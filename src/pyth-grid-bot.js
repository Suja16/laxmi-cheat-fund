#!/usr/bin/env node

/**
 * Enhanced Grid Bot with Pyth Protocol Integration
 * Uses real-time Pyth price feeds for accurate grid trading
 */

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
  LIMIT_ORDER_API_BASE,
  GridOrderType,
  OrderStatus
} from './types.js';

import {
  PythPriceFeed,
  PythFeedManager,
  PythGridPriceProvider,
  createDefaultFeedManager,
  PYTH_PRICE_FEEDS
} from './pyth-provider.js';

dotenv.config();

// --- ERC20 ABI (minimal) ---
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
];

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || 'gC7k3c3RlyaE60cRBll7CYexIHhe78nA';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '8453', 10); 
const LIMIT_ORDER_PROTOCOL_ADDRESS = LIMIT_ORDER_PROTOCOL_ADDRESSES[CHAIN_ID];

export class PythEnhancedGridStrategy {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;

    this.oneInchApi = new Api({
      networkId: CHAIN_ID,
      authKey: ONEINCH_API_KEY,
      httpConnector: new FetchProviderConnector()
    });

    // Initialize Pyth price feeds
    this.feedManager = createDefaultFeedManager();
    this.priceProvider = new PythGridPriceProvider(this.feedManager);
    
    // Grid strategy state
    this.activeOrders = new Map();
    this.filledOrders = new Map();
    this.config = {};
    this.isRunning = false;
    this.gridLevels = new Map();
    this.profits = 0;
    
    // Price monitoring
    this.currentPrice = null;
    this.priceHistory = [];
    this.lastRebalancePrice = null;
    
    // Event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Listen to price updates
    this.feedManager.on('priceUpdate', (data) => {
      this.handlePriceUpdate(data);
    });
    
    this.feedManager.on('error', (data) => {
      console.error(`❌ Price feed error for ${data.symbol}:`, data.error.message);
    });
  }

  async handlePriceUpdate(data) {
    const { symbol, price, timestamp, confidence } = data;
    
    // Update current price if it's for our trading pair
    if (this.config.baseTokenSymbol && this.config.quoteTokenSymbol) {
      if (symbol === `${this.config.baseTokenSymbol}_USD` || 
          symbol === `${this.config.quoteTokenSymbol}_USD`) {
        this.updateCurrentPrice(price, timestamp, confidence);
      }
    }
    
    // Check for order fills
    if (this.isRunning) {
      await this.checkOrderFills(price);
    }
  }

  updateCurrentPrice(price, timestamp, confidence) {
    this.currentPrice = price;
    this.priceHistory.push({
      price,
      timestamp,
      confidence
    });
    
    // Keep only last 1000 price points
    if (this.priceHistory.length > 1000) {
      this.priceHistory = this.priceHistory.slice(-1000);
    }
    
    console.log(`💰 Price update: $${price.toFixed(2)} (confidence: ±$${confidence.toFixed(2)})`);
  }

  // Accepts a StrategyConfig-like object
  setConfiguration(config) {
    this.config = {
      baseToken: config.fromToken.address,
      quoteToken: config.toToken.address,
      baseAmount: config.totalAmount,
      quoteAmount: config.totalAmount,
      gridLevels: config.numberOfOrders || 10,
      priceRange: config.priceDropPercent || 20,
      currentPrice: 0,
      slippageTolerance: config.slippageTolerance || 1,
      gasPrice: config.gasPrice || 'auto',
      baseTokenDecimals: config.fromToken.decimals,
      quoteTokenSymbol: config.toToken.symbol,
      rebalanceThreshold: 50,
      autoRebalance: true,
      profitTarget: 0.5,
      // Pyth-specific config
      usePythFeeds: true,
      priceUpdateInterval: 1000, // 1 second
      maxPriceAge: 30000, // 30 seconds
      confidenceThreshold: 0.01 // 1% confidence threshold
    };

    console.log('🔧 Enhanced Grid configuration set:');
    console.log(`  Pair: ${this.config.baseTokenSymbol}/${this.config.quoteTokenSymbol}`);
    console.log(`  Grid levels: ${this.config.gridLevels}`);
    console.log(`  Price range: ${this.config.priceRange}%`);
    console.log(`  Base amount: ${this.config.baseAmount}`);
    console.log(`  Quote amount: ${this.config.quoteAmount}`);
    console.log(`  Pyth feeds: ${this.config.usePythFeeds ? 'Enabled' : 'Disabled'}`);
  }

  async initialize() {
    console.log('🌈 Pyth-Enhanced Volatility Grid Strategy');
    console.log('==========================================\n');

    await this.getUserConfiguration();
    await this.validateConfiguration();
    console.log('\n✅ Grid Configuration validated successfully!');

    // Initialize price feeds
    if (this.config.usePythFeeds) {
      await this.initializePriceFeeds();
    }

    // Get current price
    this.config.currentPrice = await this.getCurrentPrice();
    this.generateGridLevels();

    console.log('\n📋 Enhanced Volatility Grid Summary:');
    console.log(`  📊 Grid Levels: ${this.config.gridLevels}`);
    console.log(`  💰 Base Amount: ${this.config.baseAmount} ${this.config.baseTokenSymbol}`);
    console.log(`  💵 Quote Amount: ${this.config.quoteAmount} ${this.config.quoteTokenSymbol}`);
    console.log(`  📈 Price Range: ±${this.config.priceRange}%`);
    console.log(`  🎯 Current Price: ${this.config.currentPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
    console.log(`  🔄 Auto-rebalance: ${this.config.autoRebalance ? 'Enabled' : 'Disabled'}`);
    console.log(`  📈 Profit Target: ${this.config.profitTarget}%`);
    console.log(`  🔗 Pyth Integration: ${this.config.usePythFeeds ? 'Active' : 'Disabled'}`);
  }

  async initializePriceFeeds() {
    console.log('🔗 Initializing Pyth price feeds...');
    
    try {
      // Add feeds for our trading pair
      const baseFeedId = this.getFeedIdForSymbol(this.config.baseTokenSymbol);
      const quoteFeedId = this.getFeedIdForSymbol(this.config.quoteTokenSymbol);
      
      if (baseFeedId) {
        this.feedManager.addFeed(`${this.config.baseTokenSymbol}_USD`, baseFeedId);
      }
      
      if (quoteFeedId) {
        this.feedManager.addFeed(`${this.config.quoteTokenSymbol}_USD`, quoteFeedId);
      }
      
      // Start all feeds
      await this.feedManager.startAllFeeds();
      
      console.log('✅ Pyth price feeds initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Pyth feeds:', error.message);
      console.log('⚠️ Falling back to 1inch API for price data');
      this.config.usePythFeeds = false;
    }
  }

  getFeedIdForSymbol(symbol) {
    const symbolMap = {
      'ETH': PYTH_PRICE_FEEDS.ETH_USD_STABLE,
      'BTC': PYTH_PRICE_FEEDS.BTC_USD_STABLE,
      'USDC': PYTH_PRICE_FEEDS.USDC_USD_STABLE,
      'SOL': PYTH_PRICE_FEEDS.SOL_USD_STABLE,
      'AVAX': PYTH_PRICE_FEEDS.AVAX_USD_STABLE
    };
    
    return symbolMap[symbol.toUpperCase()];
  }

  generateGridLevels() {
    const currentPrice = this.config.currentPrice;
    const priceRange = this.config.priceRange / 100;
    const gridLevels = this.config.gridLevels;

    const buyLevels = Math.floor(gridLevels / 2);
    const sellLevels = Math.ceil(gridLevels / 2);

    this.gridLevels.clear();

    console.log('\n📊 Enhanced Grid Price Levels:');
    console.log('==============================');

    for (let i = 1; i <= sellLevels; i++) {
      const priceMultiplier = 1 + (priceRange * i / sellLevels);
      const sellPrice = currentPrice * priceMultiplier;
      const buyPrice = sellPrice * (1 - this.config.profitTarget / 100);

      this.gridLevels.set(i, { buyPrice, sellPrice });
      console.log(`  Level +${i}: Sell at ${sellPrice.toFixed(6)}, Buy at ${buyPrice.toFixed(6)}`);
    }

    for (let i = 1; i <= buyLevels; i++) {
      const priceMultiplier = 1 - (priceRange * i / buyLevels);
      const buyPrice = currentPrice * priceMultiplier;
      const sellPrice = buyPrice * (1 + this.config.profitTarget / 100);

      this.gridLevels.set(-i, { buyPrice, sellPrice });
      console.log(`  Level -${i}: Buy at ${buyPrice.toFixed(6)}, Sell at ${sellPrice.toFixed(6)}`);
    }
  }

  async getUserConfiguration() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (q) => new Promise((res) => rl.question(q, (ans) => res(ans.trim())));

    try {
      console.log('📝 Enhanced Volatility Grid Configuration');
      console.log('==========================================\n');

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

      console.log(`\n🔄 Trading pair: ${this.config.baseTokenSymbol} ↔ ${this.config.quoteTokenSymbol}`);

      this.config.baseAmount = await question(`Base token amount for sell orders (${this.config.baseTokenSymbol}): `);
      this.config.quoteAmount = await question(`Quote token amount for buy orders (this.config.quoteTokenSymbol}): `);
      this.config.gridLevels = parseInt(await question('Number of grid levels (e.g., 10): '), 10);
      this.config.priceRange = parseFloat(await question('Price range % around current price (e.g., 20 for ±20%): '));
      this.config.profitTarget = parseFloat(await question('Minimum profit target % per trade (e.g., 0.5): ') || '0.5');

      const autoRebalanceInput = await question('Enable auto-rebalancing? (y/N): ');
      this.config.autoRebalance = autoRebalanceInput.toLowerCase() === 'y' || autoRebalanceInput.toLowerCase() === 'yes';

      if (this.config.autoRebalance) {
        this.config.rebalanceThreshold = parseFloat(await question('Rebalance threshold % (e.g., 50 for 50% of orders filled): ') || '50');
      }

      const usePythInput = await question('Use Pyth price feeds? (Y/n): ');
      this.config.usePythFeeds = usePythInput.toLowerCase() !== 'n' && usePythInput.toLowerCase() !== 'no';

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
      console.warn(`⚠️ Could not fetch token info for ${tokenAddress}, using defaults`);
      return { symbol: 'UNKNOWN', decimals: 18 };
    }
  }

  async validateConfiguration() {
    const result = await this.validateConfigurationWithResult();
    if (!result.isValid) {
      throw new Error(result.errors.join(', '));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.warn(`⚠️  ${w}`));
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

  async getCurrentPrice() {
    if (this.config.usePythFeeds) {
      try {
        console.log('📊 Fetching current price from Pyth feeds...');
        
        const price = await this.priceProvider.getPriceWithFallback(
          this.config.baseTokenSymbol,
          this.config.quoteTokenSymbol,
          null
        );
        
        if (price) {
          console.log(`💰 Current price from Pyth: 1 ${this.config.baseTokenSymbol} = ${price.toFixed(6)} ${this.config.quoteTokenSymbol}`);
          return price;
        }
      } catch (error) {
        console.warn('⚠️ Pyth price fetch failed, falling back to 1inch API');
      }
    }
    
    // Fallback to 1inch API
    try {
      console.log('📊 Fetching current price from 1inch API...');

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

      console.log(`💰 Current price from 1inch: 1 ${this.config.baseTokenSymbol} = ${price.toFixed(6)} ${this.config.quoteTokenSymbol}`);
      return price;
    } catch (err) {
      console.warn('⚠️ Failed to fetch current price, using fallback');
      return 1.0;
    }
  }

  async executeGridStrategy() {
    console.log('\n🚀 Starting Pyth-Enhanced Volatility Grid Strategy...');
    console.log('=======================================================');

    if (this.isRunning) {
      console.log('⚠️ Grid strategy is already running');
      return;
    }

    this.isRunning = true;

    try {
      if (!this.config.currentPrice || this.gridLevels.size === 0) {
        console.log('🔄 Initializing grid parameters...');
        this.config.currentPrice = await this.getCurrentPrice();
        this.generateGridLevels();
      }

      const orders = await this.createGridOrders();
      if (orders.length === 0) {
        console.log('❌ No orders created. Grid strategy cannot proceed.');
        return;
      }

      console.log('\n📤 Submitting orders to 1inch protocol...');
      await this.submitOrdersToProtocol();

      console.log('\n👀 Starting enhanced grid monitoring...');
      await this.monitorGridExecution();
    } catch (err) {
      console.error('❌ Grid strategy execution failed:', err.message);
    } finally {
      this.isRunning = false;
    }
  }

  async monitorGridExecution() {
    console.log('\n🔍 Enhanced Grid Monitoring Active');
    console.log('Press Ctrl+C to stop monitoring\n');

    const monitoringInterval = setInterval(async () => {
      try {
        await this.checkOrderFills();
        await this.handleRebalancing();
        await this.displayGridStatus();
        await this.displayPriceFeedStats();
      } catch (err) {
        console.error('❌ Monitoring error:', err.message);
      }
    }, 30000);

    process.on('SIGINT', () => {
      clearInterval(monitoringInterval);
      this.isRunning = false;
      this.feedManager.stopAllFeeds();
      console.log('\n🛑 Enhanced grid monitoring stopped');
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

            console.log(`✅ Grid order filled: ${orderData.gridType} at level ${orderData.gridLevel}`);

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
        console.log(`⚠️ Could not check status for grid order ${orderData.gridLevel}`);
      }
    }
  }

  async displayPriceFeedStats() {
    if (!this.config.usePythFeeds) return;
    
    const stats = this.feedManager.getFeedStats();
    console.log('\n📊 Price Feed Statistics:');
    console.log('==========================');
    
    for (const [symbol, feedStats] of Object.entries(stats)) {
      if (feedStats) {
        console.log(`${symbol}: $${feedStats.currentPrice?.toFixed(2) || 'N/A'} (volatility: ${(feedStats.volatility * 100)?.toFixed(2) || 'N/A'}%)`);
      }
    }
  }

  // ... (rest of the methods from the original gridBot.js with Pyth enhancements)
  
  async emergencyStop() {
    console.log('🚨 Emergency stop activated!');
    this.isRunning = false;
    this.feedManager.stopAllFeeds();
    await this.cancelAllOrders();
    console.log('🛑 All orders cancelled, strategy stopped');
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
      performance: { totalTrades, successfulTrades, totalProfit: this.profits, averageProfit },
      priceFeeds: this.feedManager.getFeedStats(),
      currentPrice: this.currentPrice,
      priceHistory: this.priceHistory.slice(-100) // Last 100 price points
    };
  }
}

// Class is already exported above
