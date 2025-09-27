# Pyth Protocol Integration for Grid Trading

This integration provides real-time price feeds from the Pyth Network for enhanced grid trading strategies.

## 🎯 **Overview**

The Pyth integration adds high-frequency, low-latency price feeds to your grid trading bot, enabling:

- **Real-time price updates** from Pyth Network
- **High accuracy** with confidence intervals
- **Low latency** price feeds
- **Multiple asset support** (ETH, BTC, SOL, AVAX, USDC)
- **Fallback mechanisms** to 1inch API
- **Price validation** and error handling

## 📁 **Files Created**

- `src/pyth-provider.js` - Core Pyth integration classes
- `src/pyth-grid-bot.js` - Enhanced grid bot with Pyth feeds
- `src/pyth-test.js` - Test suite for Pyth integration
- `src/types.js` - Updated with Pyth types and constants

## 🚀 **Quick Start**

### 1. Test Pyth Integration
```bash
npm run pyth:test
```

### 2. Run Enhanced Grid Bot
```bash
npm run pyth:grid
```

### 3. Use in Your Code
```javascript
import { PythEnhancedGridStrategy } from './src/pyth-grid-bot.js';

const strategy = new PythEnhancedGridStrategy(provider, signer);
await strategy.initialize();
await strategy.executeGridStrategy();
```

## 🔧 **Configuration**

### Price Feed IDs
```javascript
export const PYTH_PRICE_FEEDS = {
  ETH_USD_STABLE: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  BTC_USD_STABLE: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  SOL_USD_STABLE: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  // ... more feeds
};
```

### Feed Configuration
```javascript
export const PRICE_FEED_CONFIG = {
  UPDATE_INTERVAL: 1000,        // 1 second
  MAX_RETRIES: 3,               // Max retry attempts
  RETRY_DELAY: 5000,            // 5 seconds between retries
  PRICE_VALIDITY_WINDOW: 30000, // 30 seconds price validity
  MIN_CONFIDENCE_INTERVAL: 0.01, // 1% confidence threshold
  MAX_PRICE_CHANGE: 0.1         // 10% max price change
};
```

## 📊 **Key Features**

### 1. **Real-time Price Streaming**
- Server-Sent Events (SSE) for low-latency updates
- Automatic reconnection on connection loss
- Configurable update intervals

### 2. **Price Validation**
- Confidence interval checking
- Price change validation
- Data freshness verification
- Outlier detection

### 3. **Multi-Feed Management**
- Support for multiple price feeds
- Automatic feed discovery
- Centralized feed management
- Statistics and monitoring

### 4. **Fallback Mechanisms**
- Automatic fallback to 1inch API
- Price caching for offline scenarios
- Error recovery and retry logic

## 🎮 **Usage Examples**

### Basic Price Feed
```javascript
import { PythPriceFeed, PYTH_PRICE_FEEDS } from './src/pyth-provider.js';

const ethFeed = new PythPriceFeed(PYTH_PRICE_FEEDS.ETH_USD_STABLE);

ethFeed.on('priceUpdate', (data) => {
  console.log(`ETH Price: $${data.price.toFixed(2)}`);
});

await ethFeed.getLatestPrice();
await ethFeed.startStreaming();
```

### Multiple Feeds Manager
```javascript
import { PythFeedManager, PYTH_PRICE_FEEDS } from './src/pyth-provider.js';

const manager = new PythFeedManager();

manager.addFeed('ETH_USD', PYTH_PRICE_FEEDS.ETH_USD_STABLE);
manager.addFeed('BTC_USD', PYTH_PRICE_FEEDS.BTC_USD_STABLE);

manager.on('priceUpdate', (data) => {
  console.log(`${data.symbol}: $${data.price.toFixed(2)}`);
});

await manager.startAllFeeds();
```

### Grid Bot Integration
```javascript
import { PythEnhancedGridStrategy } from './src/pyth-grid-bot.js';

const strategy = new PythEnhancedGridStrategy(provider, signer);

// Configure with Pyth feeds enabled
strategy.setConfiguration({
  fromToken: { address: '0x...', symbol: 'ETH', decimals: 18 },
  toToken: { address: '0x...', symbol: 'USDC', decimals: 6 },
  totalAmount: 1000,
  numberOfOrders: 10,
  priceDropPercent: 20,
  usePythFeeds: true // Enable Pyth integration
});

await strategy.initialize();
await strategy.executeGridStrategy();
```

## 📈 **Price Feed Statistics**

The integration provides comprehensive statistics:

```javascript
const stats = feedManager.getFeedStats();

// Example output:
{
  ETH_USD: {
    currentPrice: 2456.78,
    averagePrice: 2445.23,
    minPrice: 2400.12,
    maxPrice: 2480.45,
    volatility: 0.0234,
    dataPoints: 1500,
    lastUpdate: 2024-01-15T10:30:00Z
  }
}
```

## ⚠️ **Error Handling**

### Common Error Scenarios
1. **Network connectivity issues**
2. **Invalid price feed IDs**
3. **Stale price data**
4. **Excessive price volatility**
5. **API rate limiting**

### Error Recovery
- Automatic retry with exponential backoff
- Fallback to cached prices
- Fallback to 1inch API
- Graceful degradation

## 🔍 **Monitoring & Debugging**

### Event Listeners
```javascript
feedManager.on('priceUpdate', (data) => {
  console.log(`Price update: ${data.symbol} = $${data.price}`);
});

feedManager.on('error', (data) => {
  console.error(`Feed error: ${data.symbol} - ${data.error.message}`);
});

feedManager.on('streamStopped', () => {
  console.log('Price stream stopped');
});
```

### Debug Information
```javascript
// Get detailed feed statistics
const stats = feedManager.getFeedStats();

// Get price history
const history = feed.getPriceHistory(100);

// Check feed status
const isStreaming = feed.isStreaming;
const currentPrice = feed.getCurrentPrice();
```

## 🛠️ **Customization**

### Custom Price Feed Configuration
```javascript
const customFeed = new PythPriceFeed(feedId, {
  updateInterval: 500,           // 500ms updates
  maxRetries: 5,                // More retries
  retryDelay: 2000,             // 2s delay
  priceValidityWindow: 15000,   // 15s validity
  minConfidenceInterval: 0.005, // 0.5% confidence
  maxPriceChange: 0.05          // 5% max change
});
```

### Custom Feed Manager
```javascript
const manager = new PythFeedManager();

// Add custom feeds
manager.addFeed('CUSTOM_USD', '0x...', {
  maxPriceChange: 0.02,
  priceValidityWindow: 20000
});
```

## 📋 **API Reference**

### PythPriceFeed Class
- `constructor(feedId, options)` - Create price feed
- `getLatestPrice()` - Get latest price via REST
- `startStreaming()` - Start real-time streaming
- `stopStreaming()` - Stop streaming
- `getCurrentPrice()` - Get current cached price
- `getPriceHistory(limit)` - Get price history
- `getPriceStats()` - Get price statistics

### PythFeedManager Class
- `addFeed(symbol, feedId, options)` - Add price feed
- `removeFeed(symbol)` - Remove price feed
- `startAllFeeds()` - Start all feeds
- `stopAllFeeds()` - Stop all feeds
- `getPrice(symbol)` - Get price for symbol
- `getAllPrices()` - Get all current prices
- `getFeedStats()` - Get statistics for all feeds

### PythGridPriceProvider Class
- `getPriceForPair(baseSymbol, quoteSymbol)` - Get pair price
- `getPriceWithFallback(baseSymbol, quoteSymbol, fallback)` - Get price with fallback
- `cachePrice(baseSymbol, quoteSymbol, price)` - Cache price

## 🔗 **Integration with Existing Grid Bot**

The Pyth integration seamlessly enhances your existing grid bot:

1. **Drop-in replacement** for price fetching
2. **Enhanced accuracy** with real-time feeds
3. **Better performance** with low-latency updates
4. **Automatic fallback** to existing methods
5. **No breaking changes** to existing code

## 🚨 **Important Notes**

1. **Rate Limits**: Pyth API has rate limits - monitor usage
2. **Network Dependency**: Requires stable internet connection
3. **Feed Availability**: Some feeds may be temporarily unavailable
4. **Price Validation**: Always validate prices before trading
5. **Fallback Strategy**: Always have fallback price sources

## 🧪 **Testing**

Run the comprehensive test suite:

```bash
# Test Pyth integration
npm run pyth:test

# Test enhanced grid bot
npm run pyth:grid

# Test with custom configuration
node src/pyth-test.js
```

## 📚 **Resources**

- [Pyth Network Documentation](https://docs.pyth.network/)
- [Pyth Price Feeds](https://pyth.network/price-feeds/)
- [Hermes API Reference](https://hermes.pyth.network/)
- [Grid Trading Strategies](https://docs.pyth.network/trading-strategies/)

## 🤝 **Contributing**

To add new price feeds or improve the integration:

1. Add feed ID to `PYTH_PRICE_FEEDS` in `types.js`
2. Update feed configuration if needed
3. Add tests in `pyth-test.js`
4. Update documentation

## 📄 **License**

This integration follows the same license as the main project.
