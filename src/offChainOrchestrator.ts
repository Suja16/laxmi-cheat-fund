#!/usr/bin/env node

import { ethers } from 'ethers';
import { ethersCompat } from './ethers-compat.js';
import axios from 'axios';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { Api, FetchProviderConnector, LimitOrder, MakerTraits, Address as OneInchAddress, randBigInt } from '@1inch/limit-order-sdk';

// Import types
import type {
    StrategyConfig,
    OrderData,
    ValidationResult,
    OneInchOrderInfo
} from './types.js';
import {
    LIMIT_ORDER_PROTOCOL_ADDRESSES,
    SWAP_API_BASE,
    LIMIT_ORDER_API_BASE,
    OrderStatus
} from './types.js';

// Load environment variables
dotenv.config();

// Off-chain orchestrator configuration
interface OrchestratorConfig {
    baseToken: string;
    quoteToken: string;
    baseAmount: string;
    quoteAmount: string;
    gridLevels: number;
    priceRange: number;
    currentPrice: number;
    slippageTolerance: number;
    gasPrice: string;
    baseTokenDecimals: number;
    quoteTokenDecimals: number;
    baseTokenSymbol: string;
    quoteTokenSymbol: string;
    rebalanceThreshold: number;
    autoRebalance: boolean;
    profitTarget: number;
    // Orchestrator-specific settings
    monitoringInterval: number; // seconds
    maxRetries: number;
    retryDelay: number; // seconds
    priceUpdateInterval: number; // seconds
    orderExpirationDays: number;
}

// Grid order types
enum GridOrderType {
    BUY = 'BUY',
    SELL = 'SELL'
}

interface OrchestratorOrderData extends OrderData {
    gridType: GridOrderType;
    gridLevel: number;
    triggerPrice: number;
    pairOrderHash?: string;
    retryCount: number;
    lastRetryAt?: Date;
    orchestratorId: string; // Unique ID for orchestrator tracking
}

// 1inch API Configuration
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY || 'dyqTRYbTBcOMYmZitPfJ9FP2j1dQVgBv';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '137');
const LIMIT_ORDER_PROTOCOL_ADDRESS = LIMIT_ORDER_PROTOCOL_ADDRESSES[CHAIN_ID];

const ERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function decimals() external view returns (uint8)',
    'function symbol() external view returns (string)'
];

export class OffChainOrchestrator {
    private provider: any;
    private signer: any;
    private oneInchApi: Api;
    private activeOrders: Map<string, OrchestratorOrderData>;
    private config: OrchestratorConfig;
    private isRunning: boolean = false;
    private gridLevels: Map<number, { buyPrice: number; sellPrice: number }> = new Map();
    private filledOrders: Map<string, OrchestratorOrderData> = new Map();
    private profits: number = 0;
    private monitoringTimer?: NodeJS.Timeout;
    private priceUpdateTimer?: NodeJS.Timeout;
    private orderCounter: number = 0;

    constructor(provider: any, signer: any) {
        this.provider = provider;
        this.signer = signer;
        
        // Initialize 1inch SDK API
        this.oneInchApi = new Api({
            networkId: CHAIN_ID,
            authKey: ONEINCH_API_KEY,
            httpConnector: new FetchProviderConnector()
        });
        
        this.activeOrders = new Map();
        this.config = {} as OrchestratorConfig;
    }

    /**
     * Set orchestrator configuration
     */
    public setConfiguration(config: StrategyConfig): void {
        this.config = {
            baseToken: config.baseToken.address,
            quoteToken: config.quoteToken.address,
            baseAmount: config.totalBaseAmount,
            quoteAmount: config.totalQuoteAmount,
            gridLevels: config.gridLevels || 10,
            priceRange: config.priceRangePercent || 20,
            currentPrice: 0,
            slippageTolerance: 1,
            gasPrice: 'auto',
            baseTokenDecimals: config.baseToken.decimals,
            quoteTokenDecimals: config.quoteToken.decimals,
            baseTokenSymbol: config.baseToken.symbol,
            quoteTokenSymbol: config.quoteToken.symbol,
            rebalanceThreshold: 50,
            autoRebalance: true,
            profitTarget: 0.5,
            // Orchestrator-specific settings
            monitoringInterval: 30, // Check every 30 seconds
            maxRetries: 3,
            retryDelay: 60, // Wait 1 minute between retries
            priceUpdateInterval: 300, // Update price every 5 minutes
            orderExpirationDays: 30
        };
        
        console.log('🎯 Off-chain Orchestrator configuration set:');
        console.log(`  Pair: ${this.config.baseTokenSymbol}/${this.config.quoteTokenSymbol}`);
        console.log(`  Grid levels: ${this.config.gridLevels}`);
        console.log(`  Price range: ${this.config.priceRange}%`);
        console.log(`  Monitoring interval: ${this.config.monitoringInterval}s`);
        console.log(`  Price update interval: ${this.config.priceUpdateInterval}s`);
    }

    /**
     * Initialize the orchestrator
     */
    async initialize(): Promise<void> {
        console.log('🎯 Off-Chain Volatility Grid Orchestrator');
        console.log('==========================================\n');
        
        await this.validateConfiguration();
        console.log('\n✅ Orchestrator configuration validated successfully!');
        
        // Fetch current market price
        this.config.currentPrice = await this.getCurrentPrice();
        
        // Generate grid levels
        this.generateGridLevels();
        
        console.log('\n📋 Orchestrator Summary:');
        console.log(`  📊 Grid Levels: ${this.config.gridLevels}`);
        console.log(`  💰 Base Amount: ${this.config.baseAmount} ${this.config.baseTokenSymbol}`);
        console.log(`  💵 Quote Amount: ${this.config.quoteAmount} ${this.config.quoteTokenSymbol}`);
        console.log(`  📈 Price Range: ±${this.config.priceRange}%`);
        console.log(`  🎯 Current Price: ${this.config.currentPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
        console.log(`  🔄 Auto-rebalance: ${this.config.autoRebalance ? 'Enabled' : 'Disabled'}`);
        console.log(`  📈 Profit Target: ${this.config.profitTarget}%`);
        console.log(`  ⏱️  Monitoring: Every ${this.config.monitoringInterval}s`);
        console.log(`  🔄 Price Updates: Every ${this.config.priceUpdateInterval}s`);
    }

    /**
     * Generate grid price levels
     */
    public generateGridLevels(): void {
        const currentPrice = this.config.currentPrice;
        const priceRange = this.config.priceRange / 100;
        const gridLevels = this.config.gridLevels;
        
        const buyLevels = Math.floor(gridLevels / 2);
        const sellLevels = Math.ceil(gridLevels / 2);
        
        this.gridLevels.clear();
        
        console.log('\n📊 Grid Price Levels:');
        console.log('===================');
        
        // Generate sell levels (above current price)
        for (let i = 1; i <= sellLevels; i++) {
            const priceMultiplier = 1 + (priceRange * i / sellLevels);
            const sellPrice = currentPrice * priceMultiplier;
            const buyPrice = sellPrice * (1 - this.config.profitTarget / 100);
            
            this.gridLevels.set(i, { buyPrice, sellPrice });
            console.log(`  Level +${i}: Sell at ${sellPrice.toFixed(6)}, Buy at ${buyPrice.toFixed(6)}`);
        }
        
        // Generate buy levels (below current price)
        for (let i = 1; i <= buyLevels; i++) {
            const priceMultiplier = 1 - (priceRange * i / buyLevels);
            const buyPrice = currentPrice * priceMultiplier;
            const sellPrice = buyPrice * (1 + this.config.profitTarget / 100);
            
            this.gridLevels.set(-i, { buyPrice, sellPrice });
            console.log(`  Level -${i}: Buy at ${buyPrice.toFixed(6)}, Sell at ${sellPrice.toFixed(6)}`);
        }
    }

    /**
     * Validate configuration
     */
    private async validateConfiguration(): Promise<void> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Validate token addresses
            if (!ethersCompat.isAddress(this.config.baseToken)) {
                errors.push('Invalid base token address');
            }
            if (!ethersCompat.isAddress(this.config.quoteToken)) {
                errors.push('Invalid quote token address');
            }

            // Validate amounts and numbers
            if (parseFloat(this.config.baseAmount) <= 0) {
                errors.push('Base amount must be greater than 0');
            }
            if (parseFloat(this.config.quoteAmount) <= 0) {
                errors.push('Quote amount must be greater than 0');
            }
            if (this.config.gridLevels <= 2) {
                errors.push('Grid levels must be greater than 2');
            }
            if (this.config.priceRange <= 0 || this.config.priceRange > 50) {
                errors.push('Price range must be between 0% and 50%');
            }

            // Check wallet balances
            const walletAddress = await this.signer.getAddress();
            
            const baseTokenContract = ethersCompat.getContract(this.config.baseToken, ERC20_ABI, this.provider);
            const baseBalance = await baseTokenContract.balanceOf!(walletAddress);
            const baseBalanceFormatted = Number(ethersCompat.formatUnits(baseBalance, this.config.baseTokenDecimals));
            const requiredBaseAmount = parseFloat(this.config.baseAmount);

            if (baseBalanceFormatted < requiredBaseAmount) {
                errors.push(`Insufficient ${this.config.baseTokenSymbol} balance. Required: ${requiredBaseAmount}, Available: ${baseBalanceFormatted.toFixed(6)}`);
            }

            const quoteTokenContract = ethersCompat.getContract(this.config.quoteToken, ERC20_ABI, this.provider);
            const quoteBalance = await quoteTokenContract.balanceOf!(walletAddress);
            const quoteBalanceFormatted = Number(ethersCompat.formatUnits(quoteBalance, this.config.quoteTokenDecimals));
            const requiredQuoteAmount = parseFloat(this.config.quoteAmount);

            if (quoteBalanceFormatted < requiredQuoteAmount) {
                errors.push(`Insufficient ${this.config.quoteTokenSymbol} balance. Required: ${requiredQuoteAmount}, Available: ${quoteBalanceFormatted.toFixed(6)}`);
            }

            console.log(`✅ Balance check: ${baseBalanceFormatted.toFixed(6)} ${this.config.baseTokenSymbol}, ${quoteBalanceFormatted.toFixed(6)} ${this.config.quoteTokenSymbol} available`);

        } catch (error) {
            errors.push(`Validation error: ${(error as Error).message}`);
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        
        if (warnings.length > 0) {
            warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
        }
    }

    /**
     * Start the orchestrator
     */
    async startOrchestrator(): Promise<void> {
        console.log('\n🚀 Starting Off-Chain Orchestrator...');
        console.log('=====================================');
        
        if (this.isRunning) {
            console.log('⚠️ Orchestrator is already running');
            return;
        }

        this.isRunning = true;
        
        try {
            // Ensure token approvals
            await this.ensureTokenApprovals();
            
            // Create initial grid orders
            const orders = await this.createGridOrders();
            
            if (orders.length === 0) {
                console.log('❌ No orders created. Orchestrator cannot proceed.');
                return;
            }

            // Submit orders to 1inch protocol
            console.log('\n📤 Submitting orders to 1inch protocol...');
            await this.submitOrdersToProtocol();

            // Start monitoring
            console.log('\n👀 Starting orchestrator monitoring...');
            this.startMonitoring();

            // Start price updates
            this.startPriceUpdates();

            console.log('\n✅ Orchestrator started successfully!');
            console.log('Press Ctrl+C to stop the orchestrator\n');

        } catch (error) {
            console.error('❌ Orchestrator startup failed:', (error as Error).message);
            this.isRunning = false;
        }
    }

    /**
     * Start monitoring orders
     */
    private startMonitoring(): void {
        this.monitoringTimer = setInterval(async () => {
            try {
                await this.checkOrderFills();
                await this.handleRebalancing();
                await this.displayOrchestratorStatus();
                await this.handleRetries();
                
            } catch (error) {
                console.error('❌ Monitoring error:', (error as Error).message);
            }
        }, this.config.monitoringInterval * 1000);
    }

    /**
     * Start price updates
     */
    private startPriceUpdates(): void {
        this.priceUpdateTimer = setInterval(async () => {
            try {
                const newPrice = await this.getCurrentPrice();
                const priceChange = Math.abs(newPrice - this.config.currentPrice) / this.config.currentPrice;
                
                if (priceChange > 0.05) { // 5% price change threshold
                    console.log(`📈 Significant price change detected: ${this.config.currentPrice.toFixed(6)} → ${newPrice.toFixed(6)}`);
                    this.config.currentPrice = newPrice;
                    
                    if (this.config.autoRebalance) {
                        console.log('🔄 Triggering rebalance due to price change...');
                        await this.rebalanceGrid();
                    }
                }
                
            } catch (error) {
                console.error('❌ Price update error:', (error as Error).message);
            }
        }, this.config.priceUpdateInterval * 1000);
    }

    /**
     * Stop the orchestrator
     */
    async stopOrchestrator(): Promise<void> {
        console.log('\n🛑 Stopping Off-Chain Orchestrator...');
        
        this.isRunning = false;
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        
        if (this.priceUpdateTimer) {
            clearInterval(this.priceUpdateTimer);
        }
        
        // Cancel all active orders
        await this.cancelAllOrders();
        
        console.log('✅ Orchestrator stopped successfully');
    }

    /**
     * Create initial grid orders
     */
    async createGridOrders(): Promise<OrchestratorOrderData[]> {
        console.log('\n🚀 Creating Volatility Grid orders...');
        
        const orders: OrchestratorOrderData[] = [];
        const buyLevels = Math.floor(this.config.gridLevels / 2);
        const sellLevels = Math.ceil(this.config.gridLevels / 2);

        // Create sell orders (above current price)
        for (let i = 1; i <= sellLevels; i++) {
            try {
                const gridLevel = this.gridLevels.get(i);
                if (!gridLevel) continue;
                
                const orderAmount = ethersCompat.parseUnits(
                    (parseFloat(this.config.baseAmount) / sellLevels).toString(),
                    this.config.baseTokenDecimals
                );

                const orderData = await this.createSingleGridOrder(
                    orderAmount,
                    GridOrderType.SELL,
                    i,
                    gridLevel.sellPrice
                );
                
                if (orderData) {
                    orders.push(orderData);
                    this.activeOrders.set(orderData.orchestratorId, orderData);
                    console.log(`✅ Sell order ${i} created at ${gridLevel.sellPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Failed to create sell order ${i}:`, (error as Error).message);
            }
        }

        // Create buy orders (below current price)
        for (let i = 1; i <= buyLevels; i++) {
            try {
                const gridLevel = this.gridLevels.get(-i);
                if (!gridLevel) continue;
                
                const orderAmount = ethersCompat.parseUnits(
                    (parseFloat(this.config.quoteAmount) / buyLevels).toString(),
                    this.config.quoteTokenDecimals
                );

                const orderData = await this.createSingleGridOrder(
                    orderAmount,
                    GridOrderType.BUY,
                    -i,
                    gridLevel.buyPrice
                );
                
                if (orderData) {
                    orders.push(orderData);
                    this.activeOrders.set(orderData.orchestratorId, orderData);
                    console.log(`✅ Buy order ${i} created at ${gridLevel.buyPrice.toFixed(6)} ${this.config.quoteTokenSymbol}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Failed to create buy order ${i}:`, (error as Error).message);
            }
        }

        console.log(`\n🎉 Created ${orders.length}/${this.config.gridLevels} grid orders successfully!`);
        return orders;
    }

    /**
     * Create a single grid order
     */
    private async createSingleGridOrder(
        makingAmount: any,
        orderType: GridOrderType,
        gridLevel: number,
        targetPrice: number
    ): Promise<OrchestratorOrderData | null> {
        try {
            const walletAddress = await this.signer.getAddress();
            
            let makerAsset: string, takerAsset: string, takingAmount: bigint;
            
            if (orderType === GridOrderType.SELL) {
                makerAsset = this.config.baseToken;
                takerAsset = this.config.quoteToken;
                takingAmount = this.calculateQuoteAmount(BigInt(makingAmount.toString()), targetPrice);
            } else {
                makerAsset = this.config.quoteToken;
                takerAsset = this.config.baseToken;
                takingAmount = this.calculateBaseAmount(BigInt(makingAmount.toString()), targetPrice);
            }

            const expirationTimestamp = Math.floor(Date.now() / 1000) + (this.config.orderExpirationDays * 24 * 60 * 60);
            const UINT_40_MAX = (1n << 40n) - 1n;
            
            const makerTraits = MakerTraits.default()
                .withExpiration(BigInt(expirationTimestamp))
                .withNonce(randBigInt(UINT_40_MAX))
                .allowPartialFills()
                .allowMultipleFills();

            const limitOrder = new LimitOrder({
                makerAsset: new OneInchAddress(makerAsset),
                takerAsset: new OneInchAddress(takerAsset),
                makingAmount: BigInt(makingAmount.toString()),
                takingAmount: takingAmount,
                maker: new OneInchAddress(walletAddress),
                salt: randBigInt(2n ** 256n - 1n),
                receiver: new OneInchAddress(walletAddress)
            }, makerTraits);

            const typedData = limitOrder.getTypedData(CHAIN_ID);
            const signature = await (this.signer as any)._signTypedData(
                typedData.domain,
                { Order: typedData.types.Order },
                typedData.message
            );

            const orderHash = limitOrder.getOrderHash(CHAIN_ID);
            const orchestratorId = `order_${++this.orderCounter}_${Date.now()}`;

            const safeToString = (value: any) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                if (value && typeof value.toString === 'function') {
                    return value.toString();
                }
                return String(value);
            };

            const orderData: OrchestratorOrderData = {
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
                orderHash: orderHash,
                signature,
                targetPrice,
                orderIndex: Math.abs(gridLevel),
                status: OrderStatus.ACTIVE,
                createdAt: new Date(),
                expiresAt: new Date(expirationTimestamp * 1000),
                remainingMakingAmount: BigInt(makingAmount.toString()),
                gridType: orderType,
                gridLevel,
                triggerPrice: targetPrice,
                limitOrderInstance: limitOrder,
                retryCount: 0,
                orchestratorId
            };

            return orderData;

        } catch (error) {
            console.error('❌ Error creating grid order:', error);
            return null;
        }
    }

    /**
     * Check for order fills and create new orders
     */
    private async checkOrderFills(): Promise<void> {
        for (const [orchestratorId, orderData] of this.activeOrders) {
            if (orderData.status !== OrderStatus.ACTIVE) continue;
            
            try {
                const status = await this.getOrderStatus(orderData.orderHash);
                if (status) {
                    const fillableBalance = status.fillableBalance || '0';
                    const remainingAmount = BigInt(fillableBalance);
                    
                    if (remainingAmount === 0n) {
                        // Order completely filled
                        orderData.status = OrderStatus.FILLED;
                        this.filledOrders.set(orchestratorId, orderData);
                        this.activeOrders.delete(orchestratorId);
                        
                        console.log(`✅ Grid order filled: ${orderData.gridType} at level ${orderData.gridLevel}`);
                        
                        // Create opposite order if auto-rebalance is enabled
                        if (this.config.autoRebalance) {
                            await this.createOppositeOrder(orderData);
                        }
                        
                        // Calculate profit
                        this.calculateProfit(orderData);
                        
                    } else if (remainingAmount < (orderData.remainingMakingAmount || 0n)) {
                        // Partially filled
                        orderData.status = OrderStatus.PARTIALLY_FILLED;
                        orderData.remainingMakingAmount = remainingAmount;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Could not check status for grid order ${orderData.gridLevel}`);
            }
        }
    }

    /**
     * Handle retries for failed orders
     */
    private async handleRetries(): Promise<void> {
        for (const [orchestratorId, orderData] of this.activeOrders) {
            if (orderData.status === OrderStatus.ACTIVE) continue;
            
            const now = new Date();
            const lastRetry = orderData.lastRetryAt || orderData.createdAt;
            const timeSinceLastRetry = (now.getTime() - lastRetry.getTime()) / 1000;
            
            if (orderData.retryCount < this.config.maxRetries && 
                timeSinceLastRetry >= this.config.retryDelay) {
                
                console.log(`🔄 Retrying order ${orchestratorId} (attempt ${orderData.retryCount + 1})`);
                
                try {
                    await this.submitSingleOrder(orderData);
                    orderData.retryCount++;
                    orderData.lastRetryAt = now;
                    orderData.status = OrderStatus.ACTIVE;
                } catch (error) {
                    console.error(`❌ Retry failed for order ${orchestratorId}:`, error);
                }
            }
        }
    }

    /**
     * Create opposite order when a grid order fills
     */
    private async createOppositeOrder(filledOrder: OrchestratorOrderData): Promise<void> {
        try {
            const gridLevel = this.gridLevels.get(filledOrder.gridLevel);
            if (!gridLevel) return;

            let newOrderType: GridOrderType;
            let newTargetPrice: number;
            let newAmount: any;

            if (filledOrder.gridType === GridOrderType.BUY) {
                newOrderType = GridOrderType.SELL;
                newTargetPrice = gridLevel.sellPrice;
                newAmount = ethersCompat.parseUnits(
                    ethersCompat.formatUnits(filledOrder.remainingMakingAmount || 0n, this.config.quoteTokenDecimals),
                    this.config.baseTokenDecimals
                );
            } else {
                newOrderType = GridOrderType.BUY;
                newTargetPrice = gridLevel.buyPrice;
                newAmount = ethersCompat.parseUnits(
                    ethersCompat.formatUnits(filledOrder.remainingMakingAmount || 0n, this.config.baseTokenDecimals),
                    this.config.quoteTokenDecimals
                );
            }

            console.log(`🔄 Creating opposite ${newOrderType.toLowerCase()} order at level ${filledOrder.gridLevel}`);
            
            const newOrder = await this.createSingleGridOrder(
                newAmount,
                newOrderType,
                filledOrder.gridLevel,
                newTargetPrice
            );

            if (newOrder) {
                this.activeOrders.set(newOrder.orchestratorId, newOrder);
                await this.submitSingleOrder(newOrder);
                console.log(`✅ Opposite order created: ${newOrderType} at ${newTargetPrice.toFixed(6)}`);
            }

        } catch (error) {
            console.error('❌ Failed to create opposite order:', (error as Error).message);
        }
    }

    /**
     * Handle rebalancing logic
     */
    private async handleRebalancing(): Promise<void> {
        if (!this.config.autoRebalance) return;

        const totalOrders = this.filledOrders.size + this.activeOrders.size;
        const filledRatio = this.filledOrders.size / totalOrders * 100;

        if (filledRatio >= this.config.rebalanceThreshold) {
            console.log(`🔄 Rebalancing triggered: ${filledRatio.toFixed(1)}% of orders filled`);
            await this.rebalanceGrid();
        }
    }

    /**
     * Rebalance the entire grid
     */
    private async rebalanceGrid(): Promise<void> {
        try {
            console.log('🔄 Rebalancing grid...');
            
            // Cancel all active orders
            await this.cancelAllOrders();
            
            // Update current price
            this.config.currentPrice = await this.getCurrentPrice();
            
            // Regenerate grid levels
            this.generateGridLevels();
            
            // Create new grid orders
            await this.createGridOrders();
            await this.submitOrdersToProtocol();
            
            // Reset filled orders
            this.filledOrders.clear();
            
            console.log('✅ Grid rebalanced successfully');
            
        } catch (error) {
            console.error('❌ Grid rebalancing failed:', (error as Error).message);
        }
    }

    /**
     * Calculate profit from filled order
     */
    private calculateProfit(filledOrder: OrchestratorOrderData): void {
        const orderValue = Number(ethersCompat.formatUnits(
            filledOrder.remainingMakingAmount || 0n,
            filledOrder.gridType === GridOrderType.SELL ? this.config.baseTokenDecimals : this.config.quoteTokenDecimals
        ));
        
        const estimatedProfit = orderValue * (this.config.profitTarget / 100);
        this.profits += estimatedProfit;
        
        console.log(`💰 Estimated profit from trade: $${estimatedProfit.toFixed(4)} (Total: $${this.profits.toFixed(4)})`);
    }

    /**
     * Display orchestrator status
     */
    private async displayOrchestratorStatus(): Promise<void> {
        const currentTime = new Date().toLocaleTimeString();
        const activeCount = this.activeOrders.size;
        const filledCount = this.filledOrders.size;
        const totalOrders = activeCount + filledCount;
        
        console.log(`📊 Orchestrator Status [${currentTime}]: ${activeCount} active, ${filledCount} filled (${totalOrders} total) | Profit: $${this.profits.toFixed(4)} | Price: ${this.config.currentPrice.toFixed(6)}`);
    }

    /**
     * Ensure sufficient token approvals
     */
    private async ensureTokenApprovals(): Promise<void> {
        console.log('🔐 Checking token approvals...');
        
        const walletAddress = await this.signer.getAddress();
        
        const baseTokenContract = ethersCompat.getContract(this.config.baseToken, ERC20_ABI, this.signer);
        const baseAmount = ethersCompat.parseUnits(this.config.baseAmount, this.config.baseTokenDecimals);
        const baseAllowance = await baseTokenContract.allowance!(walletAddress, LIMIT_ORDER_PROTOCOL_ADDRESS);
        
        if (baseAllowance.lt(baseAmount)) {
            console.log(`📝 Approving ${this.config.baseTokenSymbol} for 1inch protocol...`);
            const approveTx = await baseTokenContract.approve!(LIMIT_ORDER_PROTOCOL_ADDRESS, baseAmount);
            await approveTx.wait();
            console.log(`✅ ${this.config.baseTokenSymbol} approval confirmed`);
        }
        
        const quoteTokenContract = ethersCompat.getContract(this.config.quoteToken, ERC20_ABI, this.signer);
        const quoteAmount = ethersCompat.parseUnits(this.config.quoteAmount, this.config.quoteTokenDecimals);
        const quoteAllowance = await quoteTokenContract.allowance!(walletAddress, LIMIT_ORDER_PROTOCOL_ADDRESS);
        
        if (quoteAllowance.lt(quoteAmount)) {
            console.log(`📝 Approving ${this.config.quoteTokenSymbol} for 1inch protocol...`);
            const approveTx = await quoteTokenContract.approve!(LIMIT_ORDER_PROTOCOL_ADDRESS, quoteAmount);
            await approveTx.wait();
            console.log(`✅ ${this.config.quoteTokenSymbol} approval confirmed`);
        }
        
        console.log('✅ Token approvals sufficient');
    }

    /**
     * Submit all orders to 1inch protocol
     */
    private async submitOrdersToProtocol(): Promise<void> {
        let successCount = 0;
        
        for (const [, orderData] of this.activeOrders) {
            if (await this.submitSingleOrder(orderData)) {
                successCount++;
            }
        }

        console.log(`\n📤 Successfully submitted ${successCount}/${this.activeOrders.size} orders to 1inch protocol`);
    }

    /**
     * Submit a single order to 1inch protocol
     */
    private async submitSingleOrder(orderData: OrchestratorOrderData): Promise<boolean> {
        try {
            let limitOrder = orderData.limitOrderInstance;
            
            if (!limitOrder) {
                limitOrder = new LimitOrder({
                    makerAsset: new OneInchAddress(orderData.order.makerAsset),
                    takerAsset: new OneInchAddress(orderData.order.takerAsset),
                    makingAmount: BigInt(orderData.order.makingAmount),
                    takingAmount: BigInt(orderData.order.takingAmount),
                    maker: new OneInchAddress(orderData.order.maker),
                    salt: BigInt(orderData.order.salt),
                    receiver: new OneInchAddress(orderData.order.receiver)
                }, new MakerTraits(BigInt(orderData.order.makerTraits)));
            }

            await this.oneInchApi.submitOrder(limitOrder, orderData.signature);
            
            console.log(`✅ ${orderData.gridType} order submitted at level ${orderData.gridLevel}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Submit error for ${orderData.gridType} order:`, (error as any).response?.data || (error as Error).message);
            return false;
        }
    }

    /**
     * Get current price using 1inch API
     */
    private async getCurrentPrice(): Promise<number> {
        try {
            const response = await axios.get(
                `${SWAP_API_BASE(CHAIN_ID)}/quote`,
                {
                    params: {
                        src: this.config.baseToken,
                        dst: this.config.quoteToken,
                        amount: ethersCompat.parseUnits('1', this.config.baseTokenDecimals).toString()
                    },
                    headers: {
                        'Authorization': `Bearer ${ONEINCH_API_KEY}`,
                        'accept': 'application/json'
                    }
                }
            );

            const dstAmount = response.data.dstAmount;
            const price = Number(ethersCompat.formatUnits(dstAmount, this.config.quoteTokenDecimals));
            
            return price;
            
        } catch (error) {
            console.warn('⚠️ Failed to fetch current price, using fallback');
            return this.config.currentPrice || 1.0;
        }
    }

    /**
     * Calculate quote amount from base amount and price
     */
    private calculateQuoteAmount(baseAmount: bigint, price: number): bigint {
        const baseAmountReadable = Number(ethersCompat.formatUnits(baseAmount.toString(), this.config.baseTokenDecimals));
        const quoteAmountReadable = baseAmountReadable * price;
        const quoteAmountWithSlippage = quoteAmountReadable * (1 - this.config.slippageTolerance / 100);
        
        return ethersCompat.parseUnits(
            quoteAmountWithSlippage.toFixed(this.config.quoteTokenDecimals), 
            this.config.quoteTokenDecimals
        );
    }

    /**
     * Calculate base amount from quote amount and price
     */
    private calculateBaseAmount(quoteAmount: bigint, price: number): bigint {
        const quoteAmountReadable = Number(ethersCompat.formatUnits(quoteAmount.toString(), this.config.quoteTokenDecimals));
        const baseAmountReadable = quoteAmountReadable / price;
        const baseAmountWithSlippage = baseAmountReadable * (1 - this.config.slippageTolerance / 100);
        
        return ethersCompat.parseUnits(
            baseAmountWithSlippage.toFixed(this.config.baseTokenDecimals), 
            this.config.baseTokenDecimals
        );
    }

    /**
     * Get order status from 1inch API
     */
    async getOrderStatus(orderHash: string): Promise<OneInchOrderInfo | null> {
        try {
            const response = await axios.get(
                `${LIMIT_ORDER_API_BASE(CHAIN_ID)}/order/${orderHash}`,
                {
                    headers: {
                        'Authorization': `Bearer ${ONEINCH_API_KEY}`,
                        'accept': 'application/json'
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Cancel all active orders
     */
    async cancelAllOrders(): Promise<void> {
        console.log('🚫 Cancelling all active grid orders...');
        
        let cancelledCount = 0;
        for (const [orchestratorId, orderData] of this.activeOrders) {
            try {
                await axios.delete(
                    `${LIMIT_ORDER_API_BASE(CHAIN_ID)}/order/${orderData.orderHash}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${ONEINCH_API_KEY}`
                        }
                    }
                );
                
                orderData.status = OrderStatus.CANCELLED;
                cancelledCount++;
                
            } catch (error) {
                console.error(`❌ Failed to cancel order ${orchestratorId.slice(0, 10)}...`);
            }
        }
        
        this.activeOrders.clear();
        console.log(`✅ Cancelled ${cancelledCount} orders`);
    }

    /**
     * Get orchestrator statistics
     */
    getOrchestratorStats(): {
        totalOrders: number;
        activeOrders: number;
        filledOrders: number;
        buyOrders: number;
        sellOrders: number;
        totalProfit: number;
        averageOrderSize: string;
        currentPrice: number;
        priceRange: number;
        uptime: number;
        retryCount: number;
    } {
        const allOrders = [...this.activeOrders.values(), ...this.filledOrders.values()];
        const totalRetries = allOrders.reduce((sum, order) => sum + order.retryCount, 0);
        
        return {
            totalOrders: allOrders.length,
            activeOrders: this.activeOrders.size,
            filledOrders: this.filledOrders.size,
            buyOrders: allOrders.filter(o => o.gridType === GridOrderType.BUY).length,
            sellOrders: allOrders.filter(o => o.gridType === GridOrderType.SELL).length,
            totalProfit: this.profits,
            averageOrderSize: (parseFloat(this.config.baseAmount) / this.config.gridLevels).toFixed(6),
            currentPrice: this.config.currentPrice,
            priceRange: this.config.priceRange,
            uptime: this.isRunning ? Date.now() - (this.activeOrders.values().next().value?.createdAt?.getTime() || Date.now()) : 0,
            retryCount: totalRetries
        };
    }

    /**
     * Emergency stop
     */
    async emergencyStop(): Promise<void> {
        console.log('🚨 Emergency stop activated!');
        await this.stopOrchestrator();
    }

    // Legacy methods for compatibility
    public setConfig(config: StrategyConfig) {
        this.setConfiguration(config);
    }

    public async run() {
        await this.startOrchestrator();
    }
}
