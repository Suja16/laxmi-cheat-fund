import { useState } from 'react';
import { 
  useCreateEntity, 
  useQuery, 
  HypergraphSpaceProvider 
} from '@graphprotocol/hypergraph-react';
import { Trade, Strategy, Token, Wallet } from '../schema';
import { useAccount } from 'wagmi';

interface TradeCreatorProps {
  spaceId: string;
}

function TradeCreatorContent({ spaceId }: TradeCreatorProps) {
  const { address } = useAccount();
  const createTrade = useCreateEntity(Trade);
  const createStrategy = useCreateEntity(Strategy);
  const createToken = useCreateEntity(Token);
  const createWallet = useCreateEntity(Wallet);
  
  const { data: strategies } = useQuery(Strategy, { mode: 'public' });
  const { data: tokens } = useQuery(Token, { mode: 'public' });
  
  const [tradeData, setTradeData] = useState({
    strategyId: '',
    baseTokenSymbol: '',
    quoteTokenSymbol: '',
    entryPrice: 0,
    exitPrice: 0,
    amount: 0,
  });

  const handleCreateTrade = async () => {
    try {
      // Generate unique IDs
      const tradeId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const walletId = `wallet-${address}-${Date.now()}`;
      
      // Create wallet if it doesn't exist
      await createWallet({
        id: walletId,
        profile: `profile-${address}` // You might want to create a profile first
      });

      // Create trade
      await createTrade({
        id: tradeId,
        wallet: walletId,
        strategy: tradeData.strategyId,
        baseToken: `token-${tradeData.baseTokenSymbol}`,
        quoteToken: `token-${tradeData.quoteTokenSymbol}`,
        entryPrice: tradeData.entryPrice,
        exitPrice: tradeData.exitPrice,
        pnl: (tradeData.exitPrice - tradeData.entryPrice) * tradeData.amount,
        timestamp: Date.now(),
      });

      alert('Trade created successfully!');
      
      // Reset form
      setTradeData({
        strategyId: '',
        baseTokenSymbol: '',
        quoteTokenSymbol: '',
        entryPrice: 0,
        exitPrice: 0,
        amount: 0,
      });
    } catch (error) {
      console.error('Error creating trade:', error);
      alert('Error creating trade. Check console for details.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900/50 rounded-2xl border border-yellow-400/20">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Trade</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Strategy
          </label>
          <select
            value={tradeData.strategyId}
            onChange={(e) => setTradeData(prev => ({ ...prev, strategyId: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="">Select a strategy</option>
            {strategies?.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base Token Symbol
            </label>
            <input
              type="text"
              value={tradeData.baseTokenSymbol}
              onChange={(e) => setTradeData(prev => ({ ...prev, baseTokenSymbol: e.target.value }))}
              placeholder="e.g., ETH"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quote Token Symbol
            </label>
            <input
              type="text"
              value={tradeData.quoteTokenSymbol}
              onChange={(e) => setTradeData(prev => ({ ...prev, quoteTokenSymbol: e.target.value }))}
              placeholder="e.g., USDC"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Entry Price
            </label>
            <input
              type="number"
              step="0.0001"
              value={tradeData.entryPrice}
              onChange={(e) => setTradeData(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exit Price
            </label>
            <input
              type="number"
              step="0.0001"
              value={tradeData.exitPrice}
              onChange={(e) => setTradeData(prev => ({ ...prev, exitPrice: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.0001"
              value={tradeData.amount}
              onChange={(e) => setTradeData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        <button
          onClick={handleCreateTrade}
          disabled={!tradeData.strategyId || !tradeData.baseTokenSymbol || !tradeData.quoteTokenSymbol}
          className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Trade
        </button>
      </div>
    </div>
  );
}

export default function TradeCreator({ spaceId }: TradeCreatorProps) {
  return (
    <HypergraphSpaceProvider space={spaceId}>
      <TradeCreatorContent spaceId={spaceId} />
    </HypergraphSpaceProvider>
  );
}
