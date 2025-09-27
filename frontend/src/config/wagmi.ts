import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, arbitrum, polygon } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, arbitrum, polygon],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Laxmi Cheat Fund',
        url: 'https://laxmifund.com',
        iconUrl: 'https://laxmifund.com/icon.png',
      },
      logging: {
        developerMode: true,
        sdk: true,
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
