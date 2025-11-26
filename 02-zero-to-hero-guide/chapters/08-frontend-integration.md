# Chapter 8: Frontend Integration

> **Connect Your React App to Cedra Smart Contracts**

---

## 🎯 What You'll Learn

- Set up a React + TypeScript project
- Install and configure the Cedra SDK
- Connect wallets (Petra, Martian, etc.)
- Call view functions (read data)
- Submit transactions (write data)
- Handle events and loading states

---

## 🏗️ Project Setup

### Create React Project

```powershell
# Create with Vite
npm create vite@latest my-cedra-app -- --template react-ts
cd my-cedra-app

# Install dependencies
npm install @cedra-labs/ts-sdk @cedra-labs/wallet-adapter-react
npm install
```

### Project Structure

```
my-cedra-app/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── Counter.tsx
│   │   └── TokenBalance.tsx
│   ├── hooks/
│   │   └── useContract.ts
│   └── utils/
│       └── cedra-client.ts
├── package.json
└── vite.config.ts
```

---

## 📦 Configure Cedra SDK

### Create Cedra Client

`src/utils/cedra-client.ts`:

```typescript
import { Cedra, CedraConfig, Network } from "@cedra-labs/ts-sdk";

// Configure for testnet
const config = new CedraConfig({
  network: Network.TESTNET
});

// Create Cedra client
export const cedra = new Cedra(config);

// Your contract address
export const MODULE_ADDRESS = "0x756e0baa26922cf7a5c4eb47c146a7abb680f60213c5b626cd3bbee40d8707f4";

// Module names
export const COUNTER_MODULE = `${MODULE_ADDRESS}::simple_counter`;
export const TOKEN_MODULE = `${MODULE_ADDRESS}::cedra_asset`;
export const NFT_MODULE = `${MODULE_ADDRESS}::cedra_nft`;
```

---

## 🔌 Wallet Connection

### Wallet Provider Setup

`src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { CedraWalletAdapterProvider } from '@cedra-labs/wallet-adapter-react';
import App from './App';
import './index.css';

// Supported wallets
const wallets = [
  // Wallets are auto-detected
];

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CedraWalletAdapterProvider 
      plugins={wallets} 
      autoConnect={true}
    >
      <App />
    </CedraWalletAdapterProvider>
  </React.StrictMode>
);
```

### Wallet Connect Component

`src/components/WalletConnect.tsx`:

```tsx
import { useWallet } from '@cedra-labs/wallet-adapter-react';

export function WalletConnect() {
  const { 
    connect, 
    disconnect, 
    account, 
    connected, 
    wallets,
    connecting 
  } = useWallet();

  if (connecting) {
    return <div className="wallet-status">Connecting...</div>;
  }

  if (connected && account) {
    return (
      <div className="wallet-connected">
        <span className="address">
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </span>
        <button onClick={disconnect} className="btn-disconnect">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-options">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => connect(wallet.name)}
          className="btn-wallet"
        >
          <img src={wallet.icon} alt={wallet.name} width={24} />
          {wallet.name}
        </button>
      ))}
    </div>
  );
}
```

---

## 📖 Reading Data (View Functions)

### Counter Read Example

`src/components/Counter.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useWallet } from '@cedra-labs/wallet-adapter-react';
import { cedra, COUNTER_MODULE } from '../utils/cedra-client';

export function Counter() {
  const { account, connected, signAndSubmitTransaction } = useWallet();
  const [count, setCount] = useState<number | null>(null);
  const [hasCounter, setHasCounter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch counter value
  const fetchCounter = async () => {
    if (!account?.address) return;

    try {
      // Check if counter exists
      const [exists] = await cedra.view({
        payload: {
          function: `${COUNTER_MODULE}::has_counter`,
          functionArguments: [account.address]
        }
      });
      
      setHasCounter(exists as boolean);

      if (exists) {
        // Get counter value
        const [value] = await cedra.view({
          payload: {
            function: `${COUNTER_MODULE}::get_count`,
            functionArguments: [account.address]
          }
        });
        setCount(Number(value));
      }
    } catch (err) {
      console.error('Error fetching counter:', err);
      setError('Failed to fetch counter');
    }
  };

  // Fetch on mount and when account changes
  useEffect(() => {
    if (connected) {
      fetchCounter();
    }
  }, [connected, account?.address]);

  // Initialize counter
  const handleInitialize = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${COUNTER_MODULE}::initialize`,
          functionArguments: []
        }
      });
      
      // Wait for transaction
      await cedra.waitForTransaction({ transactionHash: response.hash });
      
      // Refresh counter
      await fetchCounter();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize');
    } finally {
      setLoading(false);
    }
  };

  // Increment counter
  const handleIncrement = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${COUNTER_MODULE}::increment`,
          functionArguments: []
        }
      });
      
      await cedra.waitForTransaction({ transactionHash: response.hash });
      await fetchCounter();
    } catch (err: any) {
      setError(err.message || 'Failed to increment');
    } finally {
      setLoading(false);
    }
  };

  // Decrement counter
  const handleDecrement = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: `${COUNTER_MODULE}::decrement`,
          functionArguments: []
        }
      });
      
      await cedra.waitForTransaction({ transactionHash: response.hash });
      await fetchCounter();
    } catch (err: any) {
      setError(err.message || 'Failed to decrement');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return <div className="card">Please connect your wallet</div>;
  }

  return (
    <div className="card counter-card">
      <h2>🔢 Counter</h2>
      
      {error && <div className="error">{error}</div>}
      
      {!hasCounter ? (
        <div>
          <p>No counter found. Create one!</p>
          <button onClick={handleInitialize} disabled={loading}>
            {loading ? 'Initializing...' : 'Initialize Counter'}
          </button>
        </div>
      ) : (
        <div>
          <div className="count-display">
            <span className="count-value">{count ?? '...'}</span>
          </div>
          
          <div className="button-group">
            <button onClick={handleDecrement} disabled={loading || count === 0}>
              ➖ Decrement
            </button>
            <button onClick={handleIncrement} disabled={loading}>
              ➕ Increment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## ✍️ Writing Data (Transactions)

### Token Transfer Example

`src/components/TokenTransfer.tsx`:

```tsx
import { useState } from 'react';
import { useWallet } from '@cedra-labs/wallet-adapter-react';
import { cedra, TOKEN_MODULE } from '../utils/cedra-client';

export function TokenTransfer() {
  const { signAndSubmitTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTxHash(null);

    try {
      // Convert amount to smallest unit (8 decimals)
      const amountInUnits = BigInt(parseFloat(amount) * 1e8);

      const response = await signAndSubmitTransaction({
        payload: {
          function: `${TOKEN_MODULE}::transfer`,
          functionArguments: [recipient, amountInUnits.toString()]
        }
      });

      // Wait for confirmation
      await cedra.waitForTransaction({ transactionHash: response.hash });
      
      setTxHash(response.hash);
      setRecipient('');
      setAmount('');
    } catch (err: any) {
      console.error('Transfer failed:', err);
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>💸 Transfer Tokens</h2>
      
      <form onSubmit={handleTransfer}>
        <div className="form-group">
          <label>Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            step="0.00000001"
            min="0"
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Tokens'}
        </button>
      </form>
      
      {txHash && (
        <div className="success">
          <p>Transaction successful!</p>
          <a 
            href={`https://cedrascan.com/txn/${txHash}`} 
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 NFT Display Component

`src/components/NFTGallery.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useWallet } from '@cedra-labs/wallet-adapter-react';
import { cedra, MODULE_ADDRESS } from '../utils/cedra-client';

interface NFT {
  tokenId: string;
  name: string;
  uri: string;
  description: string;
}

export function NFTGallery() {
  const { account, connected } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNFTs = async () => {
    if (!account?.address) return;
    
    setLoading(true);
    try {
      // Fetch owned NFTs using indexer
      const response = await cedra.getAccountOwnedTokens({
        accountAddress: account.address,
        options: {
          tokenStandard: "v2"
        }
      });
      
      const nftList = response.map((token: any) => ({
        tokenId: token.token_data_id,
        name: token.current_token_data?.token_name || 'Unknown',
        uri: token.current_token_data?.token_uri || '',
        description: token.current_token_data?.description || ''
      }));
      
      setNfts(nftList);
    } catch (err) {
      console.error('Error fetching NFTs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchNFTs();
    }
  }, [connected, account?.address]);

  if (!connected) {
    return <div className="card">Connect wallet to view NFTs</div>;
  }

  if (loading) {
    return <div className="card">Loading NFTs...</div>;
  }

  return (
    <div className="card nft-gallery">
      <h2>🖼️ Your NFTs</h2>
      
      {nfts.length === 0 ? (
        <p>No NFTs found</p>
      ) : (
        <div className="nft-grid">
          {nfts.map((nft) => (
            <div key={nft.tokenId} className="nft-card">
              <img 
                src={nft.uri || '/placeholder.png'} 
                alt={nft.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
              />
              <h3>{nft.name}</h3>
              <p>{nft.description}</p>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={fetchNFTs}>🔄 Refresh</button>
    </div>
  );
}
```

---

## 🪝 Custom Hooks

### useContractView Hook

`src/hooks/useContractView.ts`:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { cedra } from '../utils/cedra-client';

interface ViewOptions {
  functionId: string;
  args: any[];
  enabled?: boolean;
}

export function useContractView<T>({ functionId, args, enabled = true }: ViewOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [result] = await cedra.view({
        payload: {
          function: functionId,
          functionArguments: args
        }
      });
      setData(result as T);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [functionId, JSON.stringify(args), enabled]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// Usage:
// const { data: count, loading, refetch } = useContractView<number>({
//   functionId: `${MODULE}::get_count`,
//   args: [address],
//   enabled: !!address
// });
```

### useContractTransaction Hook

`src/hooks/useContractTransaction.ts`:

```tsx
import { useState, useCallback } from 'react';
import { useWallet } from '@cedra-labs/wallet-adapter-react';
import { cedra } from '../utils/cedra-client';

interface TransactionOptions {
  functionId: string;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

export function useContractTransaction({ functionId, onSuccess, onError }: TransactionOptions) {
  const { signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const execute = useCallback(async (args: any[] = []) => {
    setLoading(true);
    setTxHash(null);
    
    try {
      const response = await signAndSubmitTransaction({
        payload: {
          function: functionId,
          functionArguments: args
        }
      });
      
      await cedra.waitForTransaction({ transactionHash: response.hash });
      
      setTxHash(response.hash);
      onSuccess?.(response.hash);
      
      return response.hash;
    } catch (err) {
      onError?.(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [functionId, signAndSubmitTransaction, onSuccess, onError]);

  return { execute, loading, txHash };
}

// Usage:
// const { execute: increment, loading } = useContractTransaction({
//   functionId: `${MODULE}::increment`,
//   onSuccess: () => refetch()
// });
```

---

## 🎨 Main App Component

`src/App.tsx`:

```tsx
import { WalletConnect } from './components/WalletConnect';
import { Counter } from './components/Counter';
import { TokenTransfer } from './components/TokenTransfer';
import { NFTGallery } from './components/NFTGallery';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>🌟 My Cedra DApp</h1>
        <WalletConnect />
      </header>
      
      <main className="main">
        <div className="grid">
          <Counter />
          <TokenTransfer />
          <NFTGallery />
        </div>
      </main>
      
      <footer className="footer">
        <p>Built on Cedra with ❤️</p>
      </footer>
    </div>
  );
}

export default App;
```

---

## 🎨 Styling

`src/App.css`:

```css
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --bg: #0f172a;
  --card-bg: #1e293b;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --success: #22c55e;
  --error: #ef4444;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.card {
  background: var(--card-bg);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

button {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: var(--primary-dark);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  background: var(--bg);
  color: var(--text);
  font-size: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-muted);
}

.count-display {
  font-size: 4rem;
  text-align: center;
  margin: 2rem 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.nft-card img {
  width: 100%;
  border-radius: 0.5rem;
}

.error {
  color: var(--error);
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.success {
  color: var(--success);
  padding: 0.5rem;
  margin-top: 1rem;
}
```

---

## 🚀 Running Your App

```powershell
npm run dev
```

Visit `http://localhost:5173` in your browser!

---

## 📝 Key Takeaways

1. **Cedra SDK** provides TypeScript types and utilities
2. **Wallet Adapter** handles connection and signing
3. **View functions** are free and read-only
4. **Transactions** require wallet signature and gas
5. **Custom hooks** simplify contract interactions

---

## ➡️ Next Steps

In Chapter 9, we'll cover deployment best practices and mainnet preparation!

[Continue to Chapter 9: Deployment & Best Practices →](./09-deployment.md)
