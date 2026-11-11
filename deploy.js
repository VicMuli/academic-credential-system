const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const Factory = await ethers.getContractFactory("CredentialRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const tx = registry.deploymentTransaction();
  const receipt = await tx.wait();

  console.log(`Contract: ${address}`);
  console.log(`Tx hash:  ${tx.hash}`);
  console.log(`Block:    ${receipt.blockNumber}`);
  if (network.name === "amoy") {
    console.log(`Explorer: https://amoy.polygonscan.com/address/${address}`);
    console.log(`Tx link:  https://amoy.polygonscan.com/tx/${tx.hash}`);
  }

  // Export ABI for Fatuma (no secrets inside)
  const artifact = require("../artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json");
  const out = path.join(__dirname, "..", "abi");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "CredentialRegistry.abi.json"), JSON.stringify(artifact.abi, null, 2));
  console.log("ABI written to contracts/abi/CredentialRegistry.abi.json");
  console.log("\nPut CONTRACT_ADDRESS=" + address + " in your local .env");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
