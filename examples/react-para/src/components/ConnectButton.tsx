import { useState, useEffect } from 'react';
import { useModal, useAccount } from "@getpara/react-sdk";
import { createPublicClient, http } from 'viem';
import { erc20Abi } from 'viem';
import { baseSepolia, base } from 'viem/chains';

// Chain configuration
const chain = (import.meta.env.VITE_CHAIN === 'base') ? base : baseSepolia;
const rpcUrl = import.meta.env.VITE_RPC_URL;

const SBC_TOKEN_ADDRESS = (chain: any) => {
  if (chain.id === baseSepolia.id) {
    return '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16';
  } else if (chain.id === base.id) {
    return '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798';
  }
  throw new Error('Unsupported chain');
};

const SBC_DECIMALS = (chain: any) => {
  if (chain.id === baseSepolia.id) {
    return 6;
  } else if (chain.id === base.id) {
    return 18;
  }
  throw new Error('Unsupported chain');
};

const publicClient = createPublicClient({ 
  chain, 
  transport: http(rpcUrl),
});

export function ConnectButton() {
  const { openModal } = useModal();
  const account = useAccount();
  const [balances, setBalances] = useState<{ eth: string | null; sbc: string | null }>({ eth: null, sbc: null });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (!account.isConnected || !account.embedded.wallets?.length) {
      setBalances({ eth: null, sbc: null });
      return;
    }

    const fetchBalances = async () => {
      setIsLoadingBalances(true);
      try {
        const walletAddress = account.embedded.wallets?.[0]?.address;
        if (!walletAddress) {
          throw new Error('No wallet address found');
        }

        const [ethBalance, sbcBalance] = await Promise.all([
          publicClient.getBalance({ address: walletAddress as `0x${string}` }),
          publicClient.readContract({
            address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [walletAddress as `0x${string}`],
          }),
        ]);

        setBalances({
          eth: ethBalance.toString(),
          sbc: sbcBalance.toString(),
        });
      } catch (error) {
        console.error('Failed to fetch Para wallet balances:', error);
        setBalances({ eth: null, sbc: null });
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [account.isConnected, account.embedded.wallets]);

  const formatEthBalance = (balance: string | null): string => {
    if (!balance) return '0.0000';
    const ethValue = Number(balance) / 1e18;
    return ethValue.toFixed(4);
  };

  const formatSbcBalance = (balance: string | null, decimals: number): string => {
    if (!balance) return '0.0000';
    const sbcValue = Number(balance) / Math.pow(10, decimals);
    return sbcValue.toFixed(4);
  };
  
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      {account.isConnected && account.embedded.wallets?.length ? (
        <div>
          <h3 className="font-semibold text-green-800 mb-1">✅ Para Wallet Connected</h3>
          <p className="text-xs text-green-600 font-mono break-all mb-2">
            EOA: {account.embedded.wallets[0].address}
          </p>
          <p className="text-xs text-green-600 mb-2">
            Universal Embedded Wallet via Para SDK
          </p>
          <p className="text-xs text-green-600 mb-2"><strong>Chain:</strong> {chain.name} (ID: {chain.id})</p>
          
          {/* Balance Section */}
          <div className="mt-2 pt-2 border-t border-green-200">
            <p className="text-xs font-medium text-green-700 mb-1">Embedded Wallet Balances:</p>
            {isLoadingBalances ? (
              <p className="text-xs text-green-600">Loading balances...</p>
            ) : (
              <div className="flex gap-4">
                <span className="text-xs text-green-600">
                  <strong>ETH:</strong> {formatEthBalance(balances.eth)}
                </span>
                <span className="text-xs text-green-600">
                  <strong>SBC:</strong> {formatSbcBalance(balances.sbc, SBC_DECIMALS(chain))}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => openModal()}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm mr-2 mt-3"
          >
            Manage Wallet
          </button>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold text-blue-800 mb-2">🔗 Connect to Para</h3>
          <p className="text-sm text-blue-600 mb-3">
            Authenticate with Para's universal embedded wallet to create a smart account. 
            Para provides wallet portability across applications with granular permissions.
          </p>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
} 