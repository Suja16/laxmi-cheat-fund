# VolatilityGridStrategy Smart Contracts

This directory contains the smart contract implementation of the VolatilityGridStrategy trading system.

## 📁 Contract Structure

```
contracts/
├── VolatilityGridStrategy.sol      # Main strategy contract
├── VolatilityGridStrategyFactory.sol # Factory for deploying strategies
├── scripts/
│   ├── deploy.js                   # Deployment script
│   └── test.js                     # Contract testing script
├── package.json                    # Node.js dependencies
├── hardhat.config.js              # Hardhat configuration
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Hardhat
- Private key for deployment

### Installation

1. **Install dependencies**:
   ```bash
   cd contracts
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # PRIVATE_KEY=your_private_key_here
   # POLYGON_RPC_URL=https://polygon-rpc.com
   # POLYGONSCAN_API_KEY=your_api_key_here
   ```

3. **Compile contracts**:
   ```bash
   npm run compile
   ```

4. **Deploy contracts**:
   ```bash
   npm run deploy:polygon
   ```

## 📋 Contract Features

### VolatilityGridStrategy.sol

**Core Features:**
- ✅ Grid order management
- ✅ Automated rebalancing
- ✅ Profit tracking
- ✅ Emergency controls
- ✅ Multi-token support
- ✅ Fee management
- ✅ Pausable functionality

**Key Functions:**
- `setGridConfig()` - Configure grid parameters
- `createGridOrders()` - Create initial grid orders
- `executeGridOrder()` - Execute filled orders
- `rebalanceGrid()` - Rebalance entire grid
- `emergencyStop()` - Cancel all orders

### VolatilityGridStrategyFactory.sol

**Features:**
- ✅ Deploy multiple strategy instances
- ✅ Track deployed strategies
- ✅ Centralized fee management

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Contract Functions
```bash
npm run test:contract
```

### Gas Reporting
```bash
npm run coverage
```

## 🌐 Deployment

### Supported Networks

| Network | Chain ID | Status | Command |
|---------|----------|--------|---------|
| Polygon | 137 | ✅ Supported | `npm run deploy:polygon` |
| Ethereum | 1 | ✅ Supported | `npm run deploy:ethereum` |
| Base | 8453 | ✅ Supported | `npm run deploy:base` |
| BSC | 56 | ✅ Supported | `npm run deploy:bsc` |

### Deployment Process

1. **Compile contracts**:
   ```bash
   npm run compile
   ```

2. **Deploy to network**:
   ```bash
   npm run deploy:polygon
   ```

3. **Verify contracts** (optional):
   ```bash
   npm run verify
   ```

## 📊 Contract Architecture

### Data Structures

```solidity
struct GridConfig {
    address baseToken;        // Token to trade (base)
    address quoteToken;      // Quote token (usually stablecoin)
    uint256 baseAmount;      // Total base token amount for sell orders
    uint256 quoteAmount;     // Total quote token amount for buy orders
    uint8 gridLevels;        // Number of grid levels (buy + sell)
    uint16 priceRange;       // Price range percentage around current price
    uint16 profitTarget;     // Minimum profit target per trade
    uint16 slippageTolerance; // Slippage tolerance
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
    int8 gridLevel;
    OrderType orderType;
    OrderStatus status;
    uint256 createdAt;
    uint256 expiresAt;
    uint256 remainingAmount;
}
```

### State Variables

- `mapping(address => GridConfig) public userConfigs` - User configurations
- `mapping(address => mapping(uint256 => GridOrder)) public userOrders` - User orders
- `mapping(address => mapping(int8 => GridLevel)) public userGridLevels` - Grid levels
- `uint256 public totalOrders` - Total order count
- `uint256 public totalFilledOrders` - Total filled orders
- `uint256 public totalProfit` - Total profit generated

## 🔒 Security Features

### Access Control
- ✅ Owner-only admin functions
- ✅ User-specific order ownership
- ✅ Pausable contract functionality

### Reentrancy Protection
- ✅ ReentrancyGuard on all external functions
- ✅ Safe token transfers using SafeERC20

### Input Validation
- ✅ Token address validation
- ✅ Amount validation
- ✅ Configuration parameter validation

### Emergency Controls
- ✅ Emergency stop functionality
- ✅ Emergency token withdrawal
- ✅ Pause/unpause mechanism

## 💰 Fee Structure

- **Protocol Fee**: Configurable (default 0.5%)
- **Fee Recipient**: Set by contract owner
- **Fee Calculation**: Applied to profitable trades

## 📈 Usage Examples

### Setting Up a Grid Strategy

```solidity
// 1. Set grid configuration
GridConfig memory config = GridConfig({
    baseToken: 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619, // WETH
    quoteToken: 0x3c499c542cEF5E3811e1192ce70d8cC03d59, // USDC
    baseAmount: 0.1 ether, // 0.1 WETH
    quoteAmount: 300e6, // 300 USDC
    gridLevels: 10,
    priceRange: 2000, // 20%
    profitTarget: 50, // 0.5%
    slippageTolerance: 100, // 1%
    autoRebalance: true,
    rebalanceThreshold: 50 // 50%
});

strategy.setGridConfig(config);

// 2. Create grid orders
uint256 currentPrice = 3000e6; // $3000 per WETH
strategy.createGridOrders(currentPrice);
```

### Executing Orders

```solidity
// Execute a filled order
strategy.executeGridOrder(user, orderId, actualPrice);
```

### Emergency Stop

```solidity
// Cancel all orders for a user
strategy.emergencyStop();
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
PRIVATE_KEY=your_private_key_here

# Optional (with defaults)
POLYGON_RPC_URL=https://polygon-rpc.com
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BASE_RPC_URL=https://mainnet.base.org
BSC_RPC_URL=https://bsc-dataseed.binance.org

# API Keys for verification
POLYGONSCAN_API_KEY=your_api_key_here
ETHERSCAN_API_KEY=your_api_key_here
BASESCAN_API_KEY=your_api_key_here
BSCSCAN_API_KEY=your_api_key_here
```

## 📚 Integration with TypeScript

The smart contracts are designed to work seamlessly with the TypeScript implementation:

1. **Contract addresses** can be configured in the TypeScript config
2. **ABI interfaces** are generated for easy integration
3. **Event monitoring** can be implemented for real-time updates
4. **Gas estimation** helps optimize transaction costs

## ⚠️ Important Notes

### Security
- **Audit Required**: Contracts should be audited before mainnet deployment
- **Test Thoroughly**: Use testnets extensively before mainnet
- **Monitor Gas**: High gas costs can impact profitability

### Limitations
- **Price Oracle Dependency**: Requires external price feeds
- **Liquidity Requirements**: Needs sufficient token liquidity
- **Gas Costs**: High gas costs can eat into profits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**⚠️ Disclaimer**: These contracts are for educational purposes. Use at your own risk and never invest more than you can afford to lose.
