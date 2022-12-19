const Crowdsale = artifacts.require("Crowdsale");
const SuperToken = artifacts.require("SuperToken");

function fromWei(wei) {
  return web3.utils.fromWei(wei, "ether");
}

function toWei(wei) {
  return web3.utils.toWei(wei, "ether");
}

contract("Crowdsale", (accounts) => {
  const [account1, account2] = accounts;
  let crowdsale, superToken;
  const crowdsaleWallet = account1;
  const crowdsaleRate = 10000;
  const crowdsaleMinWei = 0.1;
  const crowdsaleMaxWei = 10;
  const crowdsaleSupply = 1000000;

  beforeEach(async () => {
    crowdsale = await Crowdsale.new();
    const superTokenTokenAddress = await crowdsale.superToken();
    superToken = await SuperToken.at(superTokenTokenAddress);
  });

  describe("Crowdsale contract deployment", async () => {
    it("Should have correct wallet, rate, min and max amount, supply", async () => {
      const wallet = await crowdsale.wallet();
      const rate = await crowdsale.rate();
      const minWei = await crowdsale.minWei();
      const maxWei = await crowdsale.maxWei();
      const supply = await crowdsale.supply();

      assert.equal(wallet, crowdsaleWallet, "Incorrect wallet");
      assert.equal(
        rate.toString(),
        crowdsaleRate.toString(),
        "Incorrect rate"
      );
      assert.equal(
        minWei.toString(),
        toWei(crowdsaleMinWei.toString()),
        "Incorrect min amount"
      );
      assert.equal(
        maxWei.toString(),
        toWei(crowdsaleMaxWei.toString()),
        "Incorrect max amount"
      );
      assert.equal(
        supply.toString(),
        toWei(crowdsaleSupply.toString()),
        "Incorrect supply"
      );
    });
  });

  describe("Tokens buying", async () => {
    let startTokenContract, startEth1, startToken2;

    beforeEach(async () => {
      startEth1 = await web3.eth.getBalance(account1);
      startToken2 = await superToken.balanceOf(account2);
      startTokenContract = await superToken.balanceOf(crowdsale.address);
    });

    it("Should send eth to wallet and tokens to buyer", async () => {
      const amount = crowdsaleMaxWei;
      
      const expectedEth1 = Number(fromWei(startEth1)) + amount;
      const expectedToken2 = Number(fromWei(startToken2)) + (amount * crowdsaleRate);
      const expectedTokenContract = Number(fromWei(startTokenContract)) - (amount * crowdsaleRate);

      await crowdsale.buyTokens({ from: account2, value: toWei(amount.toString()) });

      const endEth1 = await web3.eth.getBalance(account1);
      const endToken2 = await superToken.balanceOf(account2);
      const endTokenContract = await superToken.balanceOf(crowdsale.address);
      assert.equal(
        Number(fromWei(endEth1)).toFixed(6), // truffle includes gas in value 
        expectedEth1.toFixed(6),
        "Incorrect received ETH amount"
      );
      assert.equal(
        endToken2.toString(),
        toWei(expectedToken2.toString()),
        "Incorrect received token amount"
      );
      assert.equal(
        endTokenContract.toString(),
        toWei(expectedTokenContract.toString()),
        "Incorrect sent token amount"
      );
    });

    it("Should reject because of not enough to min amount", async () => {
      const amount = crowdsaleMinWei - 0.01;

      try {
        await crowdsale.buyTokens({ from: account2, value: toWei(amount.toString()) });
      } catch (err) {
        assert.equal(err.reason, "Not enough to min amount", "Incorrect error reason");
      }

      const endEth1 = await web3.eth.getBalance(account1);
      const endToken2 = await superToken.balanceOf(account2);
      const endTokenContract = await superToken.balanceOf(crowdsale.address);

      assert.equal(
        startEth1.toString(),
        endEth1.toString(),
        "Wallet balance changed"
      );
      assert.equal(
        startToken2.toString(),
        endToken2.toString(),
        "Buyer token balance changed"
      );
      assert.equal(
        startTokenContract.toString(),
        endTokenContract.toString(),
        "Contract token balance changed"
      );
    });

    it("Should reject because of exceeds max amount", async () => {
      const amount = crowdsaleMaxWei + 0.01;

      try {
        await crowdsale.buyTokens({ from: account2, value: toWei(amount.toString()) });
      } catch (err) {
        assert.equal(err.reason, "Exceeds max amount", "Incorrect error reason");
      }

      const endEth1 = await web3.eth.getBalance(account1);
      const endToken2 = await superToken.balanceOf(account2);
      const endTokenContract = await superToken.balanceOf(crowdsale.address);

      assert.equal(
        startEth1.toString(),
        endEth1.toString(),
        "Wallet balance changed"
      );
      assert.equal(
        startToken2.toString(),
        endToken2.toString(),
        "Buyer token balance changed"
      );
      assert.equal(
        startTokenContract.toString(),
        endTokenContract.toString(),
        "Contract token balance changed"
      );
    });

    it("Should reject because of exceeds contract token balance", async () => {
      const amount = crowdsaleMaxWei;
      let expectedTokenContract = Number(fromWei(startTokenContract));

      for(let i = 3; i < 13; i++) {
        await crowdsale.buyTokens({ from: accounts[i], value: toWei(amount.toString()) });
        expectedTokenContract -= amount * crowdsaleRate;
      }

      const expectedEth1 = await web3.eth.getBalance(account1);

      try {
        await crowdsale.buyTokens({ from: account2, value: toWei(amount.toString()) });
      } catch (err) {
        assert.equal(err.reason, "Exceeds contract token balance", "Incorrect error reason");
      }

      const endEth1 = await web3.eth.getBalance(account1);
      const endToken2 = await superToken.balanceOf(account2);
      const endTokenContract = await superToken.balanceOf(crowdsale.address);

      assert.equal(
        expectedEth1.toString(),
        endEth1.toString(),
        "Wallet balance changed"
      );
      assert.equal(
        startToken2.toString(),
        endToken2.toString(),
        "Buyer token balance changed"
      );
      assert.equal(
        toWei(expectedTokenContract.toString()),
        endTokenContract.toString(),
        "Contract token balance changed"
      );
    });
  });
});
