export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let response;
  try {
    // Next.js rewrites this same-origin path to NEXT_PUBLIC_API_BASE_URL.
    response = await fetch(`/api${path}`, { ...options, headers, cache: 'no-store' });
  } catch {
    throw new Error('Could not reach the API. Make sure the backend is running on 127.0.0.1:4000.');
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error?.message || `Request failed (${response.status}).`);
  }
  return result;
}

export function getVerificationState(result) {
  switch (result?.status) {
    case 'valid': return { tone: 'success', title: 'Credential is valid', description: 'The signature, registered hash, issuer, and revocation checks passed.' };
    case 'revoked': return { tone: 'warning', title: 'Credential has been revoked', description: 'This credential was issued, then revoked by its issuer.' };
    case 'not_found': return { tone: 'muted', title: 'Credential not found', description: 'No registered credential matches this ID.' };
    case 'tampered': return { tone: 'danger', title: 'Credential is invalid', description: 'One or more integrity checks failed. Do not accept this credential.' };
    default: return { tone: 'danger', title: 'Unexpected verification result', description: 'The API returned a status this screen does not recognize.' };
  }
}
