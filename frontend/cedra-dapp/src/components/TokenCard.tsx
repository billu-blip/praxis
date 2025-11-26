import { useState, useEffect } from 'react';
import { Account } from '@cedra-labs/ts-sdk';
import { cedra, MODULE_ADDRESS } from '../App';

interface TokenCardProps {
  account: Account;
  onRefreshBalance: () => void;
}

export default function TokenCard({ account, onRefreshBalance }: TokenCardProps) {
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const [mintAmount, setMintAmount] = useState<string>('100');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('10');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenInfo();
  }, [account]);

  const fetchTokenInfo = async () => {
    try {
      // Get token balance
      const balanceResult = await cedra.view({
        payload: {
          function: `${MODULE_ADDRESS}::cedra_asset::balance`,
          functionArguments: [account.accountAddress.toString()],
        },
      });
      const bal = Number(balanceResult[0]) / 100_000_000;
      setTokenBalance(bal.toFixed(2));

      // Get total supply
      const supplyResult = await cedra.view({
        payload: {
          function: `${MODULE_ADDRESS}::cedra_asset::total_supply`,
          functionArguments: [],
        },
      });
      const supply = Number(supplyResult[0]) / 100_000_000;
      setTotalSupply(supply.toFixed(2));
    } catch (e) {
      console.error('Error fetching token info:', e);
    }
  };

  const mintTokens = async () => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const amount = Math.floor(parseFloat(mintAmount) * 100_000_000);
      
      const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::cedra_asset::mint`,
          functionArguments: [account.accountAddress.toString(), amount],
        },
      });

      const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
      
      setTxHash(pendingTxn.hash);
      await fetchTokenInfo();
      onRefreshBalance();
    } catch (e: any) {
      setError(e.message || 'Mint failed');
    }
    
    setIsLoading(false);
  };

  const transferTokens = async () => {
    if (!transferTo) {
      setError('Please enter a recipient address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const amount = Math.floor(parseFloat(transferAmount) * 100_000_000);
      
      const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::cedra_asset::transfer`,
          functionArguments: [transferTo, amount],
        },
      });

      const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
      
      setTxHash(pendingTxn.hash);
      await fetchTokenInfo();
      onRefreshBalance();
    } catch (e: any) {
      setError(e.message || 'Transfer failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🪙</div>
        <h2 className="text-2xl font-bold text-gray-800">CTT Token</h2>
        <p className="text-gray-500 text-sm">Cedra Tutorial Token (Fungible Asset)</p>
      </div>

      {/* Token Info Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-cedra-50 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-cedra-600">{tokenBalance}</div>
          <div className="text-gray-500 text-sm">Your Balance</div>
        </div>
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-gray-600">{totalSupply}</div>
          <div className="text-gray-500 text-sm">Total Supply</div>
        </div>
      </div>

      {/* Mint Section */}
      <div className="border-t pt-4 mb-4">
        <h3 className="font-medium text-gray-700 mb-3">💰 Mint Tokens (Admin)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cedra-500"
          />
          <button
            onClick={mintTokens}
            disabled={isLoading}
            className="bg-cedra-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-cedra-600 transition-colors disabled:opacity-50"
          >
            Mint
          </button>
        </div>
      </div>

      {/* Transfer Section */}
      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-700 mb-3">📤 Transfer Tokens</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            placeholder="Recipient address (0x...)"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cedra-500 font-mono text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount"
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cedra-500"
            />
            <button
              onClick={transferTokens}
              disabled={isLoading}
              className="bg-gray-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 text-center text-gray-500">
          <span className="animate-pulse">⏳ Processing transaction...</span>
        </div>
      )}

      {/* Success Message */}
      {txHash && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          ✅ Transaction successful!{' '}
          <a
            href={`https://cedrascan.com/txn/${txHash}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            View on Explorer
          </a>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
