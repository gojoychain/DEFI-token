pragma solidity ^0.5.11;

import "./JRC223.sol";
import "../lib/Ownable.sol";
import "../lib/SafeMath.sol";

/**
 * @title DEFI token contract.
 * @dev Users can deposit 1 JUSD and receive 1 DEFI token.
 *      95% of JUSD will be stored in DEFI smart contract.
 *      5% of JUSD will go to owner of DEFI smart contract.
 */
contract DEFI is JRC223, JRC223Receiver, Ownable {
    using SafeMath for uint;

    uint8 private constant OWNER_PERCENTAGE = 5;

    address private _jusdToken;

    /**
     * @dev Creates the token.
     * @param owner Owner of the contract.
     * @param jusdToken Address of JUSD token contract.
     */
    constructor(
        address owner,
        address jusdToken)
        Ownable(owner)
        public
        validAddress(owner)
        validAddress(jusdToken)
    {
        _name = "DEFI Token";
        _symbol = "DEFI";
        _decimals = 18;
        _totalSupply = 0;
        _jusdToken = jusdToken;
    }

    function tokenFallback(
        address from,
        uint amount,
        bytes calldata data)
        external
    {
        require(msg.sender == _jusdToken, "Only JUSD is accepted");

        bytes32 encodedFunc = keccak256(abi.encodePacked(data));
        if (encodedFunc == keccak256(abi.encodePacked(hex"045d0389"))) {
            exchange(from, amount);
        } else {
            revert("Unhandled function in tokenFallback");
        }
    }

    /**
     * @dev Exchanges JUSD for DEFI. Increment balances and transfers some JUSD to owner.
     * @param exchanger Address of the exchanger.
     * @param amount Amount being exchanged.
     */
    function exchange(address exchanger, uint amount) private {
        require(amount > 0, "amount should be greater than 0");

        // Mint new DEFI
        _totalSupply = _totalSupply.add(amount);
        _balances[exchanger] = _balances[exchanger].add(amount);

        // Calculate JUSD going to owner and transfer
        uint ownerAmt = amount.mul(uint256(OWNER_PERCENTAGE)).div(100);
        JRC223(_jusdToken).transfer(owner(), ownerAmt);

        // Emit DEFI transfer events
        bytes memory empty;
        emit Transfer(address(0), exchanger, amount);
        emit Transfer(address(0), exchanger, amount, empty);
    }
}
