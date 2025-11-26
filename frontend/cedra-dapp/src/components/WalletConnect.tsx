import { Account } from '@cedra-labs/ts-sdk';

interface WalletConnectProps {
  account: Account | null;
  balance: string;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function WalletConnect({
  account,
  balance,
  isLoading,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  if (!account) {
    return (
      <button
        onClick={onConnect}
        disabled={isLoading}
        className="bg-white text-cedra-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Connecting...
          </>
        ) : (
          <>
            <span>🔗</span>
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  const shortAddress = `${account.accountAddress.toString().slice(0, 6)}...${account.accountAddress.toString().slice(-4)}`;

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm text-cedra-200">Balance</div>
        <div className="font-bold">{balance} CEDRA</div>
      </div>
      <div className="bg-white/20 px-4 py-2 rounded-lg">
        <div className="text-sm text-cedra-200">Connected</div>
        <div className="font-mono text-sm">{shortAddress}</div>
      </div>
      <button
        onClick={onDisconnect}
        className="bg-red-500/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
