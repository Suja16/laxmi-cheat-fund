// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PythPriceReceiver {
    struct PriceData {
        uint256 price;
        uint256 lastUpdated;
    }

    mapping(bytes32 => PriceData) public prices; // asset id => price data

    // Only allow updates from the trusted pusher (set this address after deployment)
    address public pusher;

    constructor(address _pusher) {
        pusher = _pusher;
    }

    modifier onlyPusher() {
        require(msg.sender == pusher, "Not authorized");
        _;
    }

    // Called by the pusher to update price
    function updatePrice(bytes32 assetId, uint256 price) external onlyPusher {
        prices[assetId] = PriceData(price, block.timestamp);
    }

    // Read latest price
    function getPrice(bytes32 assetId) external view returns (uint256, uint256) {
        PriceData memory data = prices[assetId];
        return (data.price, data.lastUpdated);
    }
}