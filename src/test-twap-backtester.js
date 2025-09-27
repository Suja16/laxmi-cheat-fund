#!/usr/bin/env node

import { MultiAssetTWAPBacktester } from './twap-backtester.js';

async function runTWAPBacktest() {
  console.log('🚀 Starting TWAP Backtester Demo');
  console.log('==================================\n');
  
  try {
    const backtester = new MultiAssetTWAPBacktester();
    await backtester.runBacktests();
    
    console.log('\n✅ TWAP Backtest completed successfully!');
    console.log('📁 Check the src/backtest-reports/ directory for detailed results');
    
  } catch (error) {
    console.error('❌ Backtest failed:', error.message);
    console.error(error.stack);
  }
}

// Run the demo
runTWAPBacktest();
