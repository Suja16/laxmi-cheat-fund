// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./VolatilityGridStrategy.sol";

/**
 * @title VolatilityGridStrategyFactory
 * @dev Factory contract to deploy VolatilityGridStrategy instances
 */
contract VolatilityGridStrategyFactory {
    address public immutable feeRecipient;
    address[] public deployedStrategies;
    
    event StrategyDeployed(address indexed strategy, address indexed owner);
    
    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Deploy a new VolatilityGridStrategy instance
     * @return strategy The deployed strategy contract address
     */
    function deployStrategy() external returns (address strategy) {
        strategy = address(new VolatilityGridStrategy(feeRecipient));
        deployedStrategies.push(strategy);
        
        emit StrategyDeployed(strategy, msg.sender);
    }
    
    /**
     * @dev Get all deployed strategies
     * @return strategies Array of deployed strategy addresses
     */
    function getDeployedStrategies() external view returns (address[] memory strategies) {
        return deployedStrategies;
    }
    
    /**
     * @dev Get number of deployed strategies
     * @return count Number of deployed strategies
     */
    function getStrategyCount() external view returns (uint256 count) {
        return deployedStrategies.length;
    }
}
