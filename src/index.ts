import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import * as readline from 'readline';
import { STRATEGIES } from './config.js';
import { OffChainOrchestrator } from './offChainOrchestrator.js';
import { Backtester } from './backtester.js';
import { StrategyType } from './types.js';

dotenv.config();

class App {
    private signer: ethers.Wallet;

    constructor() {
        const rpcUrl = process.env.RPC_URL!;
        const privateKey = process.env.PRIVATE_KEY!;
        if (!rpcUrl || !privateKey) throw new Error("RPC_URL and PRIVATE_KEY must be set in .env");
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(privateKey, provider);
        console.log(`Connected to Polygon with wallet: ${this.signer.address}`);
    }

    private async askQuestion(query: string): Promise<string> {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans.trim().toUpperCase());
        }));
    }

    public async run() {
        while(true) {
            console.log("\n--- 🔱 Laxmi Protocol CLI (Polygon) ---");
            const choice = await this.askQuestion("Choose an option:\n L. Run LIVE Strategy\n B. Run a BACKTEST\n Q. Quit\n> ");
            if (choice === 'L') await this.runLiveMode();
            else if (choice === 'B') await this.runBacktestMode();
            else if (choice === 'Q') {
                console.log("Exiting.");
                break;
            } else {
                console.log("Invalid choice.");
            }
        }
    }

    private async runLiveMode() {
        console.log("\n--- Available LIVE Strategies ---");
        Object.keys(STRATEGIES).forEach(key => console.log(` ${key}. ${STRATEGIES[key]!.name}`));
        const choice = await this.askQuestion("> ");
        
        const config = STRATEGIES[choice];
        if (!config) return console.log("Invalid choice.");

        if (config.strategyType === StrategyType.GRID) {
            const orchestrator = new OffChainOrchestrator(this.signer.provider, this.signer);
            orchestrator.setConfig(config);
            await orchestrator.run();
        }
    }

    private async runBacktestMode() {
        console.log("\n--- BACKTEST: Select Strategy ---");
        Object.keys(STRATEGIES).forEach(key => {
            const strategy = STRATEGIES[key];
            if (strategy && strategy.strategyType === StrategyType.GRID) {
                console.log(` ${key}. ${strategy.name}`);
            }
        });
        const choice = await this.askQuestion("> ");
        const config = STRATEGIES[choice];
        if (!config) return console.log("Invalid choice.");

        const orchestrator = new OffChainOrchestrator(this.signer.provider, this.signer);
        orchestrator.setConfig(config);

        const backtester = new Backtester(orchestrator);
        const allResults = [];
        for (const period of [7, 30, 180] as const) {
            await backtester.fetchHistoricalData(period);
            const result = await backtester.run(1000, 1000); // Start with $1k base, $1k quote
            allResults.push(result);
        }

        console.log('\n--- 📊 BACKTEST PERFORMANCE SUMMARY ---');
        allResults.forEach(result => {
             console.log(`Period: ${result.periodDays.toFixed(0)} Days | Return: ${result.percentageReturn.toFixed(2)}% | Trades: ${result.tradeCount}`);
        });
    }
}

const app = new App();
app.run();