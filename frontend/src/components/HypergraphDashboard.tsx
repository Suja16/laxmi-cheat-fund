import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import TradeCreator from './TradeCreator';
import TradeViewer from './TradeViewer';
import StrategyCreator from './StrategyCreator';
import { 
  ChartBarIcon, 
  PlusIcon, 
  EyeIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export default function HypergraphDashboard() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'view' | 'create-trade' | 'create-strategy'>('view');
  
  // Set space ID directly - try environment variable first, then fallback to provided space ID
  const spaceId = (import.meta as any).env?.VITE_HYPERGRAPH_SPACE_ID || 'e056e8c2-0716-4e4d-9ef3-fdcbdd2d7c8d';
  
  // Debug logging
  console.log('HypergraphDashboard - spaceId:', spaceId);
  console.log('HypergraphDashboard - activeTab:', activeTab);

  const tabs = [
    { id: 'view', name: 'View Trades', icon: EyeIcon },
    { id: 'create-trade', name: 'Create Trade', icon: PlusIcon },
    { id: 'create-strategy', name: 'Create Strategy', icon: CogIcon },
  ];

  console.log('HypergraphDashboard - Rendering with spaceId:', spaceId);
  console.log('HypergraphDashboard - activeTab:', activeTab);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-yellow-400/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-black" />
            </div>
            <span className="text-2xl font-bold text-white">Hypergraph Dashboard</span>
          </div>
          <div className="text-sm text-gray-300">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-900/20 border border-yellow-400/30 mx-6 mt-4 rounded-lg p-4">
        <div className="text-yellow-400 font-semibold">Debug Info:</div>
        <div className="text-yellow-300 text-sm">
          <div>Space ID: {spaceId}</div>
          <div>Active Tab: {activeTab}</div>
          <div>Address: {address || 'Not connected'}</div>
        </div>
      </div>


      {/* Tab Navigation */}
      <div className="bg-gray-900/30 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'view' && <TradeViewer spaceId={spaceId} />}
        {activeTab === 'create-trade' && <TradeCreator spaceId={spaceId} />}
        {activeTab === 'create-strategy' && <StrategyCreator spaceId={spaceId} />}
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">📋 Instructions</h3>
          <div className="text-sm text-blue-300 space-y-1">
            <p>• <strong>View Trades:</strong> Browse all public trades from the Hypergraph</p>
            <p>• <strong>Create Trade:</strong> Add new trades to the public space</p>
            <p>• <strong>Create Strategy:</strong> Define new trading strategies</p>
            <p>• Connected to Hypergraph space: <code className="bg-blue-800/50 px-2 py-1 rounded text-xs">{spaceId}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
