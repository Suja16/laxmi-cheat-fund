# Laxmi Cheat Fund - Frontend

A modern, responsive single-page application for the Laxmi Cheat Fund protocol - bringing institutional-grade DeFi strategies to retail users.

## Features

- 🔗 **Wallet Integration**: Connect with MetaMask using Wagmi
- 🎨 **Modern UI**: Beautiful gradient design with Tailwind CSS
- 📱 **Responsive**: Works perfectly on desktop and mobile
- ⚡ **Fast**: Built with Vite for lightning-fast development and builds
- 🔒 **Non-Custodial**: Users maintain full control of their assets

## Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **Framer Motion** - Smooth animations
- **Heroicons** - Beautiful SVG icons

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

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
