// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract SimpleVault {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        // 여기에 작성
    }

    function withdraw(uint256 amount) public {
        // 여기에 작성
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}
