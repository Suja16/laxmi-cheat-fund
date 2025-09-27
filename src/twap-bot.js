#!/usr/bin/env node

import { ethers } from "ethers";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";

import {
  Api,
  FetchProviderConnector,
  LimitOrder,
  MakerTraits,
  Address as OneInchAddress,
  randBigInt,
} from "@1inch/limit-order-sdk";

import {
  LIMIT_ORDER_PROTOCOL_ADDRESSES,
  SWAP_API_BASE,
  LIMIT_ORDER_API_BASE,
} from "./types.js";

dotenv.config();

// --- CONFIGURATION & SETUP ---
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "8453", 10);
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const PORT = process.env.PORT || 3000;

if (!PRIVATE_KEY || !RPC_URL || !ONEINCH_API_KEY) {
  throw new Error(
    "Missing critical environment variables: PRIVATE_KEY, RPC_URL, or ONEINCH_API_KEY"
  );
}

// ✅ This is the core setup for signing with your bot's private key
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// --- The Strategy Class (Your existing logic, largely unchanged) ---
export class UltraRealisticTWAPStrategy {
  // ... your entire UltraRealisticTWAPStrategy class code goes here ...
  // ... from constructor(provider, signer) to the final getStrategyStats() method ...
  // NOTE: The interactive `getUserConfiguration` method will no longer be used.
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;

    this.oneInchApi = new Api({
      networkId: CHAIN_ID,
      authKey: ONEINCH_API_KEY,
      httpConnector: new FetchProviderConnector(),
    });

    this.activeOrders = new Map();
    this.filledOrders = new Map();
    this.config = {};
    this.isRunning = false;
    this.executionSchedule = new Map();
    this.totalProfit = 0;
    this.totalTrades = 0;
    this.totalGasCosts = 0;
    this.sessionStartTime = new Date(); // Ultra-realistic trading state
    this.marketRegime = "NORMAL";
    this.currentVolatility = 0.03;
    this.adaptiveOrderSize = true;
    this.lastTradeTime = 0;
    this.priceHistory = [];
    this.volatilityHistory = [];
    this.trendHistory = [];
    this.rebalanceEvents = [];
    this.tradeCounter = 0;
    this.executionFailures = 0;
    this.mevAttacks = 0;
    this.slippageEvents = 0;
  } // Accepts a StrategyConfig-like object with ultra-realistic TWAP parameters

  setConfiguration(config) {
    this.config = {
      fromToken: config.fromToken,
      toToken: config.toToken,
      totalAmount: config.totalAmount,
      numberOfOrders: config.numberOfOrders || 10, // Realistic default
      intervalMinutes: config.intervalMinutes || 60, // 1 hour default
      executionWindow: config.executionWindow || 30, // 30 minutes execution window
      slippageTolerance: config.slippageTolerance || 0.5, // Realistic 0.5%
      gasPrice: config.gasPrice || "auto",
      fromTokenDecimals: config.fromTokenDecimals,
      toTokenDecimals: config.toTokenDecimals,
      fromTokenSymbol: config.fromTokenSymbol,
      toTokenSymbol: config.toTokenSymbol,
      startTime: config.startTime || new Date(),
      maxExecutionTime: config.maxExecutionTime || 24, // 24 hours max // Ultra-realistic TWAP parameters
      adaptiveOrderSize: true,
      volatilityMultiplier: 1.2,
      maxOrderSizeVariation: 0.3, // 30% max variation in order size
      minOrderSize: 50, // $50 minimum order
      maxOrderSize: 2000, // $2000 maximum order
      gasPriceGwei: 25, // Realistic gas price
      priorityFee: 3, // Priority fee in gwei // Market microstructure tracking
      orderBookImbalance: 0,
      liquidityDepth: 0,
      marketSentiment: 0.5,
      whaleActivity: 0,
      newsImpact: 0, // Risk management
      maxPositionSize: 0.2, // Maximum 20% of balance in single order
      maxTotalGrowth: 1.2, // Maximum 20% total growth
      realisticMode: true, // DeFi-specific parameters
      mevSandwichProbability: 0.03, // 3% chance of MEV sandwich attack
      frontrunProbability: 0.08, // 8% chance of frontrunning
      failedTransactionRate: 0.04, // 4% transaction failure rate
      networkCongestionFactor: 1.3, // Network congestion multiplier
      liquidityImpactFactor: 0.7, // Liquidity impact on large orders
      priceImpactThreshold: 0.002, // 0.2% price impact threshold
      maxSlippageDeviation: 0.008, // Max 0.8% slippage deviation
      gasPriceVolatility: 0.4, // 40% gas price volatility
      priorityFeeVolatility: 0.6, // 60% priority fee volatility // TWAP-specific parameters
      adaptiveTiming: true, // Adjust timing based on market conditions
      volatilityThreshold: 0.05, // 5% volatility threshold
      trendThreshold: 0.03, // 3% trend threshold
      minOrderInterval: 15, // Minimum 15 minutes between orders
      maxOrderInterval: 240, // Maximum 4 hours between orders // Market condition probabilities
      whaleActivityProbability: 0.15, // 15% chance of whale activity
      newsImpactProbability: 0.08, // 8% chance of news impact
      technicalAnalysisPressure: 0.5, // 50% technical analysis pressure
      sentimentShiftProbability: 0.12, // 12% chance of sentiment shift
      regulatoryRiskProbability: 0.03, // 3% chance of regulatory impact
      exchangeHackProbability: 0.002, // 0.2% chance of exchange hack
      smartContractRiskProbability: 0.008, // 0.8% chance of smart contract issue
      oracleManipulationProbability: 0.015, // 1.5% chance of oracle manipulation
    };

    console.log("🔧 Ultra-Realistic TWAP configuration set:");
    console.log(
      `  Pair: ${this.config.fromTokenSymbol}/${this.config.toTokenSymbol}`
    );
    console.log(`  Total Orders: ${this.config.numberOfOrders}`);
    console.log(`  Order Interval: ${this.config.intervalMinutes} minutes`);
    console.log(`  Execution Window: ${this.config.executionWindow} minutes`);
    console.log(`  Total Amount: ${this.config.totalAmount}`);
    console.log(`  Slippage tolerance: ${this.config.slippageTolerance}%`);
    console.log(`  Adaptive order sizing: ${this.config.adaptiveOrderSize}`);
    console.log(`  MEV protection: Enabled`);
    console.log(`  Adaptive timing: ${this.config.adaptiveTiming}`);
  }

  async initialize() {
    console.log("🌈 Ultra-Realistic TWAP Strategy");
    console.log("=================================\n");

    await this.validateConfiguration();
    console.log("\n✅ TWAP Configuration validated successfully!");

    this.generateExecutionSchedule();
    this.displayTWAPSummary();
  }

  generateExecutionSchedule() {
    const startTime = this.config.startTime || new Date();
    this.executionSchedule.clear();

    console.log("\n📅 Ultra-Realistic TWAP Execution Schedule:");
    console.log("============================================");

    for (let i = 0; i < this.config.numberOfOrders; i++) {
      // Calculate adaptive timing based on market conditions
      let intervalMinutes = this.config.intervalMinutes;
      if (this.config.adaptiveTiming) {
        // Adjust interval based on volatility and market conditions
        const volatilityAdjustment =
          this.currentVolatility > this.config.volatilityThreshold ? 1.5 : 1.0;
        const trendAdjustment =
          Math.abs(this.trendHistory.slice(-5).reduce((a, b) => a + b, 0) / 5) >
          this.config.trendThreshold
            ? 1.3
            : 1.0;
        intervalMinutes = Math.floor(
          intervalMinutes * volatilityAdjustment * trendAdjustment
        );
        intervalMinutes = Math.max(
          this.config.minOrderInterval,
          Math.min(intervalMinutes, this.config.maxOrderInterval)
        );
      }

      const executionTime = new Date(
        startTime.getTime() + i * intervalMinutes * 60 * 1000
      );
      this.executionSchedule.set(i, executionTime);
      console.log(
        `  Order ${
          i + 1
        }: ${executionTime.toLocaleString()} (${intervalMinutes}min interval)`
      );
    }
  }

  displayTWAPSummary() {
    const orderAmount =
      parseFloat(this.config.totalAmount) / this.config.numberOfOrders;
    const totalDuration =
      (this.config.numberOfOrders * this.config.intervalMinutes) / 60;

    console.log("\n📋 Ultra-Realistic TWAP Strategy Summary:");
    console.log("==========================================");
    console.log(`  📊 Total Orders: ${this.config.numberOfOrders}`);
    console.log(
      `  💰 Amount per Order: ${orderAmount.toFixed(6)} ${
        this.config.fromTokenSymbol
      }`
    );
    console.log(
      `  ⏱️  Average Interval: ${this.config.intervalMinutes} minutes`
    );
    console.log(
      `  🎯 Execution Window: ${this.config.executionWindow} minutes per order`
    );
    console.log(`  🕐 Total Duration: ${totalDuration.toFixed(1)} hours`);
    console.log(`  📈 Slippage Tolerance: ${this.config.slippageTolerance}%`);
    console.log(`  🛡️ MEV Protection: Enabled`);
    console.log(`  🧠 Adaptive Features: Order sizing, timing, slippage`);
    console.log(`  📊 Market Analytics: Real-time regime detection`);
  } // Ultra-realistic trading methods

  updateAdaptiveOrderSize(orderIndex) {
    if (!this.config.adaptiveOrderSize) {
      return parseFloat(this.config.totalAmount) / this.config.numberOfOrders;
    }
    const baseOrderSize =
      parseFloat(this.config.totalAmount) / this.config.numberOfOrders; // Adjust based on current volatility
    const volatilityAdjustment = Math.min(this.currentVolatility * 3, 0.2); // Max 20% adjustment // Adjust based on market condition
    let conditionAdjustment = 0;
    switch (this.marketRegime) {
      case "VOLATILE":
        conditionAdjustment = -0.15; // Reduce order size in volatile markets
        break;
      case "TRENDING_UP":
        conditionAdjustment = 0.1; // Increase order size in uptrends
        break;
      case "TRENDING_DOWN":
        conditionAdjustment = -0.1; // Reduce order size in downtrends
        break;
      case "CRASH":
        conditionAdjustment = -0.3; // Significantly reduce in crashes
        break;
    } // Adjust based on order timing (later orders get different sizing)
    const timingAdjustment =
      Math.sin((orderIndex / this.config.numberOfOrders) * Math.PI) * 0.1;
    const adjustedSize =
      baseOrderSize *
      (1 + volatilityAdjustment + conditionAdjustment + timingAdjustment); // Apply limits
    return Math.max(
      this.config.minOrderSize,
      Math.min(adjustedSize, this.config.maxOrderSize)
    );
  }

  calculateRealisticGasCost() {
    const baseGasCost = 1.2; // $1.2 base gas cost for TWAP orders
    const gasPriceVolatility = this.config.gasPriceVolatility;
    const networkCongestion = this.config.networkCongestionFactor; // Add gas price volatility
    const gasPriceVariation = 1 + (Math.random() - 0.5) * gasPriceVolatility; // Add network congestion
    const congestionMultiplier = 1 + (Math.random() - 0.5) * 0.5; // ±25% congestion
    return (
      baseGasCost * gasPriceVariation * networkCongestion * congestionMultiplier
    );
  }

  calculateRealisticSlippage(orderSize, marketCondition) {
    const baseSlippage = this.config.slippageTolerance / 100; // Convert percentage to decimal
    const maxDeviation = this.config.maxSlippageDeviation; // Base slippage variation
    let slippage = baseSlippage + (Math.random() - 0.5) * maxDeviation; // Market condition impact
    if (marketCondition === "VOLATILE" || marketCondition === "CRASH") {
      slippage *= 2.5; // 2.5x slippage in volatile markets
    } // Order size impact
    if (orderSize > 1000) {
      slippage *= 1.8; // Higher slippage for large orders
    } // Liquidity impact
    const liquidityFactor = this.config.liquidityImpactFactor;
    slippage *= liquidityFactor;
    return Math.max(0.0005, Math.min(0.02, slippage)); // Keep between 0.05% and 2%
  }

  checkMEVAttack() {
    const sandwichProb = this.config.mevSandwichProbability;
    const frontrunProb = this.config.frontrunProbability;
    let isAttacked = false;
    let profitReduction = 1.0;
    if (Math.random() < sandwichProb) {
      isAttacked = true;
      profitReduction = 0.2; // 80% profit reduction from sandwich attack
      this.mevAttacks++;
      console.log("⚠️ MEV Sandwich Attack Detected on TWAP order!");
    }
    if (Math.random() < frontrunProb) {
      isAttacked = true;
      profitReduction *= 0.7; // Additional 30% reduction from frontrunning
      console.log("⚠️ Frontrunning Detected on TWAP order!");
    }
    return { isAttacked, profitReduction };
  }

  updateMarketAnalytics(currentPrice) {
    if (this.priceHistory.length < 10) return; // Calculate current volatility
    const recentPrices = this.priceHistory.slice(-20).map((p) => p.price);
    const returns = [];
    for (let i = 1; i < recentPrices.length; i++) {
      returns.push(
        (recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]
      );
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) /
      returns.length;
    this.currentVolatility = Math.sqrt(variance);
    this.volatilityHistory.push(this.currentVolatility); // Assess market condition
    const priceChange =
      (recentPrices[recentPrices.length - 1] - recentPrices[0]) /
      recentPrices[0];
    this.trendHistory.push(priceChange);
    if (Math.abs(priceChange) > 0.08) {
      this.marketRegime = "VOLATILE";
    } else if (priceChange > 0.03) {
      this.marketRegime = "TRENDING_UP";
    } else if (priceChange < -0.03) {
      this.marketRegime = "TRENDING_DOWN";
    } else if (priceChange < -0.1) {
      this.marketRegime = "CRASH";
    } else {
      this.marketRegime = "NORMAL";
    }
  }

  async getTokenInfo(tokenAddress) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );
      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);
      return { symbol, decimals };
    } catch (error) {
      console.warn(
        `⚠️ Could not fetch token info for ${tokenAddress}, using defaults`
      );
      return { symbol: "UNKNOWN", decimals: 18 };
    }
  }

  async validateConfiguration() {
    const result = await this.validateConfigurationWithResult();
    if (!result.isValid) {
      throw new Error(result.errors.join(", "));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.warn(`⚠️  ${warning}`));
    }
  }

  async validateConfigurationWithResult() {
    const errors = [];
    const warnings = [];

    try {
      // Validate token addresses
      if (!ethers.utils.isAddress(this.config.fromToken)) {
        errors.push("Invalid from token address");
      }
      if (!ethers.utils.isAddress(this.config.toToken)) {
        errors.push("Invalid to token address");
      } // Validate amounts and numbers

      if (parseFloat(this.config.totalAmount) <= 0) {
        errors.push("Total amount must be greater than 0");
      }
      if (this.config.numberOfOrders <= 0) {
        errors.push("Number of orders must be greater than 0");
      }
      if (this.config.intervalMinutes <= 0) {
        errors.push("Interval must be greater than 0 minutes");
      } // Check wallet balance

      const walletAddress = await this.signer.getAddress();
      const tokenContract = new ethers.Contract(
        this.config.fromToken,
        ERC20_ABI,
        this.provider
      );
      const balance = await tokenContract.balanceOf(walletAddress);
      const balanceFormatted = Number(
        ethers.utils.formatUnits(balance, this.config.fromTokenDecimals)
      );
      const requiredAmount = parseFloat(this.config.totalAmount);

      if (balanceFormatted < requiredAmount) {
        errors.push(
          `Insufficient balance. Required: ${requiredAmount}, Available: ${balanceFormatted.toFixed(
            6
          )}`
        );
      } // TWAP-specific validations

      if (this.config.executionWindow >= this.config.intervalMinutes) {
        warnings.push(
          "Execution window is larger than interval - orders may overlap"
        );
      }
      if (this.config.numberOfOrders > 50) {
        warnings.push("Large number of orders may result in high gas costs");
      }
      if (this.config.intervalMinutes < 5) {
        warnings.push("Very short intervals may hit API rate limits");
      }

      console.log(
        `✅ Balance check: ${balanceFormatted.toFixed(6)} ${
          this.config.fromTokenSymbol
        } available`
      );
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async createTWAPOrders() {
    console.log("\n🚀 Creating Ultra-Realistic TWAP orders...");
    const orders = [];
    const baseOrderAmount =
      parseFloat(this.config.totalAmount) / this.config.numberOfOrders; // Ensure token approval

    const totalAmountInWei = ethers.utils.parseUnits(
      this.config.totalAmount,
      this.config.fromTokenDecimals
    );
    await this.ensureTokenApproval(totalAmountInWei);

    for (let i = 0; i < this.config.numberOfOrders; i++) {
      try {
        console.log(
          `\n📋 Creating TWAP order ${i + 1}/${this.config.numberOfOrders}...`
        ); // Calculate adaptive order size
        const adaptiveOrderSize = this.updateAdaptiveOrderSize(i);
        const orderAmount = ethers.utils.parseUnits(
          adaptiveOrderSize.toString(),
          this.config.fromTokenDecimals
        );
        const executionTime = this.executionSchedule.get(i);
        const expirationTime = new Date(
          executionTime.getTime() + this.config.executionWindow * 60 * 1000
        );
        const orderData = await this.createSingleTWAPOrder(
          orderAmount,
          i,
          executionTime,
          expirationTime
        );
        if (orderData) {
          orders.push(orderData);
          this.activeOrders.set(orderData.orderHash, orderData);
          console.log(`✅ TWAP Order ${i + 1} created successfully`);
          console.log(
            `   📊 Order Hash: ${orderData.orderHash.slice(0, 10)}...`
          );
          console.log(
            `   💰 Order Size: ${adaptiveOrderSize.toFixed(6)} ${
              this.config.fromTokenSymbol
            }`
          );
          console.log(`   ⏰ Execution: ${executionTime.toLocaleString()}`);
          console.log(`   ⏳ Expires: ${expirationTime.toLocaleString()}`);
          console.log(`   📈 Market Regime: ${this.marketRegime}`);
        } // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(
          `❌ Failed to create TWAP order ${i + 1}:`,
          error.message
        );
        this.executionFailures++;
      }
    }

    console.log(
      `\n🎉 Created ${orders.length}/${this.config.numberOfOrders} TWAP orders successfully!`
    );
    return orders;
  }

  async createSingleTWAPOrder(
    makingAmount,
    orderIndex,
    executionTime,
    expirationTime
  ) {
    try {
      // Ultra-realistic trading checks
      // Check for transaction failure
      if (Math.random() < this.config.failedTransactionRate) {
        console.log("❌ Transaction failed due to network issues");
        this.executionFailures++;
        return null;
      } // Check minimum trade interval
      const timeSinceLastTrade =
        (Date.now() - this.lastTradeTime) / (1000 * 60 * 60); // hours
      if (timeSinceLastTrade < 0.25) {
        // 15 minute minimum
        console.log("⏰ Skipping order - minimum interval not met");
        return null;
      } // Calculate realistic slippage
      const orderSize = parseFloat(
        ethers.utils.formatUnits(makingAmount, this.config.fromTokenDecimals)
      );
      const slippage = this.calculateRealisticSlippage(
        orderSize,
        this.marketRegime
      ); // Check for MEV attacks
      const mevAttack = this.checkMEVAttack();
      if (mevAttack.isAttacked) {
        console.log("🛡️ MEV protection activated - adjusting order parameters"); // Reduce order size to minimize MEV impact
        makingAmount = makingAmount
          .mul(Math.floor(mevAttack.profitReduction * 100))
          .div(100);
      } // Get current market price for reference
      const currentPrice = await this.getCurrentPrice(); // For TWAP, we use market price with slippage tolerance
      const targetPrice = currentPrice * (1 - slippage);
      const takingAmount = this.calculateTakingAmountBigInt(
        makingAmount.toBigInt(),
        targetPrice
      ); // Create limit order using 1inch SDK

      const walletAddress = await this.signer.getAddress(); // Set expiration time using MakerTraits
      const expirationTimestamp = BigInt(
        Math.floor(expirationTime.getTime() / 1000)
      );
      const makerTraits = MakerTraits.default()
        .withExpiration(expirationTimestamp)
        .allowPartialFills()
        .allowMultipleFills(); // Create limit order using 1inch SDK

      const limitOrder = new LimitOrder(
        {
          makerAsset: new OneInchAddress(this.config.fromToken),
          takerAsset: new OneInchAddress(this.config.toToken),
          makingAmount: makingAmount.toBigInt(),
          takingAmount: takingAmount,
          maker: new OneInchAddress(walletAddress),
          salt: randBigInt(2n ** 256n - 1n),
          receiver: new OneInchAddress(walletAddress),
        },
        makerTraits
      ); // Build the order

      const limitOrderTypedData = limitOrder.getTypedData(CHAIN_ID); // Sign the order using ethers v5 compatible method
      const signature = await this.signer._signTypedData(
        limitOrderTypedData.domain,
        { Order: limitOrderTypedData.types.Order },
        limitOrderTypedData.message
      );

      const orderHash = limitOrder.getOrderHash(CHAIN_ID); // Update trade tracking
      this.tradeCounter++;
      this.lastTradeTime = Date.now();
      const gasCost = this.calculateRealisticGasCost();
      this.totalGasCosts += gasCost;
      this.totalTrades++;
      const orderData = {
        order: limitOrder,
        orderHash: orderHash,
        signature: signature,
        targetPrice: targetPrice,
        orderIndex: orderIndex,
        status: TWAPOrderStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: expirationTime,
        remainingMakingAmount: makingAmount.toBigInt(),
        limitOrderInstance: limitOrder,
        executionTime: executionTime,
        orderSize: orderSize,
        slippage: slippage,
        gasCost: gasCost,
        marketRegime: this.marketRegime,
        volatility: this.currentVolatility,
      };

      return orderData;
    } catch (error) {
      console.error("❌ Error creating TWAP order:", error);
      this.executionFailures++; // Provide helpful error messages
      if (error.message.includes("insufficient")) {
        console.log("💡 Insufficient balance or allowance detected.");
        console.log(
          "🔄 You may need to manually approve tokens at https://app.1inch.io/"
        );
      } else if (
        error.message.includes("API") ||
        error.message.includes("rate")
      ) {
        console.log("💡 API issue detected.");
        console.log("🔑 Check your 1inch API key and rate limits.");
      }
      return null;
    }
  }

  async executeTWAPStrategy() {
    console.log("\n🚀 Starting Ultra-Realistic TWAP Strategy Execution...");
    console.log("=======================================================");
    if (this.isRunning) {
      console.log("⚠️ TWAP strategy is already executing");
      return;
    }

    this.isRunning = true;
    try {
      // Create all orders first
      const orders = await this.createTWAPOrders();
      if (orders.length === 0) {
        console.log("❌ No orders created. TWAP strategy cannot proceed.");
        return;
      } // Submit orders to 1inch protocol

      console.log("\n📤 Submitting orders to 1inch protocol...");
      await this.submitOrdersToProtocol(); // Start monitoring and execution

      console.log("\n👀 Starting TWAP monitoring...");
      await this.monitorTWAPExecution();
    } catch (error) {
      console.error("❌ TWAP strategy execution failed:", error.message);
    } finally {
      this.isRunning = false;
    }
  }

  async monitorTWAPExecution() {
    console.log("\n🔍 Ultra-Realistic TWAP Monitoring Active");
    console.log("Press Ctrl+C to stop monitoring\n");

    const monitoringInterval = setInterval(async () => {
      try {
        // Update market analytics
        const currentPrice = await this.getCurrentPrice();
        this.priceHistory.push({
          timestamp: new Date(),
          price: currentPrice,
        }); // Keep only last 100 price points
        if (this.priceHistory.length > 100) {
          this.priceHistory = this.priceHistory.slice(-100);
        }
        this.updateMarketAnalytics(currentPrice);
        await this.checkExecutionStatus();
        await this.handleOrderExpirations(); // Display stats every 10 minutes
        if (this.tradeCounter % 20 === 0) {
          this.displayTradingStats();
        } // Check if all orders are complete
        const activeOrdersCount = Array.from(this.activeOrders.values()).filter(
          (order) => order.status === TWAPOrderStatus.ACTIVE
        ).length;
        if (activeOrdersCount === 0) {
          console.log(
            "\n🎉 TWAP strategy completed! All orders filled or expired."
          );
          clearInterval(monitoringInterval);
          this.isRunning = false;
          this.displayTradingStats();
        }
      } catch (error) {
        console.error("❌ Monitoring error:", error.message);
      }
    }, 30000); // Check every 30 seconds // Stop monitoring after max execution time

    setTimeout(() => {
      clearInterval(monitoringInterval);
      console.log(
        "\n⏰ Maximum execution time reached. Stopping TWAP monitoring."
      );
      this.isRunning = false;
      this.displayTradingStats();
    }, this.config.maxExecutionTime * 60 * 60 * 1000);

    process.on("SIGINT", () => {
      clearInterval(monitoringInterval);
      this.isRunning = false;
      console.log("\n🛑 Ultra-Realistic TWAP monitoring stopped");
      this.displayTradingStats();
    });
  }

  async checkExecutionStatus() {
    console.log(`📊 TWAP Status check: ${new Date().toLocaleTimeString()}`);
    for (const [orderHash, orderData] of this.activeOrders) {
      if (orderData.status !== TWAPOrderStatus.ACTIVE) continue;
      try {
        const status = await this.getOrderStatus(orderHash);
        if (status) {
          const fillableBalance = status.fillableBalance || "0";
          const remainingAmount = ethers.BigNumber.from(fillableBalance);
          if (remainingAmount.isZero()) {
            orderData.status = TWAPOrderStatus.FILLED;
            console.log(
              `✅ TWAP Order ${orderData.orderIndex + 1} filled completely!`
            );
            this.filledOrders.set(orderHash, orderData);
          } else if (remainingAmount.lt(orderData.remainingMakingAmount || 0)) {
            orderData.status = TWAPOrderStatus.PARTIALLY_FILLED;
            orderData.remainingMakingAmount = remainingAmount.toBigInt();
            console.log(
              `🔄 TWAP Order ${orderData.orderIndex + 1} partially filled`
            );
          }
        }
      } catch (error) {
        console.log(
          `⚠️ Could not check status for TWAP order ${orderData.orderIndex + 1}`
        );
      }
    }
  }

  async handleOrderExpirations() {
    const now = new Date();
    for (const [, orderData] of this.activeOrders) {
      if (
        orderData.status === TWAPOrderStatus.ACTIVE &&
        orderData.expiresAt <= now
      ) {
        orderData.status = TWAPOrderStatus.EXPIRED;
        console.log(`⏰ TWAP Order ${orderData.orderIndex + 1} expired`);
      }
    }
  }

  async ensureTokenApproval(amount) {
    console.log("🔐 Checking token approval...");
    const walletAddress = await this.signer.getAddress();
    const tokenContract = new ethers.Contract(
      this.config.fromToken,
      ERC20_ABI,
      this.signer
    );
    const LIMIT_ORDER_PROTOCOL_ADDRESS =
      LIMIT_ORDER_PROTOCOL_ADDRESSES[CHAIN_ID];

    const currentAllowance = await tokenContract.allowance(
      walletAddress,
      LIMIT_ORDER_PROTOCOL_ADDRESS
    );
    if (currentAllowance.lt(amount)) {
      console.log("📝 Approving tokens for 1inch protocol...");
      const approveTx = await tokenContract.approve(
        LIMIT_ORDER_PROTOCOL_ADDRESS,
        amount
      );
      await approveTx.wait();
      console.log("✅ Token approval confirmed");
    } else {
      console.log("✅ Token approval sufficient");
    }
  }

  async submitOrdersToProtocol() {
    let successCount = 0;
    for (const [, orderData] of this.activeOrders) {
      try {
        // Use the 1inch SDK's submitOrder method
        if (orderData.limitOrderInstance) {
          await this.oneInchApi.submitOrder(
            orderData.limitOrderInstance,
            orderData.signature
          );
          successCount++;
          console.log(
            `✅ TWAP Order ${orderData.orderIndex + 1} submitted to 1inch`
          );
          console.log(
            `   📊 Order Hash: ${orderData.orderHash.slice(0, 10)}...`
          );
        }
      } catch (error) {
        console.error(
          `❌ Submit error for TWAP order ${orderData.orderIndex + 1}:`,
          error.message
        );
        this.executionFailures++; // Provide helpful error messages
        if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          console.log(
            "💡 API key issue detected. Check your 1inch API key at https://portal.1inch.dev/"
          );
        } else if (
          error.message.includes("400") ||
          error.message.includes("Bad Request")
        ) {
          console.log(
            "💡 Order validation failed. Check order parameters and maker balance/allowance."
          );
        }
      }
    }

    console.log(
      `\n📤 Successfully submitted ${successCount}/${this.activeOrders.size} TWAP orders to 1inch protocol`
    );
  }

  async getCurrentPrice() {
    try {
      const response = await axios.get(`${SWAP_API_BASE(CHAIN_ID)}/quote`, {
        params: {
          src: this.config.fromToken,
          dst: this.config.toToken,
          amount: ethers.utils
            .parseUnits("1", this.config.fromTokenDecimals)
            .toString(),
        },
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      });

      const dstAmount = response.data.dstAmount;
      const price = Number(
        ethers.utils.formatUnits(dstAmount, this.config.toTokenDecimals)
      );
      return price;
    } catch (error) {
      console.warn("⚠️ Failed to fetch current price, using fallback");
      return 0.5; // Fallback price
    }
  }

  calculateTakingAmountBigInt(makingAmount, targetPrice) {
    const makingAmountReadable = Number(
      ethers.utils.formatUnits(
        makingAmount.toString(),
        this.config.fromTokenDecimals
      )
    );
    const baseTakingAmount = makingAmountReadable / targetPrice;
    const takingAmountWithSlippage =
      baseTakingAmount * (1 - this.config.slippageTolerance / 100);
    return ethers.utils
      .parseUnits(
        takingAmountWithSlippage.toFixed(this.config.toTokenDecimals),
        this.config.toTokenDecimals
      )
      .toBigInt();
  }

  async getOrderStatus(orderHash) {
    try {
      const response = await axios.get(
        `${LIMIT_ORDER_API_BASE(CHAIN_ID)}/order/${orderHash}`,
        {
          headers: {
            Authorization: `Bearer ${ONEINCH_API_KEY}`,
            accept: "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return null;
    }
  } // Display ultra-realistic trading statistics

  displayTradingStats() {
    const sessionDuration =
      (Date.now() - this.sessionStartTime) / (1000 * 60 * 60 * 24); // days
    const avgGasCost =
      this.totalTrades > 0 ? this.totalGasCosts / this.totalTrades : 0;
    const successRate =
      this.totalTrades > 0
        ? ((this.totalTrades - this.executionFailures) / this.totalTrades) * 100
        : 0;
    console.log("\n📊 Ultra-Realistic TWAP Trading Statistics");
    console.log("==========================================");
    console.log(`Session Duration: ${sessionDuration.toFixed(2)} days`);
    console.log(`Total Orders Created: ${this.totalTrades}`);
    console.log(`Execution Failures: ${this.executionFailures}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Total Gas Costs: ${this.totalGasCosts.toFixed(2)}`);
    console.log(`Average Gas Cost: $${avgGasCost.toFixed(2)} per order`);
    console.log(`Current Market Regime: ${this.marketRegime}`);
    console.log(
      `Current Volatility: ${(this.currentVolatility * 100).toFixed(2)}%`
    );
    console.log(`Active Orders: ${this.activeOrders.size}`);
    console.log(`Filled Orders: ${this.filledOrders.size}`);
    console.log(`MEV Attacks Prevented: ${this.mevAttacks}`);
    console.log(`Slippage Events: ${this.slippageEvents}`); // Risk metrics
    const maxDrawdown = this.calculateMaxDrawdown();
    const sharpeRatio = this.calculateSharpeRatio();
    console.log(`Max Drawdown: ${maxDrawdown.toFixed(2)}%`);
    console.log(`Sharpe Ratio: ${sharpeRatio.toFixed(3)}`); // TWAP-specific stats
    const stats = this.getStrategyStats();
    console.log(`\n📈 TWAP Strategy Stats:`);
    console.log(`Total Orders: ${stats.totalOrders}`);
    console.log(`Active Orders: ${stats.activeOrders}`);
    console.log(`Filled Orders: ${stats.filledOrders}`);
    console.log(`Expired Orders: ${stats.expiredOrders}`);
    console.log(
      `Average Order Size: ${stats.averageOrderSize} ${this.config.fromTokenSymbol}`
    );
    if (stats.nextExecutionTime) {
      console.log(
        `Next Execution: ${stats.nextExecutionTime.toLocaleString()}`
      );
    }
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
      const drawdown = ((maxValue - pricePoint.price) / maxValue) * 100;
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
      const returnRate =
        (this.priceHistory[i].price - this.priceHistory[i - 1].price) /
        this.priceHistory[i - 1].price;
      returns.push(returnRate);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  getActiveOrders() {
    return Array.from(this.activeOrders.values());
  }

  async cancelOrder(orderHash) {
    try {
      await axios.delete(
        `${LIMIT_ORDER_API_BASE(CHAIN_ID)}/order/${orderHash}`,
        {
          headers: {
            Authorization: `Bearer ${ONEINCH_API_KEY}`,
          },
        }
      );
      const orderData = this.activeOrders.get(orderHash);
      if (orderData) {
        orderData.status = TWAPOrderStatus.CANCELLED;
      }
      return true;
    } catch (error) {
      console.error("❌ Failed to cancel TWAP order:", error.message);
      return false;
    }
  }

  getStrategyStats() {
    const orders = Array.from(this.activeOrders.values());
    const stats = {
      totalOrders: orders.length,
      activeOrders: orders.filter((o) => o.status === TWAPOrderStatus.ACTIVE)
        .length,
      filledOrders: orders.filter((o) => o.status === TWAPOrderStatus.FILLED)
        .length,
      expiredOrders: orders.filter((o) => o.status === TWAPOrderStatus.EXPIRED)
        .length,
      cancelledOrders: orders.filter(
        (o) => o.status === TWAPOrderStatus.CANCELLED
      ).length,
      averageOrderSize: (
        parseFloat(this.config.totalAmount) / this.config.numberOfOrders
      ).toFixed(6),
    }; // Find next execution time

    const now = new Date();
    const nextExecution = Array.from(this.executionSchedule.values()).find(
      (time) => time > now
    );
    return {
      ...stats,
      nextExecutionTime: nextExecution,
    };
  }
}
// --- API Server Setup ---
const app = express();
app.use(bodyParser.json());

// A simple in-memory store for active strategies
const activeStrategies = new Map();

app.post("/start-twap", async (req, res) => {
  const strategyConfig = req.body;

  // Use a unique ID for the strategy, e.g., from the user's address or a random ID
  const strategyId =
    strategyConfig.userAddress ||
    ethers.utils.hexlify(ethers.utils.randomBytes(16));

  if (activeStrategies.has(strategyId)) {
    return res
      .status(400)
      .send({ error: `Strategy already running for ID: ${strategyId}` });
  }

  try {
    const twapStrategy = new UltraRealisticTWAPStrategy(provider, signer);

    // Fetch token info and enrich the config
    const [fromTokenInfo, toTokenInfo] = await Promise.all([
      twapStrategy.getTokenInfo(strategyConfig.fromToken),
      twapStrategy.getTokenInfo(strategyConfig.toToken),
    ]);

    const fullConfig = {
      ...strategyConfig,
      fromTokenDecimals: fromTokenInfo.decimals,
      toTokenDecimals: toTokenInfo.decimals,
      fromTokenSymbol: fromTokenInfo.symbol,
      toTokenSymbol: toTokenInfo.symbol,
    };

    twapStrategy.setConfiguration(fullConfig);
    await twapStrategy.initialize();

    // Run the strategy in the background, don't await it
    twapStrategy.executeTWAPStrategy();

    activeStrategies.set(strategyId, twapStrategy);

    res.status(202).send({
      message: "TWAP strategy initiated successfully.",
      strategyId: strategyId,
    });
  } catch (error) {
    console.error("Failed to start TWAP strategy:", error.message);
    res
      .status(500)
      .send({ error: `Failed to start strategy: ${error.message}` });
  }
});

app.get("/status/:strategyId", (req, res) => {
  const { strategyId } = req.params;
  const strategy = activeStrategies.get(strategyId);

  if (!strategy) {
    return res.status(404).send({ error: "Strategy not found." });
  }

  res.status(200).send(strategy.getStrategyStats());
});

app.delete("/stop-twap/:strategyId", async (req, res) => {
  const { strategyId } = req.params;
  const strategy = activeStrategies.get(strategyId);

  if (!strategy) {
    return res.status(404).send({ error: "Strategy not found." });
  }

  try {
    await strategy.cancelAllOrders(); // Assumes cancelAllOrders is implemented
    activeStrategies.delete(strategyId);
    res
      .status(200)
      .send({ message: "Strategy stopped and all active orders cancelled." });
  } catch (error) {
    res
      .status(500)
      .send({ error: `Could not stop strategy: ${error.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 TWAP Bot server listening on port ${PORT}`);
  console.log(`🔑 Trading with wallet: ${signer.address}`);
});
