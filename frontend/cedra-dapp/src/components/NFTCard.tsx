import { useState, useEffect } from 'react';
import { Account } from '@cedra-labs/ts-sdk';
import { cedra, MODULE_ADDRESS } from '../App';

interface NFTCardProps {
  account: Account;
  onRefreshBalance: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  Common: 'bg-gray-200 text-gray-700',
  Rare: 'bg-blue-200 text-blue-700',
  Epic: 'bg-purple-200 text-purple-700',
  Legendary: 'bg-yellow-200 text-yellow-700',
};

export default function NFTCard({ account, onRefreshBalance }: NFTCardProps) {
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [nftName, setNftName] = useState<string>('My NFT');
  const [nftDescription, setNftDescription] = useState<string>('An awesome NFT!');
  const [nftRarity, setNftRarity] = useState<string>('Rare');
  const [nftPower, setNftPower] = useState<string>('50');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNFTInfo();
  }, [account]);

  const fetchNFTInfo = async () => {
    try {
      const result = await cedra.view({
        payload: {
          function: `${MODULE_ADDRESS}::cedra_nft::total_minted`,
          functionArguments: [MODULE_ADDRESS],
        },
      });
      setTotalMinted(Number(result[0]));
    } catch (e) {
      console.error('Error fetching NFT info:', e);
    }
  };

  const mintNFT = async () => {
    setIsLoading(true);
    setError(null);
    setTxHash(null);
    
    try {
      const tokenName = `${nftName} #${totalMinted + 1}`;
      const tokenUri = `https://cedra.network/nft/${totalMinted + 1}.json`;
      
      const transaction = await cedra.transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::cedra_nft::mint_nft`,
          functionArguments: [
            tokenName,
            nftDescription,
            tokenUri,
            nftRarity,
            parseInt(nftPower),
          ],
        },
      });

      const pendingTxn = await cedra.signAndSubmitTransaction({
        signer: account,
        transaction,
      });

      await cedra.waitForTransaction({ transactionHash: pendingTxn.hash });
      
      setTxHash(pendingTxn.hash);
      await fetchNFTInfo();
      onRefreshBalance();
    } catch (e: any) {
      setError(e.message || 'Mint failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🖼️</div>
        <h2 className="text-2xl font-bold text-gray-800">NFT Collection</h2>
        <p className="text-gray-500 text-sm">Cedra Tutorial NFTs</p>
      </div>

      {/* Collection Stats */}
      <div className="bg-gradient-to-r from-cedra-500 to-cedra-600 rounded-xl p-4 text-white text-center mb-6">
        <div className="text-4xl font-bold">{totalMinted}</div>
        <div className="text-cedra-100">NFTs Minted</div>
        <div className="text-sm text-cedra-200 mt-1">Max Supply: 1,000</div>
      </div>

      {/* NFT Preview */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 mb-6">
        <div className="aspect-square bg-gradient-to-br from-cedra-100 to-purple-100 rounded-lg flex items-center justify-center mb-3">
          <div className="text-6xl">🎨</div>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-800">{nftName} #{totalMinted + 1}</h3>
          <p className="text-gray-500 text-sm">{nftDescription}</p>
          <div className="flex justify-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${RARITY_COLORS[nftRarity]}`}>
              {nftRarity}
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
              ⚡ Power: {nftPower}
            </span>
          </div>
        </div>
      </div>

      {/* Mint Form */}
      <div className="space-y-3">
        <input
          type="text"
          value={nftName}
          onChange={(e) => setNftName(e.target.value)}
          placeholder="NFT Name"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cedra-500"
        />
        <textarea
          value={nftDescription}
          onChange={(e) => setNftDescription(e.target.value)}
          placeholder="Description"
          rows={2}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cedra-500 resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={nftRarity}
            onChange={(e) => setNftRarity(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cedra-500"
          >
            <option value="Common">Common</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
          </select>
          <input
            type="number"
            value={nftPower}
            onChange={(e) => setNftPower(e.target.value)}
            placeholder="Power (1-100)"
            min="1"
            max="100"
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cedra-500"
          />
        </div>
        <button
          onClick={mintNFT}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cedra-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-cedra-600 hover:to-purple-600 transition-all disabled:opacity-50"
        >
          {isLoading ? '⏳ Minting...' : '🎨 Mint NFT'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 text-center text-gray-500">
          <span className="animate-pulse">⏳ Minting your NFT on-chain...</span>
        </div>
      )}

      {/* Success Message */}
      {txHash && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          ✅ NFT minted successfully!{' '}
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
