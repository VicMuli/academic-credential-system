// Loads the shared root .env (ignored by Git). Never commit it.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
require("@nomicfoundation/hardhat-toolbox");

const { POLYGON_AMOY_RPC_URL, ISSUER_PRIVATE_KEY } = process.env;

const networks = { hardhat: {}, localhost: { url: "http://127.0.0.1:8545" } };
if (POLYGON_AMOY_RPC_URL && ISSUER_PRIVATE_KEY) {
  networks.amoy = {
    url: POLYGON_AMOY_RPC_URL,
    chainId: 80002,
    accounts: [ISSUER_PRIVATE_KEY.startsWith("0x") ? ISSUER_PRIVATE_KEY : "0x" + ISSUER_PRIVATE_KEY],
  };
}

module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks,
};
