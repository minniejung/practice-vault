import { expect } from "chai";
import { ethers } from "hardhat";

describe("V3_SimpleVault", () => {
  let vault: any;
  let owner: any;
  let user: any;
  let amount: bigint;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("V3_SimpleVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    amount = ethers.parseEther("1"); // bigint
  });

  // helpers
  async function increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  async function stakeETH() {
    await vault.connect(user).stake({ value: amount });
  }

  it("should allow user to stake ETH", async () => {
    await expect(vault.connect(user).stake({ value: amount })).to.emit(
      vault,
      "Staked"
    );

    const balance = await vault.connect(user).getBalance();
    expect(balance).to.equal(amount);
  });

  it("should not allow staking 0 ETH", async () => {
    await expect(vault.connect(user).stake({ value: 0 })).to.be.revertedWith(
      "Stake amount must be > 0"
    );
  });

  it("should allow withdrawal after lock period", async () => {
    await stakeETH();

    // 2. 이자 보충 (optional, if needed)
    const interest = (amount * 5n) / 100n;
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: interest,
    });

    await increaseTime(11);

    const expectedInterest = (amount * 5n) / 100n;
    const expectedPayout = amount + expectedInterest;

    // 출금 전 잔고
    const balanceBefore = await ethers.provider.getBalance(user.address);

    const tx = await vault.connect(user).withdraw();
    const receipt = await tx.wait();

    // 수동으로 가스비 계산
    const txGasPrice = tx.gasPrice ?? 0n;
    const gasUsed = BigInt(receipt.gasUsed);
    const totalGasCost = gasUsed * BigInt(txGasPrice);

    // 잔고 확인
    const balanceAfter = await ethers.provider.getBalance(user.address);
    const expectedFinal = balanceBefore + expectedPayout - totalGasCost;

    const delta =
      balanceAfter > expectedFinal
        ? balanceAfter - expectedFinal
        : expectedFinal - balanceAfter;

    expect(delta).to.be.lte(ethers.parseEther("0.01"));
  });

  it("should revert withdrawal if lock period not passed", async () => {
    await stakeETH();
    await increaseTime(5);
    await expect(vault.connect(user).withdraw()).to.be.revertedWith(
      "No unlocked stakes"
    );
  });

  it("should revert if no stakes", async () => {
    await expect(vault.connect(user).withdraw()).to.be.revertedWith(
      "No stakes to withdraw"
    );
  });

  async function getBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
  }
});
