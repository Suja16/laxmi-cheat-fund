# Hypergraph Integration Guide

This frontend application is now integrated with Hypergraph for data insertion and querying. Here's how to use it:

## 🚀 **What's Been Added**

### 1. **Hypergraph Dependencies**
- `@graphprotocol/hypergraph` - Core Hypergraph functionality
- `@graphprotocol/hypergraph-react` - React hooks for Hypergraph

### 2. **Schema & Mapping**
- `src/schema.ts` - All your Hypergraph entities (Trade, Strategy, Token, etc.)
- `src/mapping.ts` - Entity mappings for Hypergraph
- `src/components/HypergraphProvider.tsx` - Provider component

### 3. **Components Created**
- `TradeCreator` - Create new trades
- `TradeViewer` - View all public trades
- `StrategyCreator` - Create new trading strategies
- `HypergraphDashboard` - Main dashboard combining all features

## 📋 **How to Use**

### 1. **Start the Application**
```bash
cd frontend
npm run dev
```

### 2. **Access Hypergraph Dashboard**
1. Connect your wallet
2. Click "Hypergraph Dashboard" button in the navigation
3. You'll see three tabs:
   - **View Trades**: Browse all public trades
   - **Create Trade**: Add new trades to Hypergraph
   - **Create Strategy**: Define new trading strategies

### 3. **Creating Data**

#### **Create a Strategy**
1. Go to "Create Strategy" tab
2. Enter strategy name and description
3. Click "Create Strategy"

#### **Create a Trade**
1. Go to "Create Trade" tab
2. Select a strategy
3. Enter token symbols (e.g., ETH, USDC)
4. Set entry/exit prices and amount
5. Click "Create Trade"

### 4. **Viewing Data**
- All created trades and strategies are automatically stored in Hypergraph
- Use "View Trades" tab to see all public trades
- Data is persistent and shared across the Hypergraph network

## 🔧 **Configuration**

### **Space ID**
The space ID is now configured! The application is set up to use space ID: `e056e8c2-0716-4e4d-9ef3-fdcbdd2d7c8d`

#### **Configuration Options**
You can configure the space ID in two ways:

#### **Option 1: Environment Variable (Recommended)**
1. Create a `.env` file in your frontend directory
2. Add your space ID:
```bash
VITE_HYPERGRAPH_SPACE_ID=e056e8c2-0716-4e4d-9ef3-fdcbdd2d7c8d
```
3. Restart your development server

#### **Option 2: Direct Configuration (Current)**
The space ID is currently set directly in `HypergraphDashboard.tsx`:
```typescript
const spaceId = 'e056e8c2-0716-4e4d-9ef3-fdcbdd2d7c8d';
```

### **Getting a Space ID**
1. Visit [The Graph Hypergraph](https://thegraph.com/hypergraph)
2. Create a new space or use an existing one
3. Copy the space ID from your space dashboard
4. Use it in your configuration

### **App ID**
The app ID is already configured in `HypergraphProvider.tsx`:
```typescript
appId="93bb8907-085a-4a0e-83dd-62b0dc98e793"
```

## 🎯 **Key Features**

### **Data Insertion**
- ✅ Create trades with full metadata
- ✅ Create trading strategies
- ✅ Automatic wallet/profile creation
- ✅ Real-time data persistence

### **Data Querying**
- ✅ View all public trades
- ✅ Filter by strategy, tokens, etc.
- ✅ Real-time updates
- ✅ Formatted display with P&L calculations

### **Integration Points**
- ✅ Seamlessly integrated with existing wallet connection
- ✅ Accessible from main navigation
- ✅ Consistent UI/UX with your app theme

## 🔄 **Data Flow**

1. **User connects wallet** → Wagmi handles authentication
2. **User creates trade/strategy** → Hypergraph stores data
3. **Data is immediately available** → Other users can view it
4. **Real-time updates** → Changes reflect across all clients

## 🚨 **Important Notes**

- Make sure your Hypergraph space is properly configured
- The space ID in the dashboard needs to match your actual Hypergraph space
- All data is stored in the public space (visible to everyone)
- For private data, you'd need to use private spaces

## 🔧 **Troubleshooting**

### **"Space not found or not ready" Error**
This error occurs when the space ID is not properly configured. To fix:

1. **Check your space ID configuration:**
   - Ensure you have a valid space ID from The Graph Hypergraph
   - Verify the space ID is correctly set in your `.env` file or code

2. **Verify space exists:**
   - Visit [The Graph Hypergraph](https://thegraph.com/hypergraph)
   - Check that your space is active and ready

3. **Restart your development server:**
   - After updating the space ID, restart your dev server
   - Clear browser cache if needed

### **Environment Variable Not Loading**
If your environment variable isn't loading:

1. Ensure your `.env` file is in the `frontend/` directory
2. Make sure the variable name is exactly `VITE_HYPERGRAPH_SPACE_ID`
3. Restart your development server after making changes
4. Check that there are no spaces around the `=` sign in your `.env` file

## 🎉 **Ready to Use!**

Your frontend is now fully integrated with Hypergraph! You can:
- Insert trading data
- Query existing data
- Share data across the network
- Build on top of the persistent data layer

The integration maintains your existing UI/UX while adding powerful data capabilities through Hypergraph.
