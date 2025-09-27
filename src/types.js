// ============ TYPE DEFINITIONS ============

/**
 * Token information structure
 * @typedef {Object} TokenInfo
 * @property {string} address - Token contract address
 * @property {string} symbol - Token symbol (e.g., 'ETH', 'USDC')
 * @property {number} decimals - Token decimals
 * @property {string} name - Token name
 */

/**
 * Grid strategy configuration
 * @typedef {Object} GridConfig
 * @property {string} name - Strategy name
 * @property {number} gridLevels - Number of grid levels
 * @property {number} priceRange - Price range percentage (±%)
 * @property {number} profitTarget - Profit target percentage per trade
 * @property {number} baseAmount - Base token amount
 * @property {number} quoteAmount - Quote token amount
 */

/**
 * Asset configuration for backtesting
 * @typedef {Object} AssetConfig
 * @property {string} symbol - Trading pair symbol
 * @property {string} baseToken - Base token address
 * @property {string} quoteToken - Quote token address
 * @property {number} baseDecimals - Base token decimals
 * @property {number} quoteDecimals - Quote token decimals
 * @property {number} volatility - Daily volatility (0-1)
 * @property {number} trend - Daily trend (0-1)
 */

/**
 * Price data point
 * @typedef {Object} PriceData
 * @property {Date} timestamp - Price timestamp
 * @property {number} price - Price value
 * @property {number} volume - Trading volume
 */

/**
 * Grid level configuration
 * @typedef {Object} GridLevel
 * @property {number} buyPrice - Buy order price
 * @property {number} sellPrice - Sell order price
 */

/**
 * Order information
 * @typedef {Object} Order
 * @property {string} orderType - 'BUY' or 'SELL'
 * @property {number} price - Order price
 * @property {number} amount - Order amount
 * @property {number} level - Grid level
 */

/**
 * Backtest result
 * @typedef {Object} BacktestResult
 * @property {string} strategy - Strategy name
 * @property {string} asset - Asset symbol
 * @property {number} timeframe - Timeframe in days
 * @property {number} initialValue - Initial portfolio value
 * @property {number} finalValue - Final portfolio value
 * @property {number} totalReturn - Total return percentage
 * @property {number} netReturn - Net return percentage (after costs)
 * @property {number} totalProfit - Total profit
 * @property {number} totalGasCosts - Total gas costs
 * @property {number} netProfit - Net profit (after costs)
 * @property {number} totalTrades - Total number of trades
 * @property {number} avgProfitPerTrade - Average profit per trade
 * @property {number} maxDrawdown - Maximum drawdown percentage
 * @property {number} sharpeRatio - Sharpe ratio
 * @property {number} winRate - Win rate percentage
 * @property {Object} finalBalance - Final balance {base, quote}
 * @property {number} filledOrders - Number of filled orders
 */

/**
 * Grid order data
 * @typedef {Object} GridOrderData
 * @property {Object} order - Order details
 * @property {string} orderHash - Order hash
 * @property {string} signature - Order signature
 * @property {number} targetPrice - Target price
 * @property {number} orderIndex - Order index
 * @property {string} status - Order status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} expiresAt - Expiration timestamp
 * @property {bigint} remainingMakingAmount - Remaining amount
 * @property {string} gridType - Grid type ('BUY' or 'SELL')
 * @property {number} gridLevel - Grid level
 * @property {number} triggerPrice - Trigger price
 * @property {Object} limitOrderInstance - Limit order instance
 */

/**
 * Pyth price feed data
 * @typedef {Object} PythPriceData
 * @property {number} price - Current price
 * @property {number} confidence - Confidence interval
 * @property {number} publishTime - Publish timestamp
 * @property {Date} timestamp - Parsed timestamp
 * @property {string} feedId - Price feed ID
 * @property {Object} raw - Raw price data
 */

/**
 * Pyth price feed configuration
 * @typedef {Object} PythFeedConfig
 * @property {number} updateInterval - Update interval in ms
 * @property {number} maxRetries - Maximum retry attempts
 * @property {number} retryDelay - Delay between retries in ms
 * @property {number} priceValidityWindow - Price validity window in ms
 * @property {number} minConfidenceInterval - Minimum confidence interval
 * @property {number} maxPriceChange - Maximum price change per update
 */

/**
 * Price feed statistics
 * @typedef {Object} PriceFeedStats
 * @property {number} currentPrice - Current price
 * @property {number} averagePrice - Average price
 * @property {number} minPrice - Minimum price
 * @property {number} maxPrice - Maximum price
 * @property {number} volatility - Price volatility
 * @property {number} dataPoints - Number of data points
 * @property {Date} lastUpdate - Last update timestamp
 */

// ============ CONSTANTS ============

/**
 * 1inch API endpoints and addresses
 */
const LIMIT_ORDER_PROTOCOL_ADDRESSES = {
  1: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Ethereum
  56: '0x1111111254EEB25477B68fb85Ed929f73A960582', // BSC
  137: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Polygon
  8453: '0x1111111254EEB25477B68fb85Ed929f73A960582', // Base
  42161: '0x1111111254EEB25477B68fb85Ed929f73A960582'  // Arbitrum
};

/**
 * 1inch API base URLs
 */
const SWAP_API_BASE = (chainId) => `https://api.1inch.io/v5.2/${chainId}`;
const LIMIT_ORDER_API_BASE = (chainId) => `https://limit-order.1inch.io/v3.0/${chainId}`;

/**
 * Default token addresses for Base chain
 */
const DEFAULT_TOKENS = {
  BASE: {
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    ONEINCH: '0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE',
    ETH_SEOPOLIA: '0x29A1F4ecE9246F0042A9062FB89803fA8B1830cB'
  }
};

/**
 * Grid order types
 */
const GridOrderType = {
  BUY: 'BUY',
  SELL: 'SELL'
};

/**
 * Order statuses
 */
const OrderStatus = {
  ACTIVE: 'ACTIVE',
  FILLED: 'FILLED',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

// ============ UTILITY FUNCTIONS ============

/**
 * Validate token address
 * @param {string} address - Token address to validate
 * @returns {boolean} - True if valid address
 */
function isValidAddress(address) {
  return typeof address === 'string' && address.length === 42 && address.startsWith('0x');
}

/**
 * Format token amount with decimals
 * @param {string|number} amount - Amount to format
 * @param {number} decimals - Token decimals
 * @returns {string} - Formatted amount
 */
function formatTokenAmount(amount, decimals) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(decimals);
}

/**
 * Parse token amount from string with decimals
 * @param {string} amount - Amount string
 * @param {number} decimals - Token decimals
 * @returns {number} - Parsed amount
 */
function parseTokenAmount(amount, decimals) {
  return parseFloat(amount) * Math.pow(10, decimals);
}

/**
 * Calculate price change percentage
 * @param {number} oldPrice - Old price
 * @param {number} newPrice - New price
 * @returns {number} - Price change percentage
 */
function calculatePriceChange(oldPrice, newPrice) {
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

/**
 * Generate random nonce for orders
 * @param {number} max - Maximum value
 * @returns {number} - Random nonce
 */
function generateNonce(max = 2 ** 40 - 1) {
  return Math.floor(Math.random() * max);
}

// ============ TYPE GUARDS ============

/**
 * Check if object is TokenInfo
 * @param {any} obj - Object to check
 * @returns {boolean} - True if TokenInfo
 */
function isTokenInfo(obj) {
  return obj &&
    typeof obj.address === 'string' &&
    typeof obj.symbol === 'string' &&
    typeof obj.decimals === 'number' &&
    typeof obj.name === 'string';
}

/**
 * Check if object is GridConfig
 * @param {any} obj - Object to check
 * @returns {boolean} - True if GridConfig
 */
function isGridConfig(obj) {
  return obj &&
    typeof obj.name === 'string' &&
    typeof obj.gridLevels === 'number' &&
    typeof obj.priceRange === 'number' &&
    typeof obj.profitTarget === 'number' &&
    typeof obj.baseAmount === 'number' &&
    typeof obj.quoteAmount === 'number';
}

/**
 * Check if object is AssetConfig
 * @param {any} obj - Object to check
 * @returns {boolean} - True if AssetConfig
 */
function isAssetConfig(obj) {
  return obj &&
    typeof obj.symbol === 'string' &&
    typeof obj.baseToken === 'string' &&
    typeof obj.quoteToken === 'string' &&
    typeof obj.baseDecimals === 'number' &&
    typeof obj.quoteDecimals === 'number' &&
    typeof obj.volatility === 'number' &&
    typeof obj.trend === 'number';
}

// ============ DEFAULT CONFIGURATIONS ============

/**
 * Default grid strategy configurations
 */
const DEFAULT_GRID_CONFIGS = [
  {
    name: 'Conservative',
    gridLevels: 10,
    priceRange: 15,
    profitTarget: 0.5,
    baseAmount: 1000,
    quoteAmount: 1000
  },
  {
    name: 'Moderate',
    gridLevels: 15,
    priceRange: 20,
    profitTarget: 0.8,
    baseAmount: 1000,
    quoteAmount: 1000
  },
  {
    name: 'Aggressive',
    gridLevels: 20,
    priceRange: 25,
    profitTarget: 1.2,
    baseAmount: 1000,
    quoteAmount: 1000
  }
];

/**
 * Default asset configurations for backtesting
 */
const DEFAULT_ASSET_CONFIGS = [
  {
    symbol: 'ETH/USDC',
    baseToken: '0x4200000000000000000000000000000000000006',
    quoteToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    baseDecimals: 18,
    quoteDecimals: 6,
    volatility: 0.03,
    trend: 0.001
  },
  {
    symbol: 'BTC/USDC',
    baseToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    quoteToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    baseDecimals: 8,
    quoteDecimals: 6,
    volatility: 0.025,
    trend: 0.0008
  },
  {
    symbol: '1INCH/USDC',
    baseToken: '0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE',
    quoteToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    baseDecimals: 18,
    quoteDecimals: 6,
    volatility: 0.04,
    trend: 0.002
  }
];

/**
 * Default backtest timeframes
 */
const DEFAULT_TIMEFRAMES = [7, 14, 30, 90, 180];

/**
 * Pyth price feed IDs for different assets
 */
const PYTH_PRICE_FEEDS = {
  ETH_USD_STABLE: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  ETH_USD_BETA: '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6',
  BTC_USD_STABLE: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  BTC_USD_BETA: '0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b',
  SOL_USD_STABLE: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  AVAX_USD_STABLE: '0x93da3352f9d1e105b4aef5c7c4c9c5b8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
  USDC_USD_STABLE: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'
};

/**
 * Pyth API endpoints
 */
const PYTH_ENDPOINTS = {
  REST_BASE: 'https://hermes.pyth.network/v2',
  STREAM_BASE: 'https://hermes.pyth.network/v2',
  LATEST_PRICE: (feedId) => `${PYTH_ENDPOINTS.REST_BASE}/updates/price/latest?ids[]=${feedId}`,
  STREAM_PRICE: (feedId) => `${PYTH_ENDPOINTS.STREAM_BASE}/updates/price/stream?ids[]=${feedId}`
};

/**
 * Price feed configuration
 */
const PRICE_FEED_CONFIG = {
  UPDATE_INTERVAL: 1000, // 1 second
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  PRICE_VALIDITY_WINDOW: 30000, // 30 seconds
  MIN_CONFIDENCE_INTERVAL: 0.01, // 1% confidence interval
  MAX_PRICE_CHANGE: 0.1 // 10% max price change per update
};

//  all types for JSDoc usage
//  {
//   // Re- types for documentation
//   TokenInfo,
//   // GridConfig,
//   // AssetConfig,
//   PriceData,
//   // GridLevel,
//   Order,
//   // BacktestResult,
//   GridOrderData
// };
