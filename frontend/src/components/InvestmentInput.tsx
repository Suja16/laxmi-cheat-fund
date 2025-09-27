import { useState, useEffect } from 'react'
import { CurrencyDollarIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface InvestmentInputProps {
  onInvestmentSubmit: (amount: number, currency: string) => void
  selectedStrategy: string
  selectedRiskProfile: string
  minDeposit: number
}

const currencies = [
  { id: 'USDC', name: 'USDC', symbol: '$', decimals: 2 },
  { id: 'USDT', name: 'USDT', symbol: '$', decimals: 2 },
  { id: 'ETH', name: 'Ethereum', symbol: 'Ξ', decimals: 4 },
  { id: 'BTC', name: 'Bitcoin', symbol: '₿', decimals: 6 }
]

const quickAmounts = [100, 500, 1000, 2500, 5000, 10000]

export default function InvestmentInput({ 
  onInvestmentSubmit, 
  selectedStrategy, 
  selectedRiskProfile, 
  minDeposit 
}: InvestmentInputProps) {
  const [amount, setAmount] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('USDC')
  const [errors, setErrors] = useState<string[]>([])
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    validateInput()
  }, [amount, selectedCurrency])

  const validateInput = () => {
    const newErrors: string[] = []
    const numAmount = parseFloat(amount)

    if (!amount || isNaN(numAmount)) {
      newErrors.push('Please enter a valid amount')
    } else if (numAmount < minDeposit) {
      newErrors.push(`Minimum deposit is ${minDeposit}`)
    } else if (numAmount > 1000000) {
      newErrors.push('Maximum deposit is $1,000,000')
    } else if (numAmount <= 0) {
      newErrors.push('Amount must be greater than 0')
    }

    setErrors(newErrors)
    setIsValid(newErrors.length === 0 && numAmount > 0)
  }

  const handleAmountChange = (value: string) => {
    // Allow only numbers and one decimal point
    const sanitized = value.replace(/[^0-9.]/g, '')
    const parts = sanitized.split('.')
    
    if (parts.length <= 2) {
      if (parts[1] && parts[1].length > 2) {
        setAmount(parts[0] + '.' + parts[1].substring(0, 2))
      } else {
        setAmount(sanitized)
      }
    }
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onInvestmentSubmit(parseFloat(amount), selectedCurrency)
    }
  }

  const selectedCurrencyInfo = currencies.find(c => c.id === selectedCurrency)

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Investment Amount
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Enter how much you want to invest in your {selectedStrategy} strategy with {selectedRiskProfile} risk profile.
        </p>
      </div>

      <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-3xl p-8 border border-yellow-400/20">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Currency Selection */}
          <div>
            <label className="block text-white font-semibold mb-4 text-lg">
              Select Currency
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currencies.map((currency) => (
                <button
                  key={currency.id}
                  type="button"
                  onClick={() => setSelectedCurrency(currency.id)}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    ${selectedCurrency === currency.id
                      ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                      : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-1">{currency.symbol}</div>
                    <div className="text-sm">{currency.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-white font-semibold mb-4 text-lg">
              Investment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={`Enter amount (min ${minDeposit})`}
                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border-2 border-gray-600 rounded-xl text-white text-xl placeholder-gray-400 focus:border-yellow-400 focus:outline-none transition-colors"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <span className="text-gray-400 text-lg">{selectedCurrencyInfo?.symbol}</span>
              </div>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-gray-300 font-medium mb-3">
              Quick Select
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className="px-4 py-2 bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600/50 hover:border-gray-500 transition-colors"
                >
                  {selectedCurrencyInfo?.symbol}{quickAmount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Validation Messages */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-400 font-semibold mb-1">Please fix the following issues:</h4>
                  <ul className="text-red-300 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Investment Summary */}
          {isValid && amount && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-green-400 font-semibold mb-2">Investment Summary</h4>
                  <div className="space-y-1 text-green-300">
                    <p>Strategy: <span className="text-white">{selectedStrategy}</span></p>
                    <p>Risk Profile: <span className="text-white">{selectedRiskProfile}</span></p>
                    <p>Amount: <span className="text-white">{selectedCurrencyInfo?.symbol}{parseFloat(amount).toLocaleString()}</span></p>
                    <p>Currency: <span className="text-white">{selectedCurrencyInfo?.name}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isValid}
              className={`
                w-full py-4 px-8 rounded-xl font-bold text-lg transition-all duration-200
                ${isValid
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700 shadow-lg hover:shadow-yellow-400/25'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isValid ? 'Confirm Investment' : 'Enter Valid Amount'}
            </button>
          </div>
        </form>
      </div>

      {/* Strategy Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <h4 className="text-white font-semibold mb-2">Minimum Deposit</h4>
          <p className="text-yellow-400 text-xl font-bold">{selectedCurrencyInfo?.symbol}{minDeposit}</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <h4 className="text-white font-semibold mb-2">Strategy Type</h4>
          <p className="text-gray-300">{selectedStrategy}</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <h4 className="text-white font-semibold mb-2">Risk Level</h4>
          <p className="text-gray-300">{selectedRiskProfile}</p>
        </div>
      </div>
    </div>
  )
}
