# TWAP Strategy Backtester

A comprehensive backtesting framework for Time-Weighted Average Price (TWAP) trading strategies across multiple assets and timeframes.

## Overview

This backtester simulates ultra-realistic TWAP trading strategies with advanced features including:

- **Multi-Asset Support**: ETH/USDC, BTC/USDC, SOL/USDC, AVAX/USDC, MATIC/USDC
- **Multiple Timeframes**: 7d, 14d, 30d, 90d, 180d
- **Strategy Variants**: Conservative, Moderate, Aggressive
- **Realistic Market Conditions**: MEV attacks, slippage, gas costs, network congestion
- **Comprehensive Reporting**: PnL, trade statistics, APY calculations, risk metrics

## Features

### 🎯 TWAP Strategy Simulation
- Adaptive order sizing based on market volatility
- Dynamic timing adjustments
- Realistic execution windows
- Market regime detection (Normal, Volatile, Trending, Crash)

### 🛡️ Ultra-Realistic Trading Conditions
- **MEV Protection**: Sandwich attacks and frontrunning simulation
- **Slippage Modeling**: Dynamic slippage based on market conditions
- **Gas Cost Simulation**: Realistic gas price volatility
- **Network Congestion**: Transaction failure rates
- **Liquidity Impact**: Order size effects on execution

### 📊 Comprehensive Analytics
- **Performance Metrics**: Total return, net profit, APY calculations
- **Risk Analysis**: Max drawdown, Sharpe ratio, win rate
- **Trade Statistics**: Trade count, average profit/loss, execution details
- **Market Analytics**: Volatility tracking, regime detection

## Configuration

### Assets Tested
```javascript
assets: [
  { symbol: 'ETH/USDC', volatility: 0.04, trend: 0.02, liquidity: 0.8 },
  { symbol: 'BTC/USDC', volatility: 0.035, trend: 0.015, liquidity: 0.9 },
  { symbol: 'SOL/USDC', volatility: 0.06, trend: 0.03, liquidity: 0.7 },
  { symbol: 'AVAX/USDC', volatility: 0.05, trend: 0.025, liquidity: 0.6 },
  { symbol: 'MATIC/USDC', volatility: 0.055, trend: 0.02, liquidity: 0.65 }
]
```

### Strategy Configurations
```javascript
twapConfigs: [
  {
    name: 'Conservative',
    totalAmount: 10000,
    numberOfOrders: 8,
    intervalMinutes: 60,
    executionWindow: 30,
    slippageTolerance: 0.3
  },
  {
    name: 'Moderate',
    totalAmount: 10000,
    numberOfOrders: 12,
    intervalMinutes: 45,
    executionWindow: 25,
    slippageTolerance: 0.5
  },
  {
    name: 'Aggressive',
    totalAmount: 10000,
    numberOfOrders: 16,
    intervalMinutes: 30,
    executionWindow: 20,
    slippageTolerance: 0.8
  }
]
```

## Usage

### Basic Usage
```bash
# Run the backtester
node src/twap-backtester.js

# Or use the test script
node src/test-twap-backtester.js
```

### Programmatic Usage
```javascript
import { MultiAssetTWAPBacktester } from './twap-backtester.js';

const backtester = new MultiAssetTWAPBacktester();
await backtester.runBacktests();
```

## Output Reports

The backtester generates comprehensive reports in `src/backtest-reports/`:

### 📈 Individual Timeframe Reports
- `twap-7d-analysis.json` - 7-day analysis
- `twap-14d-analysis.json` - 14-day analysis
- `twap-30d-analysis.json` - 30-day analysis
- `twap-90d-analysis.json` - 90-day analysis
- `twap-180d-analysis.json` - 180-day analysis

### 📊 Summary Reports
- `twap-overall-summary.json` - Overall performance summary
- `twap-best-strategies.json` - Best performing strategies per asset
- `twap-risk-analysis.json` - Risk metrics and analysis
- `twap-trade-analysis.json` - Detailed trade statistics

## Report Structure

### Overall Summary
```json
{
  "totalTests": 45,
  "avgReturn": 4.00,
  "bestReturn": 6.00,
  "worstReturn": -0.01,
  "avgTrades": 392.73,
  "avgSharpeRatio": 0.67,
  "avgMaxDrawdown": 0.025,
  "avgWinRate": 47.60,
  "avgAPY": {
    "7d": 100.21,
    "14d": 80.11,
    "30d": 66.72,
    "90d": 17.79,
    "180d": 8.37
  }
}
```

### Individual Result
```json
{
  "strategy": "Moderate",
  "asset": "ETH/USDC",
  "timeframe": 7,
  "initialValue": 10000,
  "finalValue": 10600,
  "totalReturn": 6.00,
  "netReturn": 6.00,
  "totalProfit": 600,
  "totalGasCosts": 12.00,
  "netProfit": 588,
  "totalTrades": 12,
  "avgProfitPerTrade": 50.00,
  "maxDrawdown": 2.5,
  "sharpeRatio": 1.2,
  "winRate": 75.0,
  "apy": {
    "7d": 150.0,
    "14d": 120.0,
    "30d": 100.0,
    "90d": 26.7,
    "180d": 12.5
  }
}
```

## Key Features Explained

### 🎯 Adaptive Order Sizing
- Adjusts order sizes based on market volatility
- Reduces size in volatile/crash conditions
- Increases size in trending markets
- Applies timing-based adjustments

### ⏰ Dynamic Timing
- Adjusts intervals based on market conditions
- Extends intervals during high volatility
- Compresses intervals during stable periods
- Respects minimum/maximum interval bounds

### 🛡️ MEV Protection
- Simulates sandwich attacks (3% probability)
- Models frontrunning (8% probability)
- Adjusts order parameters when attacked
- Tracks MEV attack frequency

### 📊 Market Analytics
- Real-time volatility calculation
- Market regime detection
- Trend analysis
- Sentiment tracking

### 💰 Realistic Costs
- Dynamic gas price simulation
- Network congestion effects
- Slippage modeling
- Transaction failure rates

## Performance Metrics

### Return Calculations
- **Total Return**: Overall percentage gain/loss
- **Net Return**: Return after gas costs
- **APY**: Annualized percentage yield for each timeframe

### Risk Metrics
- **Max Drawdown**: Maximum peak-to-trough decline
- **Sharpe Ratio**: Risk-adjusted return measure
- **Win Rate**: Percentage of profitable trades

### Trade Statistics
- **Total Trades**: Number of executed orders
- **Average Profit/Loss**: Per-trade profitability
- **Execution Details**: Slippage, gas costs, timing

## Customization

### Adding New Assets
```javascript
assets.push({
  symbol: 'NEW/USDC',
  volatility: 0.05,
  trend: 0.02,
  liquidity: 0.7,
  marketCap: 10000000000,
  volume24h: 1000000000,
  priceRange: { min: 1, max: 10 }
});
```

### Modifying Strategy Parameters
```javascript
twapConfigs.push({
  name: 'Custom',
  totalAmount: 5000,
  numberOfOrders: 10,
  intervalMinutes: 90,
  executionWindow: 45,
  slippageTolerance: 0.4
});
```

### Adjusting Market Conditions
```javascript
simulation: {
  mevSandwichProbability: 0.02, // Reduce MEV attacks
  failedTransactionRate: 0.02,  // Reduce failures
  gasCostPerTrade: 0.8,         // Lower gas costs
  // ... other parameters
}
```

## Dependencies

- Node.js 16+
- ES6 modules support
- File system access for report generation

## License

This project is part of the Laxmi Cheat Fund trading bot suite.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions, please open an issue in the repository or contact the development team.
