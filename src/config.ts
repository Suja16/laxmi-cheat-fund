import type { StrategyConfig, TokenInfo } from './types.js';
import { StrategyType } from './types.js';

export const POLYGON_TOKENS: Record<string, TokenInfo> = {
    'WETH': { address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', symbol: 'WETH', decimals: 18, name: 'Wrapped Ether' },
    'USDC': { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d59', symbol: 'USDC', decimals: 6, name: 'USD Coin (PoS)' }
};

export const STRATEGIES: Record<string, StrategyConfig> = {
    '1': {
        name: 'Conservative WETH/USDC Grid on Polygon',
        description: 'A tight grid for profiting from low volatility.',
        baseToken: POLYGON_TOKENS['WETH']!,
        quoteToken: POLYGON_TOKENS['USDC']!,
        strategyType: StrategyType.GRID,
        totalBaseAmount: "0.1",
        totalQuoteAmount: "300",
        gridLevels: 10,
        priceRangePercent: 10,
    },
    '2': {
        name: 'Aggressive WETH/USDC Grid on Polygon',
        description: 'A wide grid for profiting from high volatility.',
        baseToken: POLYGON_TOKENS['WETH']!,
        quoteToken: POLYGON_TOKENS['USDC']!,
        strategyType: StrategyType.GRID,
        totalBaseAmount: "0.5",
        totalQuoteAmount: "1500",
        gridLevels: 20,
        priceRangePercent: 25,
    }
};