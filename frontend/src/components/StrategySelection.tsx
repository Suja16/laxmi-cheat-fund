import { useState } from "react";
import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  apy: string;
  riskLevel: "Low" | "Medium" | "High";
  minDeposit: string;
}

const strategies: Strategy[] = [
  {
    id: "twap",
    name: "TWAP",
    description:
      "Time-Weighted Average Price strategy that executes large orders over time to minimize market impact.",
    icon: ClockIcon,
    apy: "12.3%",
    riskLevel: "Low",
    minDeposit: "$50",
  },
  {
    id: "grid",
    name: "Grid Trading",
    description:
      "Automated buy-low, sell-high strategy that places orders at predetermined price levels to capture market volatility.",
    icon: ChartBarIcon,
    apy: "18.5%",
    riskLevel: "Medium",
    minDeposit: "$100",
  },
  {
    id: "funding-arbitrage",
    name: "Funding Rate Arbitrage",
    description:
      "Market-neutral strategy that captures yield from funding rate inefficiencies in perpetual markets.",
    icon: CurrencyDollarIcon,
    apy: "24.7%",
    riskLevel: "Low",
    minDeposit: "$200",
  },
  {
    id: "dca-hodl",
    name: "DCA (HODL)",
    description:
      "Dollar Cost Averaging strategy that accumulates assets over time with a long-term holding approach.",
    icon: ArrowTrendingUpIcon,
    apy: "15.8%",
    riskLevel: "Medium",
    minDeposit: "$25",
  },
  {
    id: "dca-martingale",
    name: "DCA (Martingale)",
    description:
      "Advanced DCA strategy that increases position size after losses to recover and profit from market reversals.",
    icon: ArrowPathIcon,
    apy: "31.2%",
    riskLevel: "High",
    minDeposit: "$500",
  },
];

interface StrategySelectionProps {
  onStrategySelect: (strategy: Strategy) => void;
}

export default function StrategySelection({
  onStrategySelect,
}: StrategySelectionProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null
  );

  const handleStrategyClick = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    onStrategySelect(strategy);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Choose Your Strategy
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Select from our battle-tested trading strategies. Each strategy is
          designed for different risk profiles and market conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {strategies.map((strategy) => {
          const IconComponent = strategy.icon;
          const isSelected = selectedStrategy?.id === strategy.id;

          return (
            <div
              key={strategy.id}
              onClick={() => handleStrategyClick(strategy)}
              className={`
                relative bg-gradient-to-br from-gray-900/50 to-black/50 rounded-2xl p-6 border-2 cursor-pointer
                transition-all duration-300 hover:scale-105 hover:shadow-2xl h-full flex flex-col
                ${
                  isSelected
                    ? "border-yellow-400 shadow-yellow-400/25"
                    : "border-gray-700 hover:border-gray-600"
                }
              `}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black text-sm font-bold">✓</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <IconComponent className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">
                    {strategy.apy}
                  </div>
                  <div className="text-sm text-gray-400">APY</div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                {strategy.name}
              </h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed flex-grow">
                {strategy.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Risk Level:</span>
                  <span
                    className={`font-medium ${
                      strategy.riskLevel === "Low"
                        ? "text-green-400"
                        : strategy.riskLevel === "Medium"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    {strategy.riskLevel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Min Deposit:</span>
                  <span className="text-white">{strategy.minDeposit}</span>
                </div>
              </div>

              <div
                className={`w-full py-2 px-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-lg text-center text-sm hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200`}
              >
                {isSelected ? "Selected" : "Select Strategy"}
              </div>
            </div>
          );
        })}
      </div>

      {selectedStrategy && (
        <div className="mt-8 text-center">
          <p className="text-gray-300 mb-4">
            You selected:{" "}
            <span className="text-yellow-400 font-semibold">
              {selectedStrategy.name}
            </span>
          </p>
          <p className="text-sm text-gray-400">
            Click "Continue" to proceed with risk profile selection
          </p>
        </div>
      )}
    </div>
  );
}
