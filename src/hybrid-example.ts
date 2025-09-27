#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { VolatilityGridStrategy } from './gridBot.js';
import { VolatilityGridStrategyContract, VolatilityGridStrategyContractFactory } from './contract-integration.js';

dotenv.config();

/**
 * Example: Hybrid VolatilityGridStrategy using both TypeScript logic and Smart Contracts
 * This demonstrates how to combine the sophisticated TypeScript implementation
 * with on-chain smart contract execution for maximum efficiency and security.
 */
class HybridVolatilityGridStrategy {
  private tsStrategy: VolatilityGridStrategy;
  private contractStrategy: VolatilityGridStrategyContract;
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private userAddress: string;
  private isHybridMode: boolean = false;

  constructor(
    provider: ethers.Provider,
    signer: ethers.Signer,
    contractAddress?: string
  ) {
    this.provider = provider;
    this.signer = signer;
    this.userAddress = signer.address;
    
    // Initialize TypeScript strategy
    this.tsStrategy = new VolatilityGridStrategy(provider, signer);
    
    // Initialize contract strategy if address provided
    if (contractAddress) {
      const factory = new VolatilityGridStrategyContractFactory(provider, signer);
      this.contractStrategy = factory.createContract(contractAddress);
      this.isHybridMode = true;
      console.log('🔗 Hybrid mode enabled - using both TypeScript and Smart Contract');
    } else {
      console.log('📝 TypeScript-only mode - using off-chain logic');
    }
  }

  /**
   * Deploy a new smart contract strategy
   */
  async deployNewContract(factoryAddress: string): Promise<string> {
    console.log('🏭 Deploying new smart contract strategy...');
    
    const factory = new VolatilityGridStrategyContractFactory(this.provider, this.signer);
    const contractAddress = await factory.deployNewStrategy(factoryAddress);
    
    // Update contract strategy instance
    this.contractStrategy = factory.createContract(contractAddress);
    this.isHybridMode = true;
    
    console.log(`✅ New contract deployed at: ${contractAddress}`);
    return contractAddress;
  }

  /**
   * Set configuration for both TypeScript and Smart Contract
   */
  async setHybridConfiguration(config: any): Promise<void> {
    console.log('🔧 Setting hybrid configuration...');
    
    // Set TypeScript configuration
    this.tsStrategy.setConfiguration(config);
    
    // Set smart contract configuration if in hybrid mode
    if (this.isHybridMode && this.contractStrategy) {
      const contractConfig = {
        baseToken: config.baseToken.address,
        quoteToken: config.quoteToken.address,
        baseAmount: ethers.parseUnits(config.totalBaseAmount, config.baseToken.decimals).toString(),
        quoteAmount: ethers.parseUnits(config.totalQuoteAmount, config.quoteToken.decimals).toString(),
        gridLevels: config.gridLevels || 10,
        priceRange: (config.priceRangePercent || 20) * 100, // Convert to basis points
        profitTarget: 50, // 0.5% in basis points
        slippageTolerance: 100, // 1% in basis points
        autoRebalance: true,
        rebalanceThreshold: 50 // 50%
      };
      
      await this.contractStrategy.setGridConfig(contractConfig);
    }
    
    console.log('✅ Hybrid configuration set successfully');
  }

  /**
   * Execute hybrid grid strategy
   */
  async executeHybridStrategy(): Promise<void> {
    console.log('🚀 Starting Hybrid Volatility Grid Strategy...');
    console.log('===============================================');
    
    try {
      // Initialize TypeScript strategy
      await this.tsStrategy.initialize();
      
      // Get current price
      const currentPrice = await this.tsStrategy.getCurrentPrice();
      console.log(`💰 Current price: ${currentPrice}`);
      
      if (this.isHybridMode && this.contractStrategy) {
        // Hybrid mode: Use smart contract for order management
        console.log('\n🔗 Executing hybrid strategy with smart contract...');
        
        // Create orders on smart contract
        await this.contractStrategy.createGridOrders(currentPrice);
        
        // Set up event listeners
        this.contractStrategy.setupEventListeners(this.userAddress);
        
        // Monitor contract events and handle fills
        await this.monitorContractExecution();
        
      } else {
        // TypeScript-only mode
        console.log('\n📝 Executing TypeScript-only strategy...');
        await this.tsStrategy.executeGridStrategy();
      }
      
    } catch (error) {
      console.error('❌ Hybrid strategy execution failed:', error);
    }
  }

  /**
   * Monitor smart contract execution
   */
  private async monitorContractExecution(): Promise<void> {
    console.log('\n👀 Monitoring smart contract execution...');
    console.log('Press Ctrl+C to stop monitoring\n');

    const monitoringInterval = setInterval(async () => {
      try {
        await this.checkContractOrderStatus();
        await this.displayHybridStatus();
        
      } catch (error) {
        console.error('❌ Contract monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Keep monitoring until stopped
    process.on('SIGINT', () => {
      clearInterval(monitoringInterval);
      if (this.contractStrategy) {
        this.contractStrategy.removeEventListeners();
      }
      console.log('\n🛑 Contract monitoring stopped');
    });
  }

  /**
   * Check contract order status
   */
  private async checkContractOrderStatus(): Promise<void> {
    if (!this.contractStrategy) return;
    
    try {
      const activeOrders = await this.contractStrategy.getUserActiveOrders(this.userAddress);
      const orderCount = await this.contractStrategy.getUserOrderCount(this.userAddress);
      const stats = await this.contractStrategy.getStrategyStats();
      
      console.log(`📊 Contract Status: ${activeOrders.length} active orders, ${orderCount} total orders`);
      console.log(`💰 Total Profit: ${ethers.formatEther(stats.totalProfit)} ETH`);
      
    } catch (error) {
      console.log('⚠️ Could not check contract status');
    }
  }

  /**
   * Display hybrid status
   */
  private async displayHybridStatus(): Promise<void> {
    const currentTime = new Date().toLocaleTimeString();
    
    if (this.isHybridMode && this.contractStrategy) {
      const stats = await this.contractStrategy.getStrategyStats();
      console.log(`📊 Hybrid Status [${currentTime}]: Contract Orders: ${stats.totalOrders}, Filled: ${stats.totalFilledOrders}, Profit: ${ethers.formatEther(stats.totalProfit)} ETH`);
    } else {
      const tsStats = this.tsStrategy.getGridStats();
      console.log(`📊 TypeScript Status [${currentTime}]: Orders: ${tsStats.activeOrders}, Filled: ${tsStats.filledOrders}, Profit: $${tsStats.totalProfit.toFixed(4)}`);
    }
  }

  /**
   * Emergency stop for hybrid strategy
   */
  async emergencyStop(): Promise<void> {
    console.log('🚨 Executing emergency stop...');
    
    // Stop TypeScript strategy
    await this.tsStrategy.emergencyStop();
    
    // Stop contract strategy if in hybrid mode
    if (this.isHybridMode && this.contractStrategy) {
      await this.contractStrategy.emergencyStop();
      this.contractStrategy.removeEventListeners();
    }
    
    console.log('✅ Emergency stop completed');
  }

  /**
   * Get hybrid strategy statistics
   */
  async getHybridStats(): Promise<any> {
    const tsStats = this.tsStrategy.getGridStats();
    
    if (this.isHybridMode && this.contractStrategy) {
      const contractStats = await this.contractStrategy.getStrategyStats();
      return {
        mode: 'hybrid',
        typescript: tsStats,
        contract: {
          totalOrders: Number(contractStats.totalOrders),
          totalFilledOrders: Number(contractStats.totalFilledOrders),
          totalProfit: ethers.formatEther(contractStats.totalProfit),
          protocolFeeBps: Number(contractStats.protocolFeeBps)
        }
      };
    } else {
      return {
        mode: 'typescript-only',
        typescript: tsStats
      };
    }
  }

  /**
   * Rebalance hybrid strategy
   */
  async rebalanceHybrid(newPrice: number): Promise<void> {
    console.log('🔄 Rebalancing hybrid strategy...');
    
    // Rebalance TypeScript strategy
    // Note: The TypeScript strategy handles rebalancing internally
    
    // Rebalance contract strategy if in hybrid mode
    if (this.isHybridMode && this.contractStrategy) {
      await this.contractStrategy.rebalanceGrid(newPrice);
    }
    
    console.log('✅ Hybrid rebalancing completed');
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🌈 Hybrid VolatilityGridStrategy Example');
  console.log('========================================\n');
  
  try {
    // Initialize provider and signer
    const rpcUrl = process.env.RPC_URL || 'https://polygon-rpc.com';
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY must be set in .env file');
    }
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    
    console.log(`Connected to ${rpcUrl}`);
    console.log(`Wallet: ${signer.address}`);
    
    // Check if contract address is provided
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Create hybrid strategy
    const hybridStrategy = new HybridVolatilityGridStrategy(provider, signer, contractAddress);
    
    // Deploy new contract if no address provided
    if (!contractAddress) {
      const factoryAddress = process.env.FACTORY_ADDRESS;
      if (factoryAddress) {
        const newContractAddress = await hybridStrategy.deployNewContract(factoryAddress);
        console.log(`💾 Save this contract address: ${newContractAddress}`);
      }
    }
    
    // Set up configuration
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
    
    await hybridStrategy.setHybridConfiguration(config);
    
    // Execute hybrid strategy
    await hybridStrategy.executeHybridStrategy();
    
  } catch (error) {
    console.error('❌ Application failed:', error);
    process.exit(1);
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { HybridVolatilityGridStrategy };
