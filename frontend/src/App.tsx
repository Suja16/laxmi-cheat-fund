import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import LandingPage from './components/LandingPage'
import StrategyFlow from './components/StrategyFlow'
import HypergraphProvider from './components/HypergraphProvider'
import { useAccount } from 'wagmi'

const queryClient = new QueryClient()

function AppContent() {
  const { isConnected } = useAccount()
  
  return isConnected ? <StrategyFlow /> : <LandingPage />
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <HypergraphProvider>
          <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            <AppContent />
          </div>
        </HypergraphProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
