#!/usr/bin/env node

// Static Amoy configuration check. This script does not connect to the RPC
// endpoint and never prints the endpoint or issuer key.

const args = new Set(process.argv.slice(2));
const knownArgs = new Set(["--require-contract", "--require-issuer"]);
const errors = [];
const warnings = [];

for (const arg of args) {
  if (!knownArgs.has(arg)) errors.push("Unknown option: " + arg);
}

const chainId = process.env.POLYGON_AMOY_CHAIN_ID?.trim();
if (!chainId) {
  errors.push("POLYGON_AMOY_CHAIN_ID is missing.");
} else if (chainId !== "80002") {
  errors.push("POLYGON_AMOY_CHAIN_ID must be 80002 for Polygon Amoy.");
}

const rpcUrl = process.env.POLYGON_AMOY_RPC_URL?.trim();
if (!rpcUrl) {
  errors.push("POLYGON_AMOY_RPC_URL is missing.");
} else {
  try {
    const parsed = new URL(rpcUrl);
    if (!["https:", "wss:"].includes(parsed.protocol)) {
      errors.push("POLYGON_AMOY_RPC_URL must use HTTPS or WSS.");
    }
  } catch {
    errors.push("POLYGON_AMOY_RPC_URL must be a valid URL.");
  }
}

const contractAddress = process.env.CONTRACT_ADDRESS?.trim();
if (!contractAddress) {
  if (args.has("--require-contract")) {
    errors.push("CONTRACT_ADDRESS is required for this check.");
  } else {
    warnings.push("CONTRACT_ADDRESS is not set yet; add it after deployment.");
  }
} else if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
  errors.push("CONTRACT_ADDRESS must be a 20-byte 0x-prefixed Ethereum address.");
}

const issuerKey = process.env.ISSUER_PRIVATE_KEY?.trim();
if (!issuerKey) {
  if (args.has("--require-issuer")) {
    errors.push("ISSUER_PRIVATE_KEY is required for issuer write operations.");
  } else {
    warnings.push("ISSUER_PRIVATE_KEY is not set; issue/revoke operations will need it.");
  }
}

if (warnings.length) {
  for (const warning of warnings) console.warn("Warning: " + warning);
}
if (errors.length) {
  for (const error of errors) console.error("Error: " + error);
  process.exitCode = 1;
} else {
  console.log("Amoy configuration values passed the format check.");
  console.log("No RPC request was made; this does not confirm deployment or network connectivity.");
}
