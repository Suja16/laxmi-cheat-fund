# 🎯 Off-Chain VolatilityGridStrategy Orchestrator

A sophisticated off-chain orchestrator that manages volatility grid trading strategies by coordinating on-chain orders through the 1inch Limit Order Protocol.

## 🌟 **Why Off-Chain Orchestrator?**

Unlike smart contracts that run on-chain, this orchestrator runs off-chain and provides several advantages:

- **🔧 Flexibility**: Easy to modify strategy logic without deploying new contracts
- **⚡ Performance**: Faster execution and lower gas costs
- **🔄 Real-time Updates**: Dynamic price monitoring and strategy adjustments
- **🛠️ Advanced Features**: Complex logic, retry mechanisms, and monitoring
- **💰 Cost Effective**: No gas costs for strategy logic execution
- **🔒 Security**: Private key stays in your control

## 📋 **Key Features**

### 🎯 **Core Orchestrator Features**
- ✅ **Off-chain Strategy Management** - All logic runs off-chain
- ✅ **On-chain Order Execution** - Orders executed via 1inch protocol
- ✅ **Real-time Price Monitoring** - Continuous price updates
- ✅ **Automatic Rebalancing** - Smart rebalancing based on market conditions
- ✅ **Retry Mechanisms** - Automatic retry for failed orders
- ✅ **Comprehensive Monitoring** - Real-time status and performance tracking
- ✅ **Emergency Controls** - Immediate stop and order cancellation
- ✅ **Graceful Shutdown** - Clean shutdown with order cleanup

### 🔄 **Advanced Orchestration**
- ✅ **Dynamic Price Updates** - Configurable price update intervals
- ✅ **Intelligent Retry Logic** - Smart retry with exponential backoff
- ✅ **Order Expiration Management** - Automatic order renewal
- ✅ **Performance Analytics** - Detailed profit and performance tracking
- ✅ **Multi-level Monitoring** - Order, grid, and strategy level monitoring

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- npm or yarn
- Private key for your wallet
- 1inch API key (optional)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # RPC_URL=https://polygon-rpc.com
   # PRIVATE_KEY=your_private_key_here
   # ONEINCH_API_KEY=your_api_key_here
   # CHAIN_ID=137
   ```

3. **Run the orchestrator**:
   ```bash
   npm run orchestrator
   ```

### Available Scripts

- `npm start` - Run the main CLI application
- `npm run orchestrator` - Run the off-chain orchestrator directly
- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:start` - Build and run compiled version
- `npm run dev` - Run with file watching for development

## 🎮 **Usage Examples**

### Basic Orchestrator Usage

```typescript
import { OffChainOrchestrator } from './src/offChainOrchestrator.js';
import { ethers } from 'ethers';

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
const signer = new ethers.Wallet(privateKey, provider);

// Create orchestrator
const orchestrator = new OffChainOrchestrator(provider, signer);

// Set configuration
const config = {
  baseToken: {
    address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    symbol: 'WETH',
    decimals: 18,
    name: 'Wrapped Ether'
  },
  quoteToken: {
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d59',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin (PoS)'
  },
  totalBaseAmount: '0.1',
  totalQuoteAmount: '300',
  gridLevels: 10,
  priceRangePercent: 20
};

orchestrator.setConfiguration(config);

// Start orchestrator
await orchestrator.startOrchestrator();
```

### Advanced Configuration

```typescript
// Custom orchestrator settings
const orchestratorConfig = {
  // ... basic config
  monitoringInterval: 30,        // Check every 30 seconds
  maxRetries: 3,                // Max retry attempts
  retryDelay: 60,               // Wait 1 minute between retries
  priceUpdateInterval: 300,     // Update price every 5 minutes
  orderExpirationDays: 30       // Orders expire in 30 days
};

orchestrator.setConfiguration(orchestratorConfig);
```

## 📊 **Orchestrator Architecture**

### 🔄 **Execution Flow**

```
1. Initialize Orchestrator
   ↓
2. Validate Configuration
   ↓
3. Fetch Current Price
   ↓
4. Generate Grid Levels
   ↓
5. Create Initial Orders
   ↓
6. Submit to 1inch Protocol
   ↓
7. Start Monitoring Loop
   ↓
8. Monitor Order Status
   ↓
9. Handle Fills & Rebalancing
   ↓
10. Continue Monitoring...
```

### 📈 **Monitoring System**

The orchestrator runs multiple monitoring loops:

1. **Order Monitoring** (every 30s by default)
   - Check order fill status
   - Handle partial fills
   - Create opposite orders
   - Calculate profits

2. **Price Monitoring** (every 5 minutes by default)
   - Update current market price
   - Detect significant price changes
   - Trigger rebalancing if needed

3. **Retry Management** (continuous)
   - Retry failed orders
   - Handle network issues
   - Manage order expiration

## 🔧 **Configuration Options**

### Basic Configuration
```typescript
interface OrchestratorConfig {
  baseToken: string;              // Base token address
  quoteToken: string;             // Quote token address
  baseAmount: string;             // Base token amount
  quoteAmount: string;            // Quote token amount
  gridLevels: number;             // Number of grid levels
  priceRange: number;             // Price range percentage
  profitTarget: number;           // Profit target percentage
  autoRebalance: boolean;         // Enable auto-rebalancing
  rebalanceThreshold: number;    // Rebalance threshold
}
```

### Advanced Orchestrator Settings
```typescript
interface AdvancedConfig {
  monitoringInterval: number;      // Monitoring frequency (seconds)
  maxRetries: number;            // Maximum retry attempts
  retryDelay: number;            // Delay between retries (seconds)
  priceUpdateInterval: number;   // Price update frequency (seconds)
  orderExpirationDays: number;   // Order expiration (days)
}
```

## 📊 **Monitoring & Analytics**

### Real-time Status Display
```
📊 Orchestrator Status [14:30:25]: 8 active, 2 filled (10 total) | Profit: $12.45 | Price: 3000.123456
```

### Performance Metrics
```typescript
const stats = orchestrator.getOrchestratorStats();
console.log({
  totalOrders: stats.totalOrders,
  activeOrders: stats.activeOrders,
  filledOrders: stats.filledOrders,
  totalProfit: stats.totalProfit,
  uptime: stats.uptime,
  retryCount: stats.retryCount
});
```

## 🔒 **Security Features**

### Private Key Management
- ✅ **Local Storage Only** - Private keys never leave your machine
- ✅ **No External Services** - No third-party key management
- ✅ **Secure Signing** - Uses ethers.js secure signing

### Order Security
- ✅ **1inch Protocol** - Orders executed through trusted protocol
- ✅ **Slippage Protection** - Configurable slippage tolerance
- ✅ **Order Validation** - Comprehensive order validation
- ✅ **Emergency Stop** - Immediate order cancellation

### Network Security
- ✅ **Retry Logic** - Handles network failures gracefully
- ✅ **Error Handling** - Comprehensive error handling
- ✅ **Graceful Shutdown** - Clean shutdown procedures

## 🌐 **Supported Networks**

| Network | Chain ID | Status | RPC URL |
|---------|----------|--------|---------|
| Polygon | 137 | ✅ Supported | `https://polygon-rpc.com` |
| Ethereum | 1 | ✅ Supported | `https://eth.llamarpc.com` |
| Base | 8453 | ✅ Supported | `https://mainnet.base.org` |
| BSC | 56 | ✅ Supported | `https://bsc-dataseed.binance.org` |
| Arbitrum | 42161 | ✅ Supported | `https://arb1.arbitrum.io/rpc` |
| Optimism | 10 | ✅ Supported | `https://mainnet.optimism.io` |

## 🔄 **Orchestrator vs Smart Contract**

| Feature | Off-Chain Orchestrator | Smart Contract |
|---------|------------------------|----------------|
| **Flexibility** | ✅ Easy to modify | ❌ Requires deployment |
| **Gas Costs** | ✅ No gas for logic | ❌ Gas for all operations |
| **Real-time Updates** | ✅ Dynamic updates | ❌ Fixed logic |
| **Complex Logic** | ✅ Unlimited complexity | ❌ Limited by gas |
| **Monitoring** | ✅ Advanced monitoring | ❌ Basic events only |
| **Retry Logic** | ✅ Smart retry mechanisms | ❌ Manual intervention |
| **Decentralization** | ❌ Centralized | ✅ Fully decentralized |
| **Transparency** | ❌ Private logic | ✅ Public and verifiable |

## 🛠️ **Advanced Features**

### Intelligent Rebalancing
- **Price-based Rebalancing**: Triggers when price changes significantly
- **Fill-based Rebalancing**: Triggers when threshold of orders fill
- **Time-based Rebalancing**: Periodic rebalancing (optional)

### Retry Mechanisms
- **Exponential Backoff**: Increasing delays between retries
- **Max Retry Limits**: Prevents infinite retry loops
- **Smart Retry Logic**: Only retries when appropriate

### Order Management
- **Automatic Expiration**: Orders automatically expire and renew
- **Partial Fill Handling**: Handles partial order fills intelligently
- **Order Optimization**: Optimizes order sizes and prices

## 📈 **Performance Optimization**

### Gas Optimization
- **Batch Operations**: Groups operations to reduce gas costs
- **Smart Timing**: Executes orders at optimal times
- **Fee Management**: Monitors and optimizes transaction fees

### Network Optimization
- **Connection Pooling**: Efficient RPC connection management
- **Request Batching**: Batches API requests when possible
- **Error Recovery**: Handles network issues gracefully

## 🚨 **Emergency Procedures**

### Emergency Stop
```typescript
// Immediate stop
await orchestrator.emergencyStop();

// Graceful shutdown
await orchestrator.stopOrchestrator();
```

### Order Cancellation
```typescript
// Cancel all orders
await orchestrator.cancelAllOrders();

// Cancel specific order
await orchestrator.cancelOrder(orderId);
```

## 🔍 **Troubleshooting**

### Common Issues

1. **Connection Issues**
   ```bash
   # Check RPC URL
   curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://polygon-rpc.com
   ```

2. **Private Key Issues**
   ```bash
   # Verify private key format
   echo "0x$(openssl rand -hex 32)"
   ```

3. **API Key Issues**
   ```bash
   # Test 1inch API
   curl -H "Authorization: Bearer YOUR_API_KEY" https://api.1inch.io/v5.0/137/quote?src=0x7ceb23fd6bc0add59e62ac25578270cff1b9f619&dst=0x3c499c542cEF5E3811e1192ce70d8cC03d59&amount=1000000000000000000
   ```

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG = 'true';
```

## 📚 **API Reference**

### Core Methods
- `setConfiguration(config)` - Set orchestrator configuration
- `initialize()` - Initialize orchestrator
- `startOrchestrator()` - Start the orchestrator
- `stopOrchestrator()` - Stop the orchestrator
- `emergencyStop()` - Emergency stop

### Monitoring Methods
- `getOrchestratorStats()` - Get performance statistics
- `displayOrchestratorStatus()` - Display current status
- `checkOrderFills()` - Check order fill status

### Order Management
- `createGridOrders()` - Create initial grid orders
- `submitOrdersToProtocol()` - Submit orders to 1inch
- `cancelAllOrders()` - Cancel all active orders

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

---

**⚠️ Disclaimer**: This orchestrator is for educational purposes. Trading cryptocurrencies involves substantial risk of loss. Use at your own risk and never invest more than you can afford to lose.

## 🎯 **Why Choose Off-Chain Orchestration?**

The off-chain orchestrator approach gives you the **best of both worlds**:

- **🧠 Smart Logic**: Complex strategy logic runs off-chain
- **⚡ Fast Execution**: Orders execute quickly on-chain
- **💰 Cost Effective**: Minimal gas costs
- **🔧 Flexible**: Easy to modify and improve
- **📊 Advanced Monitoring**: Comprehensive analytics and monitoring
- **🛡️ Secure**: Your private keys stay in your control

This approach is perfect for sophisticated trading strategies that require real-time decision making, complex logic, and advanced monitoring capabilities!
