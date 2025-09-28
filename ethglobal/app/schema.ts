import { Entity, Type } from '@graphprotocol/hypergraph';

export class Image extends Entity.Class<Image>('Image')({
  url: Type.String,
}) {}

export class Project extends Entity.Class<Project>('Project')({
  name: Type.String,
  description: Type.optional(Type.String),
  xUrl: Type.optional(Type.String),
  avatar: Type.Relation(Image),
}) {}

export class Dapp extends Entity.Class<Dapp>('Dapp')({
  name: Type.String,
  description: Type.optional(Type.String),
  xUrl: Type.optional(Type.String),
  githubUrl: Type.optional(Type.String),
  avatar: Type.Relation(Image),
}) {}

export class Investor extends Entity.Class<Investor>('Investor')({
  name: Type.String,
}) {}

export class FundingStage extends Entity.Class<FundingStage>('FundingStage')({
  name: Type.String,
}) {}

export class InvestmentRound extends Entity.Class<InvestmentRound>('InvestmentRound')({
  name: Type.String,
  raisedAmount: Type.optional(Type.Number),
  investors: Type.Relation(Investor),
  fundingStages: Type.Relation(FundingStage),
  raisedBy: Type.Relation(Project),
}) {}

export class Asset extends Entity.Class<Asset>('Asset')({
  name: Type.String,
  symbol: Type.optional(Type.String),
  blockchainAddress: Type.optional(Type.String),
}) {}

// Trade Analysis Schema
export class Token extends Entity.Class<Token>('Token')({
  symbol: Type.String,
  name: Type.optional(Type.String),
}) {}

export class Analytics extends Entity.Class<Analytics>('Analytics')({
  volatility: Type.Number,
  marketCondition: Type.String,
  gridPosition: Type.String,
}) {}

export class Trade extends Entity.Class<Trade>('Trade')({
  tradeId: Type.String,
  orderType: Type.String,
  price: Type.Number,
  amount: Type.Number,
  tokenSymbol: Type.String,
  timestamp: Type.String,
  profitLoss: Type.optional(Type.Number),
  percentage: Type.optional(Type.Number),
  gasCost: Type.optional(Type.Number),
  netProfit: Type.optional(Type.Number),
  status: Type.String,
  hasAsset: Type.Relation(Token),
  hasAnalytics: Type.Relation(Analytics),
}) {}

export class Report extends Entity.Class<Report>('Report')({
  totalTrades: Type.Number,
  winningTrades: Type.Number,
  losingTrades: Type.Number,
  winRate: Type.Number,
  totalProfit: Type.Number,
  totalLoss: Type.Number,
  netProfit: Type.Number,
  averageProfit: Type.Number,
  averageLoss: Type.Number,
  timestamp: Type.String,
  includesTrade: Type.Relation(Trade),
}) {}

// Contract Transaction Schema
export class ContractTransaction extends Entity.Class<ContractTransaction>('ContractTransaction')({
  transactionHash: Type.String,
  blockNumber: Type.Number,
  blockTimestamp: Type.String,
  from: Type.String,
  to: Type.String,
  value: Type.String,
  gasUsed: Type.Number,
  gasPrice: Type.String,
  methodName: Type.optional(Type.String),
  methodId: Type.optional(Type.String),
  status: Type.String, // success, failed, pending
  contractAddress: Type.String,
  inputData: Type.optional(Type.String),
  logs: Type.optional(Type.String), // JSON string of logs
}) {}

// Contract Event Schema
export class ContractEvent extends Entity.Class<ContractEvent>('ContractEvent')({
  eventName: Type.String,
  eventSignature: Type.String,
  transactionHash: Type.String,
  blockNumber: Type.Number,
  blockTimestamp: Type.String,
  logIndex: Type.Number,
  contractAddress: Type.String,
  topics: Type.String, // JSON string of topics
  data: Type.optional(Type.String),
  decodedData: Type.optional(Type.String), // JSON string of decoded parameters
}) {}

// Contract State Schema
export class ContractState extends Entity.Class<ContractState>('ContractState')({
  contractAddress: Type.String,
  blockNumber: Type.Number,
  blockTimestamp: Type.String,
  stateKey: Type.String,
  stateValue: Type.String,
  stateType: Type.String, // storage, balance, code, etc.
}) {}

// User Interaction Schema
export class UserInteraction extends Entity.Class<UserInteraction>('UserInteraction')({
  userAddress: Type.String,
  transactionHash: Type.String,
  blockNumber: Type.Number,
  blockTimestamp: Type.String,
  interactionType: Type.String, // call, send, receive, etc.
  amount: Type.optional(Type.String),
  tokenAddress: Type.optional(Type.String),
  contractAddress: Type.String,
  methodName: Type.optional(Type.String),
  success: Type.Boolean,
  gasUsed: Type.Number,
}) {}
