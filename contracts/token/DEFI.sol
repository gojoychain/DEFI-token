pragma solidity ^0.5.11;

import "./JRC223.sol";
import "../lib/Ownable.sol";

/**
 * @title DEFI token contract.
 * @dev Users can deposit 1 JUSD and receive 1 DEFI token.
 *      95% of JUSD will be stored in DEFI smart contract.
 *      5% of JUSD will go to owner of DEFI smart contract.
 */
contract DEFI is JRC223, Ownable {
    /**
     * @dev Creates the token and mints the initial token supply to the owner.
     * @param name Name of the token.
     * @param symbol Symbol of the token.
     * @param decimals Decimals of the token.
     * @param totalSupply Initial supply of tokens.
     * @param owner Owner of the initial tokens.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        address owner)
        Ownable(owner)
        public
        validAddress(owner)
    {
        require(bytes(name).length > 0, "name cannot be empty.");
        require(bytes(symbol).length > 0, "symbol cannot be empty.");

        _name = name;
        _symbol = symbol;
        _decimals = decimals;
        _totalSupply = totalSupply;
        _balances[owner] = totalSupply;

        bytes memory empty;
        emit Transfer(address(0), owner, totalSupply);
        emit Transfer(address(0), owner, totalSupply, empty);
    }

    /**
     * @dev Mints an amount of the token and assigns it to an account. 
     *      This encapsulates the modification of balances such that the proper 
     *      events are emitted.
     * @param account The account that will receive the created tokens.
     * @param value The amount that will be created.
     */
    function mint(
        address account, 
        uint256 value) 
        public
        onlyOwner
        validAddress(account)
        returns (bool success)
    {
        require(value > 0, "value must be greater than 0.");

        _totalSupply = _totalSupply.add(value);
        _balances[account] = _balances[account].add(value);

        bytes memory empty;
        emit Transfer(address(0), account, value);
        emit Transfer(address(0), account, value, empty);

        return true;
    }

    /**
     * @dev Burns an amount of the token of a given account.
     * @param account The account whose tokens will be burnt.
     * @param value The amount that will be burnt.
     */
    function burn(
        address account, 
        uint256 value) 
        public 
        onlyOwner
        validAddress(account)
        returns (bool success)
    {
        require(value > 0, "value must be greater than 0.");

        _totalSupply = _totalSupply.sub(value);
        _balances[account] = _balances[account].sub(value);
        
        bytes memory empty;
        emit Transfer(account, address(0), value);
        emit Transfer(account, address(0), value, empty);

        return true;
    }
}
