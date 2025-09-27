import { useState, useEffect } from 'react';
import { 
  useCreateEntity, 
  HypergraphSpaceProvider,
  useSpace,
  useSpaces,
  useHypergraphApp,
  useHypergraphAuth,
  preparePublish,
  publishOps
} from '@graphprotocol/hypergraph-react';
import { Strategy } from '../schema';

interface StrategyCreatorProps {
  spaceId: string;
}

function StrategyCreatorContent({ spaceId }: StrategyCreatorProps) {
  // Authentication
  const { identity, isAuthenticated, login, logout } = useHypergraphAuth();
  
  // Use private space for creating entities
  const { ready: privateReady, name: privateName, id: privateId } = useSpace({ mode: 'private' });
  const { ready: publicReady, name: publicName, id: publicId } = useSpace({ mode: 'public' });
  const { spaces: publicSpaces } = useSpaces({ mode: 'public' });
  const { spaces: privateSpaces } = useSpaces({ mode: 'private' });
  const app = useHypergraphApp();
  
  // Create strategy in private space
  const createStrategy = useCreateEntity(Strategy);
  
  const [strategyData, setStrategyData] = useState({
    name: '',
    description: '',
  });

  const handleCreatePrivateSpace = async () => {
    try {
      if (!isAuthenticated) {
        alert('Please authenticate first before creating a private space.');
        return;
      }
      
      if (app && app.createSpace) {
        console.log('Creating private space...');
        await app.createSpace('27085356-05e9-4cff-8ffa-efbf1d1d3c74');
        console.log('Private space creation initiated');
        alert('Private space creation initiated. Please wait a moment and refresh the page.');
      } else {
        alert('Cannot create private space. App not available.');
      }
    } catch (error) {
      console.error('Error creating private space:', error);
      alert(`Error creating private space: ${error.message}`);
    }
  };

  // Debug space information
  useEffect(() => {
    console.log('StrategyCreator - Authentication:', { isAuthenticated, identity });
    console.log('StrategyCreator - Private space info:', { privateReady, privateName, privateId });
    console.log('StrategyCreator - Public space info:', { publicReady, publicName, publicId, spaceId });
    console.log('StrategyCreator - Available public spaces:', publicSpaces);
    console.log('StrategyCreator - Available private spaces:', privateSpaces);
    console.log('StrategyCreator - App info:', app);
    console.log('StrategyCreator - Using private space ID: 27085356-05e9-4cff-8ffa-efbf1d1d3c74');
  }, [isAuthenticated, identity, privateReady, privateName, privateId, publicReady, publicName, publicId, spaceId, publicSpaces, privateSpaces, app]);

  const handleCreateStrategy = async () => {
    try {
      // Check if private space is ready
      if (!privateReady) {
        console.log('Private space not ready, attempting to create...');
        
        // Try to create the private space if it doesn't exist
        if (app && app.createSpace) {
          try {
            console.log('Creating private space...');
            await app.createSpace('27085356-05e9-4cff-8ffa-efbf1d1d3c74');
            console.log('Private space creation initiated');
            alert('Private space is being created. Please wait a moment and try again.');
            return;
          } catch (createError) {
            console.error('Error creating private space:', createError);
            alert('Failed to create private space. Please check your connection and try again.');
            return;
          }
        } else {
          alert('Private space is not ready and cannot be created. Please check your connection and try again.');
          return;
        }
      }

      console.log('Creating strategy in private space:', { privateReady, privateName, privateId });
      console.log('Target public space:', { publicReady, publicName, publicId, spaceId });
      
      const strategyId = `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Attempting to create strategy with ID:', strategyId);
      console.log('Strategy data:', {
        id: strategyId,
        name: strategyData.name,
        description: strategyData.description,
      });
      
      // Create strategy in private space
      const strategy = await createStrategy({
        id: strategyId,
        name: strategyData.name,
        description: strategyData.description,
      });

      console.log('Strategy created in private space:', strategy);
      
      // Now publish to public space
      if (spaceId && publicReady) {
        try {
          console.log('Publishing strategy to public space:', spaceId);
          const { ops } = await preparePublish({ entity: strategy, publicSpace: spaceId });
          const smartSessionClient = await app.getSmartSessionClient();
          
          if (!smartSessionClient) {
            throw new Error('Missing smartSessionClient');
          }
          
          const publishResult = await publishOps({
            ops,
            space: spaceId,
            name: 'Publish Strategy',
            walletClient: smartSessionClient,
          });
          
          console.log('Strategy published to public space:', publishResult);
          alert('Strategy created and published to public space successfully!');
        } catch (publishError) {
          console.error('Error publishing to public space:', publishError);
          alert('Strategy created in private space, but failed to publish to public space. Check console for details.');
        }
      } else {
        alert('Strategy created in private space successfully!');
      }
      
      // Reset form
      setStrategyData({
        name: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating strategy:', error);
      console.error('Private space state:', { privateReady, privateName, privateId });
      console.error('Public space state:', { publicReady, publicName, publicId, spaceId });
      console.error('App state:', app);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error creating strategy: ${error.message}. Check console for details.`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900/50 rounded-2xl border border-yellow-400/20">
      <h2 className="text-2xl font-bold text-white mb-6">Create New Strategy</h2>
      
      {/* Space Status */}
      <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
        {/* Authentication Status */}
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">Authentication Status:</div>
              <div className="text-lg font-semibold text-white">
                {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
              </div>
              {identity && (
                <div className="text-xs text-gray-400">
                  Identity: {identity.name || identity.id || 'Unknown'}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              {!isAuthenticated ? (
                <button
                  onClick={login}
                  className="px-4 py-2 bg-green-400 text-black font-semibold rounded-lg hover:bg-green-500 transition-colors"
                >
                  Login
                </button>
              ) : (
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-400 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Private Space Status */}
          <div>
            <div className="text-sm text-gray-300">Private Space:</div>
            <div className="text-lg font-semibold text-white">
              {privateReady ? '✅ Ready' : '⏳ Initializing...'}
            </div>
            <div className="text-xs text-gray-400">
              ID: 27085356-05e9-4cff-8ffa-efbf1d1d3c74
            </div>
            {privateName && (
              <div className="text-xs text-yellow-400">Name: {privateName}</div>
            )}
          </div>
          
          {/* Public Space Status */}
          <div>
            <div className="text-sm text-gray-300">Public Space:</div>
            <div className="text-lg font-semibold text-white">
              {publicReady ? '✅ Ready' : '⏳ Initializing...'}
            </div>
            <div className="text-xs text-gray-400">
              Target ID: {spaceId}
            </div>
            {publicName && (
              <div className="text-xs text-yellow-400">Name: {publicName}</div>
            )}
          </div>
        </div>
        
        {publicSpaces && publicSpaces.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            Available public spaces: {publicSpaces.map(s => s.id).join(', ')}
          </div>
        )}
        
        {privateSpaces && privateSpaces.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            Available private spaces: {privateSpaces.map(s => s.id).join(', ')}
          </div>
        )}
        
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-400/30 rounded-lg">
            <div className="text-red-400 font-semibold mb-2">Authentication Required</div>
            <div className="text-red-300 text-sm mb-3">
              You need to authenticate with Hypergraph before you can create spaces and strategies.
            </div>
            <button
              onClick={login}
              className="px-4 py-2 bg-red-400 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
            >
              Authenticate with Hypergraph
            </button>
          </div>
        )}
        
        {isAuthenticated && !privateReady && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-400/30 rounded-lg">
            <div className="text-yellow-400 font-semibold mb-2">Private Space Not Ready</div>
            <div className="text-yellow-300 text-sm mb-3">
              The private space needs to be initialized before you can create strategies.
            </div>
            <button
              onClick={handleCreatePrivateSpace}
              className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Initialize Private Space
            </button>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Strategy Name
          </label>
          <input
            type="text"
            value={strategyData.name}
            onChange={(e) => setStrategyData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Grid Trading Bot"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={strategyData.description}
            onChange={(e) => setStrategyData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your trading strategy..."
            rows={4}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <button
          onClick={handleCreateStrategy}
          disabled={!isAuthenticated || !strategyData.name.trim() || !strategyData.description.trim() || !privateReady}
          className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isAuthenticated ? 'Please Authenticate First' : privateReady ? 'Create Strategy' : 'Private Space Initializing...'}
        </button>
      </div>
    </div>
  );
}

export default function StrategyCreator({ spaceId }: StrategyCreatorProps) {
  // Use the provided private space ID for entity creation
  const privateSpaceId = '27085356-05e9-4cff-8ffa-efbf1d1d3c74';
  
  return (
    <HypergraphSpaceProvider space={privateSpaceId}>
      <StrategyCreatorContent spaceId={spaceId} />
    </HypergraphSpaceProvider>
  );
}
