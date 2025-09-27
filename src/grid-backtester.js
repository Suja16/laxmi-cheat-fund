#!/usr/bin/env node

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// ============ CONFIGURATION ============

const BACKTEST_CONFIG = {
  // Timeframes to test
  timeframes: [7, 14, 30, 90, 180], // days
  
  // Trading pairs to test
  assets: [
    {
      symbol: 'ETH/USDC',
      baseToken: '0x4200000000000000000000000000000000000006', // WETH
      quoteToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
      baseDecimals: 18,
      quoteDecimals: 6,
      volatility: 0.03, // 3% daily volatility
      trend: 0.001 // 0.1% daily trend
    },
    {
      symbol: 'BTC/USDC',
      baseToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      quoteToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
      baseDecimals: 8,
      quoteDecimals: 6,
      volatility: 0.025, // 2.5% daily volatility
      trend: 0.0008 // 0.08% daily trend
    },
    {
      symbol: '1INCH/USDC',
      baseToken: '0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE', // 1INCH
      quoteToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
      baseDecimals: 18,
      quoteDecimals: 6,
      volatility: 0.04, // 4% daily volatility
      trend: 0.002 // 0.2% daily trend
    }
  ],
  
  // Grid strategy parameters
  gridConfigs: [
    {
      name: 'Conservative',
      gridLevels: 10,
      priceRange: 15, // ±15%
      profitTarget: 0.5, // 0.5% profit per trade
      baseAmount: 1000, // $1000 in base token
      quoteAmount: 1000 // $1000 in quote token
    },
    {
      name: 'Moderate',
      gridLevels: 15,
      priceRange: 20, // ±20%
      profitTarget: 0.8, // 0.8% profit per trade
      baseAmount: 1000,
      quoteAmount: 1000
    },
    {
      name: 'Aggressive',
      gridLevels: 20,
      priceRange: 25, // ±25%
      profitTarget: 1.2, // 1.2% profit per trade
      baseAmount: 1000,
      quoteAmount: 1000
    }
  ],
  
  // Simulation parameters
  simulation: {
    initialPrice: 1000, // Starting price for simulation
    dataPointsPerDay: 24, // Hourly data points
    slippage: 0.001, // 0.1% slippage
    gasCostPerTrade: 0.5, // $0.5 gas cost per trade
    rebalanceThreshold: 50 // Rebalance when 50% of orders filled
  }
};

// ============ UTILITY FUNCTIONS ============

class PriceDataGenerator {
  static generatePriceData(days, asset, initialPrice = BACKTEST_CONFIG.simulation.initialPrice) {
    const dataPoints = days * BACKTEST_CONFIG.simulation.dataPointsPerDay;
    const prices = [];
    let currentPrice = initialPrice;
    
    for (let i = 0; i < dataPoints; i++) {
      // Generate realistic price movement using geometric Brownian motion
      const dt = 1 / (BACKTEST_CONFIG.simulation.dataPointsPerDay * 365); // Annualized
      const drift = asset.trend * dt;
      const volatility = asset.volatility * Math.sqrt(dt);
      const randomShock = this.generateNormalRandom() * volatility;
      
      const priceChange = drift + randomShock;
      currentPrice = currentPrice * Math.exp(priceChange);
      
      prices.push({
        timestamp: new Date(Date.now() - (dataPoints - i) * 60 * 60 * 1000), // Hourly intervals
        price: currentPrice,
        volume: Math.random() * 1000000 + 100000 // Random volume
      });
    }
    
    return prices;
  }
  
  static generateNormalRandom() {
    // Box-Muller transform for normal distribution
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

// ============ GRID STRATEGY SIMULATION ============

class GridStrategySimulator {
  constructor(config, asset) {
    this.config = config;
    this.asset = asset;
    this.gridLevels = new Map();
    this.activeOrders = new Map();
    this.filledOrders = [];
    this.totalProfit = 0;
    this.totalTrades = 0;
    this.totalGasCosts = 0;
    this.currentPrice = 0;
    this.initialBalance = {
      base: config.baseAmount,
      quote: config.quoteAmount
    };
    this.currentBalance = {
      base: config.baseAmount,
      quote: config.quoteAmount
    };
  }
  
  initializeGrid(startPrice) {
    this.currentPrice = startPrice;
    const priceRange = startPrice * (this.config.priceRange / 100);
    const halfLevels = Math.floor(this.config.gridLevels / 2);
    
    this.gridLevels.clear();
    this.activeOrders.clear();
    
    // Generate sell levels (above current price)
    for (let i = 1; i <= halfLevels; i++) {
      const sellPrice = startPrice + (priceRange * i / halfLevels);
      const buyPrice = sellPrice * (1 - this.config.profitTarget / 100);
      
      this.gridLevels.set(i, { buyPrice, sellPrice });
      
      // Create initial sell orders
      this.activeOrders.set(i, {
        orderType: 'SELL',
        price: sellPrice,
        amount: this.config.baseAmount / halfLevels,
        level: i
      });
    }
    
    // Generate buy levels (below current price)
    for (let i = 1; i <= halfLevels; i++) {
      const buyPrice = startPrice - (priceRange * i / halfLevels);
      const sellPrice = buyPrice * (1 + this.config.profitTarget / 100);
      
      this.gridLevels.set(-i, { buyPrice, sellPrice });
      
      // Create initial buy orders
      this.activeOrders.set(-i, {
        orderType: 'BUY',
        price: buyPrice,
        amount: this.config.quoteAmount / halfLevels,
        level: -i
      });
    }
  }
  
  simulatePriceMovement(priceData) {
    console.log(`🎯 Simulating ${this.config.name} strategy for ${this.asset.symbol}...`);
    
    for (const dataPoint of priceData) {
      this.checkOrderFills(dataPoint.price, dataPoint.timestamp);
      this.handleRebalancing();
    }
    
    return this.calculateResults();
  }
  
  checkOrderFills(currentPrice, timestamp) {
    const ordersToFill = [];
    
    for (const [level, order] of this.activeOrders) {
      let shouldFill = false;
      
      if (order.orderType === 'SELL' && currentPrice >= order.price) {
        shouldFill = true;
      } else if (order.orderType === 'BUY' && currentPrice <= order.price) {
        shouldFill = true;
      }
      
      if (shouldFill) {
        ordersToFill.push({ level, order, price: currentPrice, timestamp });
      }
    }
    
    // Process fills
    for (const fill of ordersToFill) {
      this.processOrderFill(fill);
    }
  }
  
  processOrderFill(fill) {
    const { level, order, price, timestamp } = fill;
    const gridLevel = this.gridLevels.get(level);
    
    if (!gridLevel) return;
    
    // Calculate trade details
    let tradeProfit = 0;
    let gasCost = BACKTEST_CONFIG.simulation.gasCostPerTrade;
    
    if (order.orderType === 'SELL') {
      // Selling base token for quote token
      const quoteReceived = order.amount * price * (1 - BACKTEST_CONFIG.simulation.slippage);
      this.currentBalance.base -= order.amount;
      this.currentBalance.quote += quoteReceived;
      
      // Calculate profit from previous buy
      const previousBuyPrice = gridLevel.buyPrice;
      const profit = order.amount * (price - previousBuyPrice);
      tradeProfit = profit;
      
      // Create opposite buy order
      this.activeOrders.set(level, {
        orderType: 'BUY',
        price: gridLevel.buyPrice,
        amount: quoteReceived / gridLevel.buyPrice,
        level: level
      });
      
    } else {
      // Buying base token with quote token
      const baseReceived = order.amount / price * (1 - BACKTEST_CONFIG.simulation.slippage);
      this.currentBalance.quote -= order.amount;
      this.currentBalance.base += baseReceived;
      
      // Create opposite sell order
      this.activeOrders.set(level, {
        orderType: 'SELL',
        price: gridLevel.sellPrice,
        amount: baseReceived,
        level: level
      });
    }
    
    this.totalProfit += tradeProfit;
    this.totalTrades++;
    this.totalGasCosts += gasCost;
    
    this.filledOrders.push({
      level,
      orderType: order.orderType,
      price,
      amount: order.amount,
      profit: tradeProfit,
      timestamp,
      balance: { ...this.currentBalance }
    });
  }
  
  handleRebalancing() {
    if (this.filledOrders.length === 0) return;
    
    const totalOrders = this.activeOrders.size + this.filledOrders.length;
    const filledRatio = (this.filledOrders.length / totalOrders) * 100;
    
    if (filledRatio >= BACKTEST_CONFIG.simulation.rebalanceThreshold) {
      console.log(`🔄 Rebalancing triggered: ${filledRatio.toFixed(1)}% of orders filled`);
      this.rebalanceGrid();
    }
  }
  
  rebalanceGrid() {
    // Cancel all active orders
    this.activeOrders.clear();
    
    // Reinitialize grid with current balance
    const currentValue = this.currentBalance.base * this.currentPrice + this.currentBalance.quote;
    const newBaseAmount = currentValue / 2;
    const newQuoteAmount = currentValue / 2;
    
    this.config.baseAmount = newBaseAmount;
    this.config.quoteAmount = newQuoteAmount;
    
    this.initializeGrid(this.currentPrice);
  }
  
  calculateResults() {
    const finalValue = this.currentBalance.base * this.currentPrice + this.currentBalance.quote;
    const initialValue = this.initialBalance.base * this.currentPrice + this.initialBalance.quote;
    const totalReturn = (finalValue - initialValue) / initialValue * 100;
    const netProfit = this.totalProfit - this.totalGasCosts;
    const netReturn = netProfit / initialValue * 100;
    
    return {
      strategy: this.config.name,
      asset: this.asset.symbol,
      initialValue,
      finalValue,
      totalReturn: totalReturn,
      netReturn: netReturn,
      totalProfit: this.totalProfit,
      totalGasCosts: this.totalGasCosts,
      netProfit: netProfit,
      totalTrades: this.totalTrades,
      avgProfitPerTrade: this.totalTrades > 0 ? this.totalProfit / this.totalTrades : 0,
      maxDrawdown: this.calculateMaxDrawdown(),
      sharpeRatio: this.calculateSharpeRatio(),
      winRate: this.calculateWinRate(),
      finalBalance: this.currentBalance,
      filledOrders: this.filledOrders.length
    };
  }
  
  calculateMaxDrawdown() {
    let maxValue = this.initialBalance.base * this.currentPrice + this.initialBalance.quote;
    let maxDrawdown = 0;
    
    for (const order of this.filledOrders) {
      const currentValue = order.balance.base * this.currentPrice + order.balance.quote;
      if (currentValue > maxValue) {
        maxValue = currentValue;
      }
      const drawdown = (maxValue - currentValue) / maxValue * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }
  
  calculateSharpeRatio() {
    if (this.filledOrders.length < 2) return 0;
    
    const returns = [];
    let previousValue = this.initialBalance.base * this.currentPrice + this.initialBalance.quote;
    
    for (const order of this.filledOrders) {
      const currentValue = order.balance.base * this.currentPrice + order.balance.quote;
      const returnRate = (currentValue - previousValue) / previousValue;
      returns.push(returnRate);
      previousValue = currentValue;
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }
  
  calculateWinRate() {
    if (this.filledOrders.length === 0) return 0;
    const winningTrades = this.filledOrders.filter(order => order.profit > 0).length;
    return (winningTrades / this.filledOrders.length) * 100;
  }
}

// ============ BACKTESTER MAIN CLASS ============

class MultiAssetGridBacktester {
  constructor() {
    this.results = new Map();
  }
  
  async runBacktests() {
    console.log('🚀 Starting Multi-Asset Grid Strategy Backtester');
    console.log('================================================\n');
    
    for (const timeframe of BACKTEST_CONFIG.timeframes) {
      console.log(`📅 Testing ${timeframe}-day timeframe...`);
      console.log('='.repeat(50));
      
      const timeframeResults = [];
      
      for (const asset of BACKTEST_CONFIG.assets) {
        console.log(`\n💰 Testing ${asset.symbol}...`);
        
        for (const gridConfig of BACKTEST_CONFIG.gridConfigs) {
          const simulator = new GridStrategySimulator(gridConfig, asset);
          
          // Generate price data
          const priceData = PriceDataGenerator.generatePriceData(timeframe, asset);
          
          // Initialize grid
          simulator.initializeGrid(priceData[0].price);
          
          // Run simulation
          const result = simulator.simulatePriceMovement(priceData);
          result.timeframe = timeframe;
          
          timeframeResults.push(result);
          
          console.log(`  ✅ ${gridConfig.name}: ${result.netReturn.toFixed(2)}% return, ${result.totalTrades} trades`);
        }
      }
      
      this.results.set(timeframe, timeframeResults);
      console.log(`\n📊 Completed ${timeframe}-day backtest\n`);
    }
    
    await this.generateReports();
  }
  
  async generateReports() {
    console.log('📈 Generating comprehensive reports...\n');
    
    // Overall summary
    await this.generateOverallSummary();
    
    // Per-timeframe analysis
    for (const [timeframe, results] of this.results) {
      await this.generateTimeframeReport(timeframe, results);
    }
    
    // Best performing strategies
    await this.generateBestStrategiesReport();
    
    // Risk analysis
    await this.generateRiskAnalysisReport();
  }
  
  async generateOverallSummary() {
    const allResults = Array.from(this.results.values()).flat();
    
    const summary = {
      totalTests: allResults.length,
      avgReturn: allResults.reduce((sum, r) => sum + r.netReturn, 0) / allResults.length,
      bestReturn: Math.max(...allResults.map(r => r.netReturn)),
      worstReturn: Math.min(...allResults.map(r => r.netReturn)),
      avgTrades: allResults.reduce((sum, r) => sum + r.totalTrades, 0) / allResults.length,
      avgSharpeRatio: allResults.reduce((sum, r) => sum + r.sharpeRatio, 0) / allResults.length,
      avgMaxDrawdown: allResults.reduce((sum, r) => sum + r.maxDrawdown, 0) / allResults.length,
      avgWinRate: allResults.reduce((sum, r) => sum + r.winRate, 0) / allResults.length
    };
    
    console.log('📊 OVERALL SUMMARY');
    console.log('==================');
    console.log(`Total Tests Run: ${summary.totalTests}`);
    console.log(`Average Return: ${summary.avgReturn.toFixed(2)}%`);
    console.log(`Best Return: ${summary.bestReturn.toFixed(2)}%`);
    console.log(`Worst Return: ${summary.worstReturn.toFixed(2)}%`);
    console.log(`Average Trades: ${summary.avgTrades.toFixed(0)}`);
    console.log(`Average Sharpe Ratio: ${summary.avgSharpeRatio.toFixed(3)}`);
    console.log(`Average Max Drawdown: ${summary.avgMaxDrawdown.toFixed(2)}%`);
    console.log(`Average Win Rate: ${summary.avgWinRate.toFixed(1)}%\n`);
    
    await this.saveReport('overall-summary.json', summary);
  }
  
  async generateTimeframeReport(timeframe, results) {
    const bestResult = results.reduce((best, current) => 
      current.netReturn > best.netReturn ? current : best
    );
    
    const avgReturn = results.reduce((sum, r) => sum + r.netReturn, 0) / results.length;
    const avgTrades = results.reduce((sum, r) => sum + r.totalTrades, 0) / results.length;
    
    console.log(`📅 ${timeframe}-DAY TIMEFRAME ANALYSIS`);
    console.log('='.repeat(40));
    console.log(`Average Return: ${avgReturn.toFixed(2)}%`);
    console.log(`Average Trades: ${avgTrades.toFixed(0)}`);
    console.log(`Best Strategy: ${bestResult.strategy} on ${bestResult.asset}`);
    console.log(`Best Return: ${bestResult.netReturn.toFixed(2)}%`);
    console.log(`Best Trades: ${bestResult.totalTrades}`);
    console.log(`Best Sharpe: ${bestResult.sharpeRatio.toFixed(3)}\n`);
    
    await this.saveReport(`${timeframe}d-analysis.json`, {
      timeframe,
      avgReturn,
      avgTrades,
      bestResult,
      allResults: results
    });
  }
  
  async generateBestStrategiesReport() {
    const allResults = Array.from(this.results.values()).flat();
    
    // Sort by net return
    const sortedByReturn = [...allResults].sort((a, b) => b.netReturn - a.netReturn);
    
    // Sort by Sharpe ratio
    const sortedBySharpe = [...allResults].sort((a, b) => b.sharpeRatio - a.sharpeRatio);
    
    // Sort by win rate
    const sortedByWinRate = [...allResults].sort((a, b) => b.winRate - a.winRate);
    
    console.log('🏆 TOP PERFORMING STRATEGIES');
    console.log('=============================');
    
    console.log('\n🥇 Top 5 by Return:');
    sortedByReturn.slice(0, 5).forEach((result, i) => {
      console.log(`${i + 1}. ${result.strategy} on ${result.asset} (${result.timeframe}d): ${result.netReturn.toFixed(2)}%`);
    });
    
    console.log('\n📈 Top 5 by Sharpe Ratio:');
    sortedBySharpe.slice(0, 5).forEach((result, i) => {
      console.log(`${i + 1}. ${result.strategy} on ${result.asset} (${result.timeframe}d): ${result.sharpeRatio.toFixed(3)}`);
    });
    
    console.log('\n🎯 Top 5 by Win Rate:');
    sortedByWinRate.slice(0, 5).forEach((result, i) => {
      console.log(`${i + 1}. ${result.strategy} on ${result.asset} (${result.timeframe}d): ${result.winRate.toFixed(1)}%`);
    });
    
    await this.saveReport('best-strategies.json', {
      topByReturn: sortedByReturn.slice(0, 10),
      topBySharpe: sortedBySharpe.slice(0, 10),
      topByWinRate: sortedByWinRate.slice(0, 10)
    });
  }
  
  async generateRiskAnalysisReport() {
    const allResults = Array.from(this.results.values()).flat();
    
    const riskAnalysis = {
      highReturnStrategies: allResults.filter(r => r.netReturn > 10),
      lowRiskStrategies: allResults.filter(r => r.maxDrawdown < 5),
      highSharpeStrategies: allResults.filter(r => r.sharpeRatio > 1),
      consistentStrategies: allResults.filter(r => r.winRate > 70),
      riskyStrategies: allResults.filter(r => r.maxDrawdown > 15)
    };
    
    console.log('\n⚠️ RISK ANALYSIS');
    console.log('================');
    console.log(`High Return Strategies (>10%): ${riskAnalysis.highReturnStrategies.length}`);
    console.log(`Low Risk Strategies (<5% drawdown): ${riskAnalysis.lowRiskStrategies.length}`);
    console.log(`High Sharpe Strategies (>1.0): ${riskAnalysis.highSharpeStrategies.length}`);
    console.log(`Consistent Strategies (>70% win rate): ${riskAnalysis.consistentStrategies.length}`);
    console.log(`Risky Strategies (>15% drawdown): ${riskAnalysis.riskyStrategies.length}\n`);
    
    await this.saveReport('risk-analysis.json', riskAnalysis);
  }
  
  async saveReport(filename, data) {
    try {
      const reportsDir = 'backtest-reports';
      await fs.mkdir(reportsDir, { recursive: true });
      await fs.writeFile(
        path.join(reportsDir, filename),
        JSON.stringify(data, null, 2)
      );
      console.log(`💾 Saved report: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save report ${filename}:`, error.message);
    }
  }
}

// ============ MAIN EXECUTION ============

async function main() {
  try {
    const backtester = new MultiAssetGridBacktester();
    await backtester.runBacktests();
    
    console.log('\n🎉 Backtesting completed successfully!');
    console.log('📁 Check the "backtest-reports" directory for detailed results.');
    
  } catch (error) {
    console.error('❌ Backtesting failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('grid-backtester.js')) {
  main();
}

export { MultiAssetGridBacktester, GridStrategySimulator, PriceDataGenerator, BACKTEST_CONFIG };
