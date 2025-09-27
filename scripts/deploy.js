const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VolatilityGridStrategy contracts...");

  // Get the contract factories
  const VolatilityGridStrategy = await ethers.getContractFactory("VolatilityGridStrategy");
  const VolatilityGridStrategyFactory = await ethers.getContractFactory("VolatilityGridStrategyFactory");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy the factory contract
  console.log("📦 Deploying VolatilityGridStrategyFactory...");
  const factory = await VolatilityGridStrategyFactory.deploy(deployer.address); // Use deployer as fee recipient
  await factory.deployed();
  console.log("✅ VolatilityGridStrategyFactory deployed to:", factory.address);

  // Deploy a sample strategy instance
  console.log("📦 Deploying sample VolatilityGridStrategy...");
  const strategy = await VolatilityGridStrategy.deploy(deployer.address);
  await strategy.deployed();
  console.log("✅ VolatilityGridStrategy deployed to:", strategy.address);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const factoryCount = await factory.getStrategyCount();
  console.log("Factory strategy count:", factoryCount.toString());

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    factory: factory.address,
    sampleStrategy: strategy.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log("=====================");
  console.log("Network:", deploymentInfo.network.name, `(${deploymentInfo.network.chainId})`);
  console.log("Factory Contract:", deploymentInfo.factory);
  console.log("Sample Strategy:", deploymentInfo.sampleStrategy);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Timestamp:", deploymentInfo.timestamp);

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'deployment.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment.json");

  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
