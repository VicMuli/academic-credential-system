'use client';

import { useState } from 'react';
import { apiRequest, getVerificationState } from '../lib/api.mjs';

const checkLabels = {
  signatureValid: 'Issuer signature',
  hashMatches: 'Credential integrity',
  issuerMatches: 'Registered issuer',
  registeredOnChain: 'On-chain registration',
  notRevoked: 'Revocation status'
};

function VerificationResult({ result, error }) {
  if (error) {
    return <div className="result-card result-error" role="alert" aria-live="assertive">
      <span className="result-icon" aria-hidden="true">!</span>
      <div><strong>Couldn’t check this credential</strong><p>{error}</p></div>
    </div>;
  }
  if (!result) return null;

  const state = getVerificationState(result);
  return <div className={`result-card result-${state.tone}`} role="status" aria-live="polite">
    <span className="result-icon" aria-hidden="true">{result.status === 'valid' ? '✓' : result.status === 'not_found' ? '?' : '!'}</span>
    <div className="result-content">
      <span className="result-label">Verification result</span>
      <strong>{state.title}</strong>
      <p>{state.description}</p>
      {result.checks && <dl className="checks">
        {Object.entries(checkLabels).map(([key, label]) => {
          const passed = result.checks[key];
          return <div className="check-row" key={key}>
            <dt>{label}</dt>
            <dd className={passed ? 'check-pass' : 'check-fail'}><span aria-hidden="true">{passed ? '✓' : '×'}</span>{passed ? 'Passed' : 'Failed'}</dd>
          </div>;
        })}
      </dl>}
    </div>
  </div>;
}

function IssueResult({ result, error }) {
  if (error) {
    return <div className="result-card result-error" role="alert" aria-live="assertive">
      <span className="result-icon" aria-hidden="true">!</span>
      <div><strong>Credential wasn’t issued</strong><p>{error}</p></div>
    </div>;
  }
  if (!result) return null;
  return <div className="result-card result-success" role="status" aria-live="polite">
    <span className="result-icon" aria-hidden="true">✓</span>
    <div className="result-content">
      <span className="result-label">Issuance complete</span>
      <strong>Credential registered</strong>
      <p>Copy the ID below to verify or revoke this credential.</p>
      <code className="credential-id">{result.id}</code>
      {result.transactionHash && <p className="transaction">Transaction <code>{result.transactionHash}</code></p>}
    </div>
  </div>;
}

export default function Home() {
  const [issuerToken, setIssuerToken] = useState('');
  const [name, setName] = useState('Sample Graduate');
  const [degree, setDegree] = useState('BSc Example Studies');
  const [year, setYear] = useState('2026');
  const [credentialId, setCredentialId] = useState('');
  const [pending, setPending] = useState('');
  const [issueResult, setIssueResult] = useState(null);
  const [issueError, setIssueError] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [revokeMessage, setRevokeMessage] = useState('');
  const [revokeTransactionHash, setRevokeTransactionHash] = useState('');
  const [revokeError, setRevokeError] = useState('');

  async function issueCredential(event) {
    event.preventDefault();
    setPending('issue');
    setIssueResult(null);
    setIssueError('');
    setRevokeMessage('');
    setRevokeTransactionHash('');
    try {
      const result = await apiRequest('/credentials', {
        method: 'POST',
        token: issuerToken,
        body: JSON.stringify({ credentialSubject: { name: name.trim(), degree: degree.trim(), graduationYear: Number(year) } })
      });
      setIssueResult(result);
      if (result.id) setCredentialId(result.id);
    } catch (error) {
      setIssueError(error.message);
    } finally {
      setPending('');
    }
  }

  async function verifyCredential(event) {
    event.preventDefault();
    setPending('verify');
    setVerifyResult(null);
    setVerifyError('');
    try {
      const result = await apiRequest(`/verify/${encodeURIComponent(credentialId.trim())}`);
      setVerifyResult(result);
    } catch (error) {
      setVerifyError(error.message);
    } finally {
      setPending('');
    }
  }

  async function revokeCredential() {
    const id = credentialId.trim();
    if (!id || !issuerToken.trim()) return;
    setPending('revoke');
    setRevokeMessage('');
    setRevokeTransactionHash('');
    setRevokeError('');
    setVerifyResult(null);
    setVerifyError('');
    try {
      const result = await apiRequest(`/credentials/${encodeURIComponent(id)}/revoke`, { method: 'POST', token: issuerToken });
      setRevokeMessage('Credential revoked. Verify it again to see the updated status.');
      setRevokeTransactionHash(result?.transactionHash || '');
    } catch (error) {
      setRevokeError(error.message);
    } finally {
      setPending('');
    }
  }

  return <main className="shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Credential Desk home"><span className="brand-mark" aria-hidden="true">C</span><span>Credential<span className="brand-light">Desk</span></span></a>
      <span className="environment"><span className="environment-dot" />Academic credential demo</span>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow">ISSUE · VERIFY · TRUST</span>
        <h1>Credentials that are<br className="desktop-break" /> easy to check.</h1>
        <p>Issue a sample academic credential or confirm one with a quick integrity check.</p>
      </div>
      <aside className="privacy-note"><span className="privacy-icon" aria-hidden="true">i</span><div><strong>Demo data only</strong><p>Use fictional student details. Testnet transactions are public; never enter real personal information.</p></div></aside>
    </section>

    <div className="workflow-line" aria-hidden="true"><span>01</span><i /><span>02</span></div>
    <div className="grid">
      <section className="panel" aria-labelledby="issue-heading">
        <div className="section-heading">
          <span className="step">01</span>
          <div><span className="eyebrow">FOR UNIVERSITY ISSUERS</span><h2 id="issue-heading">Issue a credential</h2><p>Create and register a fictional graduate credential.</p></div>
        </div>
        <label className="field"><span>Issuer API token</span>
          <input type="password" autoComplete="off" value={issuerToken} onChange={event => setIssuerToken(event.target.value)} placeholder="Enter your local demo token" />
        </label>
        <p className="help-text">Kept in this page’s memory only. It clears when you refresh.</p>
        <form aria-busy={pending === 'issue'} onSubmit={issueCredential}>
          <label className="field"><span>Fictional graduate name</span><input required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Sample Graduate" /></label>
          <label className="field"><span>Degree or qualification</span><input required maxLength={120} value={degree} onChange={event => setDegree(event.target.value)} placeholder="e.g. BSc Example Studies" /></label>
          <label className="field"><span>Graduation year</span><input required type="number" min="1900" max="2100" step="1" value={year} onChange={event => setYear(event.target.value)} /></label>
          <button className="primary-button" disabled={Boolean(pending) || !issuerToken.trim()}>
            {pending === 'issue' ? <span className="button-wait"><span className="spinner" />Issuing credential…</span> : <>Issue credential<span aria-hidden="true">↗</span></>}
          </button>
          {!issuerToken.trim() && <small>Enter your issuer token to enable issuance.</small>}
        </form>
        <IssueResult result={issueResult} error={issueError} />
        {credentialId && <div className="revoke-area">
          <button className="text-button" type="button" disabled={Boolean(pending) || !issuerToken.trim()} onClick={revokeCredential}>
            {pending === 'revoke' ? <><span className="spinner spinner-dark" />Revoking…</> : 'Revoke this credential'}
          </button>
          {revokeMessage && <p className="inline-success" role="status">
            {revokeMessage}
            {revokeTransactionHash && <> Transaction: <a href={`https://amoy.polygonscan.com/tx/${encodeURIComponent(revokeTransactionHash)}`} target="_blank" rel="noopener noreferrer">{revokeTransactionHash}</a></>}
          </p>}
          {revokeError && <p className="inline-error" role="alert">{revokeError}</p>}
        </div>}
      </section>

      <section className="panel verify-panel" aria-labelledby="verify-heading">
        <div className="section-heading">
          <span className="step step-dark">02</span>
          <div><span className="eyebrow">FOR EMPLOYERS</span><h2 id="verify-heading">Verify a credential</h2><p>Check the registry and signature without viewing student claims.</p></div>
        </div>
        <div className="verify-intro"><span className="shield" aria-hidden="true">✓</span><p>Enter the credential ID provided by the graduate or university.</p></div>
        <form aria-busy={pending === 'verify'} onSubmit={verifyCredential}>
          <label className="field"><span>Credential ID</span>
            <input required value={credentialId} onChange={event => { setCredentialId(event.target.value); setVerifyResult(null); setVerifyError(''); setRevokeMessage(''); setRevokeTransactionHash(''); setRevokeError(''); }} placeholder="e.g. urn:uuid:…" />
          </label>
          <button className="primary-button dark-button" disabled={Boolean(pending) || !credentialId.trim()}>
            {pending === 'verify' ? <span className="button-wait"><span className="spinner" />Checking registry…</span> : <>Verify credential<span aria-hidden="true">→</span></>}
          </button>
        </form>
        <VerificationResult result={verifyResult} error={verifyError} />
        {!verifyResult && !verifyError && <div className="checklist"><span className="checklist-title">WHAT WE CHECK</span><div><span>Signature &amp; integrity</span><span>Issuer &amp; revocation</span></div></div>}
      </section>
    </div>

    <footer><span>CredentialDesk · classroom prototype</span><span>Results are provided by the credential API and Polygon Amoy.</span></footer>
  </main>;
}

