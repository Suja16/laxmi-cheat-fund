# 🎯 Clean Volatility Grid Strategy with Backtester

A streamlined off-chain orchestrator that manages volatility grid trading strategies with on-chain order execution through the 1inch Limit Order Protocol, now with comprehensive backtesting capabilities.

## ✨ **What's New**

- **🧪 Advanced Backtester**: Historical data analysis with multiple data sources
- **📊 Data Provider Service**: Centralized data fetching with fallbacks
- **📈 Performance Analytics**: Detailed metrics and recommendations
- **🔄 Real-time & Historical**: Live trading + historical simulation

## 📊 **Data Sources**

The bot gets its data from multiple sources with automatic fallbacks:

### **Price Data Sources** (in order of preference):
1. **1inch API** - Most accurate DEX prices (primary)
2. **CoinGecko API** - Free, reliable market data (fallback)
3. **CoinMarketCap API** - Professional market data (fallback)
4. **Mock Data Generator** - For testing/development (last resort)

### **Order Management**:
- **1inch Limit Order Protocol** - On-chain order execution
- **Real-time Monitoring** - Order status checking every 30 seconds

### **Token Information**:
- **On-chain Contract Calls** - Decimals, symbol, balance validation
- **RPC Providers** - Polygon, Ethereum, Base networks

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- Private key for your wallet
- 1inch API key (optional, has fallback)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   # Create .env file
   PRIVATE_KEY=your_private_key_here
   RPC_URL=https://polygon-rpc.com
   ONEINCH_API_KEY=your_api_key_here
   CHAIN_ID=137
   ```

3. **Test the configuration**:
   ```bash
   npm run test:config
   ```

4. **Run backtests**:
   ```bash
   npm run backtest
   ```

5. **Run live strategy**:
   ```bash
   npm start
   ```

## 🎮 **Usage**

### **Live Trading**
```bash
npm start          # Interactive CLI
npm run orchestrator  # Direct execution
```

### **Backtesting**
```bash
npm run backtest   # Run backtest with default config
```

### **Testing**
```bash
npm run test:config    # Test configuration files
npm test              # Test implementation
```

## 📋 **Backtester Features**

### **Data Sources**
- **CoinGecko**: Free historical data (30+ days)
- **CoinMarketCap**: Professional data (requires API key)
- **1inch**: Real-time DEX prices
- **Mock Data**: Generated for testing

### **Performance Metrics**
- **Total Profit**: Absolute and percentage returns
- **Win Rate**: Percentage of profitable trades
- **Sharpe Ratio**: Risk-adjusted returns
- **Max Drawdown**: Maximum loss from peak
- **Grid Efficiency**: How well grid captured price movements
- **Trade Analysis**: Individual trade performance

### **Backtest Results Example**
```
📊 BACKTEST RESULTS
==================
Period: 720 hours
Price Range: $3000.00 → $3150.00 (5.00%)
Total Trades: 45
Successful Trades: 32
Win Rate: 71.11%
Total Profit: $125.50
Total Profit %: 4.18%
Average Profit/Trade: $2.79
Max Drawdown: $15.20
Sharpe Ratio: 1.85
Grid Efficiency: 78.50%

🎯 Performance Rating: Good

💡 Recommendations:
• Grid efficiency is good - strategy captured most price movements
• Win rate is strong - consider maintaining current settings
```

## 📋 **Configuration Options**

### **Preset Configurations**
- **Conservative**: 10 levels, ±10% range, 0.3% profit target
- **Moderate**: 15 levels, ±20% range, 0.5% profit target  
- **Aggressive**: 20 levels, ±30% range, 1.0% profit target

### **Custom Configuration**
- Base token amount (e.g., 0.1 WETH)
- Quote token amount (e.g., 300 USDC)
- Grid levels (number of buy/sell orders)
- Price range percentage around current price
- Profit target percentage per trade
- Slippage tolerance percentage

## 🌐 **Supported Networks**

| Network | Chain ID | Status | Default RPC | Data Sources |
|---------|----------|--------|-------------|--------------|
| Polygon | 137 | ✅ Supported | `https://polygon-rpc.com` | 1inch, CoinGecko |
| Ethereum | 1 | ✅ Supported | `https://eth.llamarpc.com` | 1inch, CoinGecko |
| Base | 8453 | ✅ Supported | `https://mainnet.base.org` | 1inch, CoinGecko |

## 🔄 **How It Works**

### **Live Trading Flow**
1. **Initialize**: Validates configuration and ensures token approvals
2. **Price Fetch**: Gets current market price from multiple sources
3. **Grid Generation**: Creates buy/sell levels around current price
4. **Order Creation**: Creates limit orders on 1inch protocol
5. **Monitoring**: Continuously checks order status every 30 seconds
6. **Auto-rebalancing**: Creates opposite orders when orders fill
7. **Profit Tracking**: Calculates and displays profits in real-time

### **Backtesting Flow**
1. **Data Fetch**: Retrieves historical price data from multiple sources
2. **Grid Simulation**: Simulates grid strategy execution
3. **Trade Simulation**: Models order fills and rebalancing
4. **Performance Analysis**: Calculates comprehensive metrics
5. **Recommendations**: Provides optimization suggestions

## 📊 **Example Grid**

For WETH/USDC at $3000 with ±20% range and 10 levels:

```
Level +5: Sell at $3600, Buy at $3582
Level +4: Sell at $3480, Buy at $3462
Level +3: Sell at $3360, Buy at $3342
Level +2: Sell at $3240, Buy at $3222
Level +1: Sell at $3120, Buy at $3102
Current Price: $3000
Level -1: Buy at $2880, Sell at $2898
Level -2: Buy at $2760, Sell at $2778
Level -3: Buy at $2640, Sell at $2658
Level -4: Buy at $2520, Sell at $2538
Level -5: Buy at $2400, Sell at $2418
```

## 🛡️ **Security Features**

- **Private Key Protection**: Never logged or exposed
- **Balance Validation**: Checks sufficient funds before trading
- **Slippage Protection**: Configurable slippage tolerance
- **Emergency Stop**: Immediate order cancellation (Ctrl+C)
- **Approval Management**: Automatic token approvals
- **Data Validation**: Validates price data integrity

## ⚠️ **Important Notes**

### **Security**
- **Never share your private key**
- **Use testnet first** before mainnet
- **Start with small amounts**
- **Monitor regularly**

### **Risks**
- **Market Risk**: Strategy profits from volatility, not directional moves
- **Gas Costs**: High gas costs can eat into profits
- **Liquidity Risk**: Orders may not fill if liquidity is low
- **Smart Contract Risk**: Interacting with smart contracts carries risks
- **Data Risk**: Backtest results don't guarantee future performance

## 🔧 **Development**

### **Build**
```bash
npm run build
```

### **Run Built Version**
```bash
npm run build:start
```

### **Development Mode**
```bash
npm run dev
```

## 📚 **Architecture**

### **Core Files**
- `src/clean-orchestrator.ts` - Main orchestrator class
- `src/simple-cli.ts` - Interactive CLI interface
- `src/backtester.ts` - Comprehensive backtesting engine
- `src/data-provider.ts` - Centralized data fetching service
- `src/simple-config.ts` - Configuration and presets
- `src/types.ts` - TypeScript type definitions

### **Key Features**
- **Off-chain Strategy Logic**: All decision making happens off-chain
- **On-chain Order Execution**: Orders executed via 1inch protocol
- **Real-time Monitoring**: Continuous order status checking
- **Automatic Rebalancing**: Creates opposite orders when fills occur
- **Profit Calculation**: Real-time profit tracking and display
- **Historical Analysis**: Comprehensive backtesting capabilities
- **Multi-source Data**: Robust data fetching with fallbacks

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including backtests)
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

---

**⚠️ Disclaimer**: This software is for educational purposes only. Trading cryptocurrencies involves substantial risk of loss. Use at your own risk and never invest more than you can afford to lose. Backtest results do not guarantee future performance.