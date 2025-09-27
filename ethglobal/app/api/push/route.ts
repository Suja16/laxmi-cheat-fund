import { NextRequest, NextResponse } from 'next/server';
import { createOrOpenSpace } from '@graphprotocol/hypergraph';
import { Trade, Token, Analytics, Report } from '../../schema';

export async function POST(request: NextRequest) {
  try {
    const tradeData = await request.json();
    
    // Create or open the public space
    const space = await createOrOpenSpace('ethglobal-trades');
    
    const documents = [];
    const timestamp = new Date().toISOString();
    
    // Create tokens from unique symbols in trades
    const tokenSymbols = new Set<string>();
    tradeData.allTrades?.forEach((trade: any) => {
      tokenSymbols.add(trade.entry.tokenSymbol);
    });
    
    // Create Token documents
    for (const symbol of tokenSymbols) {
      const tokenDoc = {
        '@context': {
          '@vocab': 'https://schema.org/',
          'hasAsset': { '@type': '@id' }
        },
        '@id': `urn:token:${symbol}`,
        '@type': 'Token',
        symbol: symbol,
        name: symbol
      };
      documents.push(tokenDoc);
    }
    
    // Create Analytics documents for each trade
    tradeData.allTrades?.forEach((trade: any) => {
      if (trade.analytics) {
        const analyticsDoc = {
          '@context': {
            '@vocab': 'https://schema.org/'
          },
          '@id': `urn:analytics:${trade.tradeId}`,
          '@type': 'Analytics',
          volatility: trade.analytics.volatility,
          marketCondition: trade.analytics.marketCondition,
          gridPosition: trade.analytics.gridPosition
        };
        documents.push(analyticsDoc);
      }
    });
    
    // Create Trade documents
    tradeData.allTrades?.forEach((trade: any) => {
      const tradeDoc = {
        '@context': {
          '@vocab': 'https://schema.org/',
          'hasAsset': { '@type': '@id' },
          'hasAnalytics': { '@type': '@id' }
        },
        '@id': `urn:trade:${trade.tradeId}`,
        '@type': 'Trade',
        tradeId: trade.tradeId,
        orderType: trade.entry.orderType,
        price: trade.entry.price,
        amount: trade.entry.amount,
        tokenSymbol: trade.entry.tokenSymbol,
        timestamp: trade.entry.timestamp,
        profitLoss: trade.profitLoss?.amount,
        percentage: trade.profitLoss?.percentage,
        gasCost: trade.profitLoss?.gasCost,
        netProfit: trade.profitLoss?.netProfit,
        status: trade.status,
        hasAsset: `urn:token:${trade.entry.tokenSymbol}`,
        hasAnalytics: `urn:analytics:${trade.tradeId}`
      };
      documents.push(tradeDoc);
    });
    
    // Create Report document
    if (tradeData.summary) {
      const reportDoc = {
        '@context': {
          '@vocab': 'https://schema.org/',
          'includesTrade': { '@type': '@id' }
        },
        '@id': `urn:report:${timestamp}`,
        '@type': 'Report',
        totalTrades: tradeData.summary.totalTrades,
        winningTrades: tradeData.summary.winningTrades,
        losingTrades: tradeData.summary.losingTrades,
        winRate: tradeData.summary.winRate,
        totalProfit: tradeData.summary.totalProfit,
        totalLoss: tradeData.summary.totalLoss,
        netProfit: tradeData.summary.netProfit,
        averageProfit: tradeData.summary.averageProfit,
        averageLoss: tradeData.summary.averageLoss,
        timestamp: timestamp,
        includesTrade: tradeData.allTrades?.map((trade: any) => `urn:trade:${trade.tradeId}`) || []
      };
      documents.push(reportDoc);
    }
    
    // Push all documents to the space
    for (const doc of documents) {
      await space.putDocument(doc);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully stored ${documents.length} documents`,
      documents: documents.length
    });
    
  } catch (error) {
    console.error('Error pushing trade data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store trade data' },
      { status: 500 }
    );
  }
}
