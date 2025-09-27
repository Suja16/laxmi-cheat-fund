import { useState } from 'react'
import { 
  ShieldCheckIcon, 
  ScaleIcon, 
  BoltIcon 
} from '@heroicons/react/24/outline'

export interface RiskProfile {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  riskLevel: number
  expectedReturn: string
  maxDrawdown: string
  characteristics: string[]
}

const riskProfiles: RiskProfile[] = [
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Low risk, stable returns with capital preservation focus',
    icon: ShieldCheckIcon,
    riskLevel: 1,
    expectedReturn: '8-15%',
    maxDrawdown: '5-10%',
    characteristics: [
      'Capital preservation priority',
      'Lower volatility exposure',
      'Stable, predictable returns',
      'Suitable for risk-averse investors'
    ]
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Moderate risk with balanced risk-return profile',
    icon: ScaleIcon,
    riskLevel: 2,
    expectedReturn: '15-25%',
    maxDrawdown: '10-20%',
    characteristics: [
      'Balanced risk-return approach',
      'Moderate volatility tolerance',
      'Growth with stability',
      'Most popular choice'
    ]
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'High risk, high reward strategy for maximum returns',
    icon: BoltIcon,
    riskLevel: 3,
    expectedReturn: '25-40%',
    maxDrawdown: '20-35%',
    characteristics: [
      'Maximum growth potential',
      'High volatility tolerance',
      'Higher risk, higher reward',
      'For experienced investors'
    ]
  }
]

interface RiskProfileSelectionProps {
  onRiskProfileSelect: (riskProfile: RiskProfile) => void
  selectedStrategy: string
}

export default function RiskProfileSelection({ onRiskProfileSelect, selectedStrategy }: RiskProfileSelectionProps) {
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(null)

  const handleProfileClick = (profile: RiskProfile) => {
    setSelectedProfile(profile)
    onRiskProfileSelect(profile)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Choose Your Risk Profile
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Select your risk tolerance level. This will determine how your {selectedStrategy} strategy is configured.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {riskProfiles.map((profile) => {
          const IconComponent = profile.icon
          const isSelected = selectedProfile?.id === profile.id
          
          return (
            <div
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              className={`
                relative bg-gradient-to-br from-gray-900/50 to-black/50 rounded-2xl p-8 border-2 cursor-pointer
                transition-all duration-300 hover:scale-105 hover:shadow-2xl
                ${isSelected 
                  ? 'border-yellow-400 shadow-yellow-400/25' 
                  : 'border-gray-700 hover:border-gray-600'
                }
              `}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-sm font-bold">✓</span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-400/30">
                  <IconComponent className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{profile.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{profile.description}</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Risk Level:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`w-3 h-3 rounded-full ${
                          level <= profile.riskLevel 
                            ? 'bg-yellow-400'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Return:</span>
                  <span className="text-yellow-400 font-semibold">{profile.expectedReturn}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Drawdown:</span>
                  <span className="text-red-400 font-semibold">{profile.maxDrawdown}</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <h4 className="text-white font-semibold text-sm mb-2">Key Characteristics:</h4>
                {profile.characteristics.map((characteristic, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300 text-xs">{characteristic}</span>
                  </div>
                ))}
              </div>
              
              <div className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-lg text-center hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200">
                {isSelected ? 'Selected' : 'Select Profile'}
              </div>
            </div>
          )
        })}
      </div>

      {selectedProfile && (
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-2xl p-6 border border-yellow-400/20 max-w-2xl mx-auto">
            <p className="text-gray-300 mb-2">
              You selected: <span className="text-yellow-400 font-semibold">{selectedProfile.name}</span> profile
            </p>
            <p className="text-sm text-gray-400">
              This will configure your strategy parameters for optimal risk-return balance
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
