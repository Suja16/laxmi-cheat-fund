'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@graphprotocol/hypergraph-react';
import { ContractTransaction, ContractEvent, UserInteraction } from '../schema';

export default function ContractExplorerPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'events' | 'interactions' | 'stats'>('transactions');
  const [filters, setFilters] = useState({
    userAddress: '',
    fromBlock: '',
    toBlock: '',
    methodName: '',
    status: ''
  });
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Query transactions
  const { data: transactions, isPending: transactionsLoading } = useQuery(ContractTransaction, {
    mode: 'public',
    filter: {
      ...(filters.userAddress && { from: filters.userAddress }),
      ...(filters.fromBlock && { blockNumber: { gte: parseInt(filters.fromBlock) } }),
      ...(filters.toBlock && { blockNumber: { lte: parseInt(filters.toBlock) } }),
      ...(filters.methodName && { methodName: filters.methodName }),
      ...(filters.status && { status: filters.status })
    }
  });

  // Query events
  const { data: events, isPending: eventsLoading } = useQuery(ContractEvent, {
    mode: 'public',
    filter: {
      ...(filters.userAddress && { contractAddress: filters.userAddress }),
      ...(filters.fromBlock && { blockNumber: { gte: parseInt(filters.fromBlock) } }),
      ...(filters.toBlock && { blockNumber: { lte: parseInt(filters.toBlock) } })
    }
  });

  // Query user interactions
  const { data: interactions, isPending: interactionsLoading } = useQuery(UserInteraction, {
    mode: 'public',
    filter: {
      ...(filters.userAddress && { userAddress: filters.userAddress }),
      ...(filters.fromBlock && { blockNumber: { gte: parseInt(filters.fromBlock) } }),
      ...(filters.toBlock && { blockNumber: { lte: parseInt(filters.toBlock) } }),
      ...(filters.methodName && { methodName: filters.methodName })
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setOffset(0); // Reset offset when filters change
  };

  const clearFilters = () => {
    setFilters({
      userAddress: '',
      fromBlock: '',
      toBlock: '',
      methodName: '',
      status: ''
    });
    setOffset(0);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: string) => {
    return ethers.formatEther(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Contract Explorer
          </h1>
          <p className="text-slate-600">
            Explore all transactions and events for contract{' '}
            <code className="bg-slate-200 px-2 py-1 rounded text-sm">
              0xA2aa501b19aff244D90cc15a4Cf739D2725B5729
            </code>
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                User Address
              </label>
              <input
                type="text"
                value={filters.userAddress}
                onChange={(e) => handleFilterChange('userAddress', e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                From Block
              </label>
              <input
                type="number"
                value={filters.fromBlock}
                onChange={(e) => handleFilterChange('fromBlock', e.target.value)}
                placeholder="Block number"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                To Block
              </label>
              <input
                type="number"
                value={filters.toBlock}
                onChange={(e) => handleFilterChange('toBlock', e.target.value)}
                placeholder="Block number"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Method Name
              </label>
              <select
                value={filters.methodName}
                onChange={(e) => handleFilterChange('methodName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Methods</option>
                <option value="transfer">Transfer</option>
                <option value="approve">Approve</option>
                <option value="balanceOf">Balance Of</option>
                <option value="totalSupply">Total Supply</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'transactions', label: 'Transactions', count: transactions?.length || 0 },
                { id: 'events', label: 'Events', count: events?.length || 0 },
                { id: 'interactions', label: 'User Interactions', count: interactions?.length || 0 },
                { id: 'stats', label: 'Statistics', count: null }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className="ml-2 bg-slate-100 text-slate-600 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Transactions</h3>
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-slate-600">Loading transactions...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Hash
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Block
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            From
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            To
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {transactions?.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">
                              {tx.transactionHash.slice(0, 10)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {tx.blockNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                              {tx.from.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                              {tx.to?.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {formatValue(tx.value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {tx.methodName || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                tx.status === 'success' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {formatTimestamp(tx.blockTimestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Events</h3>
                {eventsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-slate-600">Loading events...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events?.map((event) => (
                      <div key={event.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{event.eventName}</h4>
                          <span className="text-sm text-slate-500">Block {event.blockNumber}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <p>Transaction: {event.transactionHash.slice(0, 10)}...</p>
                          <p>Timestamp: {formatTimestamp(event.blockTimestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'interactions' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">User Interactions</h3>
                {interactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-slate-600">Loading interactions...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interactions?.map((interaction) => (
                      <div key={interaction.id} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900">
                            {interaction.interactionType} - {interaction.methodName}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            interaction.success 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {interaction.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <p>User: {interaction.userAddress.slice(0, 10)}...</p>
                          <p>Gas Used: {interaction.gasUsed}</p>
                          <p>Timestamp: {formatTimestamp(interaction.blockTimestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contract Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-blue-600">Total Transactions</h4>
                    <p className="text-2xl font-bold text-blue-900">{transactions?.length || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-green-600">Total Events</h4>
                    <p className="text-2xl font-bold text-green-900">{events?.length || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-purple-600">User Interactions</h4>
                    <p className="text-2xl font-bold text-purple-900">{interactions?.length || 0}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-orange-600">Contract Address</h4>
                    <p className="text-xs font-mono text-orange-900 break-all">
                      0xA2aa501b19aff244D90cc15a4Cf739D2725B5729
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
