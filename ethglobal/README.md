# Laxmi Cheat Fund - Hypergraph Integration

This project integrates the Base Sepolia contract `0xA2aa501b19aff244D90cc15a4Cf739D2725B5729` with Hypergraph to index all transactions and provide queryable data.

## Features

- **Contract Transaction Indexing**: Automatically indexes all transactions for the contract
- **Event Processing**: Captures and decodes contract events
- **User Interaction Tracking**: Tracks user interactions with the contract
- **Real-time Monitoring**: Monitors new blocks and transactions in real-time
- **Query Interface**: Provides a web interface to query contract data
- **API Endpoints**: RESTful API for programmatic access to contract data

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   Update the `.env` file with your configuration:
   - `RPC_URL`: Base Sepolia RPC endpoint
   - `HYPERGRAPH_API_URL`: Hypergraph sync server URL
   - `CONTRACT_ADDRESS`: The contract address to index
   - `START_BLOCK`: Block number to start indexing from

3. **Start Hypergraph Sync Server**
   ```bash
   # Start the Hypergraph sync server (if running locally)
   hypergraph sync-server
   ```

4. **Start the Contract Indexer**
   ```bash
   npm run indexer
   ```

5. **Start the Web Application**
   ```bash
   npm run dev
   ```

## Contract Indexer

The contract indexer (`contract-indexer.js`) performs the following tasks:

- **Historical Data Processing**: Processes all historical transactions from the start block
- **Real-time Monitoring**: Listens for new blocks and processes new transactions
- **Event Decoding**: Decodes contract events and stores them in Hypergraph
- **User Interaction Tracking**: Tracks user interactions with the contract
- **Data Normalization**: Normalizes blockchain data for efficient querying

### Indexer Features

- **Batch Processing**: Processes transactions in batches to avoid rate limits
- **Error Handling**: Robust error handling with retry logic
- **Graceful Shutdown**: Handles SIGINT and SIGTERM signals
- **Progress Tracking**: Logs progress and statistics

## API Endpoints

### Contract Data API

**GET** `/api/contract-data`

Query parameters:
- `type`: `transactions`, `events`, `interactions`, or `stats`
- `limit`: Number of results to return (default: 100)
- `offset`: Number of results to skip (default: 0)
- `userAddress`: Filter by user address
- `fromBlock`: Filter by minimum block number
- `toBlock`: Filter by maximum block number
- `methodName`: Filter by method name
- `status`: Filter by transaction status

Example:
```
GET /api/contract-data?type=transactions&limit=50&userAddress=0x123...
```

## Web Interface

The contract explorer provides a web interface to:

- **View Transactions**: Browse all contract transactions with filtering
- **Explore Events**: View contract events and their decoded data
- **User Interactions**: Track user interactions with the contract
- **Statistics**: View contract statistics and metrics

## Data Schema

### ContractTransaction
- `transactionHash`: Transaction hash
- `blockNumber`: Block number
- `blockTimestamp`: Block timestamp
- `from`: Sender address
- `to`: Recipient address
- `value`: Transaction value
- `gasUsed`: Gas used
- `gasPrice`: Gas price
- `methodName`: Decoded method name
- `methodId`: Method ID
- `status`: Transaction status
- `contractAddress`: Contract address
- `inputData`: Raw input data
- `logs`: Transaction logs (JSON)

### ContractEvent
- `eventName`: Event name
- `eventSignature`: Event signature
- `transactionHash`: Transaction hash
- `blockNumber`: Block number
- `blockTimestamp`: Block timestamp
- `logIndex`: Log index
- `contractAddress`: Contract address
- `topics`: Event topics (JSON)
- `data`: Event data
- `decodedData`: Decoded event data (JSON)

### UserInteraction
- `userAddress`: User address
- `transactionHash`: Transaction hash
- `blockNumber`: Block number
- `blockTimestamp`: Block timestamp
- `interactionType`: Type of interaction
- `amount`: Amount (if applicable)
- `tokenAddress`: Token address (if applicable)
- `contractAddress`: Contract address
- `methodName`: Method name
- `success`: Success status
- `gasUsed`: Gas used

## Query Examples

### Get all transactions for a user
```javascript
const { data } = useQuery(ContractTransaction, {
  mode: 'public',
  filter: {
    from: '0x123...'
  }
});
```

### Get events in a block range
```javascript
const { data } = useQuery(ContractEvent, {
  mode: 'public',
  filter: {
    blockNumber: { gte: 1000000, lte: 1001000 }
  }
});
```

### Get user interactions
```javascript
const { data } = useQuery(UserInteraction, {
  mode: 'public',
  filter: {
    userAddress: '0x123...',
    success: true
  }
});
```

## Monitoring

The indexer provides comprehensive logging:

- **Progress Updates**: Regular progress updates during historical processing
- **Error Logging**: Detailed error logging with context
- **Performance Metrics**: Gas usage and processing statistics
- **Real-time Updates**: Live updates for new transactions

## Troubleshooting

### Common Issues

1. **RPC Rate Limits**: If you hit rate limits, increase the delay between requests
2. **Memory Usage**: For large contracts, consider processing in smaller batches
3. **Network Issues**: The indexer includes retry logic for network failures

### Logs

Check the console output for:
- Processing progress
- Error messages
- Performance statistics
- Real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License