import { useState } from 'react';
import { Cedra, CedraConfig, Network, Account } from '@cedra-labs/ts-sdk';
import CounterCard from './components/CounterCard';
import TokenCard from './components/TokenCard';
import NFTCard from './components/NFTCard';
import WalletConnect from './components/WalletConnect';

// Contract addresses (deployed on testnet)
export const MODULE_ADDRESS = "0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4";

// Initialize Cedra client
const config = new CedraConfig({ network: Network.TESTNET });
export const cedra = new Cedra(config);

function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [activeTab, setActiveTab] = useState<'counter' | 'token' | 'nft'>('counter');
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // For demo: Generate a new account
      const newAccount = Account.generate();
      
      // Fund from faucet
      await cedra.faucet.fundAccount({
        accountAddress: newAccount.accountAddress,
        amount: 100_000_000, // 1 CEDRA
      });
      
      setAccount(newAccount);
      await refreshBalance(newAccount.accountAddress.toString());
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect wallet. Please try again.');
    }
    setIsLoading(false);
  };

  const refreshBalance = async (address: string) => {
    try {
      const resources = await cedra.getAccountResource({
        accountAddress: address,
        resourceType: "0x1::coin::CoinStore<0x1::cedra_coin::CedraCoin>",
      });
      const bal = (resources as any).coin.value;
      setBalance((parseInt(bal) / 100_000_000).toFixed(4));
    } catch {
      setBalance('0');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-bg text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🔨 Cedra Builders Forge</h1>
              <p className="text-cedra-100 mt-1">Interactive DApp Demo</p>
            </div>
            <WalletConnect
              account={account}
              balance={balance}
              isLoading={isLoading}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
            />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {(['counter', 'token', 'nft'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-cedra-500 text-cedra-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'counter' && '🔢 Counter'}
                {tab === 'token' && '🪙 Token'}
                {tab === 'nft' && '🖼️ NFT'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!account ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect a wallet to interact with the smart contracts on Cedra Testnet
            </p>
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="bg-cedra-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-cedra-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Generate Demo Wallet'}
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'counter' && (
              <CounterCard account={account} onRefreshBalance={() => refreshBalance(account.accountAddress.toString())} />
            )}
            {activeTab === 'token' && (
              <TokenCard account={account} onRefreshBalance={() => refreshBalance(account.accountAddress.toString())} />
            )}
            {activeTab === 'nft' && (
              <NFTCard account={account} onRefreshBalance={() => refreshBalance(account.accountAddress.toString())} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>Built for Cedra Builders Forge Hackathon 🚀</p>
          <p className="text-sm mt-2">
            Contracts deployed on Cedra Testnet • 
            <a href="https://cedrascan.com" target="_blank" rel="noopener noreferrer" className="text-cedra-400 hover:underline ml-1">
              View on Explorer
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
