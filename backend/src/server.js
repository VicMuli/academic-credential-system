const { createPrivateKey, createPublicKey } = require('node:crypto');
const path = require('node:path');
const { createApp } = require('./app');
const { createFileStore } = require('./store');
const { createAmoyRegistry } = require('./registry');

function keyFromEnv(name, type) {
  const encoded = process.env[name];
  if (!encoded) throw new Error(`Set ${name} to a base64-encoded DER ${type} key.`);
  return createPrivateKey({ key: Buffer.from(encoded, 'base64'), format: 'der', type: 'pkcs8' });
}

const privateKey = keyFromEnv('CREDENTIAL_SIGNING_PRIVATE_KEY', 'PKCS#8 Ed25519 private');
const publicEncoded = process.env.CREDENTIAL_SIGNING_PUBLIC_KEY;
if (!publicEncoded) throw new Error('Set CREDENTIAL_SIGNING_PUBLIC_KEY to a base64-encoded DER SPKI public key.');
const publicKey = createPublicKey({ key: Buffer.from(publicEncoded, 'base64'), format: 'der', type: 'spki' });

const storePath = path.resolve(process.env.CREDENTIAL_STORE_PATH || './data/credentials.json');
const app = createApp({ store: createFileStore(storePath), registry: createAmoyRegistry(), signingPrivateKey: privateKey, signingPublicKey: publicKey });
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Credential API listening on http://localhost:${port}/api`));
