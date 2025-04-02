// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenSale {
    IERC20 public token;
    address public owner;
    uint public soldTokens;

    uint public rate = 100; // 1 ETH = 100 TOKEN

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
        owner = msg.sender;
    }

    function buyToken() public payable {
        require(msg.value > 0, "Send ETH to buy tokens");

        uint tokenAmount = msg.value * rate;
        uint tokenBalance = token.balanceOf(address(this));

        require(
            tokenBalance >= tokenAmount,
            "Not enough tokens in the contract"
        );

        soldTokens += tokenAmount;

        require(
            token.transfer(msg.sender, tokenAmount),
            "Token transfer failed"
        );
    }

    function withdrawETH() public {
        require(msg.sender == owner, "Only the owner can withdraw ETH");
        require(address(this).balance > 0, "No ETH to withdraw");

        payable(msg.sender).transfer(address(this).balance);
    }
}
