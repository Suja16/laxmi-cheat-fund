#!/usr/bin/env node

const { ethers } = require("ethers");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Configuration
const CONTRACT_ADDRESS = "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729";
const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";
const HYPERGRAPH_API_URL = process.env.HYPERGRAPH_API_URL || "http://localhost:3001";
const START_BLOCK = process.env.START_BLOCK || 0;
const BATCH_SIZE = 1000; // Process transactions in batches

// Initialize provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Contract ABI (minimal for transaction indexing)
const CONTRACT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

class ContractIndexer {
  constructor() {
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    this.lastProcessedBlock = START_BLOCK;
    this.isRunning = false;
  }

  async start() {
    console.log(`🚀 Starting contract indexer for ${CONTRACT_ADDRESS}`);
    console.log(`📡 RPC URL: ${RPC_URL}`);
    console.log(`🔗 Hypergraph API: ${HYPERGRAPH_API_URL}`);
    
    this.isRunning = true;
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    console.log(`📦 Current block: ${currentBlock}`);
    console.log(`🔄 Starting from block: ${this.lastProcessedBlock}`);
    
    // Process historical transactions
    await this.processHistoricalTransactions(currentBlock);
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }

  async processHistoricalTransactions(currentBlock) {
    console.log(`📚 Processing historical transactions from block ${this.lastProcessedBlock} to ${currentBlock}`);
    
    for (let fromBlock = this.lastProcessedBlock; fromBlock <= currentBlock; fromBlock += BATCH_SIZE) {
      const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, currentBlock);
      
      try {
        await this.processBlockRange(fromBlock, toBlock);
        this.lastProcessedBlock = toBlock + 1;
        
        console.log(`✅ Processed blocks ${fromBlock} to ${toBlock}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error processing blocks ${fromBlock} to ${toBlock}:`, error.message);
        // Continue with next batch
      }
    }
  }

  async processBlockRange(fromBlock, toBlock) {
    // Get all transactions for the contract in this block range
    const filter = {
      address: CONTRACT_ADDRESS,
      fromBlock: fromBlock,
      toBlock: toBlock
    };

    const logs = await provider.getLogs(filter);
    
    // Group logs by transaction hash
    const transactionMap = new Map();
    
    for (const log of logs) {
      if (!transactionMap.has(log.transactionHash)) {
        transactionMap.set(log.transactionHash, []);
      }
      transactionMap.get(log.transactionHash).push(log);
    }

    // Process each transaction
    for (const [txHash, txLogs] of transactionMap) {
      try {
        await this.processTransaction(txHash, txLogs);
      } catch (error) {
        console.error(`❌ Error processing transaction ${txHash}:`, error.message);
      }
    }
  }

  async processTransaction(txHash, logs) {
    try {
      // Get transaction details
      const tx = await provider.getTransaction(txHash);
      if (!tx) return;

      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) return;

      // Get block details
      const block = await provider.getBlock(tx.blockNumber);
      if (!block) return;

      // Create transaction entity
      const transactionEntity = {
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber,
        blockTimestamp: new Date(block.timestamp * 1000).toISOString(),
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString() || "0",
        methodName: this.decodeMethodName(tx.input),
        methodId: tx.input.slice(0, 10),
        status: receipt.status === 1 ? "success" : "failed",
        contractAddress: CONTRACT_ADDRESS,
        inputData: tx.input,
        logs: JSON.stringify(logs.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          logIndex: log.logIndex
        })))
      };

      // Send to Hypergraph
      await this.sendToHypergraph('ContractTransaction', transactionEntity);

      // Process events
      for (const log of logs) {
        await this.processEvent(log, tx, block);
      }

      // Process user interactions
      await this.processUserInteraction(tx, receipt, block);

    } catch (error) {
      console.error(`❌ Error processing transaction ${txHash}:`, error.message);
    }
  }

  async processEvent(log, tx, block) {
    try {
      // Decode event
      const eventName = this.decodeEventName(log.topics[0]);
      
      const eventEntity = {
        eventName: eventName,
        eventSignature: log.topics[0],
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockTimestamp: new Date(block.timestamp * 1000).toISOString(),
        logIndex: log.logIndex,
        contractAddress: log.address,
        topics: JSON.stringify(log.topics),
        data: log.data,
        decodedData: JSON.stringify(this.decodeEventData(log, eventName))
      };

      await this.sendToHypergraph('ContractEvent', eventEntity);
    } catch (error) {
      console.error(`❌ Error processing event:`, error.message);
    }
  }

  async processUserInteraction(tx, receipt, block) {
    try {
      const interactionEntity = {
        userAddress: tx.from,
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber,
        blockTimestamp: new Date(block.timestamp * 1000).toISOString(),
        interactionType: tx.to === CONTRACT_ADDRESS ? "call" : "send",
        amount: tx.value.toString(),
        tokenAddress: null,
        contractAddress: CONTRACT_ADDRESS,
        methodName: this.decodeMethodName(tx.input),
        success: receipt.status === 1,
        gasUsed: parseInt(receipt.gasUsed.toString())
      };

      await this.sendToHypergraph('UserInteraction', interactionEntity);
    } catch (error) {
      console.error(`❌ Error processing user interaction:`, error.message);
    }
  }

  async sendToHypergraph(entityType, data) {
    try {
      const response = await axios.post(`${HYPERGRAPH_API_URL}/api/entities`, {
        entityType,
        data
      });
      
      if (response.status === 200) {
        console.log(`✅ Sent ${entityType} to Hypergraph`);
      }
    } catch (error) {
      console.error(`❌ Error sending to Hypergraph:`, error.message);
    }
  }

  decodeMethodName(input) {
    if (!input || input === "0x") return null;
    
    const methodId = input.slice(0, 10);
    
    // Common method signatures
    const methodSignatures = {
      "0xa9059cbb": "transfer",
      "0x23b872dd": "transferFrom",
      "0x095ea7b3": "approve",
      "0x70a08231": "balanceOf",
      "0x18160ddd": "totalSupply",
      "0x06fdde03": "name",
      "0x95d89b41": "symbol",
      "0x313ce567": "decimals"
    };
    
    return methodSignatures[methodId] || "unknown";
  }

  decodeEventName(topic) {
    const eventSignatures = {
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": "Transfer",
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": "Approval"
    };
    
    return eventSignatures[topic] || "Unknown";
  }

  decodeEventData(log, eventName) {
    try {
      if (eventName === "Transfer") {
        return {
          from: ethers.getAddress("0x" + log.topics[1].slice(26)),
          to: ethers.getAddress("0x" + log.topics[2].slice(26)),
          value: ethers.getBigInt(log.data).toString()
        };
      } else if (eventName === "Approval") {
        return {
          owner: ethers.getAddress("0x" + log.topics[1].slice(26)),
          spender: ethers.getAddress("0x" + log.topics[2].slice(26)),
          value: ethers.getBigInt(log.data).toString()
        };
      }
    } catch (error) {
      console.error(`❌ Error decoding event data:`, error.message);
    }
    
    return {};
  }

  startRealTimeMonitoring() {
    console.log(`👀 Starting real-time monitoring from block ${this.lastProcessedBlock}`);
    
    // Listen for new blocks
    provider.on("block", async (blockNumber) => {
      if (this.isRunning && blockNumber > this.lastProcessedBlock) {
        try {
          await this.processBlockRange(this.lastProcessedBlock, blockNumber);
          this.lastProcessedBlock = blockNumber + 1;
          console.log(`🔄 Processed new block: ${blockNumber}`);
        } catch (error) {
          console.error(`❌ Error processing new block ${blockNumber}:`, error.message);
        }
      }
    });
  }

  stop() {
    console.log("🛑 Stopping contract indexer");
    this.isRunning = false;
    provider.removeAllListeners();
  }
}

// Start the indexer
const indexer = new ContractIndexer();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  indexer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  indexer.stop();
  process.exit(0);
});

// Start indexing
indexer.start().catch(console.error);
