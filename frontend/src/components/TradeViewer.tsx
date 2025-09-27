import { 
  useQuery, 
  HypergraphSpaceProvider 
} from '@graphprotocol/hypergraph-react';
import { Trade, Strategy, Token } from '../schema';

interface TradeViewerProps {
  spaceId: string;
}

function TradeViewerContent({ spaceId }: TradeViewerProps) {
  const { data: trades, isPending: tradesPending } = useQuery(Trade, { mode: 'public' });
  const { data: strategies } = useQuery(Strategy, { mode: 'public' });
  const { data: tokens } = useQuery(Token, { mode: 'public' });

  if (tradesPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        <span className="ml-3 text-gray-300">Loading trades...</span>
      </div>
    );
  }

  const getStrategyName = (strategyId: string) => {
    return strategies?.find(s => s.id === strategyId)?.name || 'Unknown Strategy';
  };

  const getTokenSymbol = (tokenId: string) => {
    return tokens?.find(t => t.id === tokenId)?.symbol || 'Unknown Token';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatPnL = (pnl: number) => {
    const color = pnl >= 0 ? 'text-green-400' : 'text-red-400';
    const sign = pnl >= 0 ? '+' : '';
    return <span className={color}>{sign}{pnl.toFixed(4)}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Public Trades</h2>
      
      {trades && trades.length > 0 ? (
        <div className="bg-gray-900/50 rounded-2xl border border-yellow-400/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Strategy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Pair
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Entry Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Exit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {getStrategyName(trade.strategy)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {getTokenSymbol(trade.baseToken)}/{getTokenSymbol(trade.quoteToken)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {trade.entryPrice.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {trade.exitPrice.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {trade.amount?.toFixed(4) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatPnL(trade.pnl)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatTimestamp(trade.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-gray-400 text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Trades Found</h3>
          <p className="text-gray-500">No public trades are available yet.</p>
        </div>
      )}
    </div>
  );
}

export default function TradeViewer({ spaceId }: TradeViewerProps) {
  return (
    <HypergraphSpaceProvider space={spaceId}>
      <TradeViewerContent spaceId={spaceId} />
    </HypergraphSpaceProvider>
  );
}
