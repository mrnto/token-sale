const SuperToken = artifacts.require("SuperToken");

function fromWei(wei) {
  return web3.utils.fromWei(wei, "ether");
}

function toWei(wei) {
  return web3.utils.toWei(wei, "ether");
}

contract("SuperToken", (accounts) => {
  const [account1, account2, account3, account4] = accounts;
  let superToken;
  const tokenName = "Super Token";
  const tokenSymbol = "SPR";
  const tokenDecimals = 18;
  const tokenTotalSupply = 1000000;

  beforeEach(async () => {
    superToken = await SuperToken.new();
  });

  describe("Token contract deployment", async () => {
    it("Should have correct name, symbol, decimals", async () => {
      const name = await superToken.name();
      const symbol = await superToken.symbol();
      const decimals = await superToken.decimals();

      assert.equal(name, tokenName, "Incorrect name");
      assert.equal(symbol, tokenSymbol, "Incorrect symbol");
      assert.equal(decimals, tokenDecimals, "Incorrect decimals");
    });

    it("Should have correct total supply", async () => {
      const totalSupply = await superToken.totalSupply();

      assert.equal(
        totalSupply.toString(),
        toWei(tokenTotalSupply.toString()),
        "Incorrect total supply"
      );
    });

    it("Should send all tokens to the first account", async () => {
      const balance = await superToken.balanceOf(account1);

      assert.equal(
        balance.toString(),
        toWei(tokenTotalSupply.toString()),
        "All tokens are not sended"
      );
    });
  });

  describe("Token transfers", async () => {
    let startBalance1, startBalance2;

    beforeEach(async () => {
      startBalance1 = await superToken.balanceOf(account1);
      startBalance2 = await superToken.balanceOf(account2);
    });

    it("Should transfer tokens", async () => {
      const amount = tokenTotalSupply;

      const expectedBalance1 = Number(fromWei(startBalance1)) - amount;
      const expectedBalance2 = Number(fromWei(startBalance2)) + amount;

      await superToken.transfer(
        account2,
        toWei(amount.toString()),
        { from: account1 }
      );

      const endBalance1 = await superToken.balanceOf(account1);
      const endBalance2 = await superToken.balanceOf(account2);

      assert.equal(
        endBalance1.toString(),
        toWei(expectedBalance1.toString()),
        "Incorrect amount taken from sender"
      );
      assert.equal(
        endBalance2.toString(),
        toWei(expectedBalance2.toString()),
        "Incorrect amount sent to receiver"
      );
    });

    it("Should reject token transfer", async () => {
      const amount = tokenTotalSupply + 1;

      try {
        await superToken.transfer(
          account2,
          toWei(amount.toString()),
          { from: account1 }
        );
      } catch (err) {
        assert.equal(err.reason, "Amount exceeds balance", "Incorrect error reason");
      }

      const endBalance1 = await superToken.balanceOf(account1);
      const endBalance2 = await superToken.balanceOf(account2);

      assert.equal(
        endBalance1.toString(),
        startBalance1.toString(),
        "Sender balance was changed"
      );
      assert.equal(
        endBalance2.toString(),
        startBalance2.toString(),
        "Receiver balance was changed"
      );
    });
  });

  describe("Token approvals", async () => {
    it("Should approve tokens", async () => {
      const amount = tokenTotalSupply;

      await superToken.approve(
        account2,
        toWei(amount.toString()),
        { from: account1 }
      );

      const allowance = await superToken.allowance(account1, account2);

      assert.equal(
        allowance.toString(),
        toWei(amount.toString()),
        "Incorrect approved tokens amount"
      );
    });
  });

  describe("Token approved transfers", async () => {
    let startBalance1, startBalance2, startBalance3;

    beforeEach(async () => {
      const amount = tokenTotalSupply - 1;

      startBalance1 = await superToken.balanceOf(account1);
      startBalance2 = await superToken.balanceOf(account2);
      startBalance3 = await superToken.balanceOf(account3);

      await superToken.approve(
        account2,
        toWei(amount.toString()),
        { from: account1 }
      );
    });

    it("Should transfer tokens", async () => {
      const amount = tokenTotalSupply - 1;
      
      const expectedBalance1 = Number(fromWei(startBalance1)) - amount;
      const expectedBalance3 = Number(fromWei(startBalance3)) + amount;

      await superToken.transferFrom(
        account1,
        account3,
        toWei(amount.toString()),
        { from: account2 }
      );

      const endBalance1 = await superToken.balanceOf(account1);
      const endBalance2 = await superToken.balanceOf(account2);
      const endBalance3 = await superToken.balanceOf(account3);

      assert.equal(
        endBalance1.toString(),
        toWei(expectedBalance1.toString()),
        "Incorrect amount taken from sender"
      );
      assert.equal(
        endBalance2.toString(),
        startBalance2.toString(),
        "Approved account amount was changed"
      );
      assert.equal(
        endBalance3.toString(),
        toWei(expectedBalance3.toString()),
        "Incorrect amount sent to receiver"
      );
    });

    it("Should reject transfer because of insufficient allowance", async () => {
      const amount = tokenTotalSupply;

      try {
        await superToken.transferFrom(
          account1,
          account3,
          toWei(amount.toString()),
          { from: account2 }
        );
      } catch (err) {
        assert.equal(err.reason, "Insufficient allowance", "Incorrect error reason");
      }

      const endBalance1 = await superToken.balanceOf(account1);
      const endBalance2 = await superToken.balanceOf(account2);
      const endBalance3 = await superToken.balanceOf(account3);

      assert.equal(
        endBalance1.toString(),
        startBalance1.toString(),
        "Sender balance was changed"
      );
      assert.equal(
        endBalance2.toString(),
        startBalance2.toString(),
        "Approved account balance was changed"
      );
      assert.equal(
        endBalance3.toString(),
        startBalance3.toString(),
        "Receiver balance was changed"
      );
    });

    it("Should reject transfer because of amount exceeds balance", async () => {
      const amount = tokenTotalSupply - 1;

      await superToken.transfer(
        account4,
        toWei(amount.toString()),
        { from: account1 }
      );
      startBalance1 = Number(fromWei(startBalance1)) - amount;
      
      try {
        await superToken.transferFrom(
          account1,
          account3,
          toWei(amount.toString()),
          { from: account2 }
        );
      } catch (err) {
        assert.equal(err.reason, "Amount exceeds balance", "Incorrect error reason");
      }

      const endBalance1 = await superToken.balanceOf(account1);
      const endBalance2 = await superToken.balanceOf(account2);
      const endBalance3 = await superToken.balanceOf(account3);

      assert.equal(
        endBalance1.toString(),
        toWei(startBalance1.toString()),
        "Sender balance was changed"
      );
      assert.equal(
        endBalance2.toString(),
        startBalance2.toString(),
        "Approved account balance was changed"
      );
      assert.equal(
        endBalance3.toString(),
        startBalance3.toString(),
        "Receiver balance was changed"
      );
    });
  });
});
