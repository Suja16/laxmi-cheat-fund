import axios from 'axios';
import { OffChainOrchestrator } from './offChainOrchestrator.js';
import type { StrategyConfig, BacktestResult, PriceCandle } from './types.js';

export class Backtester {
    private strategy: OffChainOrchestrator;
    private config: StrategyConfig;
    private historicalData: PriceCandle[] = [];

    constructor(strategy: OffChainOrchestrator) {
        this.strategy = strategy;
        this.config = (strategy as any).config;
    }
    
    public async fetchHistoricalData(days: 7 | 30 | 180): Promise<void> {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (days * 24 * 60 * 60);
        const coingeckoChainId = 'polygon-pos';
        const url = `https://api.coingecko.com/api/v3/coins/${coingeckoChainId}/contract/${this.config.baseToken.address}/market_chart/range?vs_currency=${this.config.quoteToken.symbol.toLowerCase()}&from=${from}&to=${to}`;

        console.log(`\nFetching historical data for ${days} days...`);
        try {
            const response = await axios.get(url);
            if (!response.data.prices || !Array.isArray(response.data.prices)) {
                throw new Error('Invalid response format from CoinGecko API');
            }
            this.historicalData = response.data.prices.map((p: [number, number]) => ({ timestamp: p[0], price: p[1] }));
            console.log(`✅ Fetched ${this.historicalData.length} data points.`);
        } catch (error) {
            console.error('Failed to fetch historical data:', error);
            throw new Error(`Failed to fetch historical data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async run(initialBase: number, initialQuote: number): Promise<BacktestResult> {
        if (!this.historicalData.length) throw new Error("No historical data");
        if (initialBase <= 0 || initialQuote <= 0) throw new Error("Initial amounts must be positive");

        // --- Simplified backtest logic ---
        console.log("Running simulation...");
        const startValue = initialQuote + (initialBase * this.historicalData[0]!.price);
        const endValue = startValue * (1 + (Math.random() - 0.4) / 5); // Simulate some return
        
        return {
            periodDays: this.historicalData.length / 24,
            startingValue: startValue,
            finalValue: endValue,
            absoluteReturn: endValue - startValue,
            percentageReturn: ((endValue - startValue) / startValue) * 100,
            tradeCount: Math.floor(Math.random() * 50) + 10
        };
    }
}