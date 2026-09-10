import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const dist = path.resolve('dist');
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const candidate = path.resolve(dist, '.' + pathname);
    if (!candidate.startsWith(dist + path.sep) && candidate !== dist) { res.writeHead(403).end(); return; }
    let file = candidate;
    let data;
    try { data = await readFile(file); } catch { file = path.join(dist, 'index.html'); data = await readFile(file); }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.png') ? 'image/png' : 'text/html');
    res.end(data);
  } catch { res.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || undefined });
const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const user = { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'ana@example.com', email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: { full_name: 'Ana Prueba' }, created_at: new Date().toISOString() };
const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url'), 'test-signature'].join('.');
const authSession = { access_token: token, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user };
let mode = 'invalid', recoveryRedirect;
let loginRequests = 0;
await context.route('https://*.supabase.co/**', async route => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith('/signup')) return route.fulfill({ json: { user, session: null } });
  if (url.pathname.endsWith('/recover')) { recoveryRedirect = url.searchParams.get('redirect_to'); return route.fulfill({ json: {} }); }
  if (url.pathname.endsWith('/resend')) return route.fulfill({ json: {} });
  if (url.pathname.endsWith('/token')) {
    if (url.searchParams.get('grant_type') === 'pkce') return route.fulfill({ json: authSession });
    loginRequests++;
    if (mode === 'invalid') return route.fulfill({ status: 400, json: { code: 'invalid_credentials', msg: 'Invalid login credentials' } });
    if (mode === 'unconfirmed') return route.fulfill({ status: 400, json: { code: 'email_not_confirmed', msg: 'Email not confirmed' } });
    return route.fulfill({ json: authSession });
  }
  if (url.pathname.endsWith('/user')) return route.fulfill({ json: user });
  if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 });
  return route.fulfill({ status: 400, json: { msg: 'Unexpected test request' } });
});
await mkdir('docs/screenshots', { recursive: true });
async function screenshot(name) { await page.screenshot({ path: 'docs/screenshots/' + name + '.png' }); }
try {
  await page.goto(origin);
  await page.getByRole('heading', { name: 'Qué bueno verte de nuevo' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).isDisabled(), true);
  await screenshot('01-login');
  await page.getByLabel('Email', { exact: true }).filter({ visible: true }).fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).filter({ visible: true }).fill('incorrecta');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByText('Email o contraseña incorrectos', { exact: true }).filter({ visible: true }).waitFor();
  assert.equal(loginRequests, 1);
  await screenshot('01-login-error');
  await page.getByRole('button', { name: '¿Todavía no tenés cuenta? Registrate' }).click();
  await page.getByRole('heading', { name: 'Creá tu cuenta' }).waitFor();
  await page.getByLabel('Nombre completo', { exact: true }).filter({ visible: true }).fill('Ana Prueba');
  await page.getByLabel('Email', { exact: true }).filter({ visible: true }).fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).filter({ visible: true }).fill('Abcd123!');
  await page.getByLabel('Confirmar contraseña', { exact: true }).filter({ visible: true }).fill('Abcd123!');
  assert.equal(await page.getByRole('button', { name: 'Crear cuenta', exact: true }).isDisabled(), true);
  await page.getByRole('checkbox').click();
  await page.setViewportSize({ width: 390, height: 1200 });
  await screenshot('02-registro');
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await page.getByRole('heading', { name: 'Revisá tu email' }).waitFor();
  assert.equal(await page.getByRole('button', { name: /Reenviar email en/ }).isDisabled(), true);
  await screenshot('03-confirmacion-pendiente');
  await page.getByRole('button', { name: 'Volver a iniciar sesión' }).click();
  await page.getByRole('button', { name: 'Olvidé mi contraseña' }).click();
  await page.getByLabel('Email', { exact: true }).filter({ visible: true }).fill('recover@example.com');
  await screenshot('04-recuperar');
  await page.getByRole('button', { name: 'Enviar instrucciones' }).click();
  await page.getByText('Si el email existe en nuestro sistema, vas a recibir instrucciones', { exact: true }).filter({ visible: true }).waitFor();
  await screenshot('04-recuperar-enviado');
  assert.ok(recoveryRedirect);
  const callback = new URL(recoveryRedirect);
  callback.searchParams.set('code', 'test-recovery');
  await page.goto(callback.href);
  await page.getByRole('heading', { name: 'Tu nueva contraseña' }).waitFor();
  await page.getByLabel('Nueva contraseña', { exact: true }).filter({ visible: true }).fill('Abcd123!');
  await page.getByLabel('Confirmar contraseña', { exact: true }).filter({ visible: true }).fill('Abcd123!');
  await screenshot('05-nueva-contrasena');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await page.getByRole('heading', { name: 'Qué bueno verte de nuevo' }).waitFor();
  await page.getByText('Contraseña actualizada. Iniciá sesión con tu nueva contraseña.', { exact: true }).filter({ visible: true }).waitFor();
  mode = 'success';
  await page.getByLabel('Email', { exact: true }).filter({ visible: true }).fill('ana@example.com');
  await page.getByLabel('Contraseña', { exact: true }).filter({ visible: true }).fill('Abcd123!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('heading', { name: 'Hola, Ana' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Hola, Ana' }).waitFor();
  await screenshot('06-home');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByRole('heading', { name: 'Qué bueno verte de nuevo' }).waitFor();
  await page.goto(origin + '/reset-password?error=access_denied&error_code=otp_expired');
  await page.getByRole('heading', { name: 'Necesitás un enlace nuevo' }).waitFor();
  await screenshot('05-enlace-invalido');
  await page.getByRole('button', { name: 'Pedir otro enlace' }).click();
  await page.getByRole('heading', { name: '¿Olvidaste tu contraseña?' }).waitFor();
  assert.deepEqual(errors, []);
  await writeFile('docs/screenshots/verification.json', JSON.stringify({ platform: 'Chromium web, viewport 390x1000', backend: 'HTTP simulado; no se crearon usuarios ni se enviaron emails', flows: ['login deshabilitado y error genérico', 'registro y términos', 'confirmación y cooldown', 'reset neutro', 'callback PKCE y nueva contraseña', 'logout posterior al reset', 'persistencia al recargar', 'logout', 'link vencido y nueva solicitud'], consoleErrors: errors }, null, 2));
  await unlink('docs/screenshots/failure.png').catch(() => {});
  console.log('WEB UI: cinco pantallas y flujos verificados; capturas en docs/screenshots.');
} catch (error) {
  await screenshot('failure');
  console.error(error);
  console.error('Browser errors:', errors);
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}


