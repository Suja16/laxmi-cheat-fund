#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { OffChainOrchestrator } from './src/offChainOrchestrator.js';
import { STRATEGIES } from './src/config.js';

dotenv.config();

/**
 * Example: Off-Chain Orchestrator for VolatilityGridStrategy
 * This demonstrates how to run the strategy as an off-chain orchestrator
 * that manages on-chain orders through the 1inch protocol.
 */
async function main() {
  console.log('🎯 Off-Chain VolatilityGridStrategy Orchestrator');
  console.log('===============================================\n');
  
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
    
    // Create orchestrator
    const orchestrator = new OffChainOrchestrator(provider, signer);
    
    // Set up configuration
    const config = STRATEGIES['1']; // Use conservative strategy
    orchestrator.setConfiguration(config);
    
    console.log('\n📋 Orchestrator Configuration:');
    console.log(`  Strategy: ${config.name}`);
    console.log(`  Pair: ${config.baseToken.symbol}/${config.quoteToken.symbol}`);
    console.log(`  Base Amount: ${config.totalBaseAmount} ${config.baseToken.symbol}`);
    console.log(`  Quote Amount: ${config.totalQuoteAmount} ${config.quoteToken.symbol}`);
    console.log(`  Grid Levels: ${config.gridLevels}`);
    console.log(`  Price Range: ${config.priceRangePercent}%`);
    
    // Initialize orchestrator
    await orchestrator.initialize();
    
    // Start orchestrator
    await orchestrator.startOrchestrator();
    
    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down orchestrator...');
      await orchestrator.stopOrchestrator();
      process.exit(0);
    });
    
    // Keep the process running
    console.log('\n✅ Orchestrator is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Orchestrator failed:', error);
    process.exit(1);
  }
}

// Run the orchestrator
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { OffChainOrchestrator };
