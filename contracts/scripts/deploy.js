const { ethers, network } = require("hardhat");
const exportAbi = require("./export-abi");

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

  exportAbi();
  console.log("\nPut CONTRACT_ADDRESS=" + address + " in your local root .env");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});