import { WalletButton } from "./WalletButton";
import {
  ChartBarIcon,
  ShieldCheckIcon,
  CogIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  LockClosedIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="relative px-6 py-4 border-b border-yellow-400/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">L</span>
            </div>
            <span className="text-2xl font-bold text-white">
              Laxmi Cheat Fund
            </span>
          </div>
          <WalletButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Institutional-Grade
              <span className="block bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                DeFi Strategies
              </span>
              <span className="block text-3xl md:text-4xl font-normal mt-4 text-gray-300">
                for Everyone
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Set and forget your crypto assets. Our automated vaults execute
              sophisticated hedge fund strategies while you maintain full
              custody of your funds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-2xl hover:shadow-yellow-400/25">
              Start Earning Now
            </button>
            <button className="px-8 py-4 border-2 border-yellow-400/30 text-yellow-400 font-semibold text-lg rounded-xl hover:bg-yellow-400/10 transition-all duration-200">
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                $2.4M+
              </div>
              <div className="text-gray-300">Total Value Locked</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                24.7%
              </div>
              <div className="text-gray-300">Average APY</div>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/20">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                1,200+
              </div>
              <div className="text-gray-300">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Problem We Solve
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Retail investors lack access to sophisticated trading strategies
              that institutional players use to generate consistent returns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Complex Strategies
                  </h3>
                  <p className="text-gray-300">
                    Institutional strategies require deep technical knowledge
                    and constant monitoring.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    High Barriers
                  </h3>
                  <p className="text-gray-300">
                    Minimum investment requirements and exclusive access prevent
                    retail participation.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Custody Risks
                  </h3>
                  <p className="text-gray-300">
                    Traditional funds require giving up custody of your assets.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 rounded-3xl p-8 border border-yellow-400/20">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Our Solution
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <span className="text-white">Automated execution</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <span className="text-white">Non-custodial</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <span className="text-white">Transparent strategies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-black text-sm font-bold">✓</span>
                  </div>
                  <span className="text-white">No minimum investment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Laxmi Cheat Fund?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LockClosedIcon className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Non-Custodial
              </h3>
              <p className="text-gray-300">
                You maintain full control and ownership of your assets at all
                times.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CogIcon className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Fully Automated
              </h3>
              <p className="text-gray-300">
                Set it and forget it. Our bots handle all trading execution
                24/7.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Battle-Tested
              </h3>
              <p className="text-gray-300">
                Strategies proven in live markets with institutional-grade
                infrastructure.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Transparent</h3>
              <p className="text-gray-300">
                All strategy logic is open source and auditable on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 rounded-3xl p-12 border border-yellow-400/20">
            <RocketLaunchIcon className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users who are already earning with our automated
              strategies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-lg rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-2xl hover:shadow-yellow-400/25">
                Connect Wallet & Start
              </button>
              <button className="px-8 py-4 border-2 border-yellow-400/30 text-yellow-400 font-semibold text-lg rounded-xl hover:bg-yellow-400/10 transition-all duration-200">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-yellow-400/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold text-white">
                Laxmi Cheat Fund
              </span>
            </div>
            <div className="text-gray-400 text-center md:text-right">
              <p>&copy; 2024 Laxmi Cheat Fund. All rights reserved.</p>
              <p className="text-sm mt-1">Bridging the arsenal gap in DeFi</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
