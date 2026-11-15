import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, getVerificationState } from './api.mjs';

test('verification statuses map to clear outcomes', () => {
  assert.equal(getVerificationState({ status: 'valid' }).tone, 'success');
  assert.equal(getVerificationState({ status: 'revoked' }).tone, 'warning');
  assert.equal(getVerificationState({ status: 'not_found' }).tone, 'muted');
  assert.equal(getVerificationState({ status: 'tampered' }).tone, 'danger');
  assert.match(getVerificationState({ status: 'tampered' }).title, /invalid/i);
});

test('unknown statuses fail closed', () => {
  assert.equal(getVerificationState({ status: 'unexpected' }).tone, 'danger');
});

test('issuer token is sent in the authorization header for the request', async () => {
  const originalFetch = globalThis.fetch;
  let requestOptions;
  globalThis.fetch = async (_url, options) => {
    requestOptions = options;
    return { ok: true, json: async () => ({ id: 'urn:uuid:demo' }) };
  };
  try {
    await apiRequest('/credentials', { method: 'POST', token: 'session-token', body: '{}' });
    assert.equal(new Headers(requestOptions.headers).get('Authorization'), 'Bearer session-token');
    assert.equal(requestOptions.cache, 'no-store');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API errors use the backend message', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Issuer authorization is required.' } }) });
  try {
    await assert.rejects(apiRequest('/credentials', { method: 'POST' }), /Issuer authorization is required/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
