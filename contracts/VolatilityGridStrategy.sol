// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VolatilityGridStrategy
 * @dev Smart contract implementation of the volatility grid trading strategy
 * @author Laxmi Protocol
 */
contract VolatilityGridStrategy is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ============ STRUCTS ============

    struct GridConfig {
        address baseToken;        // Token to trade (base)
        address quoteToken;      // Quote token (usually stablecoin)
        uint256 baseAmount;      // Total base token amount for sell orders
        uint256 quoteAmount;     // Total quote token amount for buy orders
        uint8 gridLevels;        // Number of grid levels (buy + sell)
        uint16 priceRange;       // Price range percentage around current price (in basis points)
        uint16 profitTarget;     // Minimum profit target per trade (in basis points)
        uint16 slippageTolerance; // Slippage tolerance (in basis points)
        bool autoRebalance;      // Whether to auto-rebalance when orders fill
        uint8 rebalanceThreshold; // % threshold to trigger rebalancing
    }

    struct GridOrder {
        uint256 orderId;
        address maker;
        address makerAsset;
        address takerAsset;
        uint256 makingAmount;
        uint256 takingAmount;
        uint256 triggerPrice;
        uint8 gridLevel;
        OrderType orderType;
        OrderStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 remainingAmount;
    }

    struct GridLevel {
        uint256 buyPrice;
        uint256 sellPrice;
        bool hasActiveBuy;
        bool hasActiveSell;
    }

    enum OrderType {
        BUY,
        SELL
    }

    enum OrderStatus {
        ACTIVE,
        FILLED,
        PARTIALLY_FILLED,
        CANCELLED,
        EXPIRED
    }

    // ============ STATE VARIABLES ============

    mapping(address => GridConfig) public userConfigs;
    mapping(address => mapping(uint256 => GridOrder)) public userOrders;
    mapping(address => uint256) public userOrderCount;
    mapping(address => mapping(int8 => GridLevel)) public userGridLevels;
    
    uint256 public totalOrders;
    uint256 public totalFilledOrders;
    uint256 public totalProfit;
    
    // Fee configuration
    uint16 public protocolFeeBps = 50; // 0.5% protocol fee
    address public feeRecipient;
    
    // Events
    event GridOrderCreated(
        address indexed user,
        uint256 indexed orderId,
        OrderType orderType,
        uint8 gridLevel,
        uint256 triggerPrice,
        uint256 makingAmount,
        uint256 takingAmount
    );
    
    event GridOrderFilled(
        address indexed user,
        uint256 indexed orderId,
        uint256 filledAmount,
        uint256 profit
    );
    
    event GridOrderCancelled(
        address indexed user,
        uint256 indexed orderId
    );
    
    event GridRebalanced(
        address indexed user,
        uint256 newPrice,
        uint8 newLevels
    );
    
    event ConfigUpdated(
        address indexed user,
        address baseToken,
        address quoteToken,
        uint8 gridLevels,
        uint16 priceRange
    );

    // ============ CONSTRUCTOR ============

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    // ============ MODIFIERS ============

    modifier onlyValidToken(address token) {
        require(token != address(0), "Invalid token address");
        _;
    }

    modifier onlyValidAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than 0");
        _;
    }

    modifier onlyOrderOwner(address user, uint256 orderId) {
        require(userOrders[user][orderId].maker == msg.sender, "Not order owner");
        _;
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Set grid configuration for a user
     * @param config The grid configuration parameters
     */
    function setGridConfig(GridConfig calldata config) 
        external 
        onlyValidToken(config.baseToken)
        onlyValidToken(config.quoteToken)
        onlyValidAmount(config.baseAmount)
        onlyValidAmount(config.quoteAmount)
    {
        require(config.gridLevels >= 2 && config.gridLevels <= 50, "Invalid grid levels");
        require(config.priceRange > 0 && config.priceRange <= 5000, "Invalid price range"); // Max 50%
        require(config.profitTarget > 0 && config.profitTarget <= 1000, "Invalid profit target"); // Max 10%
        
        userConfigs[msg.sender] = config;
        
        emit ConfigUpdated(
            msg.sender,
            config.baseToken,
            config.quoteToken,
            config.gridLevels,
            config.priceRange
        );
    }

    /**
     * @dev Create initial grid orders
     * @param currentPrice Current market price (in quote token units per base token)
     */
    function createGridOrders(uint256 currentPrice) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidAmount(currentPrice)
    {
        GridConfig memory config = userConfigs[msg.sender];
        require(config.baseToken != address(0), "Config not set");
        
        // Generate grid levels
        _generateGridLevels(msg.sender, currentPrice);
        
        // Create sell orders (above current price)
        uint8 sellLevels = config.gridLevels / 2 + (config.gridLevels % 2);
        for (uint8 i = 1; i <= sellLevels; i++) {
            _createGridOrder(msg.sender, OrderType.SELL, int8(i), currentPrice);
        }
        
        // Create buy orders (below current price)
        uint8 buyLevels = config.gridLevels / 2;
        for (uint8 i = 1; i <= buyLevels; i++) {
            _createGridOrder(msg.sender, OrderType.BUY, -int8(i), currentPrice);
        }
    }

    /**
     * @dev Execute a grid order (called by external executor)
     * @param user The user whose order to execute
     * @param orderId The order ID to execute
     * @param actualPrice The actual execution price
     */
    function executeGridOrder(
        address user,
        uint256 orderId,
        uint256 actualPrice
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyOrderOwner(user, orderId)
    {
        GridOrder storage order = userOrders[user][orderId];
        require(order.status == OrderStatus.ACTIVE, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");
        
        // Calculate execution amount based on actual price
        uint256 executionAmount = _calculateExecutionAmount(order, actualPrice);
        require(executionAmount > 0, "Invalid execution amount");
        
        // Update order status
        order.status = OrderStatus.FILLED;
        order.remainingAmount = 0;
        
        // Transfer tokens
        if (order.orderType == OrderType.SELL) {
            IERC20(order.makerAsset).safeTransferFrom(user, msg.sender, executionAmount);
            IERC20(order.takerAsset).safeTransfer(msg.sender, order.takingAmount);
        } else {
            IERC20(order.makerAsset).safeTransferFrom(user, msg.sender, order.makingAmount);
            IERC20(order.takerAsset).safeTransfer(msg.sender, executionAmount);
        }
        
        // Calculate profit
        uint256 profit = _calculateProfit(order, executionAmount);
        totalProfit += profit;
        
        // Update grid level status
        userGridLevels[user][order.gridLevel].hasActiveBuy = false;
        userGridLevels[user][order.gridLevel].hasActiveSell = false;
        
        // Create opposite order if auto-rebalance is enabled
        if (userConfigs[user].autoRebalance) {
            _createOppositeOrder(user, order);
        }
        
        totalFilledOrders++;
        
        emit GridOrderFilled(user, orderId, executionAmount, profit);
    }

    /**
     * @dev Cancel a grid order
     * @param orderId The order ID to cancel
     */
    function cancelGridOrder(uint256 orderId) 
        external 
        nonReentrant 
        onlyOrderOwner(msg.sender, orderId)
    {
        GridOrder storage order = userOrders[msg.sender][orderId];
        require(order.status == OrderStatus.ACTIVE, "Order not active");
        
        order.status = OrderStatus.CANCELLED;
        
        // Update grid level status
        if (order.orderType == OrderType.BUY) {
            userGridLevels[msg.sender][order.gridLevel].hasActiveBuy = false;
        } else {
            userGridLevels[msg.sender][order.gridLevel].hasActiveSell = false;
        }
        
        emit GridOrderCancelled(msg.sender, orderId);
    }

    /**
     * @dev Rebalance the entire grid
     * @param newPrice New current market price
     */
    function rebalanceGrid(uint256 newPrice) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyValidAmount(newPrice)
    {
        GridConfig memory config = userConfigs[msg.sender];
        require(config.baseToken != address(0), "Config not set");
        
        // Cancel all active orders
        _cancelAllActiveOrders(msg.sender);
        
        // Regenerate grid levels
        _generateGridLevels(msg.sender, newPrice);
        
        // Create new grid orders
        uint8 sellLevels = config.gridLevels / 2 + (config.gridLevels % 2);
        for (uint8 i = 1; i <= sellLevels; i++) {
            _createGridOrder(msg.sender, OrderType.SELL, int8(i), newPrice);
        }
        
        uint8 buyLevels = config.gridLevels / 2;
        for (uint8 i = 1; i <= buyLevels; i++) {
            _createGridOrder(msg.sender, OrderType.BUY, -int8(i), newPrice);
        }
        
        emit GridRebalanced(msg.sender, newPrice, config.gridLevels);
    }

    /**
     * @dev Emergency stop - cancel all orders for a user
     */
    function emergencyStop() external nonReentrant {
        _cancelAllActiveOrders(msg.sender);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get user's grid configuration
     * @param user The user address
     * @return config The grid configuration
     */
    function getUserConfig(address user) external view returns (GridConfig memory config) {
        return userConfigs[user];
    }

    /**
     * @dev Get user's grid order
     * @param user The user address
     * @param orderId The order ID
     * @return order The grid order
     */
    function getUserOrder(address user, uint256 orderId) external view returns (GridOrder memory order) {
        return userOrders[user][orderId];
    }

    /**
     * @dev Get user's grid level
     * @param user The user address
     * @param level The grid level
     * @return gridLevel The grid level data
     */
    function getUserGridLevel(address user, int8 level) external view returns (GridLevel memory gridLevel) {
        return userGridLevels[user][level];
    }

    /**
     * @dev Get user's order count
     * @param user The user address
     * @return count The number of orders
     */
    function getUserOrderCount(address user) external view returns (uint256 count) {
        return userOrderCount[user];
    }

    /**
     * @dev Get user's active orders
     * @param user The user address
     * @return activeOrders Array of active order IDs
     */
    function getUserActiveOrders(address user) external view returns (uint256[] memory activeOrders) {
        uint256 count = userOrderCount[user];
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 1; i <= count; i++) {
            if (userOrders[user][i].status == OrderStatus.ACTIVE) {
                activeCount++;
            }
        }
        
        // Create array
        activeOrders = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= count; i++) {
            if (userOrders[user][i].status == OrderStatus.ACTIVE) {
                activeOrders[index] = i;
                index++;
            }
        }
    }

    /**
     * @dev Get strategy statistics
     * @return stats Strategy statistics
     */
    function getStrategyStats() external view returns (
        uint256 _totalOrders,
        uint256 _totalFilledOrders,
        uint256 _totalProfit,
        uint256 _protocolFeeBps
    ) {
        return (totalOrders, totalFilledOrders, totalProfit, protocolFeeBps);
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Generate grid levels for a user
     * @param user The user address
     * @param currentPrice Current market price
     */
    function _generateGridLevels(address user, uint256 currentPrice) internal {
        GridConfig memory config = userConfigs[user];
        uint256 priceRange = currentPrice * config.priceRange / 10000; // Convert basis points to percentage
        uint8 gridLevels = config.gridLevels;
        
        // Clear existing grid levels
        for (int8 i = -int8(gridLevels/2); i <= int8(gridLevels/2 + gridLevels%2); i++) {
            if (i != 0) {
                userGridLevels[user][i] = GridLevel(0, 0, false, false);
            }
        }
        
        // Generate sell levels (above current price)
        uint8 sellLevels = gridLevels / 2 + (gridLevels % 2);
        for (uint8 i = 1; i <= sellLevels; i++) {
            uint256 sellPrice = currentPrice + (priceRange * i / sellLevels);
            uint256 buyPrice = sellPrice * (10000 - config.profitTarget) / 10000;
            
            userGridLevels[user][int8(i)] = GridLevel(buyPrice, sellPrice, false, false);
        }
        
        // Generate buy levels (below current price)
        uint8 buyLevels = gridLevels / 2;
        for (uint8 i = 1; i <= buyLevels; i++) {
            uint256 buyPrice = currentPrice - (priceRange * i / buyLevels);
            uint256 sellPrice = buyPrice * (10000 + config.profitTarget) / 10000;
            
            userGridLevels[user][-int8(i)] = GridLevel(buyPrice, sellPrice, false, false);
        }
    }

    /**
     * @dev Create a single grid order
     * @param user The user address
     * @param orderType The order type (BUY or SELL)
     * @param gridLevel The grid level
     * @param currentPrice Current market price
     */
    function _createGridOrder(
        address user,
        OrderType orderType,
        int8 gridLevel,
        uint256 currentPrice
    ) internal {
        GridConfig memory config = userConfigs[user];
        GridLevel memory level = userGridLevels[user][gridLevel];
        
        require(level.buyPrice > 0 && level.sellPrice > 0, "Invalid grid level");
        
        uint256 orderId = ++userOrderCount[user];
        totalOrders++;
        
        uint256 makingAmount;
        uint256 takingAmount;
        uint256 triggerPrice;
        
        if (orderType == OrderType.SELL) {
            makingAmount = config.baseAmount / (config.gridLevels / 2 + config.gridLevels % 2);
            triggerPrice = level.sellPrice;
            takingAmount = makingAmount * triggerPrice / 1e18; // Assuming 18 decimals
            userGridLevels[user][gridLevel].hasActiveSell = true;
        } else {
            makingAmount = config.quoteAmount / (config.gridLevels / 2);
            triggerPrice = level.buyPrice;
            takingAmount = makingAmount * 1e18 / triggerPrice; // Assuming 18 decimals
            userGridLevels[user][gridLevel].hasActiveBuy = true;
        }
        
        GridOrder memory order = GridOrder({
            orderId: orderId,
            maker: user,
            makerAsset: orderType == OrderType.SELL ? config.baseToken : config.quoteToken,
            takerAsset: orderType == OrderType.SELL ? config.quoteToken : config.baseToken,
            makingAmount: makingAmount,
            takingAmount: takingAmount,
            triggerPrice: triggerPrice,
            gridLevel: gridLevel,
            orderType: orderType,
            status: OrderStatus.ACTIVE,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + 30 days, // 30 day expiration
            remainingAmount: makingAmount
        });
        
        userOrders[user][orderId] = order;
        
        emit GridOrderCreated(user, orderId, orderType, uint8(gridLevel), triggerPrice, makingAmount, takingAmount);
    }

    /**
     * @dev Create opposite order when a grid order fills
     * @param user The user address
     * @param filledOrder The filled order
     */
    function _createOppositeOrder(address user, GridOrder memory filledOrder) internal {
        GridLevel memory level = userGridLevels[user][filledOrder.gridLevel];
        
        OrderType newOrderType;
        uint256 newAmount;
        
        if (filledOrder.orderType == OrderType.BUY) {
            newOrderType = OrderType.SELL;
            newAmount = filledOrder.remainingAmount;
        } else {
            newOrderType = OrderType.BUY;
            newAmount = filledOrder.takingAmount;
        }
        
        // Create the opposite order
        _createGridOrder(user, newOrderType, filledOrder.gridLevel, filledOrder.triggerPrice);
    }

    /**
     * @dev Cancel all active orders for a user
     * @param user The user address
     */
    function _cancelAllActiveOrders(address user) internal {
        uint256 count = userOrderCount[user];
        
        for (uint256 i = 1; i <= count; i++) {
            if (userOrders[user][i].status == OrderStatus.ACTIVE) {
                userOrders[user][i].status = OrderStatus.CANCELLED;
                
                // Update grid level status
                GridOrder memory order = userOrders[user][i];
                if (order.orderType == OrderType.BUY) {
                    userGridLevels[user][order.gridLevel].hasActiveBuy = false;
                } else {
                    userGridLevels[user][order.gridLevel].hasActiveSell = false;
                }
                
                emit GridOrderCancelled(user, i);
            }
        }
    }

    /**
     * @dev Calculate execution amount based on actual price
     * @param order The order to execute
     * @param actualPrice The actual execution price
     * @return executionAmount The amount to execute
     */
    function _calculateExecutionAmount(GridOrder memory order, uint256 actualPrice) internal pure returns (uint256) {
        // Simple implementation - in practice, you'd want more sophisticated price validation
        if (order.orderType == OrderType.SELL) {
            return order.makingAmount * actualPrice / 1e18;
        } else {
            return order.makingAmount * 1e18 / actualPrice;
        }
    }

    /**
     * @dev Calculate profit from order execution
     * @param order The executed order
     * @param executionAmount The execution amount
     * @return profit The calculated profit
     */
    function _calculateProfit(GridOrder memory order, uint256 executionAmount) internal view returns (uint256) {
        GridConfig memory config = userConfigs[order.maker];
        
        if (order.orderType == OrderType.SELL) {
            return executionAmount * config.profitTarget / 10000;
        } else {
            return executionAmount * config.profitTarget / 10000;
        }
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Set protocol fee
     * @param _protocolFeeBps New protocol fee in basis points
     */
    function setProtocolFee(uint16 _protocolFeeBps) external onlyOwner {
        require(_protocolFeeBps <= 1000, "Fee too high"); // Max 10%
        protocolFeeBps = _protocolFeeBps;
    }

    /**
     * @dev Set fee recipient
     * @param _feeRecipient New fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw tokens
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
