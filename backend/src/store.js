const fs = require('node:fs/promises');
const path = require('node:path');

function invalidStoreError(message) {
  const error = new Error(message);
  error.code = 'INVALID_CREDENTIAL_STORE';
  return error;
}

function parseCredentialStore(contents) {
  let items;
  try {
    items = JSON.parse(contents.replace(/^\\uFEFF/, ''));
  } catch {
    throw invalidStoreError('Credential store contains invalid JSON.');
  }
  if (!Array.isArray(items)) {
    throw invalidStoreError('Credential store must be a JSON array of credentials.');
  }
  if (!items.every(item => item && typeof item === 'object' && !Array.isArray(item) && typeof item.id === 'string' && item.id.length > 0)) {
    throw invalidStoreError('Credential store contains a record without a valid credential ID.');
  }
  return items;
}

function createFileStore(filePath) {
  const records = new Map();
  let ready;
  async function load() {
    if (!ready) ready = (async () => {
      try {
        const contents = await fs.readFile(filePath, 'utf8');
        for (const credential of parseCredentialStore(contents)) records.set(credential.id, credential);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    })();
    await ready;
  }
  async function persist() {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify([...records.values()], null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporary, filePath);
  }
  return {
    async get(id) { await load(); return records.get(id) || null; },
    async put(credential) { await load(); records.set(credential.id, credential); await persist(); }
  };
}

module.exports = { createFileStore };
