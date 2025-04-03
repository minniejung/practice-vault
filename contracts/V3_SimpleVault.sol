// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract V3_SimpleVault {
    event Staked(address indexed user, uint amount, uint timestamp);
    event Withdrawn(address indexed user, uint amount, uint interest);

    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public stakedBalances;

    uint256 public constant lockPeriod = 10;
    uint256 public constant interestRate = 5;

    function getBalance() public view returns (uint256) {
        return stakedBalances[msg.sender];
    }

    function stake() public payable {
        require(msg.value > 0, "Stake amount must be > 0");

        stakes[msg.sender].push(
            Stake({amount: msg.value, timestamp: block.timestamp})
        );

        stakedBalances[msg.sender] += msg.value;

        emit Staked(msg.sender, msg.value, block.timestamp);
    }

    function withdraw() public {
        uint256 totalPayout = 0;
        uint256 totalWithdrawn = 0;

        Stake[] storage userStakes = stakes[msg.sender];
        require(userStakes.length > 0, "No stakes to withdraw");

        for (uint i = 0; i < userStakes.length; ) {
            Stake storage s = userStakes[i];
            if (block.timestamp >= s.timestamp + lockPeriod && s.amount > 0) {
                uint256 interest = (s.amount * interestRate) / 100;
                uint256 payout = s.amount + interest;

                totalPayout += payout;
                totalWithdrawn += s.amount;

                // Mark as withdrawn
                s.amount = 0;
            }
            unchecked {
                i++;
            }
        }

        require(totalPayout > 0, "No unlocked stakes");

        stakedBalances[msg.sender] -= totalWithdrawn;

        (bool success, ) = msg.sender.call{value: totalPayout}("");
        require(success, "Withdraw failed");

        emit Withdrawn(
            msg.sender,
            totalWithdrawn,
            totalPayout - totalWithdrawn
        );
    }

    function getStakedAmount() public view returns (uint) {
        return stakedBalances[msg.sender];
    }

    function contractBalance() public view returns (uint) {
        return address(this).balance;
    }

    receive() external payable {}
}
