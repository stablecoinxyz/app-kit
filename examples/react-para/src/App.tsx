import { useState, useEffect, useMemo } from 'react';
import { useSbcPara } from '@stablecoin.xyz/react';
import { useAccount, useWallet, useSignMessage } from '@getpara/react-sdk';
import { usePara } from './hooks/usePara';
import { Providers } from './providers';
import { ConnectButton } from './components/ConnectButton';
import { baseSepolia, base } from 'viem/chains';
import { createPublicClient, http, getAddress, PublicClient, Chain } from 'viem';
import { hexToBytes } from 'viem/utils';
import { parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import { buildPermitTypedData, hashPermitTypedData, hex32ToBase64, normalizeSignatureToRSV, deriveVForRS } from './utils/permit';
import './index.css';

// default to baseSepolia, but can be overridden with VITE_CHAIN=base
const chain = (import.meta.env.VITE_CHAIN === 'base') ? base : baseSepolia;
const rpcUrl = import.meta.env.VITE_RPC_URL;

const SBC_TOKEN_ADDRESS = (chain: Chain) => {
  if (chain.id === baseSepolia.id) {
    return '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16';
  } else if (chain.id === base.id) {
    return '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798';
  }
  throw new Error('Unsupported chain');
};

const SBC_DECIMALS = (chain: Chain) => {
  if (chain.id === baseSepolia.id) {
    return 6;
  } else if (chain.id === base.id) {
    return 18;
  }
  throw new Error('Unsupported chain');
};

const chainExplorer = (chain: Chain) => {
  if (chain.id === baseSepolia.id) {
    return 'https://sepolia.basescan.org';
  } else if (chain.id === base.id) {
    return 'https://basescan.org';
  }
  throw new Error('Unsupported chain');
};

const publicClient = createPublicClient({ 
  chain, 
  transport: http(rpcUrl),
}) as PublicClient;

const erc20PermitAbi = [
  ...erc20Abi,
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "nonces",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const permitAbi = [
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" },
      { "internalType": "uint8", "name": "v", "type": "uint8" },
      { "internalType": "bytes32", "name": "r", "type": "bytes32" },
      { "internalType": "bytes32", "name": "s", "type": "bytes32" }
    ],
    "name": "permit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Smart account info component
function SmartAccountInfo({ 
  account, 
  isLoadingAccount, 
  accountError, 
  refreshAccount 
}: {
  account: any;
  isLoadingAccount: boolean;
  accountError: Error | null;
  refreshAccount: () => Promise<void>;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sbcBalance, setSbcBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fetch SBC balance for smart account
  useEffect(() => {
    if (!account?.address) return;

    const fetchSbcBalance = async () => {
      setIsLoadingBalance(true);
      try {
        const balance = await publicClient.readContract({
          address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [account.address as `0x${string}`],
        });
        setSbcBalance(balance.toString());
      } catch (error) {
        console.error('Failed to fetch SBC balance for smart account:', error);
        setSbcBalance('0');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchSbcBalance();
  }, [account?.address]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAccount?.();
      // Refresh SBC balance as well
      if (account?.address) {
        setIsLoadingBalance(true);
        try {
          const balance = await publicClient.readContract({
            address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account.address as `0x${string}`],
          });
          setSbcBalance(balance.toString());
        } catch (error) {
          console.error('Failed to refresh SBC balance:', error);
        } finally {
          setIsLoadingBalance(false);
        }
      }
    } catch (error) {
      // error handled by parent component
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper functions for formatting
  const formatEthBalance = (balance: string | null): string => {
    if (!balance) return '0.0000';
    try {
      return (Number(balance) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const formatSbcBalance = (balance: string | null, decimals: number): string => {
    if (!balance) return '0.00';
    try {
      return (Number(balance) / Math.pow(10, decimals)).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  if (!account) {
    return null;
  }

  return (
    <div className="w-full mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-purple-800">🔐 Smart Account Status</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isLoadingAccount}
          className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
        >
          {isRefreshing || isLoadingAccount ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-purple-700 text-xs">Address:</span>
          <span className="font-mono text-xs text-purple-600 break-all">{account.address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-700 text-xs">Deployed:</span>
          <span className="text-purple-600">{account.isDeployed ? '✅ Yes' : '⏳ On first transaction'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-700 text-xs">Nonce:</span>
          <span className="text-purple-600">{account.nonce}</span>
        </div>
        
        <div className="pt-2 border-t border-purple-200">
          <p className="text-xs font-medium text-purple-700 mb-2">Smart Account Balances:</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-purple-700">ETH:</span>
              <span className="text-purple-600 font-mono text-xs">
                {formatEthBalance(account.balance)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">SBC:</span>
              <span className="text-purple-600 font-mono text-xs">
                {isLoadingBalance ? 'Loading...' : `${formatSbcBalance(sbcBalance, SBC_DECIMALS(chain))} SBC`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {accountError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-600">Error: {accountError.message}</p>
        </div>
      )}
    </div>
  );
}

// Transaction form component
function TransactionForm({ 
  account, 
  sbcAppKit
}: {
  account: any;
  sbcAppKit: any;
}) {
  const paraAccount = useAccount();
  const { data: wallet } = useWallet();
  const signMessageHook = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1');
  const isFormValid = recipient && /^0x[a-fA-F0-9]{40}$/.test(recipient) && parseFloat(amount) > 0;

  // Check if using external wallet (MetaMask/Coinbase) or embedded wallet
  const isExternalWallet = paraAccount.isConnected && paraAccount.external?.evm?.address;
  const isEmbeddedWallet = paraAccount.isConnected && paraAccount.embedded?.wallets && paraAccount.embedded.wallets.length > 0;
  
  // Get wallet address based on connection type
  const walletAddress = isExternalWallet 
    ? paraAccount.external?.evm?.address 
    : isEmbeddedWallet 
      ? paraAccount.embedded.wallets?.[0]?.address 
      : null;

  const handleSendTransaction = async () => {
    if (!account || !sbcAppKit || !paraAccount.isConnected || !walletAddress) return;
    
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const ownerChecksum = getAddress(walletAddress);
      const spenderChecksum = getAddress(account.address);
      const value = parseUnits(amount, SBC_DECIMALS(chain));
      const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min
      
      const walletClient = sbcAppKit.getWalletClient();
      
      if (!walletClient) {
        throw new Error('No wallet client available. Please reconnect your wallet.');
      }
      
      // We use Para signMessage path exclusively for permit digest
      
      console.log('Transaction: Para wallet info:', {
        walletAddress: walletAddress,
        isExternalWallet,
        isEmbeddedWallet,
        sbcWalletConnected: !!walletClient
      });
      
      // Check wallet balance before proceeding
      const walletBalance = await publicClient.readContract({
        address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
        abi: erc20PermitAbi,
        functionName: 'balanceOf',
        args: [ownerChecksum as `0x${string}`],
      });
      
      if ((walletBalance as bigint) < value) {
        throw new Error(`Insufficient SBC balance in your wallet.
        
Your wallet has: ${(walletBalance as bigint).toString()} SBC tokens
Amount to send: ${value.toString()} SBC tokens`);
      }
      
      let result;

      // Build typed data and sign EIP-712 digest via Para signMessage
      const nonce = await publicClient.readContract({
        address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
        abi: erc20PermitAbi,
        functionName: 'nonces',
        args: [ownerChecksum as `0x${string}`],
      });
      const tokenName = await publicClient.readContract({
        address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
        abi: erc20PermitAbi,
        functionName: 'name',
      });
      const typed = buildPermitTypedData({
        tokenName: tokenName as string,
        chainId: chain.id,
        tokenAddress: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
        owner: ownerChecksum as `0x${string}`,
        spender: spenderChecksum as `0x${string}`,
        value,
        nonce: nonce as bigint,
        deadline: BigInt(deadline),
      });
      let r: `0x${string}`; let s: `0x${string}`; let v: number;
      const digest = hashPermitTypedData(typed);
      const digestBase64 = hex32ToBase64(digest);
      if (!wallet?.id) throw new Error('No Para wallet ID');
      const sigRes = await signMessageHook.signMessageAsync({ walletId: wallet.id, messageBase64: digestBase64 });
      const paraSig = (sigRes as any)?.signatureBase64 || (sigRes as any)?.signature || (typeof sigRes === 'string' ? sigRes : '');
      let norm = normalizeSignatureToRSV(paraSig);
      r = norm.r; s = norm.s; v = norm.v;
      if (!v || v === 0) {
        v = await deriveVForRS({ digest, r, s, owner: ownerChecksum as `0x${string}` });
      }

      const deadlineBigInt = BigInt(deadline);
      const permitCallData = encodeFunctionData({
        abi: permitAbi,
        functionName: 'permit',
        args: [ownerChecksum, spenderChecksum, value, deadlineBigInt, v, r, s],
      });
      const transferFromCallData = encodeFunctionData({
        abi: erc20PermitAbi,
        functionName: 'transferFrom',
        args: [ownerChecksum, recipient as `0x${string}`, value],
      });
      
      result = await sbcAppKit.sendUserOperation({
        calls: [
          { to: SBC_TOKEN_ADDRESS(chain) as `0x${string}`, data: permitCallData },
          { to: SBC_TOKEN_ADDRESS(chain) as `0x${string}`, data: transferFromCallData },
        ],
      });
      
      setData(result);
      setRecipient('');
      setAmount('1');
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) return null;



  return (
    <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">💸 Send SBC Tokens</h3>
      
      <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className={`w-full px-3 py-2 text-xs font-mono border rounded-md focus:outline-none focus:ring-2 ${
                recipient && !isFormValid 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {recipient && !/^0x[a-fA-F0-9]{40}$/.test(recipient) && (
              <p className="text-xs text-red-600 mt-1">Invalid Ethereum address</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (SBC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.0"
              step="0.000001"
              min="0"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between text-sm">
              <span>Amount:</span>
              <span className="font-medium">{amount} SBC</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Gas fees:</span>
              <span>Covered by SBC Paymaster ✨</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Wallet type:</span>
              <span>{isExternalWallet ? 'External (MetaMask/Coinbase) ✅' : 'Para Embedded'}</span>
            </div>
          </div>
          <button
            onClick={handleSendTransaction}
            disabled={!isFormValid || isLoading || !account}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Waiting for signature...' : `Send ${amount} SBC`}
          </button>
          {data && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800 font-medium">✅ Transaction Successful!</p>
              <p className="text-xs text-green-600 font-mono break-all mt-1">
                <a 
                  href={`${chainExplorer(chain)}/tx/${data.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View on BaseScan: {data.transactionHash}
                </a>
              </p>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 font-medium">❌ Transaction Failed</p>
              <p className="text-xs text-red-600 mt-1 whitespace-pre-line">{error}</p>
            </div>
          )}
        </div>
    </div>
  );
}

// (Removed legacy getPermitSignature – replaced by Para signMessage digest approach)

// Main App component that uses Para SDK and SBC together
function ParaApp() {
  const paraAccount = useAccount();
  const { publicClient: paraPublicClient, walletClient: paraWalletClient, account: paraAccount_viem } = usePara();
  const { data: wallet } = useWallet();
  const signMsg = useSignMessage();
  
  // Memoize the paraViemClients object to prevent unnecessary re-renders
  const wrappedWalletClient = useMemo(() => {
    if (!paraWalletClient || !paraAccount_viem || !wallet?.id) return null;
    const base = paraWalletClient as any;
    const account = {
      ...paraAccount_viem,
      async signMessage({ message }: any) {
        // Normalize message to Uint8Array
        const toBytes = (m: any): Uint8Array => {
          if (!m) throw new Error('signMessage: missing message');
          // Plain string or hex string
          if (typeof m === 'string') {
            if (m.startsWith('0x')) return hexToBytes(m as `0x${string}`);
            return new TextEncoder().encode(m);
          }
          // Object with raw/bytes
          const raw = m.raw ?? m.bytes ?? m.data ?? m;
          if (typeof raw === 'string') {
            if (raw.startsWith('0x')) return hexToBytes(raw as `0x${string}`);
            return new TextEncoder().encode(raw);
          }
          if (raw instanceof Uint8Array) return raw;
          if (raw instanceof ArrayBuffer) return new Uint8Array(raw);
          if (Array.isArray(raw)) return new Uint8Array(raw);
          throw new Error('signMessage: unsupported message format');
        };
        const rawBytes = toBytes(message);
        const b64 = btoa(String.fromCharCode(...rawBytes));
        const res = await signMsg.signMessageAsync({ walletId: wallet.id, messageBase64: b64 });
        const sig = (res as any)?.signatureBase64 || (res as any)?.signature || (typeof res === 'string' ? res : '');
        // Return 65-byte hex signature
        const { r, s, v } = normalizeSignatureToRSV(sig);
        const vHex = (v < 27 ? v + 27 : v).toString(16).padStart(2, '0');
        return (r + s.slice(2) + vHex) as `0x${string}`;
      },
    };
    return {
      ...base,
      account,
      async signMessage(args: any) {
        return account.signMessage(args);
      },
    };
  }, [paraWalletClient, paraAccount_viem, wallet?.id]);

  const paraViemClients = useMemo(() => ({
    publicClient: paraPublicClient,
    walletClient: wrappedWalletClient || paraWalletClient,
    account: paraAccount_viem
  }), [paraPublicClient, wrappedWalletClient, paraWalletClient, paraAccount_viem]);
  
  const {
    sbcAppKit,
    isInitialized,
    error,
    account,
    isLoadingAccount,
    accountError,
    refreshAccount
  } = useSbcPara({
    apiKey: import.meta.env.VITE_SBC_API_KEY,
    chain,
    paraAccount,
    rpcUrl,
    debug: true,
    paraViemClients
  });

  // Check if any Para wallet is connected (external or embedded)
  const isParaConnected = paraAccount.isConnected && 
    (paraAccount.external?.evm?.address || (paraAccount.embedded?.wallets && paraAccount.embedded.wallets.length > 0));
  


  return (
    <div className="fixed inset-0 flex justify-center bg-gray-50">
      <div className="py-8 w-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <img src="/sbc-logo.png" alt="SBC Logo" width={36} height={36} />
              SBC (Para) Integration
            </h1>
            <p className="text-gray-600">
              Gasless transactions with Para Wallet
            </p>
          </div>
          
          <ConnectButton />

          
          {/* Only show SBC components when Para is connected and SBC is initialized */}
          {isParaConnected && isInitialized && (
            <>
              <SmartAccountInfo 
                account={account}
                isLoadingAccount={isLoadingAccount}
                accountError={accountError}
                refreshAccount={refreshAccount}
              />
              <TransactionForm 
                account={account}
                sbcAppKit={sbcAppKit}
              />
            </>
          )}
          
          {/* Show error state */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-red-800">Error: {error.message}</p>
            </div>
          )}
          
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Powered by{' '}
              <a href="https://stablecoin.xyz" className="text-blue-600 hover:underline">
                SBC AppKit
              </a>
              {' '}• Para Wallet integration
              {(paraAccount.isConnected && paraAccount.external?.evm?.address) && ' (External wallet mode)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Root App component with Para providers
export default function App() {
  return (
    <Providers>
      <ParaApp />
    </Providers>
  );
} 