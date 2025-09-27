import { useState } from 'react'
import { useAccount } from 'wagmi'
import { WalletButton } from './WalletButton'
import StrategySelection, { Strategy } from './StrategySelection'
import RiskProfileSelection, { RiskProfile } from './RiskProfileSelection'
import InvestmentInput from './InvestmentInput'
import { 
  CheckCircleIcon, 
  ArrowRightIcon,
  ArrowLeftIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

type FlowStep = 'strategy' | 'risk' | 'investment' | 'confirmation'

interface InvestmentData {
  strategy: Strategy | null
  riskProfile: RiskProfile | null
  amount: number
  currency: string
}

export default function StrategyFlow() {
  const { isConnected } = useAccount()
  const [currentStep, setCurrentStep] = useState<FlowStep>('strategy')
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    strategy: null,
    riskProfile: null,
    amount: 0,
    currency: 'USDC'
  })

  const handleStrategySelect = (strategy: Strategy) => {
    setInvestmentData(prev => ({ ...prev, strategy }))
    setCurrentStep('risk')
  }

  const handleRiskProfileSelect = (riskProfile: RiskProfile) => {
    setInvestmentData(prev => ({ ...prev, riskProfile }))
    setCurrentStep('investment')
  }

  const handleInvestmentSubmit = (amount: number, currency: string) => {
    setInvestmentData(prev => ({ ...prev, amount, currency }))
    setCurrentStep('confirmation')
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'risk':
        setCurrentStep('strategy')
        break
      case 'investment':
        setCurrentStep('risk')
        break
      case 'confirmation':
        setCurrentStep('investment')
        break
    }
  }

  const handleStartTrading = () => {
    // Here you would typically integrate with your smart contract
    console.log('Starting trading with:', investmentData)
    alert('Trading started! (This is a demo - integrate with your smart contract)')
  }

  const getMinDeposit = () => {
    if (!investmentData.strategy) return 100
    const strategyMap: { [key: string]: number } = {
      'grid': 100,
      'twap': 50,
      'funding-arbitrage': 200,
      'dca-hodl': 25,
      'dca-martingale': 500
    }
    return strategyMap[investmentData.strategy.id] || 100
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-black font-bold text-3xl">L</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            Connect your wallet to access our institutional-grade trading strategies
          </p>
          <WalletButton />
        </div>
      </div>
    )
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
            <span className="text-2xl font-bold text-white">Laxmi Cheat Fund</span>
          </div>
          <WalletButton />
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {[
              { step: 'strategy', label: 'Strategy', icon: '📊' },
              { step: 'risk', label: 'Risk Profile', icon: '⚖️' },
              { step: 'investment', label: 'Investment', icon: '💰' },
              { step: 'confirmation', label: 'Confirm', icon: '✅' }
            ].map((item, index) => {
              const isActive = currentStep === item.step
              const isCompleted = [
                'strategy', 'risk', 'investment', 'confirmation'
              ].indexOf(currentStep) > index
              
              return (
                <div key={item.step} className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-yellow-400 text-black' 
                        : 'bg-gray-600 text-gray-300'
                    }
                  `}>
                    {isCompleted ? '✓' : item.icon}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-yellow-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                  {index < 3 && (
                    <ArrowRightIcon className="w-4 h-4 text-gray-500 mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {currentStep === 'strategy' && (
          <StrategySelection onStrategySelect={handleStrategySelect} />
        )}

        {currentStep === 'risk' && investmentData.strategy && (
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

        {currentStep === 'investment' && investmentData.strategy && investmentData.riskProfile && (
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

        {currentStep === 'confirmation' && (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Trading!
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Review your investment details and confirm to start your automated trading strategy.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-3xl p-8 border border-yellow-400/20 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Investment Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Strategy:</span>
                    <span className="text-white font-semibold">{investmentData.strategy?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Risk Profile:</span>
                    <span className="text-white font-semibold">{investmentData.riskProfile?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Investment Amount:</span>
                    <span className="text-yellow-400 font-bold text-lg">
                      ${investmentData.amount.toLocaleString()} {investmentData.currency}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Expected APY:</span>
                    <span className="text-green-400 font-semibold">{investmentData.strategy?.apy}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Risk Level:</span>
                    <span className={`font-semibold ${
                      investmentData.riskProfile?.riskLevel === 1 ? 'text-green-400' :
                      investmentData.riskProfile?.riskLevel === 2 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {investmentData.riskProfile?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <span className="text-gray-400">Strategy Type:</span>
                    <span className="text-white font-semibold">{investmentData.strategy?.description.split('.')[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBack}
                className="px-8 py-4 border-2 border-gray-600 text-gray-300 font-semibold text-lg rounded-xl hover:bg-gray-800/50 transition-all duration-200"
              >
                Back to Edit
              </button>
              <button
                onClick={handleStartTrading}
                className="px-8 py-4 bg-gradient-to-r from-green-400 to-green-600 text-black font-bold text-lg rounded-xl hover:from-green-500 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-green-400/25 flex items-center space-x-2"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                <span>Start Trading Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
