# laxmi-cheat-fund

A collection of trading strategies and bots for cryptocurrency markets, featuring both Python and TypeScript implementations.

## 📁 Project Structure

```
laxmi-cheat-fund/
├── src/                      # TypeScript trading strategies
│   ├── index.ts             # Main CLI application
│   ├── gridBot.ts           # Advanced Volatility Grid Strategy
│   ├── backtester.ts        # Strategy backtesting engine
│   ├── config.ts            # Strategy configurations
│   ├── types.ts             # TypeScript type definitions
│   └── ethers-compat.ts     # Ethers v6 compatibility layer
├── bots/                    # Python trading bots
│   ├── grid.py             # Volatility Grid Strategy (main entry point)
│   ├── main.py             # Main execution script
│   ├── volatility_grid.py  # Core strategy implementation
│   ├── oneinch_client.py   # 1inch API client
│   ├── strategy_types.py  # Type definitions and interfaces
│   ├── test_strategy.py    # Test script
│   ├── requirements.txt    # Python dependencies
│   ├── env_example.txt     # Environment configuration example
│   └── README.md           # Detailed documentation
├── pyth/                   # Pyth network integration
│   ├── pyth.py
│   ├── ids.txt
│   └── requirements.txt
├── package.json            # Node.js dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## 🚀 Quick Start (TypeScript)

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

3. **Run the application**:
   ```bash
   npm start
   ```

### Available Scripts

- `npm start` - Run the main application
- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run integration tests
- `npm run dev` - Run with file watching for development

## 🌈 Advanced Volatility Grid Strategy (TypeScript)

The TypeScript implementation features a sophisticated volatility grid trading strategy with advanced features:

### 🎯 Key Features

- **Automated Grid Trading**: Creates buy and sell orders at predetermined price levels
- **1inch Limit Order Protocol**: Uses 1inch SDK for efficient order execution
- **Multi-chain Support**: Works on Ethereum, Base, Polygon, BSC, Optimism, Arbitrum, and Fantom
- **Real-time Monitoring**: Continuously monitors order status and market conditions
- **Auto-rebalancing**: Automatically creates new orders when existing ones fill
- **Profit Tracking**: Calculates and tracks profits from successful trades
- **Advanced Configuration**: Interactive CLI for strategy setup
- **Comprehensive Validation**: Validates balances, token addresses, and configuration
- **Emergency Controls**: Emergency stop functionality to cancel all orders

### 🔧 Configuration Options

The strategy supports extensive configuration:

- **Token Pair**: Base and quote token addresses
- **Grid Levels**: Number of buy/sell levels (default: 10)
- **Price Range**: Percentage range around current price (default: ±20%)
- **Profit Target**: Minimum profit per trade (default: 0.5%)
- **Auto-rebalancing**: Enable/disable automatic rebalancing
- **Rebalance Threshold**: Percentage of filled orders to trigger rebalancing
- **Slippage Tolerance**: Maximum acceptable slippage
- **Gas Price**: Gas price strategy (auto or manual)

### 📊 Strategy Modes

1. **Live Trading Mode**: Execute real trades on the blockchain
2. **Backtest Mode**: Test strategies against historical data

### 🎮 Interactive CLI

The application provides an intuitive command-line interface:

```
--- 🔱 Laxmi Protocol CLI (Polygon) ---
Choose an option:
 L. Run LIVE Strategy
 B. Run a BACKTEST
 Q. Quit
```

### 📈 Example Grid Configuration

For a 10-level grid with ±20% price range around $3000 (WETH/USDC):

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

## 🐍 Python Implementation

The Python implementation provides the same core functionality with additional features:

### Quick Start (Python)

1. **Install dependencies**:
   ```bash
   cd bots
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   cp env_example.txt .env
   # Edit .env with your private key and configuration
   ```

3. **Run the strategy**:
   ```bash
   python grid.py
   ```

## 🌐 Supported Networks

| Network | Chain ID | Status | TypeScript | Python |
|---------|----------|--------|------------|--------|
| Ethereum | 1 | ✅ Supported | ✅ | ✅ |
| Optimism | 10 | ✅ Supported | ✅ | ✅ |
| BSC | 56 | ✅ Supported | ✅ | ✅ |
| Polygon | 137 | ✅ Supported | ✅ | ✅ |
| Fantom | 250 | ✅ Supported | ✅ | ✅ |
| Base | 8453 | ✅ Supported | ✅ | ✅ |
| Arbitrum | 42161 | ✅ Supported | ✅ | ✅ |

## 🧪 Testing

### TypeScript Testing
```bash
npm test
```

### Python Testing
```bash
cd bots
python test_strategy.py
```

## 🔒 Security Features

- **Private Key Protection**: Never logs or exposes private keys
- **Balance Validation**: Validates sufficient token balances before trading
- **Address Validation**: Validates token addresses before use
- **Emergency Stop**: Immediate order cancellation capability
- **Slippage Protection**: Configurable slippage tolerance

## ⚠️ Important Notes

### Security
- **Never share your private key**
- **Use testnet first** before mainnet
- **Start with small amounts**
- **Monitor regularly**

### Risks
- **Market Risk**: Strategy profits from volatility, not directional moves
- **Gas Costs**: High gas costs can eat into profits
- **Liquidity Risk**: Orders may not fill if liquidity is low
- **Smart Contract Risk**: Interacting with smart contracts carries risks

## 📚 Documentation

For detailed documentation, see:
- [Bots README](bots/README.md) - Comprehensive Python strategy documentation
- [Test Script](bots/test_strategy.py) - Python testing and validation
- [Environment Example](bots/env_example.txt) - Python configuration template

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational purposes. Use at your own risk.

---

**⚠️ Disclaimer**: This software is for educational purposes only. Trading cryptocurrencies involves substantial risk of loss. Use at your own risk and never invest more than you can afford to lose.