const fs = require("fs");
const path = require("path");

function exportAbi() {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "CredentialRegistry.sol",
    "CredentialRegistry.json"
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Compiled artifact not found. Run `npm run compile` first.");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const outputDirectory = path.join(__dirname, "..", "abi");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const outputPath = path.join(outputDirectory, "CredentialRegistry.abi.json");
  fs.writeFileSync(outputPath, JSON.stringify(artifact.abi, null, 2) + "\n");
  console.log("ABI written to contracts/abi/CredentialRegistry.abi.json");
}

if (require.main === module) {
  try {
    exportAbi();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = exportAbi;