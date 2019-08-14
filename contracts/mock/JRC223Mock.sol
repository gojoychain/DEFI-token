pragma solidity ^0.5.11;

import "../token/JRC223.sol";
import "../lib/Ownable.sol";

contract JRC223Mock is JRC223, Ownable  {
    string internal _name = "JRC223Mock token";
    string internal _symbol = "JRC";
    uint8 internal _decimals = 18;
    uint internal _totalSupply = 10 ** 23;

    constructor(address owner) Ownable(owner) public validAddress(owner) {
        _balances[owner] = _totalSupply;
    }
}
