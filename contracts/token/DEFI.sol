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
        if (encodedFunc == keccak256(abi.encodePacked(hex"1178acd9"))) {
            exchangeToDEFI(from, amount);
        } else {
            revert("Unhandled function in tokenFallback");
        }
    }

    function jusdToken() external view returns (address) {
        return _jusdToken;
    }

    /**
     * @dev Exchanges DEFI for JUSD.
     * @param amount Amount to exchange.
     */
    function exchangeToJUSD(uint amount) external {
        require(amount > 0, "Amount should be greater than 0");
        require(
            _balances[msg.sender] >= amount,
            "Exchanger does not have enough balance"
        );

        // Burn exchanged DEFI
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        _totalSupply = _totalSupply.sub(amount);

        // Contract keeps percentage of JUSD for exchanging service
        uint exchAmt = amount.mul(uint256(100 - OWNER_PERCENTAGE)).div(100);
        JRC223(_jusdToken).transfer(msg.sender, exchAmt);

        // Emit DEFI transfer events
        // From exchanger to burn address
        bytes memory empty;
        emit Transfer(msg.sender, address(0), amount);
        emit Transfer(msg.sender, address(0), amount, empty);
    }

    /**
     * @dev Allows the owner to withdraw the remaining JUSD in the contract.
     */
    function withdrawJUSD() external onlyOwner {

    }

    /**
     * @dev Exchanges JUSD for DEFI.
     * @param exchanger Address of the exchanger.
     * @param amount Amount being exchanged.
     */
    function exchangeToDEFI(address exchanger, uint amount) private {
        require(amount > 0, "Amount should be greater than 0");

        // Mint new DEFI
        _balances[exchanger] = _balances[exchanger].add(amount);
        _totalSupply = _totalSupply.add(amount);

        // Calculate JUSD going to owner and transfer
        uint ownerAmt = amount.mul(uint256(OWNER_PERCENTAGE)).div(100);
        JRC223(_jusdToken).transfer(owner(), ownerAmt);

        // Emit DEFI transfer events
        // From burn address to exchanger
        bytes memory empty;
        emit Transfer(address(0), exchanger, amount);
        emit Transfer(address(0), exchanger, amount, empty);
    }
}
