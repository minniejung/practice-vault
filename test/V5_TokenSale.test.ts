// import { expect } from "chai";
// import { ethers } from "hardhat";
// import { ContractFactory, Signer } from "ethers";
// import { MyToken, TokenSale } from "../typechain-types";
// import { parseEther } from "ethers/lib/utils";
// import { ContractReceipt } from "ethers";

// describe("TokenSale", function () {
//   let token: MyToken;
//   let tokenSale: TokenSale;
//   let Token: ContractFactory;
//   let TokenSaleFactory: ContractFactory;

//   let owner: Signer;
//   let user: Signer;

//   const RATE = 100;
//   const INITIAL_SUPPLY = parseEther("100000");

//   beforeEach(async () => {
//     [owner, user] = await ethers.getSigners();

//     // 토큰 배포
//     Token = await ethers.getContractFactory("MyToken");
//     token = (await Token.deploy(INITIAL_SUPPLY)) as MyToken;
//     await token.deployed();

//     // 판매 컨트랙트 배포
//     TokenSaleFactory = await ethers.getContractFactory("TokenSale");
//     tokenSale = (await TokenSaleFactory.deploy(token.address)) as TokenSale;
//     await tokenSale.deployed();

//     // 판매 컨트랙트에 토큰 전송
//     await token.transfer(tokenSale.address, parseEther("10000"));
//   });

//   it("should allow user to buy tokens", async () => {
//     const ethToSend = parseEther("1");
//     await tokenSale.connect(user).buyToken({ value: ethToSend });

//     const expectedTokens = ethToSend.mul(RATE);
//     const userAddress = await user.getAddress();

//     const userTokenBalance = await token.balanceOf(userAddress);
//     expect(userTokenBalance).to.equal(expectedTokens);

//     const sold = await tokenSale.soldTokens();
//     expect(sold).to.equal(expectedTokens);
//   });

//   it("should not allow buying more tokens than available", async () => {
//     const ethToSend = parseEther("999999"); // too much
//     await expect(
//       tokenSale.connect(user).buyToken({ value: ethToSend })
//     ).to.be.revertedWith("Not enough tokens in the contract");
//   });

//   it("should only allow owner to withdraw ETH", async () => {
//     const ethToSend = parseEther("2");
//     await tokenSale.connect(user).buyToken({ value: ethToSend });

//     // 유저가 출금하려고 하면 실패
//     await expect(tokenSale.connect(user).withdrawETH()).to.be.revertedWith(
//       "Only the owner can withdraw ETH"
//     );

//     // 오너는 출금 가능
//     const ownerAddress = await owner.getAddress();
//     const beforeBalance = await ethers.provider.getBalance(ownerAddress);

//     const tx = await tokenSale.connect(owner).withdrawETH();
//     const receipt: ContractReceipt = await tx.wait();

//     const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

//     const afterBalance = await ethers.provider.getBalance(ownerAddress);
//     expect(afterBalance).to.be.closeTo(
//       beforeBalance.add(ethToSend).sub(gasUsed),
//       parseEther("0.01")
//     );
//   });
// });
