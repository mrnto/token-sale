const fs = require("fs");
const Crowdsale = artifacts.require("Crowdsale");

function saveContractData(contract) {
    const DEST_DIR = __dirname + "/../../src/abi";
    let name = contract.constructor._json.contractName;

    if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR);

    fs.writeFileSync(DEST_DIR + `/${name}.json`, JSON.stringify({
        abi: contract.abi,
        address: contract.address
    }, null, null));
}

module.exports = function (deployer) {
    deployer.deploy(Crowdsale)
        // Crowdsale contract deploys SuperToken
        .then(async () => {
            const instance = await Crowdsale.deployed();
            saveContractData(instance);
        });
};
