import { useState, useEffect, useRef } from 'react';
import { createPublicClient, http, getAddress, parseSignature, WalletClient, PublicClient, Chain } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { SbcProvider, WalletButton, useSbcApp, useUserOperation } from '@stablecoin.xyz/react';
import { parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import './index.css';

// default to baseSepolia, but can be overridden with VITE_CHAIN=base
const chain = (import.meta.env.VITE_CHAIN === 'base') ? base : baseSepolia;

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

const publicClient = createPublicClient({ chain, transport: http() });

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

function WalletStatus({ onDisconnect }: { onDisconnect: () => void }) {
  const { ownerAddress } = useSbcApp();
  const [balances, setBalances] = useState<{ eth: string | null; sbc: string | null }>({ eth: null, sbc: null });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (!ownerAddress) return;

    const fetchBalances = async () => {
      setIsLoadingBalances(true);
      try {
        // Fetch ETH and SBC balances in parallel
        const [ethBalance, sbcBalance] = await Promise.all([
          publicClient.getBalance({ address: ownerAddress as `0x${string}` }),
          publicClient.readContract({
            address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [ownerAddress as `0x${string}`],
          }),
        ]);

        setBalances({
          eth: ethBalance.toString(),
          sbc: sbcBalance.toString(),
        });
      } catch (error) {
        console.error('Failed to fetch wallet balances:', error);
        setBalances({ eth: '0', sbc: '0' });
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [ownerAddress]);

  // Helper functions for formatting
  const formatEthBalance = (balance: string | null): string => {
    if (!balance) return '0.0000';
    try {
      return (Number(balance) / 1e18).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const formatSbcBalance = (balance: string | null): string => {
    if (!balance) return '0.00';
    try {
      return (Number(balance) / Math.pow(10, SBC_DECIMALS(chain))).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  if (!ownerAddress) return null;

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-green-800 mb-1">✅ Wallet Connected</h3>
          <p className="text-xs text-green-600 font-mono break-all mb-2">EOA: {ownerAddress}</p>
          <p className="text-xs text-green-600 mb-2">Connected to MetaMask (or Wallet Extension detected)</p>
          
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
                  <strong>SBC:</strong> {formatSbcBalance(balances.sbc)}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDisconnect}
          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 ml-4"
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}

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

  const formatSbcBalance = (balance: string | null): string => {
    if (!balance) return '0.00';
    try {
      return (Number(balance) / Math.pow(10, SBC_DECIMALS(chain))).toFixed(2);
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
        
        {/* Enhanced Balance Section */}
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
                {isLoadingBalance ? 'Loading...' : `${formatSbcBalance(sbcBalance)} SBC`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionForm() {
  const { account, sbcAppKit } = useSbcApp();
  const { sendUserOperation, isLoading, isSuccess, isError, error: opError, data } = useUserOperation();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1');
  const { ownerAddress } = useSbcApp();
  const walletClient = (sbcAppKit as any)?.walletClient;
  const isFormValid = recipient && /^0x[a-fA-F0-9]{40}$/.test(recipient) && parseFloat(amount) > 0;

  const handleSendTransaction = async () => {
    if (!account || !ownerAddress || !walletClient) return;
    try {
      const ownerChecksum = getAddress(ownerAddress);
      const spenderChecksum = getAddress(account.address);
      const value = parseUnits(amount, SBC_DECIMALS(chain));
      const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min
      
      const signature = await getPermitSignature({
        publicClient: publicClient as PublicClient,
        walletClient: walletClient as WalletClient,
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
            <span>Your wallet will prompt to sign 🖊️</span>
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

export default function App() {
  const sbcConfig = {
    apiKey: import.meta.env.VITE_SBC_API_KEY,
    chain,
    wallet: 'auto' as const,
    debug: true,
    walletOptions: { autoConnect: false },
  };

  return (
    <SbcProvider config={sbcConfig}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <img src="/sbc-logo.png" alt="SBC Logo" width={36} height={36} />
              SBC (Wallet Signer) Integration
            </h1>
            <p className="text-gray-600">
              True decentralized smart accounts with user wallet signing
            </p>
          </div>
          <WalletConnectFlow />
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Powered by{' '}
              <a href="https://stablecoin.xyz" className="text-blue-600 hover:underline">
                SBC App Kit
              </a>
              {' '}• True wallet integration with user-controlled signing
            </p>
          </div>
        </div>
      </div>
    </SbcProvider>
  );
}

function WalletConnectFlow() {
  const { ownerAddress, disconnectWallet, refreshAccount } = useSbcApp();
  const prevOwnerAddress = useRef<string | null>(null);

  useEffect(() => {
    if (ownerAddress && !prevOwnerAddress.current) {
      refreshAccount();
    }
    prevOwnerAddress.current = ownerAddress;
  }, [ownerAddress, refreshAccount]);

  if (!ownerAddress) {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">🔗 Connect Your Wallet</h3>
        <p className="text-sm text-blue-600 mb-3">
          Connect your wallet to create a smart account with your wallet as the signer
        </p>
        <WalletButton walletType="auto" onConnect={refreshAccount}>Connect Wallet</WalletButton>
      </div>
    );
  }

  return (
    <>
      <WalletStatus onDisconnect={disconnectWallet} />
      <SmartAccountInfo />
      <TransactionForm />
    </>
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
