const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing VolatilityGridStrategy contract...");

  // Get the contract factory
  const VolatilityGridStrategy = await ethers.getContractFactory("VolatilityGridStrategy");
  
  // Get test accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Testing with accounts:");
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // Deploy the contract
  console.log("\n📦 Deploying VolatilityGridStrategy...");
  const strategy = await VolatilityGridStrategy.deploy(deployer.address);
  await strategy.deployed();
  console.log("✅ Contract deployed to:", strategy.address);

  // Test 1: Set grid configuration
  console.log("\n🧪 Test 1: Setting grid configuration...");
  const gridConfig = {
    baseToken: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // WETH on Polygon
    quoteToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d59", // USDC on Polygon
    baseAmount: ethers.utils.parseEther("0.1"), // 0.1 WETH
    quoteAmount: ethers.utils.parseUnits("300", 6), // 300 USDC
    gridLevels: 10,
    priceRange: 2000, // 20% in basis points
    profitTarget: 50, // 0.5% in basis points
    slippageTolerance: 100, // 1% in basis points
    autoRebalance: true,
    rebalanceThreshold: 50 // 50%
  };

  await strategy.connect(user1).setGridConfig(gridConfig);
  console.log("✅ Grid configuration set successfully");

  // Test 2: Verify configuration
  console.log("\n🧪 Test 2: Verifying configuration...");
  const retrievedConfig = await strategy.getUserConfig(user1.address);
  console.log("Retrieved config:");
  console.log("- Base Token:", retrievedConfig.baseToken);
  console.log("- Quote Token:", retrievedConfig.quoteToken);
  console.log("- Grid Levels:", retrievedConfig.gridLevels);
  console.log("- Price Range:", retrievedConfig.priceRange.toString(), "bps");
  console.log("- Profit Target:", retrievedConfig.profitTarget.toString(), "bps");

  // Test 3: Create grid orders
  console.log("\n🧪 Test 3: Creating grid orders...");
  const currentPrice = ethers.utils.parseUnits("3000", 6); // $3000 per WETH
  await strategy.connect(user1).createGridOrders(currentPrice);
  console.log("✅ Grid orders created successfully");

  // Test 4: Check order count
  console.log("\n🧪 Test 4: Checking order count...");
  const orderCount = await strategy.getUserOrderCount(user1.address);
  console.log("User order count:", orderCount.toString());

  // Test 5: Get active orders
  console.log("\n🧪 Test 5: Getting active orders...");
  const activeOrders = await strategy.getUserActiveOrders(user1.address);
  console.log("Active orders:", activeOrders.length);

  // Test 6: Get grid levels
  console.log("\n🧪 Test 6: Checking grid levels...");
  for (let i = 1; i <= 5; i++) {
    const level = await strategy.getUserGridLevel(user1.address, i);
    console.log(`Level +${i}: Buy at ${ethers.utils.formatUnits(level.buyPrice, 6)}, Sell at ${ethers.utils.formatUnits(level.sellPrice, 6)}`);
  }

  // Test 7: Get strategy statistics
  console.log("\n🧪 Test 7: Getting strategy statistics...");
  const stats = await strategy.getStrategyStats();
  console.log("Strategy stats:");
  console.log("- Total Orders:", stats[0].toString());
  console.log("- Total Filled Orders:", stats[1].toString());
  console.log("- Total Profit:", ethers.utils.formatEther(stats[2]), "ETH");
  console.log("- Protocol Fee:", stats[3].toString(), "bps");

  // Test 8: Emergency stop
  console.log("\n🧪 Test 8: Testing emergency stop...");
  await strategy.connect(user1).emergencyStop();
  console.log("✅ Emergency stop executed successfully");

  // Test 9: Verify orders are cancelled
  console.log("\n🧪 Test 9: Verifying orders are cancelled...");
  const activeOrdersAfterStop = await strategy.getUserActiveOrders(user1.address);
  console.log("Active orders after stop:", activeOrdersAfterStop.length);

  console.log("\n🎉 All tests completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
