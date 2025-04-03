import { expect } from "chai";
import { ethers } from "hardhat";

describe("V2_Stake", function () {
  let vault: any;
  let owner: any;
  let user: any;
  let stakeAmount: bigint;
  let interestRate: number;

  const lockPeriod = 60; // seconds

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("V2_Stake");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    stakeAmount = ethers.parseEther("1.0");
    interestRate = 5;
  });

  // helpers
  async function increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  async function stakeETH() {
    const tx = await vault.connect(user).stake({ value: stakeAmount });
    const receipt = await tx.wait();
    return { tx, receipt };
  }

  async function withdrawETH() {
    const tx = await vault.connect(user).withdraw(stakeAmount);
    const receipt = await tx.wait();
    return { tx, receipt };
  }

  it("should allow staking ETH", async () => {
    const { tx, receipt } = await stakeETH();

    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const expectedTimestamp = block!.timestamp;

    await expect(tx)
      .to.emit(vault, "Staked")
      .withArgs(user.address, stakeAmount, expectedTimestamp);

    const staked = await vault.connect(user).getStakedAmount();
    expect(staked).to.equal(stakeAmount);
  });

  it("should not allow withdraw before lock period", async () => {
    await stakeETH();

    await expect(vault.connect(user).withdraw(stakeAmount)).to.be.revertedWith(
      "Staking period not met"
    );
  });

  it("should allow withdraw after lock period with interest", async () => {
    await stakeETH();

    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("0.1"),
    });

    await increaseTime(lockPeriod + 1);

    const userBalanceBefore = await ethers.provider.getBalance(user.address);

    const { tx, receipt } = await withdrawETH();

    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.gasPrice ?? 0n;
    const gasCost = BigInt(gasUsed) * BigInt(gasPrice);
    const userBalanceAfter = await ethers.provider.getBalance(user.address);

    const interest = (stakeAmount * BigInt(interestRate)) / BigInt(100);
    const expected =
      BigInt(userBalanceBefore) + stakeAmount + interest - gasCost;

    expect(userBalanceAfter).to.be.closeTo(expected, ethers.parseEther("0.01"));

    await expect(tx)
      .to.emit(vault, "Withdrawn")
      .withArgs(user.address, stakeAmount, interest);
  });
});
