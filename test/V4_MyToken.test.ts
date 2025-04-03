import { expect } from "chai";
import { ethers } from "hardhat";

describe("V4_MyToken", () => {
  let token: any;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("V4_MyToken");
    token = await Token.deploy("MyToken", "MTK");
    await token.waitForDeployment();
  });

  it("should initialize with name and symbol", async () => {
    expect(await token.tokenName()).to.equal("MyToken");
    expect(await token.tokenSymbol()).to.equal("MTK");
    expect(await token.decimals()).to.equal(18);
  });

  it("should allow owner to mint tokens", async () => {
    const amount = ethers.parseEther("100");
    await expect(token.connect(owner).mint(user.address, amount))
      .to.emit(token, "Mint")
      .withArgs(user.address, amount);

    expect(await token.balanceOf(user.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(amount);
  });

  it("should not allow non-owner to mint", async () => {
    const amount = ethers.parseEther("100");
    await expect(
      token.connect(user).mint(user.address, amount)
    ).to.be.revertedWith("Not the owner");
  });

  it("should not allow minting beyond MAX_SUPPLY", async () => {
    const amount = ethers.parseEther("5001"); // 5001 > MAX_SUPPLY
    await expect(
      token.connect(owner).mint(user.address, amount)
    ).to.be.revertedWith("Exceeds max supply");
  });

  it("should transfer tokens successfully", async () => {
    const amount = ethers.parseEther("100");
    await token.connect(owner).mint(owner.address, amount);

    await expect(token.connect(owner).transfer(user.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, user.address, amount);

    expect(await token.balanceOf(user.address)).to.equal(amount);
  });

  it("should fail transfer if balance too low", async () => {
    const amount = ethers.parseEther("10");
    await expect(
      token.connect(user).transfer(owner.address, amount)
    ).to.be.revertedWith("Not enough balance");
  });

  it("should fail transfer to zero address", async () => {
    const amount = ethers.parseEther("100");
    await token.connect(owner).mint(owner.address, amount);

    await expect(
      token.connect(owner).transfer(ethers.ZeroAddress, amount)
    ).to.be.revertedWith("Cannot transfer to zero address");
  });
});
