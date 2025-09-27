#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// ============ CONFIGURATION ============

const TWAP_BACKTEST_CONFIG = {
  // Timeframes to test
  timeframes: [7, 14, 30, 90, 180],
  
  // Assets to test
  assets: [
    {
      symbol: 'ETH/USDC',
      volatility: 0.04,
      trend: 0.02,
      liquidity: 0.8,
      marketCap: 200000000000,
      volume24h: 15000000000,
      priceRange: { min: 2000, max: 5000 }
    },
    {
      symbol: 'BTC/USDC',
      volatility: 0.035,
      trend: 0.015,
      liquidity: 0.9,
      marketCap: 500000000000,
      volume24h: 25000000000,
      priceRange: { min: 30000, max: 80000 }
    },
    {
      symbol: 'SOL/USDC',
      volatility: 0.06,
      trend: 0.03,
      liquidity: 0.7,
      marketCap: 50000000000,
      volume24h: 3000000000,
      priceRange: { min: 50, max: 200 }
    },
    {
      symbol: 'AVAX/USDC',
      volatility: 0.05,
      trend: 0.025,
      liquidity: 0.6,
      marketCap: 15000000000,
      volume24h: 800000000,
      priceRange: { min: 20, max: 80 }
    },
    {
      symbol: 'MATIC/USDC',
      volatility: 0.055,
      trend: 0.02,
      liquidity: 0.65,
      marketCap: 8000000000,
      volume24h: 500000000,
      priceRange: { min: 0.5, max: 3 }
    }
  ],
  
  // TWAP Strategy Configurations
  twapConfigs: [
    {
      name: 'Conservative',
      totalAmount: 10000,
      numberOfOrders: 8,
      intervalMinutes: 60,
      executionWindow: 30,
      slippageTolerance: 0.3,
      adaptiveOrderSize: true,
      volatilityMultiplier: 1.0,
      maxOrderSizeVariation: 0.2
    },
    {
      name: 'Moderate',
      totalAmount: 10000,
      numberOfOrders: 12,
      intervalMinutes: 45,
      executionWindow: 25,
      slippageTolerance: 0.5,
      adaptiveOrderSize: true,
      volatilityMultiplier: 1.2,
      maxOrderSizeVariation: 0.3
    },
    {
      name: 'Aggressive',
      totalAmount: 10000,
      numberOfOrders: 16,
      intervalMinutes: 30,
      executionWindow: 20,
      slippageTolerance: 0.8,
      adaptiveOrderSize: true,
      volatilityMultiplier: 1.5,
      maxOrderSizeVariation: 0.4
    }
  ],
  
  // Simulation parameters - Ultra realistic DeFi trading conditions
  simulation: {
    initialPrice: 1000, // Starting price for simulation
    dataPointsPerDay: 24, // Hourly data points
    slippage: 0.0005, // 0.05% base slippage (realistic for major pairs)
    gasCostPerTrade: 1.2, // $1.2 gas cost per TWAP order (realistic for 2024)
    adaptiveOrderSize: true,
    volatilityThreshold: 0.05, // Trigger adaptive sizing on high volatility (5%)
    trendThreshold: 0.03, // Trigger adaptive sizing on strong trends (3%)
    minOrderInterval: 15, // Minimum 15 minutes between orders
    maxOrderInterval: 240, // Maximum 4 hours between orders
    minOrderSize: 50, // $50 minimum order
    maxOrderSize: 2000, // $2000 maximum order
    compoundProfits: true,
    maxTotalGrowth: 1.2, // Maximum 20% total growth (realistic)
    realisticMode: true,
    
    // Ultra realistic DeFi parameters
    mevSandwichProbability: 0.03, // 3% chance of MEV sandwich attack
    frontrunProbability: 0.08, // 8% chance of frontrunning
    failedTransactionRate: 0.04, // 4% transaction failure rate
    networkCongestionFactor: 1.3, // Network congestion multiplier
    liquidityImpactFactor: 0.7, // Liquidity impact on large orders
    priceImpactThreshold: 0.002, // 0.2% price impact threshold
    maxSlippageDeviation: 0.008, // Max 0.8% slippage deviation
    gasPriceVolatility: 0.4, // 40% gas price volatility
    priorityFeeVolatility: 0.6, // 60% priority fee volatility
    
    // TWAP-specific parameters
    adaptiveTiming: true, // Adjust timing based on market conditions
    volatilityThreshold: 0.05, // 5% volatility threshold
    trendThreshold: 0.03, // 3% trend threshold
    minOrderInterval: 15, // Minimum 15 minutes between orders
    maxOrderInterval: 240, // Maximum 4 hours between orders
    
    // Market condition probabilities
    whaleActivityProbability: 0.15, // 15% chance of whale activity
    newsImpactProbability: 0.08, // 8% chance of news impact
    technicalAnalysisPressure: 0.5, // 50% technical analysis pressure
    sentimentShiftProbability: 0.12, // 12% chance of sentiment shift
    regulatoryRiskProbability: 0.03, // 3% chance of regulatory impact
    exchangeHackProbability: 0.002, // 0.2% chance of exchange hack
    smartContractRiskProbability: 0.008, // 0.8% chance of smart contract issue
    oracleManipulationProbability: 0.015 // 1.5% chance of oracle manipulation
  }
};

// ============ PRICE DATA GENERATOR ============

class PriceDataGenerator {
  static generatePriceData(days, asset, initialPrice = TWAP_BACKTEST_CONFIG.simulation.initialPrice) {
    const dataPoints = days * TWAP_BACKTEST_CONFIG.simulation.dataPointsPerDay;
    const prices = [];
    
    let currentPrice = initialPrice;
    let currentVolatility = asset.volatility;
    let marketRegime = 'NORMAL';
    let volatilityHistory = [currentVolatility];
    
    // Market microstructure state
    let orderBookImbalance = 0; // -1 to 1
    let liquidityDepth = 0.8; // 0 to 1
    let marketSentiment = 0.5; // 0 = bearish, 1 = bullish
    let whaleActivity = 0;
    let newsImpact = 0;
    
    for (let i = 0; i < dataPoints; i++) {
      // Update market microstructure
      this.updateMarketMicrostructure(asset, i, dataPoints, {
        orderBookImbalance,
        liquidityDepth,
        marketSentiment,
        whaleActivity,
        newsImpact
      });
      
      // Update volatility with realistic clustering
      currentVolatility = this.updateVolatility(currentVolatility, volatilityHistory, asset.volatility, marketRegime);
      volatilityHistory.push(currentVolatility);
      
      // Generate ultra realistic price movement
      const priceChange = this.generateUltraRealisticPriceChange(
        currentVolatility, 
        marketRegime, 
        asset, 
        i, 
        dataPoints,
        { orderBookImbalance, liquidityDepth, marketSentiment, whaleActivity, newsImpact }
      );
      
      currentPrice = currentPrice * Math.exp(priceChange);
      
      // Ensure price stays within realistic bounds
      currentPrice = Math.max(currentPrice, asset.priceRange.min);
      currentPrice = Math.min(currentPrice, asset.priceRange.max);
      
      prices.push({
        timestamp: new Date(Date.now() - (dataPoints - i) * 60 * 60 * 1000),
        price: currentPrice,
        volume: this.generateRealisticVolume(currentPrice, currentVolatility, asset, marketRegime),
        volatility: currentVolatility,
        regime: marketRegime,
        orderBookImbalance,
        liquidityDepth,
        marketSentiment,
        whaleActivity,
        newsImpact
      });
    }
    
    return prices;
  }
  
  static updateMarketMicrostructure(asset, step, totalSteps, state) {
    const { orderBookImbalance, liquidityDepth, marketSentiment, whaleActivity, newsImpact } = state;
    
    // Update order book imbalance with realistic dynamics
    const imbalanceChange = (Math.random() - 0.5) * 0.1;
    state.orderBookImbalance = Math.max(-1, Math.min(1, orderBookImbalance + imbalanceChange));
    
    // Update liquidity depth based on market conditions
    const liquidityChange = (Math.random() - 0.5) * 0.05;
    state.liquidityDepth = Math.max(0.1, Math.min(1, liquidityDepth + liquidityChange));
    
    // Update market sentiment with momentum
    const sentimentChange = (Math.random() - 0.5) * 0.08;
    state.marketSentiment = Math.max(0, Math.min(1, marketSentiment + sentimentChange));
    
    // Random whale activity
    if (Math.random() < TWAP_BACKTEST_CONFIG.simulation.whaleActivityProbability) {
      state.whaleActivity = Math.random() * 0.3; // 0-30% whale impact
    } else {
      state.whaleActivity *= 0.9; // Decay whale activity
    }
    
    // Random news impact
    if (Math.random() < TWAP_BACKTEST_CONFIG.simulation.newsImpactProbability) {
      state.newsImpact = (Math.random() - 0.5) * 0.2; // ±20% news impact
    } else {
      state.newsImpact *= 0.8; // Decay news impact
    }
  }
  
  static updateVolatility(currentVolatility, volatilityHistory, baseVolatility, marketRegime) {
    // Volatility clustering - high volatility tends to persist
    const volatilityPersistence = 0.7;
    const volatilityMeanReversion = 0.3;
    
    // Add some randomness
    const randomShock = (Math.random() - 0.5) * 0.02;
    
    // Mean reversion towards base volatility
    const meanReversion = (baseVolatility - currentVolatility) * volatilityMeanReversion;
    
    // Regime-based volatility adjustment
    let regimeAdjustment = 0;
    switch (marketRegime) {
      case 'VOLATILE':
        regimeAdjustment = 0.02;
        break;
      case 'CRASH':
        regimeAdjustment = 0.05;
        break;
      case 'TRENDING_UP':
      case 'TRENDING_DOWN':
        regimeAdjustment = 0.01;
        break;
    }
    
    const newVolatility = currentVolatility * volatilityPersistence + 
                         meanReversion + 
                         randomShock + 
                         regimeAdjustment;
    
    return Math.max(0.01, Math.min(0.2, newVolatility)); // Keep between 1% and 20%
  }
  
  static generateUltraRealisticPriceChange(volatility, marketRegime, asset, step, totalSteps, microstructure) {
    const { orderBookImbalance, liquidityDepth, marketSentiment, whaleActivity, newsImpact } = microstructure;
    
    // Base price change from volatility
    let priceChange = volatility * this.generateNormalRandom();
    
    // Market regime adjustments
    switch (marketRegime) {
      case 'VOLATILE':
        priceChange *= 1.5;
        break;
      case 'CRASH':
        priceChange *= 2.0;
        priceChange -= 0.02; // Bias towards negative
        break;
      case 'TRENDING_UP':
        priceChange += 0.001; // Small upward bias
        break;
      case 'TRENDING_DOWN':
        priceChange -= 0.001; // Small downward bias
        break;
    }
    
    // Microstructure effects
    priceChange += orderBookImbalance * 0.001; // Order book imbalance effect
    priceChange += (marketSentiment - 0.5) * 0.002; // Sentiment effect
    priceChange += whaleActivity * 0.005; // Whale activity effect
    priceChange += newsImpact; // News impact
    
    // Liquidity impact
    priceChange *= (2 - liquidityDepth); // Lower liquidity = higher impact
    
    // Asset-specific adjustments
    priceChange *= asset.volatility / 0.04; // Normalize by base volatility
    
    return priceChange;
  }
  
  static generateRealisticVolume(currentPrice, volatility, asset, marketRegime) {
    const baseVolume = asset.volume24h / 24; // Hourly volume
    
    // Volume increases with volatility
    let volumeMultiplier = 1 + volatility * 2;
    
    // Regime-based volume adjustments
    switch (marketRegime) {
      case 'VOLATILE':
        volumeMultiplier *= 1.5;
        break;
      case 'CRASH':
        volumeMultiplier *= 2.0;
        break;
      case 'TRENDING_UP':
      case 'TRENDING_DOWN':
        volumeMultiplier *= 1.2;
        break;
    }
    
    // Add some randomness
    volumeMultiplier *= (0.5 + Math.random());
    
    return baseVolume * volumeMultiplier;
  }
  
  static generateNormalRandom() {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

// ============ TWAP STRATEGY SIMULATION ============

class TWAPStrategySimulator {
  constructor(config, asset) {
    this.config = config;
    this.asset = asset;
    this.activeOrders = new Map();
    this.filledOrders = [];
    this.totalProfit = 0;
    this.totalTrades = 0;
    this.totalGasCosts = 0;
    this.currentPrice = 0;
    this.initialBalance = config.totalAmount;
    this.currentBalance = config.totalAmount;
    
    // Enhanced trade tracking
    this.tradeLog = [];
    this.tradeCounter = 0;
    this.sessionStartTime = new Date();
    this.priceHistory = [];
    this.executionSchedule = new Map();
    
    // Adaptive features
    this.currentVolatility = asset.volatility;
    this.marketRegime = 'NORMAL';
    this.lastTradeTime = 0;
    this.volatilityHistory = [];
    this.trendHistory = [];
    this.executionFailures = 0;
    this.mevAttacks = 0;
    this.slippageEvents = 0;
    
    // TWAP-specific state
    this.orderIndex = 0;
    this.totalAmountTraded = 0;
    this.averageExecutionPrice = 0;
  }
  
  initializeTWAP(startPrice, priceData) {
    this.currentPrice = startPrice;
    this.generateExecutionSchedule(priceData);
    
    console.log(`🎯 Initialized ${this.config.name} TWAP strategy for ${this.asset.symbol}`);
    console.log(`   📊 Total Orders: ${this.config.numberOfOrders}`);
    console.log(`   ⏱️  Interval: ${this.config.intervalMinutes} minutes`);
    console.log(`   💰 Total Amount: $${this.config.totalAmount}`);
  }
  
  generateExecutionSchedule(priceData) {
    const startTime = priceData[0].timestamp;
    this.executionSchedule.clear();
    
    for (let i = 0; i < this.config.numberOfOrders; i++) {
      // Calculate adaptive timing based on market conditions
      let intervalMinutes = this.config.intervalMinutes;
      
      if (this.config.adaptiveOrderSize) {
        // Adjust interval based on volatility and market conditions
        const volatilityAdjustment = this.currentVolatility > TWAP_BACKTEST_CONFIG.simulation.volatilityThreshold ? 1.5 : 1.0;
        const trendAdjustment = Math.abs(this.trendHistory.slice(-5).reduce((a, b) => a + b, 0) / 5) > TWAP_BACKTEST_CONFIG.simulation.trendThreshold ? 1.3 : 1.0;
        
        intervalMinutes = Math.floor(intervalMinutes * volatilityAdjustment * trendAdjustment);
        intervalMinutes = Math.max(TWAP_BACKTEST_CONFIG.simulation.minOrderInterval, 
                                 Math.min(intervalMinutes, TWAP_BACKTEST_CONFIG.simulation.maxOrderInterval));
      }
      
      const executionTime = new Date(startTime.getTime() + (i * intervalMinutes * 60 * 1000));
      this.executionSchedule.set(i, executionTime);
    }
  }
  
  updateAdaptiveOrderSize(orderIndex) {
    if (!this.config.adaptiveOrderSize) {
      return this.config.totalAmount / this.config.numberOfOrders;
    }
    
    const baseOrderSize = this.config.totalAmount / this.config.numberOfOrders;
    
    // Adjust based on current volatility
    const volatilityAdjustment = Math.min(this.currentVolatility * 3, 0.2); // Max 20% adjustment
    
    // Adjust based on market condition
    let conditionAdjustment = 0;
    switch (this.marketRegime) {
      case 'VOLATILE':
        conditionAdjustment = -0.15; // Reduce order size in volatile markets
        break;
      case 'TRENDING_UP':
        conditionAdjustment = 0.1; // Increase order size in uptrends
        break;
      case 'TRENDING_DOWN':
        conditionAdjustment = -0.1; // Reduce order size in downtrends
        break;
      case 'CRASH':
        conditionAdjustment = -0.3; // Significantly reduce in crashes
        break;
    }
    
    // Adjust based on order timing (later orders get different sizing)
    const timingAdjustment = Math.sin((orderIndex / this.config.numberOfOrders) * Math.PI) * 0.1;
    
    const adjustedSize = baseOrderSize * (1 + volatilityAdjustment + conditionAdjustment + timingAdjustment);
    
    // Apply limits
    return Math.max(
      TWAP_BACKTEST_CONFIG.simulation.minOrderSize,
      Math.min(adjustedSize, TWAP_BACKTEST_CONFIG.simulation.maxOrderSize)
    );
  }
  
  calculateRealisticGasCost() {
    const baseGasCost = TWAP_BACKTEST_CONFIG.simulation.gasCostPerTrade;
    const gasPriceVolatility = TWAP_BACKTEST_CONFIG.simulation.gasPriceVolatility;
    const networkCongestion = TWAP_BACKTEST_CONFIG.simulation.networkCongestionFactor;
    
    // Add gas price volatility
    const gasPriceVariation = 1 + (Math.random() - 0.5) * gasPriceVolatility;
    
    // Add network congestion
    const congestionMultiplier = 1 + (Math.random() - 0.5) * 0.5; // ±25% congestion
    
    return baseGasCost * gasPriceVariation * networkCongestion * congestionMultiplier;
  }
  
  calculateRealisticSlippage(orderSize, marketCondition) {
    const baseSlippage = this.config.slippageTolerance / 100; // Convert percentage to decimal
    const maxDeviation = TWAP_BACKTEST_CONFIG.simulation.maxSlippageDeviation;
    
    // Base slippage variation
    let slippage = baseSlippage + (Math.random() - 0.5) * maxDeviation;
    
    // Market condition impact
    if (marketCondition === 'VOLATILE' || marketCondition === 'CRASH') {
      slippage *= 2.5; // 2.5x slippage in volatile markets
    }
    
    // Order size impact
    if (orderSize > 1000) {
      slippage *= 1.8; // Higher slippage for large orders
    }
    
    // Liquidity impact
    const liquidityFactor = TWAP_BACKTEST_CONFIG.simulation.liquidityImpactFactor;
    slippage *= liquidityFactor;
    
    return Math.max(0.0005, Math.min(0.02, slippage)); // Keep between 0.05% and 2%
  }
  
  checkMEVAttack() {
    const sandwichProb = TWAP_BACKTEST_CONFIG.simulation.mevSandwichProbability;
    const frontrunProb = TWAP_BACKTEST_CONFIG.simulation.frontrunProbability;
    
    let isAttacked = false;
    let profitReduction = 1.0;
    
    if (Math.random() < sandwichProb) {
      isAttacked = true;
      profitReduction = 0.2; // 80% profit reduction from sandwich attack
      this.mevAttacks++;
    }
    
    if (Math.random() < frontrunProb) {
      isAttacked = true;
      profitReduction *= 0.7; // Additional 30% reduction from frontrunning
    }
    
    return { isAttacked, profitReduction };
  }
  
  updateMarketAnalytics(currentPrice) {
    if (this.priceHistory.length < 10) return;
    
    // Calculate current volatility
    const recentPrices = this.priceHistory.slice(-20).map(p => p.price);
    const returns = [];
    
    for (let i = 1; i < recentPrices.length; i++) {
      returns.push((recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    this.currentVolatility = Math.sqrt(variance);
    this.volatilityHistory.push(this.currentVolatility);
    
    // Assess market condition
    const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
    this.trendHistory.push(priceChange);
    
    if (Math.abs(priceChange) > 0.08) {
      this.marketRegime = 'VOLATILE';
    } else if (priceChange > 0.03) {
      this.marketRegime = 'TRENDING_UP';
    } else if (priceChange < -0.03) {
      this.marketRegime = 'TRENDING_DOWN';
    } else if (priceChange < -0.1) {
      this.marketRegime = 'CRASH';
    } else {
      this.marketRegime = 'NORMAL';
    }
  }
  
  simulatePriceMovement(priceData) {
    console.log(`🎯 Simulating ${this.config.name} TWAP strategy for ${this.asset.symbol}...`);
    
    for (const dataPoint of priceData) {
      // Track price history
      this.priceHistory.push({
        timestamp: dataPoint.timestamp,
        price: dataPoint.price,
        volume: dataPoint.volume
      });
      
      // Update market analytics
      this.updateMarketAnalytics(dataPoint.price);
      
      // Check for TWAP order execution
      this.checkTWAPExecution(dataPoint.price, dataPoint.timestamp);
    }
    
    return this.calculateResults();
  }
  
  checkTWAPExecution(currentPrice, timestamp) {
    // Check if any orders should be executed at this time
    for (const [orderIndex, executionTime] of this.executionSchedule) {
      if (this.activeOrders.has(orderIndex)) continue; // Order already executed
      
      // Check if it's time to execute this order
      const timeDiff = Math.abs(timestamp.getTime() - executionTime.getTime());
      const executionWindow = this.config.executionWindow * 60 * 1000; // Convert to milliseconds
      
      if (timeDiff <= executionWindow) {
        this.executeTWAPOrder(orderIndex, currentPrice, timestamp);
      }
    }
  }
  
  executeTWAPOrder(orderIndex, currentPrice, timestamp) {
    try {
      // Check for transaction failure
      if (Math.random() < TWAP_BACKTEST_CONFIG.simulation.failedTransactionRate) {
        console.log('❌ Transaction failed due to network issues');
        this.executionFailures++;
        return;
      }
      
      // Check minimum trade interval
      const timeSinceLastTrade = (timestamp.getTime() - this.lastTradeTime) / (1000 * 60 * 60); // hours
      if (timeSinceLastTrade < 0.25) { // 15 minute minimum
        console.log('⏰ Skipping order - minimum interval not met');
        return;
      }
      
      // Calculate adaptive order size
      const orderSize = this.updateAdaptiveOrderSize(orderIndex);
      
      // Calculate realistic slippage
      const slippage = this.calculateRealisticSlippage(orderSize, this.marketRegime);
      
      // Check for MEV attacks
      const mevAttack = this.checkMEVAttack();
      let actualOrderSize = orderSize;
      if (mevAttack.isAttacked) {
        console.log('🛡️ MEV protection activated - adjusting order parameters');
        actualOrderSize = orderSize * mevAttack.profitReduction;
      }
      
      // Calculate execution price with slippage
      const executionPrice = currentPrice * (1 - slippage);
      
      // Calculate profit/loss from this trade
      const tradeProfit = (executionPrice - this.averageExecutionPrice) * actualOrderSize;
      
      // Calculate gas cost
      const gasCost = this.calculateRealisticGasCost();
      
      // Update balances and tracking
      this.currentBalance += tradeProfit - gasCost;
      this.totalProfit += tradeProfit;
      this.totalGasCosts += gasCost;
      this.totalTrades++;
      this.totalAmountTraded += actualOrderSize;
      this.averageExecutionPrice = (this.averageExecutionPrice * (this.totalTrades - 1) + executionPrice) / this.totalTrades;
      this.lastTradeTime = timestamp.getTime();
      
      // Record trade
      const trade = {
        timestamp: timestamp,
        orderIndex: orderIndex,
        orderSize: actualOrderSize,
        executionPrice: executionPrice,
        slippage: slippage,
        gasCost: gasCost,
        profit: tradeProfit,
        marketRegime: this.marketRegime,
        volatility: this.currentVolatility,
        mevAttacked: mevAttack.isAttacked
      };
      
      this.tradeLog.push(trade);
      this.activeOrders.set(orderIndex, trade);
      
      console.log(`✅ TWAP Order ${orderIndex + 1} executed: $${tradeProfit.toFixed(2)} profit, ${(slippage * 100).toFixed(3)}% slippage`);
      
    } catch (error) {
      console.error(`❌ Error executing TWAP order ${orderIndex + 1}:`, error.message);
      this.executionFailures++;
    }
  }
  
  calculateResults() {
    const totalReturn = ((this.currentBalance - this.initialBalance) / this.initialBalance) * 100;
    const netReturn = totalReturn; // Gas costs already deducted
    
    const avgProfitPerTrade = this.totalTrades > 0 ? this.totalProfit / this.totalTrades : 0;
    const winRate = this.totalTrades > 0 ? 
      (this.tradeLog.filter(t => t.profit > 0).length / this.totalTrades) * 100 : 0;
    
    const maxDrawdown = this.calculateMaxDrawdown();
    const sharpeRatio = this.calculateSharpeRatio();
    
    // Calculate APY for different timeframes
    const apy = this.calculateAPY();
    
    return {
      strategy: this.config.name,
      asset: this.asset.symbol,
      initialValue: this.initialBalance,
      finalValue: this.currentBalance,
      totalReturn: totalReturn,
      netReturn: netReturn,
      totalProfit: this.totalProfit,
      totalGasCosts: this.totalGasCosts,
      netProfit: this.totalProfit - this.totalGasCosts,
      totalTrades: this.totalTrades,
      avgProfitPerTrade: avgProfitPerTrade,
      maxDrawdown: maxDrawdown,
      sharpeRatio: sharpeRatio,
      winRate: winRate,
      finalBalance: this.currentBalance,
      filledOrders: this.activeOrders.size,
      apy: apy,
      tradeStatistics: this.calculateTradeStatistics(),
      tradeLog: {
        exportTime: new Date().toISOString(),
        strategy: this.config.name,
        asset: this.asset.symbol,
        sessionDuration: (Date.now() - this.sessionStartTime) / (1000 * 60 * 60 * 24),
        totalTrades: this.totalTrades,
        executionFailures: this.executionFailures,
        mevAttacks: this.mevAttacks,
        slippageEvents: this.slippageEvents,
        averageExecutionPrice: this.averageExecutionPrice,
        totalAmountTraded: this.totalAmountTraded,
        trades: this.tradeLog
      }
    };
  }
  
  calculateMaxDrawdown() {
    if (this.priceHistory.length < 2) return 0;
    
    let maxValue = this.priceHistory[0].price;
    let maxDrawdown = 0;
    
    for (const pricePoint of this.priceHistory) {
      if (pricePoint.price > maxValue) {
        maxValue = pricePoint.price;
      }
      const drawdown = (maxValue - pricePoint.price) / maxValue * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }
  
  calculateSharpeRatio() {
    if (this.tradeLog.length < 10) return 0;
    
    const returns = this.tradeLog.map(trade => trade.profit / this.initialBalance);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }
  
  calculateAPY() {
    const timeframes = [7, 14, 30, 90, 180];
    const apy = {};
    
    for (const days of timeframes) {
      const periodsPerYear = 365 / days;
      const returnForPeriod = this.totalReturn / 100; // Convert percentage to decimal
      const apyForPeriod = Math.pow(1 + returnForPeriod, periodsPerYear) - 1;
      apy[`${days}d`] = apyForPeriod * 100; // Convert back to percentage
    }
    
    return apy;
  }
  
  calculateTradeStatistics() {
    const trades = this.tradeLog;
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    
    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      averageProfit: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length : 0,
      maxProfit: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit)) : 0,
      maxLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit)) : 0,
      profitFactor: losingTrades.length > 0 ? 
        Math.abs(winningTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.reduce((sum, t) => sum + t.profit, 0)) : null,
      averageDuration: trades.length > 0 ? 
        (trades[trades.length - 1].timestamp.getTime() - trades[0].timestamp.getTime()) / (1000 * 60 * 60 * 24) : 0
    };
  }
}

// ============ BACKTESTER MAIN CLASS ============

class MultiAssetTWAPBacktester {
  constructor() {
    this.results = new Map();
  }
  
  async runBacktests() {
    console.log('🚀 Starting Multi-Asset TWAP Strategy Backtester');
    console.log('================================================\n');
    
    const totalTests = TWAP_BACKTEST_CONFIG.timeframes.length * 
                      TWAP_BACKTEST_CONFIG.assets.length * 
                      TWAP_BACKTEST_CONFIG.twapConfigs.length;
    let currentTest = 0;
    
    for (const timeframe of TWAP_BACKTEST_CONFIG.timeframes) {
      console.log(`📅 Testing ${timeframe}-day timeframe...`);
      console.log('='.repeat(50));
      
      const timeframeResults = [];
      
      for (const asset of TWAP_BACKTEST_CONFIG.assets) {
        console.log(`\n💰 Testing ${asset.symbol}...`);
        
        for (const twapConfig of TWAP_BACKTEST_CONFIG.twapConfigs) {
          currentTest++;
          console.log(`\n🔄 Running test ${currentTest}/${totalTests}: ${twapConfig.name} strategy on ${asset.symbol} (${timeframe}d)`);
          
          const simulator = new TWAPStrategySimulator(twapConfig, asset);
          
          // Generate price data
          const priceData = PriceDataGenerator.generatePriceData(timeframe, asset);
          
          // Initialize TWAP
          simulator.initializeTWAP(priceData[0].price, priceData);
          
          // Run simulation
          const result = simulator.simulatePriceMovement(priceData);
          result.timeframe = timeframe;
          
          timeframeResults.push(result);
          
          console.log(`  ✅ ${twapConfig.name}: ${result.netReturn.toFixed(2)}% return, ${result.totalTrades} trades, ${result.winRate.toFixed(1)}% win rate, $${result.totalGasCosts.toFixed(2)} gas costs`);
          console.log(`     📊 Max Drawdown: ${result.maxDrawdown.toFixed(2)}%, Sharpe: ${result.sharpeRatio.toFixed(3)}, MEV Attacks: ${result.tradeLog.mevAttacks || 0}`);
        }
      }
      
      this.results.set(timeframe, timeframeResults);
      console.log(`\n📊 Completed ${timeframe}-day backtest (${timeframeResults.length} tests)\n`);
    }
    
    await this.generateReports();
  }
  
  async generateReports() {
    console.log('📈 Generating comprehensive TWAP reports...\n');
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'src', 'backtest-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate individual timeframe reports
    for (const [timeframe, results] of this.results) {
      const reportPath = path.join(reportsDir, `twap-${timeframe}d-analysis.json`);
      fs.writeFileSync(reportPath, JSON.stringify({
        timeframe: timeframe,
        avgReturn: this.calculateAverage(results, 'netReturn'),
        avgTrades: this.calculateAverage(results, 'totalTrades'),
        bestResult: this.findBestResult(results),
        worstResult: this.findWorstResult(results),
        results: results
      }, null, 2));
      
      console.log(`✅ Generated ${timeframe}-day TWAP report`);
    }
    
    // Generate overall summary
    const overallSummary = this.generateOverallSummary();
    const summaryPath = path.join(reportsDir, 'twap-overall-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(overallSummary, null, 2));
    
    console.log('✅ Generated TWAP overall summary');
    
    // Generate best strategies report
    const bestStrategies = this.generateBestStrategiesReport();
    const bestStrategiesPath = path.join(reportsDir, 'twap-best-strategies.json');
    fs.writeFileSync(bestStrategiesPath, JSON.stringify(bestStrategies, null, 2));
    
    console.log('✅ Generated TWAP best strategies report');
    
    // Generate risk analysis
    const riskAnalysis = this.generateRiskAnalysis();
    const riskAnalysisPath = path.join(reportsDir, 'twap-risk-analysis.json');
    fs.writeFileSync(riskAnalysisPath, JSON.stringify(riskAnalysis, null, 2));
    
    console.log('✅ Generated TWAP risk analysis');
    
    // Generate trade analysis
    const tradeAnalysis = this.generateTradeAnalysis();
    const tradeAnalysisPath = path.join(reportsDir, 'twap-trade-analysis.json');
    fs.writeFileSync(tradeAnalysisPath, JSON.stringify(tradeAnalysis, null, 2));
    
    console.log('✅ Generated TWAP trade analysis');
    
    // Display comprehensive results in terminal
    this.displayComprehensiveResults(overallSummary, bestStrategies, riskAnalysis, tradeAnalysis);
    
    console.log('\n🎉 All TWAP reports generated successfully!');
    console.log(`📁 Reports saved in: ${reportsDir}`);
  }
  
  calculateAverage(results, field) {
    return results.reduce((sum, result) => sum + result[field], 0) / results.length;
  }
  
  findBestResult(results) {
    return results.reduce((best, current) => 
      current.netReturn > best.netReturn ? current : best
    );
  }
  
  findWorstResult(results) {
    return results.reduce((worst, current) => 
      current.netReturn < worst.netReturn ? current : worst
    );
  }
  
  generateOverallSummary() {
    const allResults = Array.from(this.results.values()).flat();
    
    const avgReturn = this.calculateAverage(allResults, 'netReturn');
    const avgTrades = this.calculateAverage(allResults, 'totalTrades');
    const avgSharpeRatio = this.calculateAverage(allResults, 'sharpeRatio');
    const avgMaxDrawdown = this.calculateAverage(allResults, 'maxDrawdown');
    const avgWinRate = this.calculateAverage(allResults, 'winRate');
    
    const bestReturn = Math.max(...allResults.map(r => r.netReturn));
    const worstReturn = Math.min(...allResults.map(r => r.netReturn));
    
    // Calculate average APY for each timeframe
    const avgAPY = {};
    const bestAPY = {};
    
    for (const timeframe of TWAP_BACKTEST_CONFIG.timeframes) {
      const timeframeResults = this.results.get(timeframe);
      const timeframeAPYs = timeframeResults.map(r => r.apy[`${timeframe}d`]);
      avgAPY[`${timeframe}d`] = timeframeAPYs.reduce((sum, apy) => sum + apy, 0) / timeframeAPYs.length;
      bestAPY[`${timeframe}d`] = Math.max(...timeframeAPYs);
    }
    
    return {
      totalTests: allResults.length,
      avgReturn: avgReturn,
      bestReturn: bestReturn,
      worstReturn: worstReturn,
      avgTrades: avgTrades,
      avgSharpeRatio: avgSharpeRatio,
      avgMaxDrawdown: avgMaxDrawdown,
      avgWinRate: avgWinRate,
      avgAPY: avgAPY,
      bestAPY: bestAPY
    };
  }
  
  generateBestStrategiesReport() {
    const bestStrategies = {};
    
    for (const [timeframe, results] of this.results) {
      // Find best strategy for each asset
      const assetResults = {};
      for (const asset of TWAP_BACKTEST_CONFIG.assets) {
        const assetSpecificResults = results.filter(r => r.asset === asset.symbol);
        if (assetSpecificResults.length > 0) {
          assetResults[asset.symbol] = this.findBestResult(assetSpecificResults);
        }
      }
      
      bestStrategies[`${timeframe}d`] = assetResults;
    }
    
    return bestStrategies;
  }
  
  generateRiskAnalysis() {
    const riskAnalysis = {};
    
    for (const [timeframe, results] of this.results) {
      const maxDrawdowns = results.map(r => r.maxDrawdown);
      const sharpeRatios = results.map(r => r.sharpeRatio);
      const winRates = results.map(r => r.winRate);
      
      riskAnalysis[`${timeframe}d`] = {
        avgMaxDrawdown: maxDrawdowns.reduce((sum, dd) => sum + dd, 0) / maxDrawdowns.length,
        maxDrawdown: Math.max(...maxDrawdowns),
        avgSharpeRatio: sharpeRatios.reduce((sum, sr) => sum + sr, 0) / sharpeRatios.length,
        bestSharpeRatio: Math.max(...sharpeRatios),
        avgWinRate: winRates.reduce((sum, wr) => sum + wr, 0) / winRates.length,
        bestWinRate: Math.max(...winRates)
      };
    }
    
    return riskAnalysis;
  }
  
  generateTradeAnalysis() {
    const tradeAnalysis = {};
    
    for (const [timeframe, results] of this.results) {
      const allTrades = results.flatMap(r => r.tradeLog.trades || []);
      
      if (allTrades.length > 0) {
        const profitableTrades = allTrades.filter(t => t.profit > 0);
        const losingTrades = allTrades.filter(t => t.profit < 0);
        
        tradeAnalysis[`${timeframe}d`] = {
          totalTrades: allTrades.length,
          profitableTrades: profitableTrades.length,
          losingTrades: losingTrades.length,
          winRate: (profitableTrades.length / allTrades.length) * 100,
          avgProfit: profitableTrades.length > 0 ? 
            profitableTrades.reduce((sum, t) => sum + t.profit, 0) / profitableTrades.length : 0,
          avgLoss: losingTrades.length > 0 ? 
            losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length : 0,
          maxProfit: profitableTrades.length > 0 ? Math.max(...profitableTrades.map(t => t.profit)) : 0,
          maxLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit)) : 0,
          avgSlippage: allTrades.reduce((sum, t) => sum + t.slippage, 0) / allTrades.length,
          avgGasCost: allTrades.reduce((sum, t) => sum + t.gasCost, 0) / allTrades.length,
          mevAttacks: allTrades.filter(t => t.mevAttacked).length,
          mevAttackRate: (allTrades.filter(t => t.mevAttacked).length / allTrades.length) * 100
        };
      }
    }
    
    return tradeAnalysis;
  }
  
  displayComprehensiveResults(overallSummary, bestStrategies, riskAnalysis, tradeAnalysis) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TWAP BACKTEST RESULTS');
    console.log('='.repeat(80));
    
    // Overall Summary
    console.log('\n🎯 OVERALL PERFORMANCE SUMMARY');
    console.log('-'.repeat(50));
    console.log(`📈 Total Tests Run: ${overallSummary.totalTests}`);
    console.log(`💰 Average Return: ${overallSummary.avgReturn.toFixed(2)}%`);
    console.log(`🚀 Best Return: ${overallSummary.bestReturn.toFixed(2)}%`);
    console.log(`📉 Worst Return: ${overallSummary.worstReturn.toFixed(2)}%`);
    console.log(`📊 Average Trades: ${overallSummary.avgTrades.toFixed(0)}`);
    console.log(`⚡ Average Sharpe Ratio: ${overallSummary.avgSharpeRatio.toFixed(3)}`);
    console.log(`📉 Average Max Drawdown: ${overallSummary.avgMaxDrawdown.toFixed(2)}%`);
    console.log(`🎯 Average Win Rate: ${overallSummary.avgWinRate.toFixed(1)}%`);
    
    // APY by Timeframe
    console.log('\n📅 ANNUALIZED PERCENTAGE YIELD (APY)');
    console.log('-'.repeat(50));
    console.log(`7 Days:  ${overallSummary.avgAPY['7d'].toFixed(2)}% (Best: ${overallSummary.bestAPY['7d'].toFixed(2)}%)`);
    console.log(`14 Days: ${overallSummary.avgAPY['14d'].toFixed(2)}% (Best: ${overallSummary.bestAPY['14d'].toFixed(2)}%)`);
    console.log(`30 Days: ${overallSummary.avgAPY['30d'].toFixed(2)}% (Best: ${overallSummary.bestAPY['30d'].toFixed(2)}%)`);
    console.log(`90 Days: ${overallSummary.avgAPY['90d'].toFixed(2)}% (Best: ${overallSummary.bestAPY['90d'].toFixed(2)}%)`);
    console.log(`180 Days: ${overallSummary.avgAPY['180d'].toFixed(2)}% (Best: ${overallSummary.bestAPY['180d'].toFixed(2)}%)`);
    
    // Best Strategies by Asset
    console.log('\n🏆 BEST STRATEGIES BY ASSET');
    console.log('-'.repeat(50));
    for (const [timeframe, strategies] of Object.entries(bestStrategies)) {
      console.log(`\n📅 ${timeframe.toUpperCase()} TIMEFRAME:`);
      for (const [asset, result] of Object.entries(strategies)) {
        console.log(`  ${asset}: ${result.strategy} - ${result.netReturn.toFixed(2)}% return, ${result.totalTrades} trades`);
      }
    }
    
    // Risk Analysis
    console.log('\n🛡️ RISK ANALYSIS');
    console.log('-'.repeat(50));
    for (const [timeframe, risk] of Object.entries(riskAnalysis)) {
      console.log(`\n📅 ${timeframe.toUpperCase()}:`);
      console.log(`  Max Drawdown: ${risk.avgMaxDrawdown.toFixed(2)}% (Worst: ${risk.maxDrawdown.toFixed(2)}%)`);
      console.log(`  Sharpe Ratio: ${risk.avgSharpeRatio.toFixed(3)} (Best: ${risk.bestSharpeRatio.toFixed(3)})`);
      console.log(`  Win Rate: ${risk.avgWinRate.toFixed(1)}% (Best: ${risk.bestWinRate.toFixed(1)}%)`);
    }
    
    // Trade Analysis
    console.log('\n📈 TRADE ANALYSIS');
    console.log('-'.repeat(50));
    for (const [timeframe, trades] of Object.entries(tradeAnalysis)) {
      if (trades.totalTrades > 0) {
        console.log(`\n📅 ${timeframe.toUpperCase()}:`);
        console.log(`  Total Trades: ${trades.totalTrades}`);
        console.log(`  Win Rate: ${trades.winRate.toFixed(1)}%`);
        console.log(`  Avg Profit: $${trades.avgProfit.toFixed(2)}`);
        console.log(`  Avg Loss: $${trades.avgLoss.toFixed(2)}`);
        console.log(`  Max Profit: $${trades.maxProfit.toFixed(2)}`);
        console.log(`  Max Loss: $${trades.maxLoss.toFixed(2)}`);
        console.log(`  Avg Slippage: ${(trades.avgSlippage * 100).toFixed(3)}%`);
        console.log(`  Avg Gas Cost: $${trades.avgGasCost.toFixed(2)}`);
        console.log(`  MEV Attacks: ${trades.mevAttacks} (${trades.mevAttackRate.toFixed(1)}%)`);
      }
    }
    
    // Detailed Results by Timeframe
    console.log('\n📊 DETAILED RESULTS BY TIMEFRAME');
    console.log('-'.repeat(50));
    for (const [timeframe, results] of this.results) {
      console.log(`\n📅 ${timeframe}-DAY TIMEFRAME:`);
      console.log(`  Average Return: ${this.calculateAverage(results, 'netReturn').toFixed(2)}%`);
      console.log(`  Average Trades: ${this.calculateAverage(results, 'totalTrades').toFixed(0)}`);
      console.log(`  Best Strategy: ${this.findBestResult(results).strategy} on ${this.findBestResult(results).asset} (${this.findBestResult(results).netReturn.toFixed(2)}%)`);
      console.log(`  Worst Strategy: ${this.findWorstResult(results).strategy} on ${this.findWorstResult(results).asset} (${this.findWorstResult(results).netReturn.toFixed(2)}%)`);
      
      // Show top 3 results for this timeframe
      const sortedResults = results.sort((a, b) => b.netReturn - a.netReturn);
      console.log(`  Top 3 Results:`);
      for (let i = 0; i < Math.min(3, sortedResults.length); i++) {
        const result = sortedResults[i];
        console.log(`    ${i + 1}. ${result.strategy} on ${result.asset}: ${result.netReturn.toFixed(2)}% (${result.totalTrades} trades, ${result.winRate.toFixed(1)}% win rate)`);
      }
    }
    
    // Asset Performance Summary
    console.log('\n💰 ASSET PERFORMANCE SUMMARY');
    console.log('-'.repeat(50));
    const assetPerformance = {};
    
    for (const [timeframe, results] of this.results) {
      for (const result of results) {
        if (!assetPerformance[result.asset]) {
          assetPerformance[result.asset] = [];
        }
        assetPerformance[result.asset].push(result.netReturn);
      }
    }
    
    for (const [asset, returns] of Object.entries(assetPerformance)) {
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const bestReturn = Math.max(...returns);
      const worstReturn = Math.min(...returns);
      console.log(`${asset}: Avg ${avgReturn.toFixed(2)}% (Best: ${bestReturn.toFixed(2)}%, Worst: ${worstReturn.toFixed(2)}%)`);
    }
    
    // Strategy Performance Summary
    console.log('\n🎯 STRATEGY PERFORMANCE SUMMARY');
    console.log('-'.repeat(50));
    const strategyPerformance = {};
    
    for (const [timeframe, results] of this.results) {
      for (const result of results) {
        if (!strategyPerformance[result.strategy]) {
          strategyPerformance[result.strategy] = [];
        }
        strategyPerformance[result.strategy].push(result.netReturn);
      }
    }
    
    for (const [strategy, returns] of Object.entries(strategyPerformance)) {
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const bestReturn = Math.max(...returns);
      const worstReturn = Math.min(...returns);
      console.log(`${strategy}: Avg ${avgReturn.toFixed(2)}% (Best: ${bestReturn.toFixed(2)}%, Worst: ${worstReturn.toFixed(2)}%)`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPREHENSIVE TWAP BACKTEST COMPLETED');
    console.log('='.repeat(80));
  }
}

// ============ MAIN EXECUTION ============

async function main() {
  try {
    const backtester = new MultiAssetTWAPBacktester();
    await backtester.runBacktests();
  } catch (error) {
    console.error('❌ Backtest failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MultiAssetTWAPBacktester, TWAPStrategySimulator, PriceDataGenerator };
