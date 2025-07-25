'use client';

import { 
  SbcProvider, 
  type SbcAppKitConfig
} from '@stablecoin.xyz/react';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SBC_DECIMALS, chainExplorer, SBC_TOKEN_ADDRESS } from './lib/common';
import { base, baseSepolia, type Chain } from 'viem/chains';

const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base as Chain : baseSepolia as Chain;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

// Configuration Constants
const TRANSFER_AMOUNT = 1n * 10n ** BigInt(SBC_DECIMALS(chain)); // 1 SBC (chain decimals)

// Client-side config (no private key)
const config: SbcAppKitConfig = {
  apiKey: process.env.NEXT_PUBLIC_SBC_API_KEY || 'your_api_key_here',
  chain: chain,
  debug: true,
  rpcUrl,
};

// ABI Definitions
const ERC20_ABI = {
  balanceOf: [{
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }],
  transfer: [{
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  }],
  transferFrom: [{
    name: 'transferFrom',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  }],
  permit: [{
    name: 'permit',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ]
  }],
  nonces: [{
    name: 'nonces',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }],
  name: [{
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  }]
};

// Proper ErrorBoundary class component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in Dashboard:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error">
          <h3>Something went wrong</h3>
          <p>Please check the console for details</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function Dashboard() {
  // State for transaction status and error
  const [txStatus, setTxStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState<string | null>(null);

  // State for target address input
  const [targetAddress, setTargetAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');

  // State for balances
  const [ownerBalances, setOwnerBalances] = useState<{eth: string | null, sbc: string | null}>({eth: null, sbc: null});
  const [smartAccountBalances, setSmartAccountBalances] = useState<{eth: string | null, sbc: string | null}>({eth: null, sbc: null});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<any>(null); // Only declare once

  // State for backend smart account info
  const [account, setAccount] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingAccount(true);
    fetch('/api/account-info')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch account info');
        return res.json();
      })
      .then(data => {
        setAccount(data);
        setIsLoadingAccount(false);
      })
      .catch(err => {
        setAccountError(err.message);
        setIsLoadingAccount(false);
      });
  }, []);

  // Effect to fetch owner address when sbcAppKit changes
  useEffect(() => {
    const fetchOwnerAddress = async () => {
      try {
        const response = await fetch('/api/owner-address');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch owner address');
        }
        const data = await response.json();
        console.log('Owner address:', data.ownerAddress);
        setOwnerAddress(data.ownerAddress);
      } catch (error) {
        console.error('Failed to fetch owner address:', error);
        setOwnerAddress('Environment setup required');
      }
    };
    fetchOwnerAddress();
  }, []);

  // Function to fetch balances for a specific address
  const fetchBalancesForAddress = useCallback(async (address: string): Promise<{eth: string, sbc: string}> => {
    if (!account?.publicClient) return {eth: '0', sbc: '0'};

    try {
      const publicClient = account.publicClient;
      
      // Fetch ETH and SBC balances in parallel
      const [ethBalance, sbcBalance] = await Promise.all([
        publicClient.getBalance({ address: address as `0x${string}` }),
        publicClient.readContract({
          address: SBC_TOKEN_ADDRESS(chain),
          abi: ERC20_ABI.balanceOf,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        })
      ]);

      return {
        eth: ethBalance.toString(),
        sbc: sbcBalance.toString()
      };
    } catch (error) {
      console.error(`Failed to fetch balances for ${address}:`, error);
      return {eth: '0', sbc: '0'};
    }
  }, [account]);

  // Helper function to format SBC balance
  const formatSbcBalance = (balance: string | null): string => {
    if (!balance) return '0.00';
    try {
      return (parseFloat(balance) / Math.pow(10, SBC_DECIMALS(chain))).toFixed(SBC_DECIMALS(chain));
    } catch {
      return '0.00';
    }
  };

  // Helper function to format ETH balance
  const formatEthBalance = (balance: string | null): string => {
    if (!balance) return '0.000000';
    try {
      return (parseFloat(balance) / 1e18).toFixed(6);
    } catch {
      return '0.000000';
    }
  };

  // Helper function to get explorer URL for transaction hash
  const getExplorerUrl = (txHash: string): string => {
    // Base Sepolia explorer URL
    return `${chainExplorer(chain)}/tx/${txHash}`;
  };

  // Function to fetch all balances
  const fetchAllBalances = useCallback(async () => {
    if (!account?.address) return;

    setIsLoadingBalances(true);
    console.log(`fetching balances for ${account.address}`);
    try {
      const response = await fetch('/api/owner-address');
      if (!response.ok) {
        throw new Error('Failed to fetch owner address');
      }
      const { ownerAddress } = await response.json();
      console.log(`ownerAddress: ${ownerAddress}`);
      
      // Fetch balances for both addresses in parallel
      const [ownerBals, smartAccountBals] = await Promise.all([
        fetchBalancesForAddress(ownerAddress),
        fetchBalancesForAddress(account.address)
      ]);

      setOwnerBalances(ownerBals);
      setSmartAccountBalances(smartAccountBals);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setOwnerBalances({eth: null, sbc: null});
      setSmartAccountBalances({eth: null, sbc: null});
    } finally {
      setIsLoadingBalances(false);
    }
  }, [account?.address, fetchBalancesForAddress]);

  // Effect to fetch balances on mount and when account changes
  useEffect(() => {
    if (account?.address) {
      fetchAllBalances();
    }
  }, [account?.address, fetchAllBalances]);

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleAddressChange = (value: string) => {
    setTargetAddress(value);
    if (value && !validateAddress(value)) {
      setAddressError('Invalid Ethereum address format');
    } else {
      setAddressError('');
    }
  };

  const handleSendTransaction = async () => {
    if (!validateAddress(targetAddress)) {
      setAddressError('Invalid Ethereum address format');
      return;
    }

    setTxStatus('loading');
    setTxError(null);
    setTxResult(null);

    try {
      // Call the backend API to send the transaction
      const response = await fetch('/api/send-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toAddress: targetAddress,
          amount: TRANSFER_AMOUNT.toString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send transaction');
      }

      const data = await response.json();
      setTxResult(data.userOperation);
      setTxStatus('success');
    } catch (error: any) {
      setTxError(error.message || 'Unknown error');
      setTxStatus('error');
    }
  };

  // Helper function to safely get error message
  const getErrorMessage = (err: any): string => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err.message) return String(err.message);
    if (err.toString) return err.toString();
    return String(err);
  };

  // Helper function to safely convert values to strings
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (accountError) {
    return (
      <div className="error">
        <h3>Error</h3>
        <p>{accountError}</p>
      </div>
    );
  }

  if (!account || isLoadingAccount) {
    return (
      <div className="loading">
        <h3>Loading...</h3>
        <p>Initializing SBC AppKit...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Account Status Card */}
      <div className="card">
        <h3>📱 Account Information</h3>
        {isLoadingAccount ? (
          <p>Loading account info...</p>
        ) : accountError ? (
          <div className="error">
            <p>Error: {getErrorMessage(accountError)}</p>
            <button onClick={() => {
              setAccountError(null);
              setIsLoadingAccount(true);
              fetch('/api/account-info')
                .then(res => {
                  if (!res.ok) throw new Error('Failed to fetch account info');
                  return res.json();
                })
                .then(data => {
                  setAccount(data);
                  setIsLoadingAccount(false);
                })
                .catch(err => {
                  setAccountError(err.message);
                  setIsLoadingAccount(false);
                });
            }}>Retry</button>
          </div>
        ) : account ? (
          <div>
            {/* Owner Section */}
            <div className="section">
              <h4>👤 EOA (Owner)</h4>
              {accountError ? (
                <p style={{ color: 'red' }}>Error: {accountError}</p>
              ) : (
                <>
                  <p><strong>Address:</strong> <span className="monospace">{account?.owner ? safeString(account.owner.address) : 'Loading...'}</span></p>
                  <p><strong>ETH Balance:</strong> {account?.owner ? formatEthBalance(account.owner.ethBalance) : 'Loading...'} ETH</p>
                  <p><strong>SBC Balance:</strong> {account?.owner ? formatSbcBalance(account.owner.sbcBalance) : 'Loading...'} SBC</p>
                </>
              )}
            </div>

            {/* Smart Account Section */}
            <div className="section">
              <h4>🤖 Smart Account</h4>
              {accountError ? (
                <p style={{ color: 'red' }}>Error: {accountError}</p>
              ) : (
                <>
                  <p><strong>Address:</strong> <span className="monospace">{account ? safeString(account.address) : 'Loading...'}</span></p>
                  <p><strong>Deployed:</strong> {account ? (account.isDeployed ? '✅ Yes' : '❌ No') : 'Loading...'}</p>
                  <p><strong>Nonce:</strong> {account ? safeString(account.nonce) : 'Loading...'}</p>
                  <p><strong>ETH Balance:</strong> {account?.smartAccount ? formatEthBalance(account.smartAccount.ethBalance) : 'Loading...'} ETH</p>
                  <p><strong>SBC Balance:</strong> {account?.smartAccount ? formatSbcBalance(account.smartAccount.sbcBalance) : 'Loading...'} SBC</p>
                </>
              )}
            </div>

            {smartAccountBalances.eth && parseFloat(smartAccountBalances.eth) > 0 && parseFloat(smartAccountBalances.eth) < 1000000000000000 && (
              <div className="warning" style={{color: 'orange', marginTop: '8px'}}>
                ⚠️ Low ETH balance on smart account. Recommended: at least 0.001 ETH for reliable transactions.
                <br />
                <a 
                  href={`https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    color: '#0052ff',
                    textDecoration: 'underline'
                  }}
                >
                  Get more Base Sepolia ETH from faucet
                </a>
              </div>
            )}
            
            <button onClick={() => {
              setAccountError(null);
              setIsLoadingAccount(true);
              fetch('/api/account-info')
                .then(res => {
                  if (!res.ok) throw new Error('Failed to fetch account info');
                  return res.json();
                })
                .then(data => {
                  setAccount(data);
                  setIsLoadingAccount(false);
                })
                .catch(err => {
                  setAccountError(err.message);
                  setIsLoadingAccount(false);
                });
            }}>Refresh</button>
          </div>
        ) : null}
      </div>

      {/* Transaction Controls */}
      <div className="card">
        <h3>💸 Send SBC Transaction</h3>
        <p>Send 1 SBC to any address</p>
        
        {/* Address Input */}
        <div style={{marginBottom: '16px'}}>
          <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
            Recipient Address:
          </label>
          <input
            type="text"
            value={targetAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="0x... (Enter recipient's Ethereum address)"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${addressError ? '#ff4444' : '#ddd'}`,
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          {addressError && (
            <p className="helper-text error">
              {addressError}
            </p>
          )}
          {targetAddress && !addressError && (
            <p className="helper-text success">
              ✅ Valid address
            </p>
          )}
        </div>
        
        <p className="helper-text info">
          💡 Smart Transaction: the smart account can have zero SBC balance and will transfer SBC from Owner's balance if it has enough.
        </p>
        <div className="button-group">
          <button
            onClick={handleSendTransaction}
            disabled={txStatus === 'loading' || !targetAddress || !!addressError || (
              account?.owner?.sbcBalance !== undefined && 
              account?.smartAccount?.sbcBalance !== undefined && 
              (BigInt(account.owner.sbcBalance) + BigInt(account.smartAccount.sbcBalance)) < TRANSFER_AMOUNT
            )}
            className="primary"
          >
            {txStatus === 'loading' ? '⏳ Sending...' : '🚀 Send 1 SBC'}
          </button>
        </div>

        {!targetAddress && (
          <p className="helper-text">
            👆 Enter a recipient address to enable sending
          </p>
        )}

        {targetAddress && addressError && (
          <p className="helper-text error">
            ❌ Please enter a valid address to enable sending
          </p>
        )}

        {account?.owner?.sbcBalance !== undefined && 
         account?.smartAccount?.sbcBalance !== undefined && 
         (BigInt(account.owner.sbcBalance) + BigInt(account.smartAccount.sbcBalance)) < TRANSFER_AMOUNT && (
          <p className="helper-text error">
            ❌ Insufficient SBC balance across both accounts
          </p>
        )}

        {/* Transaction Status */}
        {txStatus === 'loading' && (
          <div className="status loading">
            <p>🔄 Transaction in progress...</p>
          </div>
        )}
        
        {txStatus === 'success' && txResult && (
          <div className="status success">
            <p>✅ Transaction successful!</p>
            <p>
              <strong>TX Hash:</strong>{' '}
              <a 
                href={getExplorerUrl(safeString(txResult.transactionHash))} 
                target="_blank" 
                rel="noopener noreferrer"
                className="monospace"
              >
                {safeString(txResult.transactionHash)}
              </a>
            </p>
            <p><strong>Gas Used:</strong> {safeString(txResult.gasUsed)}</p>
            <button onClick={() => { setTxStatus('idle'); setTxResult(null); }}>Clear</button>
          </div>
        )}
        
        {txStatus === 'error' && txError && (
          <div className="status error">
            <p>❌ Transaction failed:</p>
            <p>{txError}</p>
            <button onClick={() => setTxStatus('idle')}>Clear</button>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="card debug">
        <h3>🔧 Debug Information</h3>
        <p><strong>Chain:</strong> {config.chain.name} (ID: {safeString(config.chain.id)})</p>
        <p><strong>SDK Initialized:</strong> {account?.isInitialized ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SbcProvider config={config}>
      <div className="App">
        <h1>
          <Image src="/sbc-logo.png" alt="SBC Logo" width={30} height={30} />
          <span>SBC Account Abstraction Demo (NextJS)</span>
        </h1>
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
      </div>
    </SbcProvider>
  );
} 