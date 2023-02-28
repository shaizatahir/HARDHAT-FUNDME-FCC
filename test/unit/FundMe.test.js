const { getNamedAccounts, deployments, ethers } = require("hardhat");
const { assert, expect } = require("chai");

describe("FundMe", function () {
  let deployer;
  let fundMe;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("0.05");
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", function () {
    it("sets the aggregator prices correctly", async function () {
      const response = await fundMe.getPriceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("fund", function () {
    it("Fails if you don't send enough ETH", async function () {
      expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH");
    });

    it("updated the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("Add funders to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const funders = await fundMe.getFunders(0);
      assert.equal(funders, deployer);
    });

    it("Withdraw ETH from a single funder", async function () {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      //assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    it("allows us to withdraw with multiple funders", async function () {
      // Arrange
      const accounts = await ethers.getSigners();
      for (i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );
        // Act
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt = await transactionResponse.wait(1);
        const { gasUsed, effectiveGasPrice } = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice);

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
        // Assert
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance).toString(),
          endingDeployerBalance.add(gasCost).toString()
        );
        // Make sure that the are reset properly
        await expect(fundMe.getFunders(0)).to.be.reverted;

        for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.getAddressToAmountFunded(accounts[i].address),
            0
          );
        }
    });
  });
});
