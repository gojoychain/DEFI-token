pragma solidity ^0.5.11;

import "../token/JRC223.sol";

contract JRC223Mock is JRC223, Ownable  {
    string internal _name = "JRC223Mock token";
    string internal _symbol = "JRC";
    uint8 internal _decimals = 18;
    uint256 internal _totalSupply = 1000000 ** 18;

    constructor(address owner) Ownable(owner) public validAddress(owner) {
        _balances[owner] = _totalSupply;
    }
}
