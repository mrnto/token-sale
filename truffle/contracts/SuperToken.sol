// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    
    function approve(address spender, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract SuperToken is IERC20 {
    string private _name = "Super Token";
    string private _symbol = "SPR";
    uint8 private _decimals = 18;
    uint256 private _totalSupply = 1000000 * (10 ** _decimals);
    
    mapping(address => uint256) private _balance;
    mapping(address => mapping(address => uint256)) private _allowance;

    constructor() {
        _balance[msg.sender] = _totalSupply;
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }
    
    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balance[account];
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowance[owner][spender];
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        require(_balance[msg.sender] >= value, "Amount exceeds balance");
        unchecked {
            _balance[msg.sender] -= value;
            _balance[to] += value;
        }
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public override returns (bool) {
        _allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        require(_allowance[from][msg.sender] >= value, "Insufficient allowance");
        require(_balance[from] >= value, "Amount exceeds balance");
        unchecked {
            _allowance[from][msg.sender] -= value;
            _balance[from] -= value;
            _balance[to] += value;
        }
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
