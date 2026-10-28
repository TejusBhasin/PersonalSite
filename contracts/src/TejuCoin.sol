// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TejuCoin
/// @notice ERC-20 compatible prototype. Only the creator's own transfer may mint
///         the exact balance shortfall needed to complete that transfer.
/// @dev This behavior permits uncapped supply growth and is NOT production-ready.
contract TejuCoin {
    string public constant name = "TejuCoin";
    string public constant symbol = "TEJU";
    uint8 public constant decimals = 18;

    address public immutable creator;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor() {
        creator = msg.sender;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _creatorAwareTransfer(msg.sender, to, value, msg.sender == creator);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = allowed - value;
            }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        // The creator can use the shortfall rule only when transferring their
        // own tokens, never when spending another holder's allowance.
        _creatorAwareTransfer(from, to, value, msg.sender == creator && from == creator);
        return true;
    }

    function _creatorAwareTransfer(address from, address to, uint256 value, bool mayMintShortfall) internal {
        if (to == address(0)) revert ZeroAddress();
        uint256 available = balanceOf[from];
        if (available < value) {
            if (!mayMintShortfall) revert InsufficientBalance();
            _mint(from, value - available);
        }
        unchecked {
            balanceOf[from] -= value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply += value;
        balanceOf[to] += value;
        emit Transfer(address(0), to, value);
    }
}
