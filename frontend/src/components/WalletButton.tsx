import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { metaMask } from 'wagmi/connectors'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    connect({ connector: metaMask() })
  }

  const handleDisconnect = () => {
    disconnect()
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-yellow-400/30 text-yellow-400 rounded-lg backdrop-blur-sm">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-sm font-medium">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-gray-500 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-yellow-400/25"
    >
      Connect Wallet
    </button>
  )
}
