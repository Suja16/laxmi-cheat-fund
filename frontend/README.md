# Laxmi Cheat Fund - Frontend

A modern, responsive single-page application for the Laxmi Cheat Fund protocol - bringing institutional-grade DeFi strategies to retail users.

## Features

- 🔗 **Wallet Integration**: Connect with MetaMask using Wagmi
- 🎨 **Modern UI**: Beautiful gradient design with Tailwind CSS
- 📱 **Responsive**: Works perfectly on desktop and mobile
- ⚡ **Fast**: Built with Vite for lightning-fast development and builds
- 🔒 **Non-Custodial**: Users maintain full control of their assets
- 📊 **Hypergraph Integration**: Create and manage trading strategies with persistent data storage

## Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **Framer Motion** - Smooth animations
- **Heroicons** - Beautiful SVG icons
- **Hypergraph** - Decentralized data storage and querying

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Hypergraph (Required for strategy creation)**:
   ```bash
   npm run setup-hypergraph
   ```
   Follow the prompts to enter your Hypergraph space ID. If you don't have one, visit [The Graph Hypergraph](https://thegraph.com/hypergraph) to create a space.

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run setup-hypergraph` - Configure Hypergraph space ID

## Project Structure

```
src/
├── components/
│   ├── LandingPage.tsx    # Main landing page component
│   └── WalletButton.tsx   # Wallet connect/disconnect button
├── config/
│   └── wagmi.ts          # Wagmi configuration
├── App.tsx               # Main app component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

## Wallet Connection

The app uses MetaMask connector from Wagmi. Users can:
- Connect their MetaMask wallet
- View their connected address
- Disconnect when needed

## Hypergraph Integration

The app includes a powerful Hypergraph dashboard for managing trading strategies:

### Features
- **Create Strategies**: Define custom trading strategies with names and descriptions
- **Create Trades**: Record trades with entry/exit prices, P&L, and token information
- **View Trades**: Browse all public trades with real-time updates
- **Persistent Storage**: All data is stored on Hypergraph's decentralized network

### Getting Started with Hypergraph
1. Run `npm run setup-hypergraph` to configure your space ID
2. Visit [The Graph Hypergraph](https://thegraph.com/hypergraph) to create a space
3. Use the Hypergraph Dashboard in the app to manage your strategies

For detailed setup instructions, see [HYPERGRAPH_INTEGRATION.md](./HYPERGRAPH_INTEGRATION.md).

## Design System

- **Primary Colors**: Yellow (#f59e0b) to Orange (#f97316)
- **Background**: Dark gradient from slate to purple
- **Typography**: Inter font family
- **Components**: Glass morphism effects with backdrop blur

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
