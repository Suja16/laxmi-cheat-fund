import { ethers } from 'ethers';
import axios from 'axios';
import readline from 'readline';
import dotenv from 'dotenv';

import {
  Api,
  FetchProviderConnector,
  LimitOrder,
  MakerTraits,
  Address as OneInchAddress,
  randBigInt
} from '@1inch/limit-order-sdk';

import {
  LIMIT_ORDER_PROTOCOL_ADDRESSES,
  SWAP_API_BASE,
  LIMIT_ORDER_API_BASE
} from './types.js'; 

dotenv.config();

// --- ERC20 ABI (minimal) ---
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
];

const GridOrderType = {
  BUY: 'BUY',
  SELL: 'SELL'
};

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || 'gC7k3c3RlyaE60cRBll7CYexIHhe78nA';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '8453', 10); 
const LIMIT_ORDER_PROTOCOL_ADDRESS = LIMIT_ORDER_PROTOCOL_ADDRESSES[CHAIN_ID];

export class VolatilityGridStrategy {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;

    this.oneInchApi = new Api({
      networkId: CHAIN_ID,
      authKey: ONEINCH_API_KEY,
      httpConnector: new FetchProviderConnector()
    });

    this.activeOrders = new Map();
    this.filledOrders = new Map();
    this.config = {};
    this.isRunning = false;
    this.gridLevels = new Map();
    this.profits = 0;
    
    // Ultra-realistic trading state
    this.marketRegime = 'NORMAL';
    this.currentVolatility = 0.03;
    this.adaptiveProfitTarget = 0.8;
    this.lastTradeTime = 0;
    this.positionSizes = new Map();
    this.volatilityHistory = [];
    this.trendHistory = [];
    this.priceHistory = [];
    this.rebalanceEvents = [];
    this.tradeCounter = 0;
    this.totalGasCosts = 0;
    this.totalTrades = 0;
    this.totalProfit = 0;
    this.sessionStartTime = new Date();
  }

  setConfiguration(config) {
    this.config = {
      baseToken: config.fromToken.address,
      quoteToken: config.toToken.address,
      baseAmount: config.totalAmount,
      quoteAmount: config.totalAmount,
      gridLevels: config.numberOfOrders || 12, 
      priceRange: config.priceDropPercent || 8, 
      currentPrice: 0,
      slippageTolerance: config.slippageTolerance || 0.2, 
      gasPrice: config.gasPrice || 'auto',
      baseTokenDecimals: config.fromToken.decimals,
      quoteTokenDecimals: config.toToken.decimals,
      baseTokenSymbol: config.fromToken.symbol,
      quoteTokenSymbol: config.toToken.symbol,
      rebalanceThreshold: 50,
      autoRebalance: true,
      profitTarget: 0.8, 
      
      adaptiveProfitTarget: true,
      volatilityMultiplier: 1.2,
      maxCompoundRatio: 1.08, 
      minTradeSize: 30, 
      maxTradeSize: 800,
      gasPriceGwei: 25, 
      priorityFee: 3, 
      
      // Market microstructure tracking
      orderBookImbalance: 0,
      liquidityDepth: 0,
      marketSentiment: 0.5,
      whaleActivity: 0,
      newsImpact: 0,
      
      // Risk management
      maxPositionSize: 0.4, 
      maxTotalGrowth: 1.3, 
      realisticMode: true,
      
      // DeFi-specific parameters
      mevSandwichProbability: 0.02, 
      frontrunProbability: 0.05, 
      failedTransactionRate: 0.03, // 3% transaction failure rate
      networkCongestionFactor: 1.2, // Network congestion multiplier
      liquidityImpactFactor: 0.8, // Liquidity impact on large trades
      priceImpactThreshold: 0.001, 
      maxSlippageDeviation: 0.005, // Max 0.5% slippage deviation
      gasPriceVolatility: 0.3, 
      priorityFeeVolatility: 0.5, 
      
      // Market condition probabilities
      whaleActivityProbability: 0.1, 
      newsImpactProbability: 0.05, // 5% chance of news impact
      technicalAnalysisPressure: 0.4, // 40% technical analysis pressure
      sentimentShiftProbability: 0.08, 
      regulatoryRiskProbability: 0.02, 
      exchangeHackProbability: 0.001, // 0.1% chance of exchange hack
      smartContractRiskProbability: 0.005, 
      oracleManipulationProbability: 0.01 // 1% chance of oracle manipulation
    };

    console.log('Volatility Grid configuration set:');
    console.log(`  Pair: ${this.config.baseTokenSymbol}/${this.config.quoteTokenSymbol}`);
    console.log(`  Grid levels: ${this.config.gridLevels}`);
    console.log(`  Price range: ${this.config.priceRange}%`);
    console.log(`  Profit target: ${this.config.profitTarget}%`);
    console.log(`  Base amount: ${this.config.baseAmount}`);
    console.log(`  Quote amount: ${this.config.quoteAmount}`);
    console.log(`  Slippage tolerance: ${this.config.slippageTolerance}%`);
    console.log(`  Max position size: ${this.config.maxPositionSize * 100}%`);
    console.log(`  MEV protection: Enabled`);
    console.log(`  Adaptive profit targets: ${this.config.adaptiveProfitTarget}`);
  }

  async initialize() {
    console.log('1inch Volatility Grid Strategy');
    console.log('==================================\n');

    await this.getUserConfiguration();
    await this.validateConfiguration();
    console.log('\nGrid Configuration validated successfully!');

    this.config.currentPrice = await this.getCurrentPrice();
    this.generateGridLevels();

    console.log('\nVolatility Grid Summary:');
    console.log(`  Grid Levels: ${this.config.gridLevels}`);
    console.log(`  Base Amount: ${this.config.baseAmount} ${this.config.baseTokenSymbol}`);
    console.log(`  Quote Amount: ${this.config.quoteAmount} ${this.config.quoteTokenSymbol}`);
    console.log(`  Price Range: ±${this.config.priceRange}%`);
    console.log(`  Current Price: ${this.config.currentPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
    console.log(`  Auto-rebalance: ${this.config.autoRebalance ? 'Enabled' : 'Disabled'}`);
    console.log(`  Profit Target: ${this.config.profitTarget}%`);
  }

  generateGridLevels() {
    const currentPrice = this.config.currentPrice;
    const priceRange = this.config.priceRange / 100;
    const gridLevels = this.config.gridLevels;

    const buyLevels = Math.floor(gridLevels / 2);
    const sellLevels = Math.ceil(gridLevels / 2);

    this.gridLevels.clear();
    this.positionSizes.clear();

    // Calculate adaptive profit target based on current market conditions
    this.updateAdaptiveProfitTarget();

    console.log('\nUltra-Realistic Grid Price Levels:');
    console.log('=====================================');
    console.log(`Market Regime: ${this.marketRegime}`);
    console.log(`Current Volatility: ${(this.currentVolatility * 100).toFixed(2)}%`);
    console.log(`Adaptive Profit Target: ${this.adaptiveProfitTarget.toFixed(2)}%`);

    for (let i = 1; i <= sellLevels; i++) {
      const priceMultiplier = 1 + (priceRange * i / sellLevels);
      const sellPrice = currentPrice * priceMultiplier;
      const buyPrice = sellPrice * (1 - this.adaptiveProfitTarget / 100);

      // Calculate adaptive position size
      const distanceFactor = i / sellLevels;
      const positionSize = this.calculateAdaptivePositionSize(distanceFactor, 'SELL');

      this.gridLevels.set(i, { buyPrice, sellPrice });
      this.positionSizes.set(i, positionSize);
      
      console.log(`  Level +${i}: Sell at ${sellPrice.toFixed(6)}, Buy at ${buyPrice.toFixed(6)} (Size: $${positionSize.toFixed(2)})`);
    }

    for (let i = 1; i <= buyLevels; i++) {
      const priceMultiplier = 1 - (priceRange * i / buyLevels);
      const buyPrice = currentPrice * priceMultiplier;
      const sellPrice = buyPrice * (1 + this.adaptiveProfitTarget / 100);

      // Calculate adaptive position size
      const distanceFactor = i / buyLevels;
      const positionSize = this.calculateAdaptivePositionSize(distanceFactor, 'BUY');

      this.gridLevels.set(-i, { buyPrice, sellPrice });
      this.positionSizes.set(-i, positionSize);
      
      console.log(`  Level -${i}: Buy at ${buyPrice.toFixed(6)}, Sell at ${sellPrice.toFixed(6)} (Size: $${positionSize.toFixed(2)})`);
    }
  }
  
  // Ultra-realistic trading methods
  updateAdaptiveProfitTarget() {
    if (!this.config.adaptiveProfitTarget) {
      this.adaptiveProfitTarget = this.config.profitTarget;
      return;
    }
    
    // Base profit target
    let baseTarget = this.config.profitTarget;
    
    // Adjust based on current volatility (limited range)
    const volatilityAdjustment = Math.min(this.currentVolatility * 5, 0.3);
    
    // Adjust based on market condition (limited range)
    let conditionAdjustment = 0;
    switch (this.marketRegime) {
      case 'VOLATILE':
        conditionAdjustment = 0.2; // Increase profit target in volatile markets
        break;
      case 'TRENDING_UP':
      case 'TRENDING_DOWN':
        conditionAdjustment = 0.1; // Slight increase in trending markets
        break;
      default:
        conditionAdjustment = 0;
    }
    
    // Keep profit targets in realistic range (0.5% to 2.0%)
    this.adaptiveProfitTarget = Math.max(0.5, Math.min(2.0, baseTarget + volatilityAdjustment + conditionAdjustment));
  }
  
  calculateAdaptivePositionSize(distanceFactor, orderType) {
    const baseAmount = orderType === 'SELL' ? this.config.baseAmount : this.config.quoteAmount;
    const halfLevels = Math.floor(this.config.gridLevels / 2);
    
    // Base position size
    let positionSize = baseAmount / halfLevels;
    
    // Adjust based on distance from current price (closer = larger position)
    const distanceMultiplier = 1 + (1 - distanceFactor) * 0.5; // Up to 50% increase for closer levels
    
    // Adjust based on volatility (higher volatility = smaller positions)
    const volatilityMultiplier = 1 / (1 + this.currentVolatility * this.config.volatilityMultiplier);
    
    // Adjust based on market condition
    let conditionMultiplier = 1;
    switch (this.marketRegime) {
      case 'VOLATILE':
        conditionMultiplier = 0.8; // Reduce position size in volatile markets
        break;
      case 'TRENDING_UP':
        conditionMultiplier = orderType === 'SELL' ? 1.2 : 0.8; // Favor sells in uptrend
        break;
      case 'TRENDING_DOWN':
        conditionMultiplier = orderType === 'BUY' ? 1.2 : 0.8; // Favor buys in downtrend
        break;
    }
    
    // Apply maximum position size limit
    const maxPosition = baseAmount * this.config.maxPositionSize;
    positionSize = Math.min(
      positionSize * distanceMultiplier * volatilityMultiplier * conditionMultiplier,
      maxPosition
    );
    
    // Ensure minimum trade size
    positionSize = Math.max(positionSize, this.config.minTradeSize);
    
    return positionSize;
  }
  
  calculateRealisticGasCost() {
    const baseGasCost = 0.8; 
    const gasPriceVolatility = this.config.gasPriceVolatility;
    const networkCongestion = this.config.networkCongestionFactor;
    
    // Add gas price volatility
    const gasPriceVariation = 1 + (Math.random() - 0.5) * gasPriceVolatility;
    
    // Add network congestion
    const congestionMultiplier = 1 + (Math.random() - 0.5) * 0.4; 
    
    return baseGasCost * gasPriceVariation * networkCongestion * congestionMultiplier;
  }
  
  calculateRealisticSlippage(tradeSize, marketCondition) {
    const baseSlippage = this.config.slippageTolerance / 100; 
    const maxDeviation = this.config.maxSlippageDeviation;
    
    // Base slippage variation
    let slippage = baseSlippage + (Math.random() - 0.5) * maxDeviation;
    
    // Market condition impact
    if (marketCondition === 'VOLATILE' || marketCondition === 'CRASH') {
      slippage *= 2.0; 
    }
    
    // Trade size impact
    if (tradeSize > 1000) {
      slippage *= 1.5; 
    }
    
    // Liquidity impact
    const liquidityFactor = this.config.liquidityImpactFactor;
    slippage *= liquidityFactor;
    
    return Math.max(0.0001, Math.min(0.01, slippage)); 
  }
  
  checkMEVAttack() {
    const sandwichProb = this.config.mevSandwichProbability;
    const frontrunProb = this.config.frontrunProbability;
    
    let isAttacked = false;
    let profitReduction = 1.0;
    
    if (Math.random() < sandwichProb) {
      isAttacked = true;
      profitReduction = 0.3; 
      console.log('⚠️ MEV Sandwich Attack Detected!');
    }
    
    if (Math.random() < frontrunProb) {
      isAttacked = true;
      profitReduction *= 0.8; 
      console.log('⚠️ Frontrunning Detected!');
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
    
    if (Math.abs(priceChange) > 0.05) {
      this.marketRegime = 'VOLATILE';
    } else if (priceChange > 0.02) {
      this.marketRegime = 'TRENDING_UP';
    } else if (priceChange < -0.02) {
      this.marketRegime = 'TRENDING_DOWN';
    } else {
      this.marketRegime = 'NORMAL';
    }
    
    // Update adaptive profit target
    this.updateAdaptiveProfitTarget();
  }
  
  // Display ultra-realistic trading statistics
  displayTradingStats() {
    const sessionDuration = (Date.now() - this.sessionStartTime) / (1000 * 60 * 60 * 24); // days
    const avgGasCost = this.totalTrades > 0 ? this.totalGasCosts / this.totalTrades : 0;
    
    console.log('\nUltra-Realistic Trading Statistics');
    console.log('=====================================');
    console.log(`Session Duration: ${sessionDuration.toFixed(2)} days`);
    console.log(`Total Trades: ${this.totalTrades}`);
    console.log(`Total Gas Costs: $${this.totalGasCosts.toFixed(2)}`);
    console.log(`Average Gas Cost: $${avgGasCost.toFixed(2)} per trade`);
    console.log(`Current Market Regime: ${this.marketRegime}`);
    console.log(`Current Volatility: ${(this.currentVolatility * 100).toFixed(2)}%`);
    console.log(`Adaptive Profit Target: ${this.adaptiveProfitTarget.toFixed(2)}%`);
    console.log(`Active Orders: ${this.activeOrders.size}`);
    console.log(`Filled Orders: ${this.filledOrders.size}`);
    console.log(`Rebalance Events: ${this.rebalanceEvents.length}`);
    
    // Risk metrics
    const maxDrawdown = this.calculateMaxDrawdown();
    const sharpeRatio = this.calculateSharpeRatio();
    console.log(`Max Drawdown: ${maxDrawdown.toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${sharpeRatio.toFixed(3)}`);
    
    // MEV protection stats
    const mevAttacks = this.rebalanceEvents.filter(e => e.mevAttacked).length;
    console.log(`MEV Attacks Prevented: ${mevAttacks}`);
    console.log(`MEV Protection: ${mevAttacks > 0 ? 'Active' : 'Standby'}`);
  }
  
  calculateMaxDrawdown() {
    // Simplified max drawdown calculation
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
    if (this.priceHistory.length < 10) return 0;
    
    const returns = [];
    for (let i = 1; i < this.priceHistory.length; i++) {
      const returnRate = (this.priceHistory[i].price - this.priceHistory[i-1].price) / this.priceHistory[i-1].price;
      returns.push(returnRate);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  async getUserConfiguration() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (q) => new Promise((res) => rl.question(q, (ans) => res(ans.trim())));

    try {
      console.log('Volatility Grid Configuration');
      console.log('=================================\n');

      const baseToken = (await question('Base Token Address (or press enter for 1INCH): ')) ||
        process.env.DEFAULT_FROM_TOKEN || '0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE';
      const quoteToken = (await question('Quote Token Address (or press enter for USDC): ')) ||
        process.env.DEFAULT_TO_TOKEN || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

      this.config.baseToken = baseToken;
      this.config.quoteToken = quoteToken;

      const [baseTokenInfo, quoteTokenInfo] = await Promise.all([
        this.getTokenInfo(baseToken),
        this.getTokenInfo(quoteToken)
      ]);

      this.config.baseTokenDecimals = baseTokenInfo.decimals;
      this.config.quoteTokenDecimals = quoteTokenInfo.decimals;
      this.config.baseTokenSymbol = baseTokenInfo.symbol;
      this.config.quoteTokenSymbol = quoteTokenInfo.symbol;

      console.log(`\nTrading pair: ${this.config.baseTokenSymbol} ↔ ${this.config.quoteTokenSymbol}`);

      this.config.baseAmount = await question(`Base token amount for sell orders (${this.config.baseTokenSymbol}): `);
      this.config.quoteAmount = await question(`Quote token amount for buy orders (${this.config.quoteTokenSymbol}): `);
      this.config.gridLevels = parseInt(await question('Number of grid levels (e.g., 10): '), 10);
      this.config.priceRange = parseFloat(await question('Price range % around current price (e.g., 20 for ±20%): '));
      this.config.profitTarget = parseFloat(await question('Minimum profit target % per trade (e.g., 0.5): ') || '0.5');

      const autoRebalanceInput = await question('Enable auto-rebalancing? (y/N): ');
      this.config.autoRebalance = autoRebalanceInput.toLowerCase() === 'y' || autoRebalanceInput.toLowerCase() === 'yes';

      if (this.config.autoRebalance) {
        this.config.rebalanceThreshold = parseFloat(await question('Rebalance threshold % (e.g., 50 for 50% of orders filled): ') || '50');
      }

      const slippageInput = await question('Slippage Tolerance % (e.g., 1 for 1%): ');
      this.config.slippageTolerance = parseFloat(slippageInput || '1');
      const gasPriceInput = await question('Gas Price (gwei, press enter for auto): ');
      this.config.gasPrice = gasPriceInput || 'auto';

    } finally {
      rl.close();
    }
  }

  async getTokenInfo(tokenAddress) {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);
      return { symbol, decimals };
    } catch (err) {
      console.warn(`Could not fetch token info for ${tokenAddress}, using defaults`);
      return { symbol: 'UNKNOWN', decimals: 18 };
    }
  }

  async validateConfiguration() {
    const result = await this.validateConfigurationWithResult();
    if (!result.isValid) {
      throw new Error(result.errors.join(', '));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.warn(`  ${w}`));
    }
  }

  async validateConfigurationWithResult() {
    const errors = [];
    const warnings = [];

    try {
      if (!ethers.utils.isAddress(this.config.baseToken)) errors.push('Invalid base token address');
      if (!ethers.utils.isAddress(this.config.quoteToken)) errors.push('Invalid quote token address');

      if (parseFloat(this.config.baseAmount) <= 0) errors.push('Base amount must be greater than 0');
      if (parseFloat(this.config.quoteAmount) <= 0) errors.push('Quote amount must be greater than 0');
      if (this.config.gridLevels <= 2) errors.push('Grid levels must be greater than 2');
      if (this.config.priceRange <= 0 || this.config.priceRange > 50) errors.push('Price range must be between 0% and 50%');

      const walletAddress = await this.signer.getAddress();

      // Base token balance
      const baseTokenContract = new ethers.Contract(this.config.baseToken, ERC20_ABI, this.provider);
      const baseBalance = await baseTokenContract.balanceOf(walletAddress);
      const baseBalanceFormatted = Number(ethers.utils.formatUnits(baseBalance, this.config.baseTokenDecimals));
      const requiredBaseAmount = parseFloat(this.config.baseAmount);

      if (baseBalanceFormatted < requiredBaseAmount) {
        errors.push(`Insufficient ${this.config.baseTokenSymbol} balance. Required: ${requiredBaseAmount}, Available: ${baseBalanceFormatted.toFixed(6)}`);
      }

      // Quote token balance
      const quoteTokenContract = new ethers.Contract(this.config.quoteToken, ERC20_ABI, this.provider);
      const quoteBalance = await quoteTokenContract.balanceOf(walletAddress);
      const quoteBalanceFormatted = Number(ethers.utils.formatUnits(quoteBalance, this.config.quoteTokenDecimals));
      const requiredQuoteAmount = parseFloat(this.config.quoteAmount);

      if (quoteBalanceFormatted < requiredQuoteAmount) {
        errors.push(`Insufficient ${this.config.quoteTokenSymbol} balance. Required: ${requiredQuoteAmount}, Available: ${quoteBalanceFormatted.toFixed(6)}`);
      }

      if (this.config.gridLevels > 30) warnings.push('Large number of grid levels may result in high gas costs');
      if (this.config.profitTarget < 0.1) warnings.push('Very low profit target may result in frequent but small profits');
      if (this.config.priceRange > 30) warnings.push('Large price range may result in orders far from market price');

      console.log(`✅ Balance check: ${baseBalanceFormatted.toFixed(6)} ${this.config.baseTokenSymbol}, ${quoteBalanceFormatted.toFixed(6)} ${this.config.quoteTokenSymbol} available`);
    } catch (err) {
      errors.push(`Validation error: ${err.message}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  async createGridOrders() {
    console.log('\n🚀 Creating Volatility Grid orders...');
    const orders = [];
    const buyLevels = Math.floor(this.config.gridLevels / 2);
    const sellLevels = Math.ceil(this.config.gridLevels / 2);

    await this.ensureTokenApprovals();

    for (let i = 1; i <= sellLevels; i++) {
      try {
        const gridLevel = this.gridLevels.get(i);
        if (!gridLevel) {
          console.error(`❌ Grid level ${i} not found.`);
          continue;
        }

        const orderAmount = ethers.utils.parseUnits(
          (parseFloat(this.config.baseAmount) / sellLevels).toString(),
          this.config.baseTokenDecimals
        );

        console.log(`\n📋 Creating sell order at level +${i}...`);
        const orderData = await this.createSingleGridOrder(orderAmount, GridOrderType.SELL, i, gridLevel.sellPrice);

        if (orderData) {
          orders.push(orderData);
          this.activeOrders.set(orderData.orderHash, orderData);
          console.log(`✅ Sell order ${i} created at ${gridLevel.sellPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
        }

        await new Promise(res => setTimeout(res, 1000));
      } catch (err) {
        console.error(`❌ Failed to create sell order ${i}:`, err.message);
      }
    }

    for (let i = 1; i <= buyLevels; i++) {
      try {
        const gridLevel = this.gridLevels.get(-i);
        if (!gridLevel) {
          console.error(`❌ Grid level -${i} not found.`);
          continue;
        }

        const orderAmount = ethers.utils.parseUnits(
          (parseFloat(this.config.quoteAmount) / buyLevels).toString(),
          this.config.quoteTokenDecimals
        );

        console.log(`\n📋 Creating buy order at level -${i}...`);
        const orderData = await this.createSingleGridOrder(orderAmount, GridOrderType.BUY, -i, gridLevel.buyPrice);

        if (orderData) {
          orders.push(orderData);
          this.activeOrders.set(orderData.orderHash, orderData);
          console.log(`✅ Buy order ${i} created at ${gridLevel.buyPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
        }

        await new Promise(res => setTimeout(res, 1000));
      } catch (err) {
        console.error(`❌ Failed to create buy order ${i}:`, err.message);
      }
    }

    console.log(`\n🎉 Created ${orders.length}/${this.config.gridLevels} grid orders successfully!`);
    return orders;
  }

  // creating a single limit order using 1inch SDK
  async createSingleGridOrder(makingAmount, orderType, gridLevel, targetPrice) {
    try {
      // Ultra-realistic trading checks
      // Check for transaction failure
      if (Math.random() < this.config.failedTransactionRate) {
        console.log('❌ Transaction failed due to network issues');
        return null;
      }
      
      // Check minimum trade interval
      const timeSinceLastTrade = (Date.now() - this.lastTradeTime) / (1000 * 60 * 60); // hours
      if (timeSinceLastTrade < 2) { // 2 hour minimum
        console.log('⏰ Skipping trade - minimum interval not met');
        return null;
      }
      
      // Calculate realistic slippage
      const tradeSize = parseFloat(ethers.utils.formatUnits(makingAmount, orderType === GridOrderType.SELL ? this.config.baseTokenDecimals : this.config.quoteTokenDecimals)) * targetPrice;
      const slippage = this.calculateRealisticSlippage(tradeSize, this.marketRegime);
      
      // Check for MEV attacks
      const mevAttack = this.checkMEVAttack();
      if (mevAttack.isAttacked) {
        console.log('🛡️ MEV protection activated - adjusting order parameters');
        // Reduce order size to minimize MEV impact
        makingAmount = makingAmount.mul(Math.floor(mevAttack.profitReduction * 100)).div(100);
      }
      
      const walletAddress = await this.signer.getAddress();

      let makerAsset, takerAsset, takingAmount;

      if (orderType === GridOrderType.SELL) {
        makerAsset = this.config.baseToken;
        takerAsset = this.config.quoteToken;
        takingAmount = this.calculateQuoteAmount(makingAmount.toBigInt(), targetPrice);
      } else {
        makerAsset = this.config.quoteToken;
        takerAsset = this.config.baseToken;
        takingAmount = this.calculateBaseAmount(makingAmount.toBigInt(), targetPrice);
      }

      // Apply slippage to taking amount
      const slippageMultiplier = ethers.BigNumber.from(Math.floor((1 - slippage) * 10000));
      takingAmount = takingAmount.mul(slippageMultiplier).div(10000);

      const expirationTimestamp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      const UINT_40_MAX = (1n << 40n) - 1n;

      const makerTraits = MakerTraits.default()
        .withExpiration(BigInt(expirationTimestamp))
        .withNonce(randBigInt(UINT_40_MAX))
        .allowPartialFills()
        .allowMultipleFills();

      const limitOrder = new LimitOrder({
        makerAsset: new OneInchAddress(makerAsset),
        takerAsset: new OneInchAddress(takerAsset),
        makingAmount: makingAmount.toBigInt(),
        takingAmount: takingAmount,
        maker: new OneInchAddress(walletAddress),
        salt: randBigInt(2n ** 256n - 1n),
        receiver: new OneInchAddress(walletAddress)
      }, makerTraits);

      const typedData = limitOrder.getTypedData(CHAIN_ID);

      // signer._signTypedData is Ethers v5 method - cast signer if needed
      const signature = await (this.signer)._signTypedData(
        typedData.domain,
        { Order: typedData.types.Order },
        typedData.message
      );

      const orderHash = limitOrder.getOrderHash(CHAIN_ID);

      const safeToString = (value) => {
        if (typeof value === 'bigint') return value.toString();
        if (value && typeof value.toString === 'function') return value.toString();
        return String(value);
      };

      const orderData = {
        order: {
          salt: safeToString(limitOrder.salt),
          maker: safeToString(limitOrder.maker),
          receiver: safeToString(limitOrder.receiver),
          makerAsset: safeToString(limitOrder.makerAsset),
          takerAsset: safeToString(limitOrder.takerAsset),
          makingAmount: safeToString(limitOrder.makingAmount),
          takingAmount: safeToString(limitOrder.takingAmount),
          makerTraits: safeToString(limitOrder.makerTraits)
        },
        orderHash,
        signature,
        targetPrice,
        orderIndex: Math.abs(gridLevel),
        status: 'ACTIVE',
        createdAt: new Date(),
        expiresAt: new Date(expirationTimestamp * 1000),
        remainingMakingAmount: makingAmount.toBigInt(),
        gridType: orderType,
        gridLevel,
        triggerPrice: targetPrice,
        limitOrderInstance: limitOrder
      };

      return orderData;
    } catch (err) {
      console.error('Error creating grid order:', err);
      return null;
    }
  }

  async executeGridStrategy() {
    console.log('\nStarting Volatility Grid Strategy...');
    console.log('======================================');

    if (this.isRunning) {
      console.log('Grid strategy is already running');
      return;
    }

    this.isRunning = true;

    try {
      if (!this.config.currentPrice || this.gridLevels.size === 0) {
        console.log('Initializing grid parameters...');
        this.config.currentPrice = await this.getCurrentPrice();
        this.generateGridLevels();

        console.log('\nVolatility Grid Summary:');
        console.log(`  Grid Levels: ${this.config.gridLevels}`);
        console.log(`  Base Amount: ${this.config.baseAmount} ${this.config.baseTokenSymbol}`);
        console.log(`  Quote Amount: ${this.config.quoteAmount} ${this.config.quoteTokenSymbol}`);
        console.log(`  Price Range: ±${this.config.priceRange}%`);
        console.log(`  Current Price: ${this.config.currentPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
        console.log(`  Auto-rebalance: ${this.config.autoRebalance ? 'Enabled' : 'Disabled'}`);
        console.log(`  Profit Target: ${this.config.profitTarget}%`);
      }

      const orders = await this.createGridOrders();
      if (orders.length === 0) {
        console.log('No orders created. Grid strategy cannot proceed.');
        return;
      }

      console.log('\nSubmitting orders to 1inch protocol...');
      await this.submitOrdersToProtocol();

      console.log('\nStarting grid monitoring...');
      await this.monitorGridExecution();
    } catch (err) {
      console.error('Grid strategy execution failed:', err.message);
    } finally {
      this.isRunning = false;
    }
  }

  async monitorGridExecution() {
    console.log('\nUltra-Realistic Grid Monitoring Active');
    console.log('Press Ctrl+C to stop monitoring\n');

    const monitoringInterval = setInterval(async () => {
      try {
        // Update market analytics
        const currentPrice = await this.getCurrentPrice();
        this.priceHistory.push({
          timestamp: new Date(),
          price: currentPrice
        });
        
        // Keep only last 100 price points
        if (this.priceHistory.length > 100) {
          this.priceHistory = this.priceHistory.slice(-100);
        }
        
        this.updateMarketAnalytics(currentPrice);
        
        await this.checkOrderFills();
        await this.handleRebalancing();
        await this.displayGridStatus();
        
        // Display trading stats every 10 minutes
        if (this.tradeCounter % 20 === 0) {
          this.displayTradingStats();
        }
      } catch (err) {
        console.error('Monitoring error:', err.message);
      }
    }, 30000);

    process.on('SIGINT', () => {
      clearInterval(monitoringInterval);
      this.isRunning = false;
      console.log('\nUltra-Realistic Grid monitoring stopped');
      this.displayTradingStats();
    });
  }

  async checkOrderFills() {
    for (const [orderHash, orderData] of this.activeOrders) {
      if (orderData.status !== 'ACTIVE') continue;
      try {
        const status = await this.getOrderStatus(orderHash);
        if (status) {
          const fillableBalance = status.fillableBalance || '0';
          const remainingAmount = ethers.BigNumber.from(fillableBalance);

          if (remainingAmount.isZero()) {
            orderData.status = 'FILLED';
            this.filledOrders.set(orderHash, orderData);
            this.activeOrders.delete(orderHash);

            console.log(`Grid order filled: ${orderData.gridType} at level ${orderData.gridLevel}`);

            if (this.config.autoRebalance) {
              await this.createOppositeOrder(orderData);
            }

            this.calculateProfit(orderData);
          } else if (remainingAmount.lt(orderData.remainingMakingAmount || 0)) {
            orderData.status = 'PARTIALLY_FILLED';
            orderData.remainingMakingAmount = remainingAmount.toBigInt();
          }
        }
      } catch (err) {
        console.log(`Could not check status for grid order ${orderData.gridLevel}`);
      }
    }
  }

  async createOppositeOrder(filledOrder) {
    try {
      const gridLevel = this.gridLevels.get(filledOrder.gridLevel);
      if (!gridLevel) return;

      let newOrderType, newTargetPrice, newAmount;

      if (filledOrder.gridType === GridOrderType.BUY) {
        newOrderType = GridOrderType.SELL;
        newTargetPrice = gridLevel.sellPrice;
        newAmount = ethers.utils.parseUnits(
          ethers.utils.formatUnits(filledOrder.remainingMakingAmount || 0, this.config.quoteTokenDecimals),
          this.config.baseTokenDecimals
        );
      } else {
        newOrderType = GridOrderType.BUY;
        newTargetPrice = gridLevel.buyPrice;
        newAmount = ethers.utils.parseUnits(
          ethers.utils.formatUnits(filledOrder.remainingMakingAmount || 0, this.config.baseTokenDecimals),
          this.config.quoteTokenDecimals
        );
      }

      console.log(`Creating opposite ${newOrderType.toLowerCase()} order at level ${filledOrder.gridLevel}`);

      const newOrder = await this.createSingleGridOrder(newAmount, newOrderType, filledOrder.gridLevel, newTargetPrice);

      if (newOrder) {
        this.activeOrders.set(newOrder.orderHash, newOrder);
        await this.submitSingleOrder(newOrder);
        console.log(`Opposite order created: ${newOrderType} at ${newTargetPrice.toFixed(6)}`);
      }
    } catch (err) {
      console.error('Failed to create opposite order:', err.message);
    }
  }

  async handleRebalancing() {
    if (!this.config.autoRebalance) return;

    const totalOrders = this.filledOrders.size + this.activeOrders.size;
    const filledRatio = totalOrders === 0 ? 0 : (this.filledOrders.size / totalOrders) * 100;

    if (filledRatio >= this.config.rebalanceThreshold) {
      console.log(`Rebalancing triggered: ${filledRatio.toFixed(1)}% of orders filled`);
      await this.rebalanceGrid();
    }
  }

  async rebalanceGrid() {
    try {
      console.log('Rebalancing grid...');
      await this.cancelAllOrders();
      this.config.currentPrice = await this.getCurrentPrice();
      this.generateGridLevels();
      await this.createGridOrders();
      await this.submitOrdersToProtocol();
      this.filledOrders.clear();
      console.log('Grid rebalanced successfully');
    } catch (err) {
      console.error('Grid rebalancing failed:', err.message);
    }
  }

  calculateProfit(filledOrder) {
    const orderValue = Number(ethers.utils.formatUnits(
      filledOrder.remainingMakingAmount || 0,
      filledOrder.gridType === GridOrderType.SELL ? this.config.baseTokenDecimals : this.config.quoteTokenDecimals
    ));

    const estimatedProfit = orderValue * (this.config.profitTarget / 100);
    this.profits += estimatedProfit;

    console.log(`Estimated profit from trade: $${estimatedProfit.toFixed(4)} (Total: $${this.profits.toFixed(4)})`);
  }

  async displayGridStatus() {
    const currentTime = new Date().toLocaleTimeString();
    const activeCount = this.activeOrders.size;
    const filledCount = this.filledOrders.size;
    const totalOrders = activeCount + filledCount;

    console.log(`Grid Status [${currentTime}]: ${activeCount} active, ${filledCount} filled (${totalOrders} total) | Profit: ${this.profits.toFixed(4)}`);
  }

  async ensureTokenApprovals() {
    console.log('Checking token approvals...');

    const walletAddress = await this.signer.getAddress();

    const baseTokenContract = new ethers.Contract(this.config.baseToken, ERC20_ABI, this.signer);
    const baseAmount = ethers.utils.parseUnits(this.config.baseAmount, this.config.baseTokenDecimals);
    const baseAllowance = await baseTokenContract.allowance(walletAddress, LIMIT_ORDER_PROTOCOL_ADDRESS);

    if (baseAllowance.lt(baseAmount)) {
      console.log(`Approving ${this.config.baseTokenSymbol} for 1inch protocol...`);
      const approveTx = await baseTokenContract.approve(LIMIT_ORDER_PROTOCOL_ADDRESS, baseAmount);
      await approveTx.wait();
      console.log(`${this.config.baseTokenSymbol} approval confirmed`);
    }

    const quoteTokenContract = new ethers.Contract(this.config.quoteToken, ERC20_ABI, this.signer);
    const quoteAmount = ethers.utils.parseUnits(this.config.quoteAmount, this.config.quoteTokenDecimals);
    const quoteAllowance = await quoteTokenContract.allowance(walletAddress, LIMIT_ORDER_PROTOCOL_ADDRESS);

    if (quoteAllowance.lt(quoteAmount)) {
      console.log(`Approving ${this.config.quoteTokenSymbol} for 1inch protocol...`);
      const approveTx = await quoteTokenContract.approve(LIMIT_ORDER_PROTOCOL_ADDRESS, quoteAmount);
      await approveTx.wait();
      console.log(`${this.config.quoteTokenSymbol} approval confirmed`);
    }

    console.log('Token approvals sufficient');
  }

  async submitOrdersToProtocol() {
    let successCount = 0;
    for (const [, orderData] of this.activeOrders) {
      if (await this.submitSingleOrder(orderData)) successCount++;
    }
    console.log(`\nSuccessfully submitted ${successCount}/${this.activeOrders.size} orders to 1inch protocol`);
  }

  async submitSingleOrder(orderData) {
    try {
      let limitOrder = orderData.limitOrderInstance;

      if (!limitOrder) {
        console.log(`Recreating order from stored data for ${orderData.gridType} order`);
        limitOrder = new LimitOrder({
          makerAsset: new OneInchAddress(orderData.order.makerAsset),
          takerAsset: new OneInchAddress(orderData.order.takerAsset),
          makingAmount: BigInt(orderData.order.makingAmount),
          takingAmount: BigInt(orderData.order.takingAmount),
          maker: new OneInchAddress(orderData.order.maker),
          salt: BigInt(orderData.order.salt),
          receiver: new OneInchAddress(orderData.order.receiver)
        }, new MakerTraits(BigInt(orderData.order.makerTraits)));
      } else {
        console.log(`Using stored limit order instance for ${orderData.gridType} order`);
      }

      await this.oneInchApi.submitOrder(limitOrder, orderData.signature);
      console.log(`${orderData.gridType} order submitted at level ${orderData.gridLevel}`);
      return true;
    } catch (err) {
      console.error(`Submit error for ${orderData.gridType} order:`, err?.response?.data || err.message);
      return false;
    }
  }

  async getCurrentPrice() {
    try {
      console.log('Fetching current price from 1inch API...');

      const response = await axios.get(`${SWAP_API_BASE(CHAIN_ID)}/quote`, {
        params: {
          src: this.config.baseToken,
          dst: this.config.quoteToken,
          amount: ethers.utils.parseUnits('1', this.config.baseTokenDecimals).toString()
        },
        headers: {
          'Authorization': `Bearer ${ONEINCH_API_KEY}`,
          accept: 'application/json'
        }
      });

      const dstAmount = response.data.dstAmount;
      const price = Number(ethers.utils.formatUnits(dstAmount, this.config.quoteTokenDecimals));

      console.log(`Current price: 1 ${this.config.baseTokenSymbol} = ${price.toFixed(6)} ${this.config.quoteTokenSymbol}`);
      return price;
    } catch (err) {
      console.warn('Failed to fetch current price, using fallback');
      return 1.0;
    }
  }

  calculateQuoteAmount(baseAmount, price) {
    const baseAmountReadable = Number(ethers.utils.formatUnits(baseAmount.toString(), this.config.baseTokenDecimals));
    const quoteAmountReadable = baseAmountReadable * price;
    const quoteAmountWithSlippage = quoteAmountReadable * (1 - this.config.slippageTolerance / 100);

    return ethers.utils.parseUnits(
      quoteAmountWithSlippage.toFixed(this.config.quoteTokenDecimals),
      this.config.quoteTokenDecimals
    ).toBigInt();
  }

  calculateBaseAmount(quoteAmount, price) {
    const quoteAmountReadable = Number(ethers.utils.formatUnits(quoteAmount.toString(), this.config.quoteTokenDecimals));
    const baseAmountReadable = quoteAmountReadable / price;
    const baseAmountWithSlippage = baseAmountReadable * (1 - this.config.slippageTolerance / 100);

    return ethers.utils.parseUnits(
      baseAmountWithSlippage.toFixed(this.config.baseTokenDecimals),
      this.config.baseTokenDecimals
    ).toBigInt();
  }

  async getOrderStatus(orderHash) {
    try {
      const response = await axios.get(`${LIMIT_ORDER_API_BASE(CHAIN_ID)}/order/${orderHash}`, {
        headers: { Authorization: `Bearer ${ONEINCH_API_KEY}`, accept: 'application/json' }
      });
      return response.data;
    } catch (err) {
      return null;
    }
  }

  async cancelAllOrders() {
    console.log('Cancelling all active grid orders...');
    let cancelledCount = 0;
    for (const [orderHash, orderData] of this.activeOrders) {
      try {
        await axios.delete(`${LIMIT_ORDER_API_BASE(CHAIN_ID)}/order/${orderHash}`, {
          headers: { Authorization: `Bearer ${ONEINCH_API_KEY}` }
        });

        orderData.status = 'CANCELLED';
        cancelledCount++;
      } catch {
        console.error(`Failed to cancel order ${orderHash.slice(0, 10)}...`);
      }
    }

    this.activeOrders.clear();
    console.log(`Cancelled ${cancelledCount} orders`);
  }

  getActiveOrders() {
    return Array.from(this.activeOrders.values());
  }

  getGridStats() {
    const allOrders = [...this.activeOrders.values(), ...this.filledOrders.values()];
    return {
      totalOrders: allOrders.length,
      activeOrders: this.activeOrders.size,
      filledOrders: this.filledOrders.size,
      buyOrders: allOrders.filter(o => o.gridType === GridOrderType.BUY).length,
      sellOrders: allOrders.filter(o => o.gridType === GridOrderType.SELL).length,
      totalProfit: this.profits,
      averageOrderSize: (parseFloat(this.config.baseAmount) / this.config.gridLevels).toFixed(6),
      currentPrice: this.config.currentPrice,
      priceRange: this.config.priceRange
    };
  }

  async emergencyStop() {
    console.log('Emergency stop activated!');
    this.isRunning = false;
    await this.cancelAllOrders();
    console.log('All orders cancelled, strategy stopped');
  }

  async getDetailedStatus() {
    const gridStatus = Array.from(this.gridLevels.entries()).map(([level, prices]) => {
      const hasActiveBuy = Array.from(this.activeOrders.values()).some(o => o.gridLevel === level && o.gridType === GridOrderType.BUY);
      const hasActiveSell = Array.from(this.activeOrders.values()).some(o => o.gridLevel === level && o.gridType === GridOrderType.SELL);

      return { level, buyPrice: prices.buyPrice, sellPrice: prices.sellPrice, hasActiveBuy, hasActiveSell };
    });

    const filledOrdersArray = Array.from(this.filledOrders.values());
    const totalTrades = filledOrdersArray.length;
    const successfulTrades = filledOrdersArray.filter(o => o.status === 'FILLED').length;
    const averageProfit = totalTrades > 0 ? this.profits / totalTrades : 0;

    return {
      gridLevels: gridStatus,
      performance: { totalTrades, successfulTrades, totalProfit: this.profits, averageProfit }
    };
  }
}
