// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./SuperToken.sol";

contract Crowdsale {
    SuperToken public superToken;
    address public wallet;
    uint256 public rate = 10000;
    uint256 public minWei = 0.1 ether;
    uint256 public maxWei = 10 ether;
    uint256 public supply;
    uint256 public tokenPurchased;
    mapping(address => uint256) public investors;

    event TokenPurchase(address indexed investor, uint256 tokenAmount);
    
    constructor() {
        superToken = new SuperToken();
        wallet = msg.sender;
        supply = superToken.balanceOf(address(this));
    }

    function buyTokens() public payable {
        address investor = msg.sender;
        uint256 amount = msg.value;
        require(investor != address(0), "Null address");
        require(amount >= minWei, "Not enough to min amount");
        require((investors[investor] + amount) <= maxWei, "Exceeds max amount");
        uint256 tokenAmount = amount * rate;
        require((tokenPurchased + tokenAmount) <= supply, "Exceeds contract token balance");
        investors[investor] += amount;
        tokenPurchased += tokenAmount;
        superToken.transfer(investor, tokenAmount);
        payable(wallet).transfer(amount);
        emit TokenPurchase(investor, tokenAmount);
    }
}
