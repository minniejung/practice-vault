import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleVault", function () {
  let vault: any;
  let owner: any;
  let user: any;

  const lockPeriod = 60; // seconds

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("SimpleVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
  });

  //   it("should accept ETH deposit", async function () {
  //     const depositAmount = ethers.parseEther("1.0");
  //     await vault.connect(user).deposit({ value: depositAmount });

  //     const balance = await vault.connect(user).getBalance();
  //     expect(balance).to.equal(depositAmount);
  //   });

  //   it("should allow withdrawal of ETH", async function () {
  //     await vault.connect(user).deposit({ value: ethers.parseEther("1.0") });

  //     const depositAmount = ethers.parseEther("1.0");
  //     const withdrawAmount = ethers.parseEther("0.5");
  //     const tolerance = ethers.parseEther("0.01");

  //     await vault.connect(user).deposit({ value: depositAmount });

  //     const userBalanceBefore = await ethers.provider.getBalance(user.address);

  //     const tx = await vault.connect(user).withdraw(withdrawAmount);
  //     const receipt = await tx.wait();

  //     const gasUsed = receipt.gasUsed;
  //     const gasPrice = receipt.gasPrice || 0n;
  //     const gasCost = gasUsed * gasPrice;

  //     const userBalanceAfter = await ethers.provider.getBalance(user.address);
  //     const expected =
  //       BigInt(userBalanceBefore) + BigInt(withdrawAmount) - BigInt(gasCost);

  //     expect(Number(userBalanceAfter)).to.be.closeTo(
  //       Number(expected),
  //       Number(tolerance)
  //     );
  //   });

  //   it("should revert if withdrawal exceeds balance", async function () {
  //     await vault.connect(user).deposit({ value: ethers.parseEther("0.1") });

  //     await expect(
  //       vault.connect(user).withdraw(ethers.parseEther("1.0"))
  //     ).to.be.revertedWith("Not enough balance");
  //   });

  it("should allow staking ETH", async () => {
    const stakeAmount = ethers.parseEther("1.0");

    const tx = await vault.connect(user).stake({ value: stakeAmount });
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const expectedTimestamp = block!.timestamp;

    await expect(tx)
      .to.emit(vault, "Staked")
      .withArgs(user.address, stakeAmount, expectedTimestamp);

    const staked = await vault.connect(user).getStakedAmount();
    expect(staked).to.equal(stakeAmount);
    console.log("💬 Staked amount:", staked.toString());
  });

  it("should not allow withdraw before lock period", async () => {
    const stakeAmount = ethers.parseEther("1.0");
    await vault.connect(user).stake({ value: stakeAmount });

    const timestamp = await vault.stakeTimestamps(user.address);
    console.log("🧪 stakeTimestamp:", timestamp.toString());
    const unlock = await vault.connect(user).getUnlockTime();
    const now = (await ethers.provider.getBlock("latest"))!.timestamp;
    console.log("⏰ now:", now);
    console.log("🔓 unlockTime:", unlock.toString());

    try {
      await vault.connect(user).withdraw(stakeAmount);
    } catch (e: any) {
      console.log("🔥 Revert reason:", e.message);
    }

    await expect(vault.connect(user).withdraw(stakeAmount)).to.be.revertedWith(
      "Staking period not met"
    );
  });

  it("should allow withdraw after lock period with interest", async () => {
    const stakeAmount = ethers.parseEther("1.0");
    const interestRate = 5; // %

    await vault.connect(user).stake({ value: stakeAmount });

    // ⏩ Add extra ETH to the vault so it can pay interest
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("0.1"),
    });

    // increase time by 61 seconds
    await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
    await ethers.provider.send("evm_mine", []);

    const userBalanceBefore = await ethers.provider.getBalance(user.address);

    const tx = await vault.connect(user).withdraw(stakeAmount);
    const receipt = await tx.wait();
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
