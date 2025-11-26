import { useState, useEffect } from 'react';
import { Account } from '@cedra-labs/ts-sdk';
import { cedra, MODULE_ADDRESS } from '../App';

interface CounterCardProps {
  account: Account;
  onRefreshBalance: () => void;
}

export default function CounterCard({ account, onRefreshBalance }: CounterCardProps) {
  const [count, setCount] = useState<number | null>(null);
  const [hasCounter, setHasCounter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCounter();
  }, [account]);

  const checkCounter = async () => {
    try {
      const result = await cedra.view({
        payload: {
          function: `${MODULE_ADDRESS}::simple_counter::has_counter`,
          functionArguments: [account.accountAddress.toString()],
        },
      });
      setHasCounter(result[0] as boolean);
      if (result[0]) {
        await fetchCount();
      }
    } catch (e) {
      console.error('Error checking counter:', e);
    }
  };

  const fetchCount = async () => {
    try {
      const result = await cedra.view({
        payload: {
          function: `${MODULE_ADDRESS}::simple_counter::get_count`,
          functionArguments: [account.accountAddress.toString()],
        },
      });
      setCount(Number(result[0]));
    } catch (e) {
      console.error('Error fetching count:', e);
    }
  };

  const executeTransaction = async (functionName: string, args: any[] = []) => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::simple_counter::${functionName}`,
          functionArguments: args,
        },
      });

      const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
      
      setTxHash(pendingTxn.hash);
      await checkCounter();
      onRefreshBalance();
    } catch (e: any) {
      setError(e.message || 'Transaction failed');
      console.error('Transaction error:', e);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🔢</div>
        <h2 className="text-2xl font-bold text-gray-800">Counter Contract</h2>
        <p className="text-gray-500 text-sm">Interact with your on-chain counter</p>
      </div>

      {!hasCounter ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You don't have a counter yet!</p>
          <button
            onClick={() => executeTransaction('initialize')}
            disabled={isLoading}
            className="bg-cedra-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-cedra-600 transition-colors disabled:opacity-50 w-full"
          >
            {isLoading ? '⏳ Creating...' : '🚀 Initialize Counter'}
          </button>
        </div>
      ) : (
        <>
          {/* Counter Display */}
          <div className="bg-gray-100 rounded-xl p-8 text-center mb-6">
            <div className="text-6xl font-bold text-cedra-600">
              {count !== null ? count : '...'}
            </div>
            <div className="text-gray-500 mt-2">Current Count</div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => executeTransaction('decrement')}
              disabled={isLoading}
              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              ➖ -1
            </button>
            <button
              onClick={() => executeTransaction('increment')}
              disabled={isLoading}
              className="bg-cedra-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-cedra-600 transition-colors disabled:opacity-50"
            >
              ➕ +1
            </button>
            <button
              onClick={() => executeTransaction('reset')}
              disabled={isLoading}
              className="bg-red-100 text-red-600 px-4 py-3 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              🔄 Reset
            </button>
          </div>

          <button
            onClick={() => executeTransaction('increment_by', [5])}
            disabled={isLoading}
            className="bg-cedra-100 text-cedra-700 px-4 py-3 rounded-lg font-medium hover:bg-cedra-200 transition-colors disabled:opacity-50 w-full"
          >
            ⏫ Increment by 5
          </button>
        </>
      )}

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
