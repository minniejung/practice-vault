// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract V1_Basic {
    event Staked(address indexed user, uint amount, uint timestamp);
    event Withdrawn(address indexed user, uint amount, uint interest);

    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => uint256) public stakedBalances;

    function deposit() public payable {
        // TODO : msg.value로 받은 ETH를 stakedBalances[msg.sender]에 추가
        stakedBalances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        // TODO : stakedBalances[msg.sender]보다 많은 금액이면 revert
        // TODO : 아니면, msg.sender에게 ETH 전송
        // TODO : stakedBalances에서 차감
        require(stakedBalances[msg.sender] >= amount, "Not enough balance");
        stakedBalances[msg.sender] -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
