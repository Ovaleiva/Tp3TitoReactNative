import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthController } from '../src/auth/controller.ts';
import { authError, validEmail, validPassword, matchingPassword, remainingSeconds, EMAIL_SENT, CONFIRM_SENT } from '../src/auth/rules.ts';
import { parseAuthLink } from '../src/auth/links.ts';

const callbacks = { confirm: 'ibanktp://confirm', recovery: 'ibanktp://reset-password' };
const session = { access_token: 'test-only', refresh_token: 'test-only', expires_at: 9999999999, user: { id: 'user-1', email: 'test@example.com', user_metadata: {} } };
function setup({ initialSession = null, marker = false } = {}) {
  let listener = () => {};
  const storageMap = new Map(marker ? [['ibank-recovery-active', '1']] : []);
  const storage = { async getItem(k) { return storageMap.get(k) ?? null; }, async setItem(k, v) { storageMap.set(k, v); }, async removeItem(k) { storageMap.delete(k); } };
  const calls = [];
  const auth = {
    onAuthStateChange(fn) { listener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
    async getSession() { return { data: { session: initialSession }, error: null }; },
    async signInWithPassword(input) { calls.push(['login', input]); listener('SIGNED_IN', session); return { data: { session }, error: null }; },
    async signUp(input) { calls.push(['signup', input]); return { data: { session: null }, error: null }; },
    async resend(input) { calls.push(['resend', input]); return { error: null }; },
    async resetPasswordForEmail(email, options) { calls.push(['recover', email, options]); return { error: null }; },
    async exchangeCodeForSession(code, options) { calls.push(['exchange', code, options]); listener('PASSWORD_RECOVERY', session); return { data: { session }, error: null }; },
    async updateUser(input) { calls.push(['update', input]); listener('USER_UPDATED', session); return { error: null }; },
    async signOut(options) { calls.push(['logout', options]); initialSession = null; listener('SIGNED_OUT', null); return { error: null }; },
  };
  const controller = new AuthController({ auth }, storage, callbacks);
  return { controller, auth, calls, storageMap, emit: (event, value) => listener(event, value) };
}
test('email, contraseña, coincidencia exacta y plazos', () => {
  assert.equal(validEmail('  USER@example.com '), true);
  for (const email of ['', 'x', 'x@x', 'x @a.com']) assert.equal(validEmail(email), false);
  assert.equal(validPassword('Abcd123!'), true);
  for (const pass of ['abc123!', 'ABCDEFG1!', 'abcdefgh1!', 'Abcdefgh!', 'Abcdefg1', 'Abcdef1 ']) assert.equal(validPassword(pass), false);
  assert.equal(matchingPassword('Abcd123!', 'Abcd123! '), false);
  assert.equal(remainingSeconds(60000, 1001), 59);
  assert.equal(remainingSeconds(1, 1001), 0);
});
test('mapeo centralizado no muestra errores crudos ni datos del servidor', () => {
  assert.equal(authError({ code: 'invalid_credentials' }).message, 'Email o contraseña incorrectos');
  assert.equal(authError({ code: 'user_already_exists' }).message, CONFIRM_SENT);
  assert.equal(authError({ status: 429 }).kind, 'rate');
  assert.equal(authError({ name: 'AuthRetryableFetchError' }).kind, 'network');
  assert.equal(authError({ message: 'token=secret' }).message.includes('secret'), false);
});
test('solo acepta callbacks exactos y códigos PKCE únicos', () => {
  assert.deepEqual(parseAuthLink('ibanktp://reset-password?code=abc&sb_flow_id=flow', callbacks), { route: 'reset-password', code: 'abc', flowId: 'flow' });
  assert.equal(parseAuthLink('https://attacker.test/reset-password?code=abc', callbacks), null);
  assert.equal(parseAuthLink('ibanktp://confirm.evil?code=abc', callbacks), null);
  assert.equal(parseAuthLink('ibanktp://home?code=abc', callbacks), null);
  for (const url of ['ibanktp://reset-password', 'ibanktp://confirm?code=x&code=y', 'ibanktp://reset-password#error=access_denied', 'ibanktp://reset-password#access_token=x&refresh_token=y', 'ibanktp://confirm?code=a&sb_flow_id='])
    assert.throws(() => parseAuthLink(url, callbacks));
  const expo = { confirm: 'exp://192.168.1.2:8081/--/confirm', recovery: 'exp://192.168.1.2:8081/--/reset-password' };
  assert.equal(parseAuthLink(expo.confirm + '?code=x', expo).route, 'confirm');
});
test('restaura la sesión antes de habilitar navegación', async () => {
  const { controller } = setup({ initialSession: session });
  assert.equal(controller.state.ready, false);
  await controller.start(null);
  assert.equal(controller.state.ready, true);
  assert.equal(controller.state.session, session);
});
test('una recuperación interrumpida nunca restaura Home', async () => {
  const { controller, calls, storageMap } = setup({ initialSession: session, marker: true });
  await controller.start(null);
  assert.equal(controller.state.session, null);
  assert.match(controller.state.linkError, /interrumpió/);
  assert.equal(storageMap.has('ibank-recovery-active'), false);
  assert.equal(calls[0][0], 'logout');
});
test('login normaliza email y lleva email no confirmado a confirmación', async () => {
  const { controller, auth } = setup();
  await controller.start(null);
  auth.signInWithPassword = async input => {
    assert.equal(input.email, 'test@example.com');
    return { data: {}, error: { code: 'email_not_confirmed' } };
  };
  assert.equal(await controller.login(' TEST@example.com ', 'x'), 'confirm');
  assert.equal(controller.state.pendingEmail, 'test@example.com');
});
test('login exitoso conserva la sesión y logout la limpia', async () => {
  const { controller } = setup();
  await controller.start(null);
  assert.equal(await controller.login('test@example.com', 'x'), 'home');
  assert.equal(controller.state.session, session);
  await controller.logout();
  assert.equal(controller.state.session, null);
});
test('signup existente usa éxito neutro; nombre y callback van en options', async () => {
  const { controller, auth, calls } = setup();
  await controller.start(null);
  auth.signUp = async input => {
    calls.push(['signup', input]);
    return { data: {}, error: { code: 'user_already_exists' } };
  };
  assert.equal(await controller.signup(' Ana ', 'Test@example.com', 'Abcd123!'), true);
  assert.equal(controller.state.notice, CONFIRM_SENT);
  assert.equal(calls[0][1].options.data.full_name, 'Ana');
  assert.equal(calls[0][1].options.emailRedirectTo, callbacks.confirm);
  await controller.resend();
  assert.equal(calls.length, 1, 'cooldown impide reenviar inmediatamente');
});
test('una configuración sin Confirm email no expone Home durante signup', async () => {
  const { controller, auth, emit } = setup();
  await controller.start(null);
  const exposed = [];
  controller.subscribe(() => exposed.push(Boolean(controller.state.session)));
  auth.signUp = async () => { emit('SIGNED_IN', session); return { data: { session }, error: null }; };
  await controller.signup('Ana', 'test@example.com', 'Abcd123!');
  assert.equal(exposed.some(Boolean), false);
});
test('recuperación usa el mismo éxito para cuenta existente e inexistente', async () => {
  const first = setup(), second = setup();
  await first.controller.start(null); await second.controller.start(null);
  second.auth.resetPasswordForEmail = async () => ({ error: { code: 'user_not_found' } });
  await first.controller.recover('test@example.com');
  await second.controller.recover('missing@example.com');
  assert.equal(first.controller.state.notice, EMAIL_SENT);
  assert.equal(second.controller.state.notice, EMAIL_SENT);
  assert.ok(first.controller.seconds('email', 'TEST@example.com') >= 59);
});
test('429 bloquea mismo email 60 s aun al navegar y normalizar', async () => {
  const { controller, auth } = setup();
  await controller.start(null);
  auth.signInWithPassword = async () => ({ error: { status: 429 } });
  await assert.rejects(controller.login('test@example.com', 'x'), /Demasiados intentos/);
  assert.ok(controller.seconds('login', ' TEST@example.com ') >= 59);
  assert.equal(controller.seconds('login', 'other@example.com'), 0);
  assert.equal(await controller.login('test@example.com', 'x'), undefined);
});
test('doble envío no produce dos requests', async () => {
  const { controller, auth } = setup();
  await controller.start(null);
  let finish;
  let count = 0;
  auth.signInWithPassword = () => { count++; return new Promise(resolve => { finish = resolve; }); };
  const request = controller.login('test@example.com', 'x');
  await controller.login('test@example.com', 'x');
  assert.equal(count, 1);
  finish({ data: { session }, error: null });
  await request;
  assert.equal(controller.state.busy, false);
});
test('callback de confirmación válido abre sesión normal', async () => {
  const { controller, auth, emit, storageMap } = setup();
  auth.exchangeCodeForSession = async () => { emit('SIGNED_IN', session); return { data: { session }, error: null }; };
  await controller.start('ibanktp://confirm?code=valid');
  assert.equal(controller.state.session, session);
  assert.equal(controller.state.recovery, false);
  assert.equal(controller.state.processingLink, false);
  assert.equal(storageMap.size, 0);
});
test('el formulario de reset necesita PASSWORD_RECOVERY, no solo una sesión', async () => {
  const { controller, auth, emit } = setup();
  auth.exchangeCodeForSession = async () => { emit('SIGNED_IN', session); return { data: { session }, error: null }; };
  await controller.start('ibanktp://reset-password?code=normal-session');
  assert.equal(controller.state.session, null);
  assert.equal(controller.state.recovery, false);
  assert.ok(controller.state.linkError);
});
test('recuperación abre formulario, actualiza y cierra sesión en ese orden', async () => {
  const { controller, calls, storageMap } = setup();
  await controller.start('ibanktp://reset-password?code=recovery&sb_flow_id=flow');
  assert.equal(controller.state.recovery, true);
  assert.equal(storageMap.get('ibank-recovery-active'), '1');
  assert.deepEqual(calls[0], ['exchange', 'recovery', { flowId: 'flow' }]);
  await controller.updatePassword('Abcd123!');
  assert.deepEqual(calls.map(call => call[0]), ['exchange', 'update', 'logout']);
  assert.equal(controller.state.session, null);
  assert.equal(controller.state.recovery, false);
  assert.match(controller.state.notice, /Contraseña actualizada/);
  assert.equal(storageMap.size, 0);
});
test('reset sin evento y enlace vencido no permiten updateUser', async () => {
  const { controller, auth, calls } = setup();
  auth.exchangeCodeForSession = async () => ({ data: { session: null }, error: { code: 'flow_state_expired' } });
  await controller.start('ibanktp://reset-password?code=expired');
  await assert.rejects(controller.updatePassword('Abcd123!'));
  assert.equal(calls.some(call => call[0] === 'update'), false);
});
test('fallo de logout después de reset mantiene barrera de seguridad', async () => {
  const { controller, auth, storageMap } = setup();
  await controller.start('ibanktp://reset-password?code=valid');
  auth.signOut = async () => ({ error: { name: 'AuthRetryableFetchError' } });
  await assert.rejects(controller.updatePassword('Abcd123!'));
  assert.ok(controller.state.fatalError);
  assert.equal(storageMap.get('ibank-recovery-active'), '1');
});

