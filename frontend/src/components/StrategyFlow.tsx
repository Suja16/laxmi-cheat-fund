import React, { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, parseUnits } from 'viem'
import { WalletButton } from './WalletButton.js'
import StrategySelection, { type Strategy } from './StrategySelection.js'
import RiskProfileSelection, { type RiskProfile } from './RiskProfileSelection.js'
import InvestmentInput from './InvestmentInput.js'
import { 
  CheckCircleIcon, 
  ArrowRightIcon,
  ArrowLeftIcon,
  RocketLaunchIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

type FlowStep = "strategy" | "risk" | "investment" | "confirmation" | "dashboard";

interface InvestmentData {
  strategy: Strategy | null;
  riskProfile: RiskProfile | null;
  amount: number;
  currency: string;
}

interface StrategyStatus {
  strategyId: string;
  totalOrders: number;
  activeOrders: number;
  filledOrders: number;
  expiredOrders: number;
  averageOrderSize: string;
  nextExecutionTime?: Date;
}

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default function StrategyFlow() {
  const { isConnected, address } = useAccount()
  const [currentStep, setCurrentStep] = useState<FlowStep>('strategy')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [strategyStatus, setStrategyStatus] = useState<StrategyStatus | null>(null)
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    strategy: null,
    riskProfile: null,
    amount: 0,
    currency: "USDC",
  });

  // Contract write hooks
  const { writeContract, data: hash, isPending: isContractPending, error: contractError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const handleStrategySelect = (strategy: Strategy) => {
    setInvestmentData((prev) => ({ ...prev, strategy }));
    setCurrentStep("risk");
  };

  const handleRiskProfileSelect = (riskProfile: RiskProfile) => {
    setInvestmentData((prev) => ({ ...prev, riskProfile }));
    setCurrentStep("investment");
  };

  const handleInvestmentSubmit = (amount: number, currency: string) => {
    setInvestmentData((prev) => ({ ...prev, amount, currency }));
    setCurrentStep("confirmation");
  };

  const handleBack = () => {
    switch (currentStep) {
      case "risk":
        setCurrentStep("strategy");
        break;
      case "investment":
        setCurrentStep("risk");
        break;
      case "confirmation":
        setCurrentStep("investment");
        break;
    }
  };

  // Token addresses for Base Sepolia
  const TOKEN_ADDRESSES = {
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    USDT: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2"
  }

  // 1inch Limit Order Protocol address for Base Sepolia
  const LIMIT_ORDER_PROTOCOL = "0x1111111254EEB25477B68fb85Ed929f73A960582"

  const handleStartTrading = async () => {
    if (!address) {
      setError('Wallet address not found')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Approve tokens for the TWAP bot
      await approveTokens()

      // Step 2: Start TWAP strategy
      const result = await startTwapStrategy()
      
      if (result.success) {
        setStrategyStatus({
          strategyId: result.strategyId,
          totalOrders: 0,
          activeOrders: 0,
          filledOrders: 0,
          expiredOrders: 0,
          averageOrderSize: "0"
        })
        setCurrentStep('dashboard')
        alert('TWAP trading strategy started successfully!')
      }
      
    } catch (err) {
      console.error('Error starting TWAP trading:', err)
      setError(err instanceof Error ? err.message : 'Failed to start trading')
    } finally {
      setIsLoading(false)
    }
  }

  const approveTokens = async () => {
    const amount = investmentData.amount
    const tokenAddress = TOKEN_ADDRESSES[investmentData.currency as keyof typeof TOKEN_ADDRESSES]
    
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${investmentData.currency}`)
    }

    // Parse amount to 18 decimals (assuming USDC has 6 decimals, adjust as needed)
    const decimals = investmentData.currency === 'USDC' ? 6 : 18
    const amountInWei = parseUnits(amount.toString(), decimals)

    try {
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [LIMIT_ORDER_PROTOCOL as `0x${string}`, amountInWei]
      })
    } catch (err) {
      throw new Error(`Failed to approve tokens: ${err}`)
    }
  }

  const startTwapStrategy = async () => {
    // Map strategy to TWAP parameters
    const getTwapParams = () => {
      const strategy = investmentData.strategy?.id
      const amount = investmentData.amount.toString()
      
      // Default parameters
      const baseParams = {
        fromToken: TOKEN_ADDRESSES[investmentData.currency as keyof typeof TOKEN_ADDRESSES],
        toToken: TOKEN_ADDRESSES.WETH, // Default to WETH
        totalAmount: amount,
        userAddress: address
      }

      // Strategy-specific parameters
      switch (strategy) {
        case 'twap':
          return {
            ...baseParams,
            numberOfOrders: 10,
            intervalMinutes: 60,
            executionWindow: 30,
            slippageTolerance: 0.5
          }
        case 'grid':
          return {
            ...baseParams,
            numberOfOrders: 20,
            intervalMinutes: 30,
            executionWindow: 15,
            slippageTolerance: 0.3
          }
        case 'dca-hodl':
          return {
            ...baseParams,
            numberOfOrders: 5,
            intervalMinutes: 1440, // 24 hours
            executionWindow: 60,
            slippageTolerance: 1.0
          }
        default:
          return {
            ...baseParams,
            numberOfOrders: 10,
            intervalMinutes: 60,
            executionWindow: 30,
            slippageTolerance: 0.5
          }
      }
    }

    const twapParams = getTwapParams()
    
    const response = await fetch('http://localhost:3000/start-twap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(twapParams)
    })

    if (!response.ok) {
      const errorData = await response.json() as { error?: string }
      throw new Error(errorData.error || 'Failed to start TWAP trading')
    }

    const result = await response.json() as { strategyId: string }
    return { success: true, strategyId: result.strategyId }
  }

  // Monitor strategy status
  useEffect(() => {
    if (strategyStatus?.strategyId) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3000/status/${strategyStatus.strategyId}`)
          if (response.ok) {
            const status = await response.json() as Partial<StrategyStatus>
            setStrategyStatus(prev => prev ? { ...prev, ...status } : null)
          }
        } catch (err) {
          console.error('Failed to fetch strategy status:', err)
        }
      }, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [strategyStatus?.strategyId])

  const stopStrategy = async () => {
    if (!strategyStatus?.strategyId) return

    try {
      const response = await fetch(`http://localhost:3000/stop-twap/${strategyStatus.strategyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setStrategyStatus(null)
        setCurrentStep('strategy')
        alert('Strategy stopped successfully!')
      }
    } catch (err) {
      console.error('Failed to stop strategy:', err)
      setError('Failed to stop strategy')
    }
  }

  const getMinDeposit = () => {
    if (!investmentData.strategy) return 100;
    const strategyMap: { [key: string]: number } = {
      grid: 100,
      twap: 50,
      "funding-arbitrage": 200,
      "dca-hodl": 25,
      "dca-martingale": 500,
    };
    return strategyMap[investmentData.strategy.id] || 100;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-black font-bold text-3xl">L</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            Connect your wallet to access our institutional-grade trading
            strategies
          </p>
          <WalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Navigation */}
      <nav className="relative px-6 py-4 border-b border-yellow-400/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">L</span>
            </div>
            <span className="text-2xl font-bold text-white">
              Laxmi Chit Fund
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {strategyStatus && (
              <button
                onClick={() => setCurrentStep('dashboard')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChartBarIcon className="w-5 h-5 text-blue-400" />
                <span className="text-white">Strategy Dashboard</span>
              </button>
            )}
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {[
              { step: "strategy", label: "Strategy", icon: "📊" },
              { step: "risk", label: "Risk Profile", icon: "⚖️" },
              { step: "investment", label: "Investment", icon: "💰" },
              { step: "confirmation", label: "Confirm", icon: "✅" },
            ].map((item, index) => {
              const isActive = currentStep === item.step;
              const isCompleted =
                ["strategy", "risk", "investment", "confirmation"].indexOf(
                  currentStep
                ) > index;

              return (
                <div key={item.step} className="flex items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-yellow-400 text-black"
                        : "bg-gray-600 text-gray-300"
                    }
                  `}
                  >
                    {isCompleted ? "✓" : item.icon}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isActive
                        ? "text-yellow-400"
                        : isCompleted
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  {index < 3 && (
                    <ArrowRightIcon className="w-4 h-4 text-gray-500 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {currentStep === "dashboard" && strategyStatus && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Strategy Dashboard</h2>
                <button
                  onClick={stopStrategy}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Stop Strategy
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm text-gray-400 mb-2">Total Orders</h3>
                  <p className="text-2xl font-bold text-white">{strategyStatus.totalOrders}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm text-gray-400 mb-2">Active Orders</h3>
                  <p className="text-2xl font-bold text-blue-400">{strategyStatus.activeOrders}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm text-gray-400 mb-2">Filled Orders</h3>
                  <p className="text-2xl font-bold text-green-400">{strategyStatus.filledOrders}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm text-gray-400 mb-2">Expired Orders</h3>
                  <p className="text-2xl font-bold text-red-400">{strategyStatus.expiredOrders}</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Strategy Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Strategy ID:</span>
                    <p className="text-white font-mono text-sm">{strategyStatus.strategyId}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Average Order Size:</span>
                    <p className="text-white">{strategyStatus.averageOrderSize} {investmentData.currency}</p>
                  </div>
                  {strategyStatus.nextExecutionTime && (
                    <div>
                      <span className="text-gray-400">Next Execution:</span>
                      <p className="text-white">{strategyStatus.nextExecutionTime.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === "strategy" && (
          <StrategySelection onStrategySelect={handleStrategySelect} />
        )}

        {currentStep === "risk" && investmentData.strategy && (
          <div>
            <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Strategy</span>
              </button>
            </div>
            <RiskProfileSelection
              onRiskProfileSelect={handleRiskProfileSelect}
              selectedStrategy={investmentData.strategy.name}
            />
          </div>
        )}

        {currentStep === "investment" &&
          investmentData.strategy &&
          investmentData.riskProfile && (
            <div>
              <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
                <button
                  onClick={handleBack}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back to Risk Profile</span>
                </button>
              </div>
              <InvestmentInput
                onInvestmentSubmit={handleInvestmentSubmit}
                selectedStrategy={investmentData.strategy.name}
                selectedRiskProfile={investmentData.riskProfile.name}
                minDeposit={getMinDeposit()}
              />
            </div>
          )}

        {currentStep === "confirmation" && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Trading!
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Review your investment details and confirm to start your
                automated trading strategy.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-3xl p-8 border border-yellow-400/20 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Investment Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Strategy:</span>
                    <span className="text-white font-semibold">
                      {investmentData.strategy?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Risk Profile:</span>
                    <span className="text-white font-semibold">
                      {investmentData.riskProfile?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Investment Amount:</span>
                    <span className="text-yellow-400 font-bold text-lg">
                      ${investmentData.amount.toLocaleString()}{" "}
                      {investmentData.currency}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Expected APY:</span>
                    <span className="text-green-400 font-semibold">
                      {investmentData.strategy?.apy}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Risk Level:</span>
                    <span
                      className={`font-semibold ${
                        investmentData.riskProfile?.riskLevel === 1
                          ? "text-green-400"
                          : investmentData.riskProfile?.riskLevel === 2
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {investmentData.riskProfile?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Strategy Type:</span>
                    <span className="text-white font-semibold">
                      {investmentData.strategy?.description.split(".")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            )}

            {(isContractPending || isConfirming) && (
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-xl">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-blue-400 text-center">
                    {isContractPending ? 'Approving tokens...' : 'Transaction confirming...'}
                  </p>
                </div>
              </div>
            )}

            {contractError && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
                <p className="text-red-400 text-center">
                  Contract error: {contractError.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold text-lg rounded-xl hover:bg-gray-800/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back to Edit
              </button>
              <button
                onClick={handleStartTrading}
                disabled={isLoading || isContractPending || isConfirming}
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-green-600 text-black font-bold text-lg rounded-xl hover:from-green-500 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-green-400/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isContractPending || isConfirming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="w-5 h-5" />
                    <span>Start Trading Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
