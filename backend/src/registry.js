const { Contract, JsonRpcProvider, Wallet, isAddress } = require('ethers');

const ABI = [
  'function registerCredential(bytes32 credentialIdHash, bytes32 contentHash)',
  'function revokeCredential(bytes32 credentialIdHash)',
  'function getCredential(bytes32 credentialIdHash) view returns (bool exists, bytes32 contentHash, address issuer, uint64 issuedAt, bool revoked)'
];

function createAmoyRegistry(env = process.env) {
  if (!env.POLYGON_AMOY_RPC_URL || !env.CONTRACT_ADDRESS || !env.ISSUER_PRIVATE_KEY) {
    throw new Error('Set POLYGON_AMOY_RPC_URL, CONTRACT_ADDRESS, and ISSUER_PRIVATE_KEY before starting the Amoy backend.');
  }
  if (env.POLYGON_AMOY_CHAIN_ID !== '80002') throw new Error('POLYGON_AMOY_CHAIN_ID must be 80002.');
  if (!isAddress(env.CONTRACT_ADDRESS)) throw new Error('CONTRACT_ADDRESS must be a valid address.');

  const provider = new JsonRpcProvider(env.POLYGON_AMOY_RPC_URL, 80002, { name: 'polygon-amoy', chainId: 80002 });
  const wallet = new Wallet(env.ISSUER_PRIVATE_KEY, provider);
  const contract = new Contract(env.CONTRACT_ADDRESS, ABI, wallet);
  return {
    issuerAddress: wallet.address,
    async register(idHash, hash) {
      const tx = await contract.registerCredential(idHash, hash);
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) throw new Error('Credential registration transaction failed.');
      return tx.hash;
    },
    async get(idHash) {
      const [exists, hash, issuer, issuedAt, revoked] = await contract.getCredential(idHash);
      return { exists, contentHash: hash, issuer, issuedAt: issuedAt.toString(), revoked };
    },
    async revoke(idHash) {
      const tx = await contract.revokeCredential(idHash);
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) throw new Error('Credential revocation transaction failed.');
      return tx.hash;
    }
  };
}

module.exports = { createAmoyRegistry };
