pragma solidity ^0.5.11;

/// @title JRC223 receiver interface
contract JRC223Receiver { 
    /// @dev Standard JRC223 function that will handle incoming token transfers.
    /// @param from Token sender address.
    /// @param amount Amount of tokens.
    /// @param data Transaction metadata.
    function tokenFallback(address from, uint amount, bytes calldata data) external;
}
