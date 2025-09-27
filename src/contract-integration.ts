import { ethers } from 'ethers';
import { ethersCompat } from './ethers-compat.js';

// Contract ABI (simplified for demonstration)
const VOLATILITY_GRID_STRATEGY_ABI = [
  // Events
  "event GridOrderCreated(address indexed user, uint256 indexed orderId, uint8 orderType, uint8 gridLevel, uint256 triggerPrice, uint256 makingAmount, uint256 takingAmount)",
  "event GridOrderFilled(address indexed user, uint256 indexed orderId, uint256 filledAmount, uint256 profit)",
  "event GridOrderCancelled(address indexed user, uint256 indexed orderId)",
  "event GridRebalanced(address indexed user, uint256 newPrice, uint8 newLevels)",
  "event ConfigUpdated(address indexed user, address baseToken, address quoteToken, uint8 gridLevels, uint16 priceRange)",
  
  // View functions
  "function getUserConfig(address user) external view returns (tuple(address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount, uint8 gridLevels, uint16 priceRange, uint16 profitTarget, uint16 slippageTolerance, bool autoRebalance, uint8 rebalanceThreshold))",
  "function getUserOrder(address user, uint256 orderId) external view returns (tuple(uint256 orderId, address maker, address makerAsset, address takerAsset, uint256 makingAmount, uint256 takingAmount, uint256 triggerPrice, int8 gridLevel, uint8 orderType, uint8 status, uint256 createdAt, uint256 expiresAt, uint256 remainingAmount))",
  "function getUserGridLevel(address user, int8 level) external view returns (tuple(uint256 buyPrice, uint256 sellPrice, bool hasActiveBuy, bool hasActiveSell))",
  "function getUserOrderCount(address user) external view returns (uint256)",
  "function getUserActiveOrders(address user) external view returns (uint256[])",
  "function getStrategyStats() external view returns (uint256 totalOrders, uint256 totalFilledOrders, uint256 totalProfit, uint256 protocolFeeBps)",
  
  // State-changing functions
  "function setGridConfig(tuple(address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount, uint8 gridLevels, uint16 priceRange, uint16 profitTarget, uint16 slippageTolerance, bool autoRebalance, uint8 rebalanceThreshold) config) external",
  "function createGridOrders(uint256 currentPrice) external",
  "function executeGridOrder(address user, uint256 orderId, uint256 actualPrice) external",
  "function cancelGridOrder(uint256 orderId) external",
  "function rebalanceGrid(uint256 newPrice) external",
  "function emergencyStop() external"
];

export interface ContractGridConfig {
  baseToken: string;
  quoteToken: string;
  baseAmount: string;
  quoteAmount: string;
  gridLevels: number;
  priceRange: number;
  profitTarget: number;
  slippageTolerance: number;
  autoRebalance: boolean;
  rebalanceThreshold: number;
}

export interface ContractGridOrder {
  orderId: string;
  maker: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  triggerPrice: string;
  gridLevel: number;
  orderType: number;
  status: number;
  createdAt: string;
  expiresAt: string;
  remainingAmount: string;
}

export interface ContractGridLevel {
  buyPrice: string;
  sellPrice: string;
  hasActiveBuy: boolean;
  hasActiveSell: boolean;
}

export interface ContractStats {
  totalOrders: string;
  totalFilledOrders: string;
  totalProfit: string;
  protocolFeeBps: string;
}

export class VolatilityGridStrategyContract {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(
    contractAddress: string,
    provider: ethers.Provider,
    signer: ethers.Signer
  ) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      contractAddress,
      VOLATILITY_GRID_STRATEGY_ABI,
      signer
    );
  }

  /**
   * Set grid configuration on the smart contract
   */
  async setGridConfig(config: ContractGridConfig): Promise<void> {
    console.log('📝 Setting grid configuration on contract...');
    
    const tx = await this.contract.setGridConfig([
      config.baseToken,
      config.quoteToken,
      config.baseAmount,
      config.quoteAmount,
      config.gridLevels,
      config.priceRange,
      config.profitTarget,
      config.slippageTolerance,
      config.autoRebalance,
      config.rebalanceThreshold
    ]);
    
    await tx.wait();
    console.log('✅ Grid configuration set successfully');
  }

  /**
   * Create grid orders on the smart contract
   */
  async createGridOrders(currentPrice: number): Promise<void> {
    console.log('🚀 Creating grid orders on contract...');
    
    const tx = await this.contract.createGridOrders(
      ethersCompat.parseUnits(currentPrice.toString(), 6) // Assuming 6 decimals for price
    );
    
    await tx.wait();
    console.log('✅ Grid orders created successfully');
  }

  /**
   * Execute a grid order
   */
  async executeGridOrder(user: string, orderId: string, actualPrice: number): Promise<void> {
    console.log(`🎯 Executing grid order ${orderId} for user ${user}...`);
    
    const tx = await this.contract.executeGridOrder(
      user,
      orderId,
      ethersCompat.parseUnits(actualPrice.toString(), 6)
    );
    
    await tx.wait();
    console.log('✅ Grid order executed successfully');
  }

  /**
   * Cancel a grid order
   */
  async cancelGridOrder(orderId: string): Promise<void> {
    console.log(`🚫 Cancelling grid order ${orderId}...`);
    
    const tx = await this.contract.cancelGridOrder(orderId);
    await tx.wait();
    console.log('✅ Grid order cancelled successfully');
  }

  /**
   * Rebalance the entire grid
   */
  async rebalanceGrid(newPrice: number): Promise<void> {
    console.log('🔄 Rebalancing grid on contract...');
    
    const tx = await this.contract.rebalanceGrid(
      ethersCompat.parseUnits(newPrice.toString(), 6)
    );
    
    await tx.wait();
    console.log('✅ Grid rebalanced successfully');
  }

  /**
   * Emergency stop - cancel all orders
   */
  async emergencyStop(): Promise<void> {
    console.log('🚨 Executing emergency stop on contract...');
    
    const tx = await this.contract.emergencyStop();
    await tx.wait();
    console.log('✅ Emergency stop executed successfully');
  }

  /**
   * Get user's grid configuration
   */
  async getUserConfig(user: string): Promise<ContractGridConfig> {
    const config = await this.contract.getUserConfig(user);
    return {
      baseToken: config[0],
      quoteToken: config[1],
      baseAmount: config[2].toString(),
      quoteAmount: config[3].toString(),
      gridLevels: config[4],
      priceRange: config[5],
      profitTarget: config[6],
      slippageTolerance: config[7],
      autoRebalance: config[8],
      rebalanceThreshold: config[9]
    };
  }

  /**
   * Get user's grid order
   */
  async getUserOrder(user: string, orderId: string): Promise<ContractGridOrder> {
    const order = await this.contract.getUserOrder(user, orderId);
    return {
      orderId: order[0].toString(),
      maker: order[1],
      makerAsset: order[2],
      takerAsset: order[3],
      makingAmount: order[4].toString(),
      takingAmount: order[5].toString(),
      triggerPrice: order[6].toString(),
      gridLevel: order[7],
      orderType: order[8],
      status: order[9],
      createdAt: order[10].toString(),
      expiresAt: order[11].toString(),
      remainingAmount: order[12].toString()
    };
  }

  /**
   * Get user's grid level
   */
  async getUserGridLevel(user: string, level: number): Promise<ContractGridLevel> {
    const gridLevel = await this.contract.getUserGridLevel(user, level);
    return {
      buyPrice: gridLevel[0].toString(),
      sellPrice: gridLevel[1].toString(),
      hasActiveBuy: gridLevel[2],
      hasActiveSell: gridLevel[3]
    };
  }

  /**
   * Get user's order count
   */
  async getUserOrderCount(user: string): Promise<number> {
    const count = await this.contract.getUserOrderCount(user);
    return Number(count.toString());
  }

  /**
   * Get user's active orders
   */
  async getUserActiveOrders(user: string): Promise<string[]> {
    const orders = await this.contract.getUserActiveOrders(user);
    return orders.map((order: any) => order.toString());
  }

  /**
   * Get strategy statistics
   */
  async getStrategyStats(): Promise<ContractStats> {
    const stats = await this.contract.getStrategyStats();
    return {
      totalOrders: stats[0].toString(),
      totalFilledOrders: stats[1].toString(),
      totalProfit: stats[2].toString(),
      protocolFeeBps: stats[3].toString()
    };
  }

  /**
   * Listen to contract events
   */
  setupEventListeners(userAddress: string): void {
    console.log('👂 Setting up contract event listeners...');

    // Listen for order creation events
    this.contract.on('GridOrderCreated', (eventUser, orderId, orderType, gridLevel, triggerPrice, makingAmount, takingAmount) => {
      if (eventUser.toLowerCase() === userAddress.toLowerCase()) {
        console.log(`📋 New grid order created: ID ${orderId}, Type ${orderType}, Level ${gridLevel}`);
      }
    });

    // Listen for order fill events
    this.contract.on('GridOrderFilled', (eventUser, orderId, filledAmount, profit) => {
      if (eventUser.toLowerCase() === userAddress.toLowerCase()) {
        console.log(`✅ Grid order filled: ID ${orderId}, Amount ${ethersCompat.formatUnits(filledAmount, 18)}, Profit ${ethersCompat.formatUnits(profit, 18)}`);
      }
    });

    // Listen for order cancellation events
    this.contract.on('GridOrderCancelled', (eventUser, orderId) => {
      if (eventUser.toLowerCase() === userAddress.toLowerCase()) {
        console.log(`🚫 Grid order cancelled: ID ${orderId}`);
      }
    });

    // Listen for grid rebalancing events
    this.contract.on('GridRebalanced', (eventUser, newPrice, newLevels) => {
      if (eventUser.toLowerCase() === userAddress.toLowerCase()) {
        console.log(`🔄 Grid rebalanced: New price ${ethersCompat.formatUnits(newPrice, 6)}, Levels ${newLevels}`);
      }
    });

    console.log('✅ Event listeners set up successfully');
  }

  /**
   * Remove event listeners
   */
  removeEventListeners(): void {
    console.log('🔇 Removing contract event listeners...');
    this.contract.removeAllListeners();
    console.log('✅ Event listeners removed');
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contract.target as string;
  }

  /**
   * Get contract instance for advanced operations
   */
  getContract(): ethers.Contract {
    return this.contract;
  }
}

/**
 * Factory class to create contract instances
 */
export class VolatilityGridStrategyContractFactory {
  private provider: ethers.Provider;
  private signer: ethers.Signer;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  /**
   * Create a contract instance
   */
  createContract(contractAddress: string): VolatilityGridStrategyContract {
    return new VolatilityGridStrategyContract(contractAddress, this.provider, this.signer);
  }

  /**
   * Deploy a new contract instance (requires factory contract)
   */
  async deployNewStrategy(factoryAddress: string): Promise<string> {
    console.log('🏭 Deploying new strategy contract...');
    
    const factoryABI = [
      "function deployStrategy() external returns (address strategy)"
    ];
    
    const factory = new ethers.Contract(factoryAddress, factoryABI, this.signer);
    const tx = await factory.deployStrategy();
    const receipt = await tx.wait();
    
    // Extract contract address from events
    const event = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === 'StrategyDeployed';
      } catch {
        return false;
      }
    });
    
    if (event) {
      const parsed = factory.interface.parseLog(event);
      const contractAddress = parsed.args.strategy;
      console.log(`✅ New strategy deployed at: ${contractAddress}`);
      return contractAddress;
    } else {
      throw new Error('Failed to extract contract address from deployment');
    }
  }
}
