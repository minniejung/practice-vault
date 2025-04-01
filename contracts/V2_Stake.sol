// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract V2_Stake {
    event Staked(address indexed user, uint amount, uint timestamp);
    event Withdrawn(address indexed user, uint amount, uint interest);

    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakeTimestamps;

    uint256 public constant lockPeriod = 10;
    uint256 public constant interestRate = 5;

    function getBalance() public view returns (uint256) {
        return stakedBalances[msg.sender];
    }

    function stake() public payable {
        // TODO : 사용자가 ETH를 보냄 (msg.value)
        // TODO : 스테이킹 시작 시간 기록 (block.timestamp)
        require(msg.value > 0, "Stake amount must be > 0");

        stakes[msg.sender].push(
            Stake({amount: msg.value, timestamp: block.timestamp})
        );

        stakedBalances[msg.sender] += msg.value;
        stakeTimestamps[msg.sender] = block.timestamp;

        emit Staked(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(uint256 amount) public {
        // TODO : 일정 기간(예: 1분)이 지나야 출금 가능
        // TODO : 원금 + 이자(예: 5%)를 출금
        // TODO : 출금 후 초기화
        uint256 interest = (amount * interestRate) / 100; // 5% 이자
        uint256 payout = amount + interest;

        require(stakedBalances[msg.sender] >= amount, "Not enough balance");
        require(
            block.timestamp >= stakeTimestamps[msg.sender] + lockPeriod,
            "Staking period not met"
        );
        require(
            address(this).balance >= payout,
            "Vault has insufficient balance"
        );

        stakedBalances[msg.sender] -= amount;
        stakeTimestamps[msg.sender] = 0; // 출금 후 초기화 (선택)

        payable(msg.sender).transfer(payout);

        emit Withdrawn(msg.sender, amount, interest);
    }

    function getStakedAmount() public view returns (uint) {
        return stakedBalances[msg.sender];
    }

    function getUnlockTime() public view returns (uint) {
        return stakeTimestamps[msg.sender] + lockPeriod;
    }

    function isUnlocked() public view returns (bool) {
        return block.timestamp >= stakeTimestamps[msg.sender] + lockPeriod;
    }

    function contractBalance() public view returns (uint) {
        return address(this).balance;
    }

    receive() external payable {}
}
