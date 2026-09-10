import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { AuthController } from '../src/auth/controller.ts';

test('SDK Supabase real: recover → PKCE → PASSWORD_RECOVERY → update → signOut (HTTP simulado)', async () => {
  const values = new Map();
  const storage = { getItem: async key => values.get(key) ?? null, setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } };
  let redirect;
  const requests = [];
  const user = { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'test@example.com', email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url'), 'test-signature'].join('.');
  const fetch = async (raw, options) => {
    const url = new URL(raw);
    requests.push(url.pathname);
    if (url.pathname.endsWith('/recover')) {
      redirect = url.searchParams.get('redirect_to');
      const body = JSON.parse(options.body);
      assert.ok(body.code_challenge);
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname.endsWith('/token')) {
      const body = JSON.parse(options.body);
      assert.equal(body.auth_code, 'test-code');
      assert.ok(body.code_verifier);
      return Response.json({ access_token: token, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600, user });
    }
    if (url.pathname.endsWith('/user')) return Response.json(user);
    if (url.pathname.endsWith('/logout')) return new Response(null, { status: 204 });
    throw new Error('Unexpected request in test');
  };
  const client = createClient('https://test-project.supabase.co', 'test-public-key', { global: { fetch }, auth: { storage, storageKey: 'sdk-test', flowType: 'pkce', autoRefreshToken: false, persistSession: true, detectSessionInUrl: false } });
  const controller = new AuthController(client, storage, { confirm: 'ibanktp://confirm', recovery: 'ibanktp://reset-password' });
  try {
    await controller.start(null);
    await controller.recover('test@example.com');
    assert.ok(redirect.startsWith('ibanktp://reset-password'));
    const callback = new URL(redirect);
    callback.searchParams.set('code', 'test-code');
    await controller.handleLink(callback.href);
    assert.equal(controller.state.recovery, true, controller.state.linkError);
    assert.equal(controller.state.session.user.id, user.id);
    await controller.updatePassword('Abcd123!');
    assert.equal(controller.state.session, null);
    assert.equal(values.has('sdk-test'), false);
    assert.equal(values.has('ibank-recovery-active'), false);
    assert.ok(requests.includes('/auth/v1/logout'));
  } finally { controller.dispose(); client.auth.stopAutoRefresh(); }
});

