import { expect } from "chai";
import { ethers } from "hardhat";

describe("V1_Basic", function () {
  let vault: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("V1_Basic");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
  });

  it("should accept ETH deposit", async function () {
    const depositAmount = ethers.parseEther("1.0");

    await vault.connect(user).deposit({ value: depositAmount });

    const balance = await vault.stakedBalances(user.address);
    expect(balance).to.equal(depositAmount);
  });

  it("should allow withdrawal of ETH", async function () {
    await vault.connect(user).deposit({ value: ethers.parseEther("1.0") });

    const depositAmount = ethers.parseEther("1.0");
    const withdrawAmount = ethers.parseEther("0.5");
    const tolerance = ethers.parseEther("0.01");

    await vault.connect(user).deposit({ value: depositAmount });

    const userBalanceBefore = await ethers.provider.getBalance(user.address);

    const tx = await vault.connect(user).withdraw(withdrawAmount);
    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.gasPrice || 0n;
    const gasCost = gasUsed * gasPrice;

    const userBalanceAfter = await ethers.provider.getBalance(user.address);
    const expected =
      BigInt(userBalanceBefore) + BigInt(withdrawAmount) - BigInt(gasCost);

    expect(Number(userBalanceAfter)).to.be.closeTo(
      Number(expected),
      Number(tolerance)
    );
  });

  it("should revert if withdrawal exceeds balance", async function () {
    await vault.connect(user).deposit({ value: ethers.parseEther("0.1") });

    await expect(
      vault.connect(user).withdraw(ethers.parseEther("1.0"))
    ).to.be.revertedWith("Not enough balance");
  });
});
