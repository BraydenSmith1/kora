
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TradeRegistry {
    event TradeRecorded(bytes32 indexed tradeId, address indexed emitter, uint256 priceCentsPerKwh, uint256 quantityWh, uint256 amountCents, string regionId);
    mapping(bytes32 => bool) public seen;
    function record(bytes32 tradeId, uint256 priceCentsPerKwh, uint256 quantityWh, uint256 amountCents, string calldata regionId) external {
        require(!seen[tradeId], "already recorded");
        seen[tradeId] = true;
        emit TradeRecorded(tradeId, msg.sender, priceCentsPerKwh, quantityWh, amountCents, regionId);
    }
}
