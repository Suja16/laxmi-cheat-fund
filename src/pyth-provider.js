#!/usr/bin/env node

/**
 * Pyth Protocol Price Feed Integration
 * Provides real-time price feeds for grid trading strategies
 */

import axios from 'axios';
import EventEmitter from 'events';

// ============ PYTH CONFIGURATION ============

/**
 * Pyth price feed IDs for different assets
 */
export const PYTH_PRICE_FEEDS = {
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
export const PYTH_ENDPOINTS = {
  REST_BASE: 'https://hermes.pyth.network/v2',
  STREAM_BASE: 'https://hermes.pyth.network/v2',
  LATEST_PRICE: (feedId) => `${PYTH_ENDPOINTS.REST_BASE}/updates/price/latest?ids[]=${feedId}`,
  STREAM_PRICE: (feedId) => `${PYTH_ENDPOINTS.STREAM_BASE}/updates/price/stream?ids[]=${feedId}`
};

/**
 * Price feed configuration
 */
export const PRICE_FEED_CONFIG = {
  UPDATE_INTERVAL: 1000, // 1 second
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  PRICE_VALIDITY_WINDOW: 30000, // 30 seconds
  MIN_CONFIDENCE_INTERVAL: 0.01, // 1% confidence interval
  MAX_PRICE_CHANGE: 0.1 // 10% max price change per update
};

// ============ PYTH PRICE FEED CLASS ============

/**
 * Pyth price feed client for real-time price updates
 */
export class PythPriceFeed extends EventEmitter {
  constructor(feedId, options = {}) {
    super();
    
    this.feedId = feedId;
    this.options = {
      ...PRICE_FEED_CONFIG,
      ...options
    };
    
    this.currentPrice = null;
    this.lastUpdate = null;
    this.isStreaming = false;
    this.retryCount = 0;
    this.streamController = null;
    this.priceHistory = [];
    this.maxHistorySize = 1000;
    
    // Price validation
    this.lastValidPrice = null;
    this.priceChangeCount = 0;
    this.maxPriceChanges = 10;
  }
  
  /**
   * Get latest price from REST API
   */
  async getLatestPrice() {
    try {
      console.log(`📊 Fetching latest price for feed: ${this.feedId.slice(0, 8)}...`);
      
      const response = await axios.get(PYTH_ENDPOINTS.LATEST_PRICE(this.feedId), {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GridBot-PythClient/1.0'
        }
      });
      
      const priceData = this.parsePriceResponse(response.data);
      if (priceData) {
        this.updatePrice(priceData);
        return priceData;
      }
      
      throw new Error('No valid price data received');
      
    } catch (error) {
      console.error(`❌ Failed to fetch latest price:`, error.message);
      this.emit('error', error);
      return null;
    }
  }
  
  /**
   * Start streaming price updates
   */
  async startStreaming() {
    if (this.isStreaming) {
      console.log('⚠️ Price stream already active');
      return;
    }
    
    console.log(`🔄 Starting price stream for feed: ${this.feedId.slice(0, 8)}...`);
    
    try {
      this.isStreaming = true;
      this.streamController = new AbortController();
      
      const response = await axios.get(PYTH_ENDPOINTS.STREAM_PRICE(this.feedId), {
        stream: true,
        timeout: 0,
        signal: this.streamController.signal,
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'User-Agent': 'GridBot-PythClient/1.0'
        }
      });
      
      this.processStream(response.data);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`❌ Stream error:`, error.message);
        this.handleStreamError(error);
      }
    }
  }
  
  /**
   * Stop streaming price updates
   */
  stopStreaming() {
    if (!this.isStreaming) return;
    
    console.log('🛑 Stopping price stream...');
    this.isStreaming = false;
    
    if (this.streamController) {
      this.streamController.abort();
      this.streamController = null;
    }
    
    this.emit('streamStopped');
  }
  
  /**
   * Process streaming data
   */
  async processStream(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (this.isStreaming) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const priceData = this.parsePriceResponse(data);
              
              if (priceData) {
                this.updatePrice(priceData);
              }
            } catch (parseError) {
              console.warn('⚠️ Failed to parse stream data:', parseError.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Stream processing error:', error.message);
      this.handleStreamError(error);
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Parse price response from Pyth API
   */
  parsePriceResponse(responseData) {
    try {
      const parsedData = responseData.parsed || [];
      
      for (const item of parsedData) {
        const priceInfo = item.price;
        if (!priceInfo) continue;
        
        const price = parseInt(priceInfo.price);
        const expo = parseInt(priceInfo.expo);
        const confidence = parseInt(priceInfo.conf || '0');
        const publishTime = parseInt(priceInfo.publish_time);
        
        if (price && expo !== undefined) {
          const realPrice = price * Math.pow(10, expo);
          const confidenceInterval = confidence * Math.pow(10, expo);
          
          return {
            price: realPrice,
            confidence: confidenceInterval,
            publishTime: publishTime,
            timestamp: new Date(publishTime * 1000),
            feedId: this.feedId,
            raw: priceInfo
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Price parsing error:', error.message);
      return null;
    }
  }
  
  /**
   * Update current price with validation
   */
  updatePrice(priceData) {
    // Validate price data
    if (!this.validatePrice(priceData)) {
      console.warn('⚠️ Price validation failed, skipping update');
      return;
    }
    
    // Check for significant price changes
    if (this.lastValidPrice) {
      const priceChange = Math.abs(priceData.price - this.lastValidPrice) / this.lastValidPrice;
      
      if (priceChange > this.options.MAX_PRICE_CHANGE) {
        this.priceChangeCount++;
        
        if (this.priceChangeCount > this.maxPriceChanges) {
          console.error('❌ Too many large price changes, possible feed issue');
          this.emit('error', new Error('Excessive price volatility detected'));
          return;
        }
        
        console.warn(`⚠️ Large price change detected: ${(priceChange * 100).toFixed(2)}%`);
      } else {
        this.priceChangeCount = Math.max(0, this.priceChangeCount - 1);
      }
    }
    
    // Update price data
    this.currentPrice = priceData.price;
    this.lastUpdate = priceData.timestamp;
    this.lastValidPrice = priceData.price;
    
    // Add to history
    this.priceHistory.push({
      price: priceData.price,
      timestamp: priceData.timestamp,
      confidence: priceData.confidence
    });
    
    // Trim history
    if (this.priceHistory.length > this.maxHistorySize) {
      this.priceHistory = this.priceHistory.slice(-this.maxHistorySize);
    }
    
    // Emit price update
    this.emit('priceUpdate', {
      price: priceData.price,
      timestamp: priceData.timestamp,
      confidence: priceData.confidence,
      feedId: this.feedId
    });
    
    console.log(`💰 Price update: $${priceData.price.toFixed(2)} (confidence: ±$${priceData.confidence.toFixed(2)})`);
  }
  
  /**
   * Validate price data
   */
  validatePrice(priceData) {
    // Check if price is valid number
    if (!priceData || typeof priceData.price !== 'number' || isNaN(priceData.price)) {
      return false;
    }
    
    // Check if price is positive
    if (priceData.price <= 0) {
      return false;
    }
    
    // Check confidence interval
    if (priceData.confidence && priceData.confidence > priceData.price * this.options.MIN_CONFIDENCE_INTERVAL) {
      console.warn('⚠️ High confidence interval, price may be unreliable');
    }
    
    // Check publish time freshness
    const now = Date.now();
    const publishTime = priceData.publishTime * 1000;
    const age = now - publishTime;
    
    if (age > this.options.PRICE_VALIDITY_WINDOW) {
      console.warn(`⚠️ Price data is ${Math.round(age / 1000)}s old`);
    }
    
    return true;
  }
  
  /**
   * Handle stream errors with retry logic
   */
  async handleStreamError(error) {
    this.isStreaming = false;
    this.retryCount++;
    
    if (this.retryCount <= this.options.MAX_RETRIES) {
      console.log(`🔄 Retrying stream connection (${this.retryCount}/${this.options.MAX_RETRIES})...`);
      
      setTimeout(() => {
        this.startStreaming();
      }, this.options.RETRY_DELAY);
    } else {
      console.error('❌ Max retries reached, stopping stream');
      this.emit('error', new Error('Stream connection failed after max retries'));
    }
  }
  
  /**
   * Get current price
   */
  getCurrentPrice() {
    return this.currentPrice;
  }
  
  /**
   * Get price history
   */
  getPriceHistory(limit = 100) {
    return this.priceHistory.slice(-limit);
  }
  
  /**
   * Get price statistics
   */
  getPriceStats() {
    if (this.priceHistory.length === 0) return null;
    
    const prices = this.priceHistory.map(p => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const volatility = this.calculateVolatility(prices);
    
    return {
      currentPrice: this.currentPrice,
      averagePrice: avgPrice,
      minPrice,
      maxPrice,
      volatility,
      dataPoints: this.priceHistory.length,
      lastUpdate: this.lastUpdate
    };
  }
  
  /**
   * Calculate price volatility
   */
  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
}

// ============ MULTI-FEED MANAGER ============

/**
 * Manages multiple Pyth price feeds
 */
export class PythFeedManager extends EventEmitter {
  constructor() {
    super();
    this.feeds = new Map();
    this.isRunning = false;
  }
  
  /**
   * Add a price feed
   */
  addFeed(symbol, feedId, options = {}) {
    if (this.feeds.has(symbol)) {
      console.warn(`⚠️ Feed ${symbol} already exists`);
      return;
    }
    
    const feed = new PythPriceFeed(feedId, options);
    
    // Set up event listeners
    feed.on('priceUpdate', (data) => {
      this.emit('priceUpdate', { symbol, ...data });
    });
    
    feed.on('error', (error) => {
      this.emit('error', { symbol, error });
    });
    
    this.feeds.set(symbol, feed);
    console.log(`✅ Added price feed: ${symbol}`);
  }
  
  /**
   * Remove a price feed
   */
  removeFeed(symbol) {
    const feed = this.feeds.get(symbol);
    if (feed) {
      feed.stopStreaming();
      this.feeds.delete(symbol);
      console.log(`🗑️ Removed price feed: ${symbol}`);
    }
  }
  
  /**
   * Start all feeds
   */
  async startAllFeeds() {
    if (this.isRunning) {
      console.log('⚠️ Feeds already running');
      return;
    }
    
    console.log('🚀 Starting all price feeds...');
    this.isRunning = true;
    
    for (const [symbol, feed] of this.feeds) {
      try {
        await feed.getLatestPrice();
        await feed.startStreaming();
      } catch (error) {
        console.error(`❌ Failed to start feed ${symbol}:`, error.message);
      }
    }
  }
  
  /**
   * Stop all feeds
   */
  stopAllFeeds() {
    console.log('🛑 Stopping all price feeds...');
    this.isRunning = false;
    
    for (const [symbol, feed] of this.feeds) {
      feed.stopStreaming();
    }
  }
  
  /**
   * Get current price for a symbol
   */
  getPrice(symbol) {
    const feed = this.feeds.get(symbol);
    return feed ? feed.getCurrentPrice() : null;
  }
  
  /**
   * Get all current prices
   */
  getAllPrices() {
    const prices = {};
    for (const [symbol, feed] of this.feeds) {
      prices[symbol] = feed.getCurrentPrice();
    }
    return prices;
  }
  
  /**
   * Get feed statistics
   */
  getFeedStats() {
    const stats = {};
    for (const [symbol, feed] of this.feeds) {
      stats[symbol] = feed.getPriceStats();
    }
    return stats;
  }
}

// ============ GRID BOT INTEGRATION ============

/**
 * Pyth-integrated grid bot price provider
 */
export class PythGridPriceProvider {
  constructor(feedManager) {
    this.feedManager = feedManager;
    this.priceCache = new Map();
    this.lastUpdate = new Map();
  }
  
  /**
   * Get price for trading pair
   */
  async getPriceForPair(baseSymbol, quoteSymbol) {
    // Try direct feed first
    const directFeed = `${baseSymbol}_${quoteSymbol}`;
    let price = this.feedManager.getPrice(directFeed);
    
    if (price) {
      return price;
    }
    
    // Try USD feeds and convert
    const baseUsdPrice = this.feedManager.getPrice(`${baseSymbol}_USD`);
    const quoteUsdPrice = this.feedManager.getPrice(`${quoteSymbol}_USD`);
    
    if (baseUsdPrice && quoteUsdPrice) {
      price = baseUsdPrice / quoteUsdPrice;
      return price;
    }
    
    // Fallback to cached price
    const cacheKey = `${baseSymbol}_${quoteSymbol}`;
    const cachedPrice = this.priceCache.get(cacheKey);
    
    if (cachedPrice && Date.now() - this.lastUpdate.get(cacheKey) < 30000) {
      console.warn(`⚠️ Using cached price for ${cacheKey}`);
      return cachedPrice;
    }
    
    throw new Error(`No price feed available for ${baseSymbol}/${quoteSymbol}`);
  }
  
  /**
   * Cache price for fallback
   */
  cachePrice(baseSymbol, quoteSymbol, price) {
    const cacheKey = `${baseSymbol}_${quoteSymbol}`;
    this.priceCache.set(cacheKey, price);
    this.lastUpdate.set(cacheKey, Date.now());
  }
  
  /**
   * Get price with fallback mechanism
   */
  async getPriceWithFallback(baseSymbol, quoteSymbol, fallbackPrice) {
    try {
      const price = await this.getPriceForPair(baseSymbol, quoteSymbol);
      this.cachePrice(baseSymbol, quoteSymbol, price);
      return price;
    } catch (error) {
      console.warn(`⚠️ Pyth price failed, using fallback: ${error.message}`);
      return fallbackPrice;
    }
  }
}

// ============ UTILITY FUNCTIONS ============

/**
 * Create default feed manager with common feeds
 */
export function createDefaultFeedManager() {
  const manager = new PythFeedManager();
  
  // Add common feeds
  manager.addFeed('ETH_USD', PYTH_PRICE_FEEDS.ETH_USD_STABLE);
  manager.addFeed('BTC_USD', PYTH_PRICE_FEEDS.BTC_USD_STABLE);
  manager.addFeed('USDC_USD', PYTH_PRICE_FEEDS.USDC_USD_STABLE);
  
  return manager;
}

/**
 * Load price feed IDs from file
 */
export async function loadPriceFeedIds(filePath) {
  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const feeds = {};
    
    for (const line of content.split('\n')) {
      if (line.includes('=')) {
        const [key, value] = line.split('=');
        feeds[key.trim()] = value.trim().replace(/'/g, '');
      }
    }
    
    return feeds;
  } catch (error) {
    console.error('❌ Failed to load price feed IDs:', error.message);
    return {};
  }
}

// Main classes and functions are already exported above
