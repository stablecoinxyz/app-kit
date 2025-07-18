/* 
🚀 SBC App Kit - React Wallet Integration Example

CURRENT VERSION: Manual wallet connection with viem
FUTURE VERSION: Native wallet integration (see comments throughout)

After the SDK update, this entire file can be simplified to ~30 lines
with automatic wallet detection, connection, and state management!

Run with: pnpm dev:local (for latest SDK features)
*/

import { useState } from 'react';
import { baseSepolia } from 'viem/chains';
import { 
  SbcProvider, 
  useSbcApp,
  useUserOperation
} from '@stablecoin.xyz/react';
import type { SbcAppKitConfig } from '@stablecoin.xyz/core';
import { parseUnits, encodeFunctionData, erc20Abi, createWalletClient, custom, WalletClient } from 'viem';
import { toAccount } from 'viem/accounts';
import './index.css';

// Constants
const SBC_TOKEN_ADDRESS = '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16';
const SBC_DECIMALS = 6;

interface WalletState {
  client: WalletClient | null;
  address: string | null;
  isConnected: boolean;
}

// Wallet Connection Component
const WalletConnection = ({ onWalletChange }: { onWalletChange: (wallet: WalletState) => void }) => {
  const [wallet, setWallet] = useState<WalletState>({
    client: null,
    address: null,
    isConnected: false
  });

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        if (accounts.length > 0) {
          // Get the account from window.ethereum
          const [address] = accounts;
          
          // Try approach without setting account in constructor
          const walletClient = createWalletClient({
            chain: baseSepolia,
            transport: custom(window.ethereum),
          });

                     // Use viem's toAccount utility for proper LocalAccount creation
           try {
             console.log('Creating account with toAccount utility');
             const account = toAccount({
               address: address as `0x${string}`,
               async signMessage({ message }) {
                 return await window.ethereum!.request({
                   method: 'personal_sign',
                   params: [message, address],
                 });
               },
               async signTransaction(transaction) {
                 // For MetaMask, we don't need to implement this as the provider handles it
                 throw new Error('Transaction signing handled by MetaMask provider');
               },
               async signTypedData(typedData) {
                 return await window.ethereum!.request({
                   method: 'eth_signTypedData_v4',
                   params: [address, JSON.stringify(typedData)],
                 });
               },
             });
             
             (walletClient as any).account = account;
             console.log('Account created with toAccount:', account);
           } catch (error) {
             console.log('Failed to create account with toAccount:', error);
             
             // Ultimate fallback - create the simplest possible account object
             (walletClient as any).account = {
               address: address as `0x${string}`,
               type: 'json-rpc' as const,
             };
           }

          console.log('walletClient.account', walletClient.account);
          console.log('walletClient.account structure:', JSON.stringify(walletClient.account, null, 2));

          const newWallet = {
            client: walletClient,
            address: address,
            isConnected: true
          };

          setWallet(newWallet);
          onWalletChange(newWallet);
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };

  const disconnectWallet = () => {
    const newWallet = {
      client: null,
      address: null,
      isConnected: false
    };
    setWallet(newWallet);
    onWalletChange(newWallet);
  };

  if (!wallet.isConnected) {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">🔗 Connect Your Wallet</h3>
        <p className="text-sm text-blue-600 mb-3">
          Connect your wallet to create a smart account with your wallet as the signer
        </p>
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {typeof window.ethereum !== 'undefined' ? 'Connect MetaMask' : 'Install MetaMask'}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-green-800 mb-2">✅ Wallet Connected</h3>
          <p className="text-xs text-green-600 font-mono break-all mb-1">{wallet.address}</p>
          <p className="text-xs text-green-600">Chain: Base Sepolia • Ready to sign transactions</p>
        </div>
        <button
          onClick={disconnectWallet}
          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

// Smart Account Info Component  
const SmartAccountInfo = () => {
  const { account, isInitialized, refreshAccount, isLoadingAccount, accountError } = useSbcApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debug logging
  console.log('SmartAccountInfo render:', {
    isInitialized,
    hasAccount: !!account,
    isLoadingAccount,
    hasRefreshFunction: !!refreshAccount,
    accountError: accountError?.message
  });

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setIsRefreshing(true);
    try {
      console.log('📡 Calling refreshAccount...');
      await refreshAccount?.();
      console.log('✅ RefreshAccount completed');
    } catch (error) {
      console.error('❌ Failed to refresh account:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isInitialized || !account) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-yellow-800">⏳ Initializing Smart Account</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingAccount}
            className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1"
          >
            {isRefreshing || isLoadingAccount ? '🔄 Refreshing...' : '🔄 Retry'}
          </button>
        </div>
        <p className="text-sm text-yellow-700">
          Creating your smart account with connected wallet as owner...
        </p>
        {isLoadingAccount && (
          <p className="text-xs text-yellow-600 mt-2">Loading account information...</p>
        )}
        {accountError && (
          <p className="text-xs text-red-600 mt-2">Error: {accountError.message}</p>
        )}
      </div>
    );
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
          <span className="text-purple-700">Address:</span>
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
        <div className="flex justify-between">
          <span className="text-purple-700">Balance:</span>
          <span className="text-purple-600">{account.balance ? `${(Number(account.balance) / 1e18).toFixed(4)} ETH` : '0 ETH'}</span>
        </div>
      </div>
    </div>
  );
};

// Transaction Form Component
const TransactionForm = () => {
  const { account } = useSbcApp();
  const { sendUserOperation, isLoading, isSuccess, isError, error: opError, data } = useUserOperation();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1');

  const handleSendTransaction = async () => {
    if (!account) return;

    try {
      const transferCallData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, parseUnits(amount, SBC_DECIMALS)]
      });

      // This will trigger the user's wallet to sign the transaction
      await sendUserOperation({
        to: SBC_TOKEN_ADDRESS,
        data: transferCallData,
        value: '0'
      });
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  };

  const isFormValid = recipient && /^0x[a-fA-F0-9]{40}$/.test(recipient) && parseFloat(amount) > 0;

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
                href={`https://sepolia.basescan.org/tx/${data.transactionHash}`}
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
};

// Main App Component
export default function App() {
  const [wallet, setWallet] = useState<WalletState>({
    client: null,
    address: null,
    isConnected: false
  });

  if (!import.meta.env.VITE_SBC_API_KEY) {
    throw new Error('SBC_API_KEY is not set');
  }

  /* 
  🚀 FUTURE CLEAN API (after SDK update):
  
  const sbcConfig: SbcAppKitConfig = {
    apiKey: import.meta.env.VITE_SBC_API_KEY,
    chain: baseSepolia,
    wallet: 'auto', // That's it! Auto-detects and connects to wallets
    debug: true,
  };
  
  No more manual wallet connection code needed!
  */

  // Current implementation (will be replaced by clean API above)
  const sbcConfig: SbcAppKitConfig | null = wallet.isConnected && wallet.client 
    ? {
        apiKey: import.meta.env.VITE_SBC_API_KEY,
        chain: baseSepolia,
        walletClient: wallet.client, // Use connected wallet as signer!
        debug: true,
      }
    : null;

  // Debug logging
  console.log('App render - SBC Config:', {
    walletConnected: wallet.isConnected,
    hasWalletClient: !!wallet.client,
    hasConfig: !!sbcConfig,
    apiKey: sbcConfig?.apiKey ? 'present' : 'missing',
    chain: sbcConfig?.chain?.name,
    walletClientChain: wallet.client?.chain?.id,
    walletClientAccount: wallet.client?.account,
    walletClientAccountAddress: wallet.client?.account?.address,
    walletClientAccountType: typeof wallet.client?.account
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <img src="/sbc-logo.png" alt="SBC Logo" width={36} height={36} />
            SBC (Wallet Signer) Integration
          </h1>
          <p className="text-gray-600">
            True decentralized smart accounts with user wallet signing
          </p>
        </div>

        {/* Wallet Connection */}
        <WalletConnection onWalletChange={setWallet} />
        
        {/* 
        🚀 FUTURE CLEAN WALLET COMPONENTS (after SDK update):
        
        <WalletButton 
          walletType="auto" 
          onConnect={(result) => console.log('Connected:', result)}
        >
          Connect Wallet
        </WalletButton>
        
        OR for multiple wallet options:
        
        <WalletSelector 
          onConnect={(result) => console.log('Connected:', result)}
          onError={(error) => console.error('Connection failed:', error)}
        />
        
        Components automatically handle wallet detection, connection, and state management!
        */}

        {/* Smart Account Management */}
                 {wallet.isConnected && sbcConfig ? (
           <SbcProvider 
             config={sbcConfig}
             onError={(error) => {
               console.error('❌ SBC Provider Error:', error);
             }}
           >
             <SmartAccountInfo />
             <TransactionForm />
           </SbcProvider>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-gray-600">Connect your wallet to create a smart account</p>
          </div>
        )}

        {/* Footer */}
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
  );
} 