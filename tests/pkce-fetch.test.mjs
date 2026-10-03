import test from 'node:test';
import assert from 'node:assert/strict';
import { createPkceFetch } from '../src/auth/pkceFetch.ts';
const url = 'https://test.supabase.co/auth/v1/token?grant_type=pkce';
const options = { method: 'POST', body: '{"auth_code":"test","code_verifier":"test"}' };
test('PKCE waits for foreground and retries transport without changing body', async () => {
  let calls = 0, release;
  const foreground = new Promise(resolve => { release = resolve; });
  const transport = async (input, init) => {
    calls++;
    assert.equal(input, url); assert.equal(init, options);
    if (calls === 1) throw new TypeError('Network request failed');
    return Response.json({ ok: true });
  };
  const request = createPkceFetch(transport, () => foreground, async () => {})(url, options);
  await Promise.resolve(); assert.equal(calls, 0);
  release(); assert.equal((await request).status, 200); assert.equal(calls, 2);
});
test('persistent failure stops after three attempts', async () => {
  let calls = 0;
  const fetch = createPkceFetch(async () => { calls++; throw new TypeError('Network request failed'); }, async () => {}, async () => {});
  await assert.rejects(fetch(url, options)); assert.equal(calls, 3);
});
test('HTTP errors, email sends and explicit aborts are never retried', async () => {
  let calls = 0;
  const fetch = createPkceFetch(async () => { calls++; return new Response('{}', { status: 400 }); }, async () => {});
  assert.equal((await fetch(url, options)).status, 400); assert.equal(calls, 1);
  const failing = createPkceFetch(async () => { calls++; throw new TypeError('Network request failed'); }, async () => {});
  await assert.rejects(failing('https://test.supabase.co/auth/v1/resend', options)); assert.equal(calls, 2);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(failing(url, { ...options, signal: controller.signal })); assert.equal(calls, 3);
});
