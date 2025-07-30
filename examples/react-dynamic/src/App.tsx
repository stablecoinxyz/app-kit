import { useState, useEffect } from 'react';
import { SbcProvider, useSbcApp, useUserOperation } from '@stablecoin.xyz/react';
import { DynamicContextProvider, useDynamicContext, DynamicUserProfile } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { ZeroDevSmartWalletConnectors } from '@dynamic-labs/ethereum-aa';
import { baseSepolia, base } from 'viem/chains';
import { createPublicClient, http, getAddress, parseSignature, WalletClient, PublicClient, Chain } from 'viem';
import { parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import './App.css';

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

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) }) as PublicClient;

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

// Wrapper component to ensure Dynamic SDK is ready before rendering DynamicUserProfile
const DynamicUserProfileWrapper = () => {
  const { sdkHasLoaded } = useDynamicContext();
  
  // Only render DynamicUserProfile when SDK has loaded
  if (!sdkHasLoaded) {
    return null;
  }
  
  return <DynamicUserProfile />;
};

// Dynamic connect flow component
function DynamicConnectFlow() {
  const { primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext();

  const handleDisconnect = async () => {
    try {
      console.log('Attempting to disconnect wallet');
      await handleLogOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  if (!primaryWallet) {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">🔗 Connect Your Dynamic Wallet</h3>
        <p className="text-sm text-blue-600 mb-3">
          Connect your wallet through Dynamic to create a smart account with your wallet as the signer
        </p>
        <button
          onClick={() => setShowAuthFlow(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <DynamicWalletStatus onDisconnect={handleDisconnect} />
  );
}

// Dynamic wallet status component
function DynamicWalletStatus({ onDisconnect }: { onDisconnect: () => void }) {
  const { primaryWallet } = useDynamicContext();
  const [balances, setBalances] = useState<{ eth: string | null; sbc: string | null }>({ eth: null, sbc: null });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (!primaryWallet?.address) return;

    const fetchBalances = async () => {
      setIsLoadingBalances(true);
      try {
        const [ethBalance, sbcBalance] = await Promise.all([
          publicClient.getBalance({ address: primaryWallet.address as `0x${string}` }),
          publicClient.readContract({
            address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [primaryWallet.address as `0x${string}`],
          }),
        ]);

        setBalances({
          eth: ethBalance.toString(),
          sbc: sbcBalance.toString(),
        });
      } catch (error) {
        console.error('Failed to fetch balances:', error);
        setBalances({ eth: null, sbc: null });
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [primaryWallet?.address]);

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

  if (!primaryWallet) return null;

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-green-800 mb-1">✅ Dynamic Wallet Connected</h3>
          <p className="text-xs text-green-600 font-mono break-all mb-2">EOA: {primaryWallet.address}</p>
          <p className="text-xs text-green-600 mb-2">Connected via Dynamic SDK ({primaryWallet.connector.name})</p>
          <p className="text-xs text-green-600 mb-2"><strong>Chain:</strong> {chain.name} (ID: {chain.id})</p>
          
          {/* Balance Section */}
          <div className="mt-2 pt-2 border-t border-green-200">
            <p className="text-xs font-medium text-green-700 mb-1">Wallet Balances:</p>
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
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDisconnect}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

// Smart account info component
function SmartAccountInfo() {
  const { account, isInitialized, refreshAccount, isLoadingAccount } = useSbcApp();
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
      // error handled below
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

  if (!isInitialized || !account) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex justify-between items-center mb-2">
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
          <span className="text-purple-700">Smart Account Address:</span>
          <span className="font-mono text-xs text-purple-600 break-all">{account.address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-700">Deployed:</span>
          <span className="text-purple-600">{account.isDeployed ? '✅ Yes' : '⏳ On first transaction'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-purple-700">Nonce:</span>
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
    </div>
  );
}

// Transaction form component
function TransactionForm() {
  const { account, sbcAppKit } = useSbcApp();
  const { sendUserOperation, isLoading, isSuccess, isError, error: opError, data } = useUserOperation();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1');
  const isFormValid = recipient && /^0x[a-fA-F0-9]{40}$/.test(recipient) && parseFloat(amount) > 0;

  const handleSendTransaction = async () => {
    if (!account || !sbcAppKit) return;
    try {
      const ownerAddress = sbcAppKit.getOwnerAddress();
      const ownerChecksum = getAddress(ownerAddress);
      const spenderChecksum = getAddress(account.address);
      const value = parseUnits(amount, SBC_DECIMALS(chain));
      const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min
      
      // Use the wallet client from SBC Provider (already configured for Dynamic)
      const walletClient = (sbcAppKit as any).walletClient as WalletClient;
      
      const signature = await getPermitSignature({
        publicClient,
        walletClient,
        owner: ownerChecksum,
        spender: spenderChecksum,
        value,
        tokenAddress: SBC_TOKEN_ADDRESS(chain),
        chainId: chain.id,
        deadline,
      });

      if (!signature) {
        console.error('Error signing permit transaction');
        return;
      }
      const { r, s, v } = parseSignature(signature);
      
      const permitCallData = encodeFunctionData({
        abi: permitAbi,
        functionName: 'permit',
        args: [ownerChecksum, spenderChecksum, value, deadline, v, r, s],
      });
      const transferFromCallData = encodeFunctionData({
        abi: erc20PermitAbi,
        functionName: 'transferFrom',
        args: [ownerChecksum, recipient as `0x${string}`, value],
      });
      
      await sendUserOperation({
        calls: [
          { to: SBC_TOKEN_ADDRESS(chain) as `0x${string}`, data: permitCallData },
          { to: SBC_TOKEN_ADDRESS(chain) as `0x${string}`, data: transferFromCallData },
        ],
      });
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  };

  if (!account) return null;

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
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
            <span>Signing:</span>
            <span>Your Dynamic wallet will prompt to sign 🖊️</span>
          </div>
        </div>
        <button
          onClick={handleSendTransaction}
          disabled={!isFormValid || isLoading || !account}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Waiting for signature...' : `Send ${amount} SBC`}
        </button>
        {isSuccess && data && (
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
        {isError && opError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-medium">❌ Transaction Failed</p>
            <p className="text-xs text-red-600 mt-1">{opError.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to get permit signature
async function getPermitSignature({
  publicClient,
  walletClient,
  owner,
  spender,
  value,
  tokenAddress,
  chainId,
  deadline,
}: {
  publicClient: PublicClient;
  walletClient: WalletClient;
  owner: string;
  spender: string;
  value: bigint;
  tokenAddress: string;
  chainId: number;
  deadline: number;
}): Promise<`0x${string}` | null> {
  try {
    const ownerChecksum = getAddress(owner);
    const spenderChecksum = getAddress(spender);
    
    const nonce = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20PermitAbi,
      functionName: 'nonces',
      args: [ownerChecksum],
    });
    
    const tokenName = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20PermitAbi,
      functionName: 'name',
    });
    
    const domain = {
      name: tokenName as string,
      version: '1',
      chainId: BigInt(chainId),
      verifyingContract: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
    };
    
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    } as const;
    
    const message = {
      owner: ownerChecksum,
      spender: spenderChecksum,
      value: value,
      nonce: nonce as bigint,
      deadline: BigInt(deadline),
    };
    
    const signature = await walletClient.signTypedData({
      account: ownerChecksum,
      domain,
      types,
      primaryType: 'Permit',
      message,
    });

    return signature;
  } catch (e) {
    console.error('Error in getPermitSignature:', e);
    return null;
  }
}

// Dynamic SBC Provider wrapper
function DynamicSbcProvider({ children }: { children: React.ReactNode }) {
  const { primaryWallet } = useDynamicContext();
  const [walletClient, setWalletClient] = useState<any>(null);

  // Get Dynamic wallet client when wallet connects
  useEffect(() => {
    const getWalletClient = async () => {
      if (primaryWallet) {
        try {
          console.log('Getting Dynamic wallet client for SBC Provider...');
          const dynamicWalletClient = (await primaryWallet.connector.getWalletClient()) as WalletClient;
          console.log('Primary wallet address:', primaryWallet.address);
          
          // Create a compatible wallet client using primaryWallet.address
          const compatibleWalletClient = {
            account: {
              address: primaryWallet.address as `0x${string}`,
              type: 'local' as const,
              // Required methods for LocalAccount
              signMessage: async ({ message }: { message: string }) => {
                return await dynamicWalletClient.signMessage({ 
                  message, 
                  account: primaryWallet.address as `0x${string}` 
                });
              },
              signTransaction: async (transaction: any) => {
                return await dynamicWalletClient.signTransaction({ ...transaction, account: primaryWallet.address as `0x${string}` });
              },
              signTypedData: async (typedData: any) => {
                return await dynamicWalletClient.signTypedData({ ...typedData, account: primaryWallet.address as `0x${string}` });
              },
            },
            chain,
            // Use the original Dynamic wallet client for signing
            signTypedData: dynamicWalletClient.signTypedData,
          };
          
          console.log('Setting compatible wallet client for SBC Provider');
          setWalletClient(compatibleWalletClient);
        } catch (error) {
          console.error('Failed to get Dynamic wallet client:', error);
          setWalletClient(null);
        }
      } else {
        setWalletClient(null);
      }
    };

    getWalletClient();
  }, [primaryWallet]);

  // Don't render SbcProvider until we have a wallet client
  if (!walletClient) {
    return null;
  }

  console.log('Creating SbcProvider with wallet client:');
  console.log('Wallet client account:', walletClient.account);

  return (
    <SbcProvider config={{
      apiKey: import.meta.env.VITE_SBC_API_KEY,
      chain,
      walletClient,
      rpcUrl,
      debug: true
    }}>
      {children}
    </SbcProvider>
  );
}

// Main App component
function DynamicApp() {

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <img src="/sbc-logo.png" alt="SBC Logo" width={36} height={36} />
            SBC (Dynamic) Integration
          </h1>
          <p className="text-gray-600">
            Gasless transactions with Dynamic SDK integration
          </p>
        </div>
        
        <DynamicConnectFlow />
        
        <DynamicSbcProvider>
          <SmartAccountInfo />
          <TransactionForm />
        </DynamicSbcProvider>
        
        {/* Dynamic User Profile Modal - only render when SDK is ready */}
        <DynamicUserProfileWrapper />
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Powered by{' '}
            <a href="https://stablecoin.xyz" className="text-blue-600 hover:underline">
              SBC AppKit
            </a>
            {' '}• Dynamic SDK integration
          </p>
        </div>
      </div>
    </div>
  );
}

// Root App component with Dynamic provider
export default function App() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || '',
        walletConnectors: [EthereumWalletConnectors, ZeroDevSmartWalletConnectors],
      }}
    >
      <DynamicApp />
    </DynamicContextProvider>
  );
} 