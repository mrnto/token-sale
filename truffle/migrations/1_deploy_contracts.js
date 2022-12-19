const Crowdsale = artifacts.require("Crowdsale");

const fs = require("fs");

function saveContractData(contract, name) {
  const DEST_DIR = __dirname + "/../../src/abi";

  if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR);

  fs.writeFileSync(DEST_DIR + `/${name}-address.json`, JSON.stringify({ address: contract.address }, undefined, 2));
  fs.writeFileSync(DEST_DIR + `/${name}.json`, JSON.stringify({ abi: contract.abi }, null, 2));
}

module.exports = function(deployer) {
  deployer.deploy(Crowdsale)
  // Crowdsale contract deploys SuperToken
    .then(async () => {
      const instance = await Crowdsale.deployed();
      saveContractData(instance, "Crowdsale");
    });
};
