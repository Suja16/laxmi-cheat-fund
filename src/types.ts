export interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
}

export enum StrategyType {
    GRID = 'GRID',
    DCA = 'DCA',
}

export interface StrategyConfig {
    name: string;
    description: string;
    baseToken: TokenInfo;
    quoteToken: TokenInfo;
    strategyType: StrategyType;
    totalBaseAmount: string;
    totalQuoteAmount: string;
    gridLevels?: number;
    priceRangePercent?: number;
}

export interface PriceCandle {
    timestamp: number;
    price: number;
}

export interface BacktestResult {
    periodDays: number;
    startingValue: number;
    finalValue: number;
    absoluteReturn: number;
    percentageReturn: number;
    tradeCount: number;
}

// Advanced Grid Strategy Types
export interface OrderData {
    order: {
        salt: string;
        maker: string;
        receiver: string;
        makerAsset: string;
        takerAsset: string;
        makingAmount: string;
        takingAmount: string;
        makerTraits: string;
    };
    orderHash: string;
    signature: string;
    targetPrice: number;
    orderIndex: number;
    status: OrderStatus;
    createdAt: Date;
    expiresAt: Date;
    remainingMakingAmount: bigint;
    limitOrderInstance?: any;
}

export enum OrderStatus {
    ACTIVE = 'ACTIVE',
    FILLED = 'FILLED',
    PARTIALLY_FILLED = 'PARTIALLY_FILLED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED'
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface OneInchOrderInfo {
    orderHash: string;
    fillableBalance: string;
    status: string;
    createdAt: string;
    filledMakingAmount: string;
    filledTakingAmount: string;
}

// 1inch API Configuration
export const LIMIT_ORDER_PROTOCOL_ADDRESSES: Record<number, string> = {
    1: '0x111111125421ca6dc452d289314280a0f8842a65', // Ethereum
    137: '0x111111125421ca6dc452d289314280a0f8842a65', // Polygon
    8453: '0x111111125421ca6dc452d289314280a0f8842a65', // Base
    56: '0x111111125421ca6dc452d289314280a0f8842a65', // BSC
};

export const SWAP_API_BASE = (chainId: number): string => {
    const baseUrls: Record<number, string> = {
        1: 'https://api.1inch.io/v5.0/1',
        137: 'https://api.1inch.io/v5.0/137',
        8453: 'https://api.1inch.io/v5.0/8453',
        56: 'https://api.1inch.io/v5.0/56',
    };
    return baseUrls[chainId] || baseUrls[1]!;
};

export const LIMIT_ORDER_API_BASE = (chainId: number): string => {
    const baseUrls: Record<number, string> = {
        1: 'https://api.1inch.io/v5.0/1/limit-order',
        137: 'https://api.1inch.io/v5.0/137/limit-order',
        8453: 'https://api.1inch.io/v5.0/8453/limit-order',
        56: 'https://api.1inch.io/v5.0/56/limit-order',
    };
    return baseUrls[chainId] || baseUrls[1]!;
};