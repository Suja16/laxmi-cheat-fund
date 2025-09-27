import { Entity, Type } from '@graphprotocol/hypergraph';

export class Token extends Entity.Class<Token>('Token')({
  id: Type.String,
  name: Type.String,
  symbol: Type.String
}) {}

export class NewsEvent extends Entity.Class<NewsEvent>('NewsEvent')({
  id: Type.String,
  title: Type.String,
  source: Type.String,
  sentiment: Type.Number,
  timestamp: Type.Number
}) {}

export class Strategy extends Entity.Class<Strategy>('Strategy')({
  id: Type.String,
  name: Type.String,
  description: Type.String
}) {}

export class StrategyRating extends Entity.Class<StrategyRating>('StrategyRating')({
  id: Type.String,
  strategy: Type.Relation(Strategy),
  score: Type.Number,
  profitabilityScore: Type.Number,
  volumeScore: Type.Number,
  riskScore: Type.Number,
  narrativeScore: Type.Number,
  lastUpdated: Type.Number
}) {}

export class TraderProfile extends Entity.Class<TraderProfile>('TraderProfile')({
  id: Type.String,
  name: Type.String
}) {}

export class TimeframePerformance extends Entity.Class<TimeframePerformance>('TimeframePerformance')({
  id: Type.String,
  profile: Type.Relation(TraderProfile),
  timeframe: Type.String,
  percentageGain: Type.Number
}) {}

export class Wallet extends Entity.Class<Wallet>('Wallet')({
  id: Type.String,
  profile: Type.Relation(TraderProfile)
}) {}

export class Trade extends Entity.Class<Trade>('Trade')({
  id: Type.String,
  wallet: Type.Relation(Wallet),
  strategy: Type.Relation(Strategy),
  baseToken: Type.Relation(Token),
  quoteToken: Type.Relation(Token),
  entryPrice: Type.Number,
  exitPrice: Type.Number,
  pnl: Type.Number,
  timestamp: Type.Number,
  relatedNews: Type.Relation(NewsEvent)
}) {}

export class Project extends Entity.Class<Project>('Project')({
  id: Type.String,
  name: Type.String,
  description: Type.String,
  xUrl: Type.optional(Type.String),
  avatar: Type.optional(Type.String)
}) {}

export class Asset extends Entity.Class<Asset>('Asset')({
  id: Type.String,
  name: Type.String,
  symbol: Type.String,
  price: Type.Number,
  blockchainAddress: Type.String
}) {}

export class Dapp extends Entity.Class<Dapp>('Dapp')({
  id: Type.String,
  name: Type.String,
  description: Type.String,
  xUrl: Type.optional(Type.String),
  githubUrl: Type.optional(Type.String),
  avatar: Type.optional(Type.String)
}) {}

export class Investor extends Entity.Class<Investor>('Investor')({
  id: Type.String,
  name: Type.String
}) {}

export class FundingStage extends Entity.Class<FundingStage>('FundingStage')({
  id: Type.String,
  name: Type.String
}) {}

export class InvestmentRound extends Entity.Class<InvestmentRound>('InvestmentRound')({
  id: Type.String,
  name: Type.String,
  raisedAmount: Type.Number,
  investors: Type.Relation(Investor),
  fundingStages: Type.Relation(FundingStage),
  raisedBy: Type.Relation(Project)
}) {}

export class Analytics extends Entity.Class<Analytics>('Analytics')({
  id: Type.String,
  name: Type.String,
  data: Type.String
}) {}

export class Report extends Entity.Class<Report>('Report')({
  id: Type.String,
  title: Type.String,
  content: Type.String,
  timestamp: Type.Number
}) {}
