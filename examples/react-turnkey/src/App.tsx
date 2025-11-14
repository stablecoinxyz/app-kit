import { useState, useEffect } from 'react';
import { TurnkeyProvider, useTurnkey } from '@turnkey/sdk-react';
import { createPublicClient, http, getAddress, parseSignature, WalletClient, PublicClient, Chain } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { useSbcTurnkey } from '@stablecoin.xyz/react';
import { parseUnits, encodeFunctionData, erc20Abi } from 'viem';
import './index.css';

const chain = (import.meta.env.VITE_CHAIN === 'base') ? base : baseSepolia;
const rpcUrl = import.meta.env.VITE_RPC_URL;

const SBC_TOKEN_ADDRESS = (chain: Chain) => {
  if (chain.id === baseSepolia.id) return '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16';
  if (chain.id === base.id) return '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798';
  throw new Error('Unsupported chain');
};

const SBC_DECIMALS = (chain: Chain) => {
  if (chain.id === baseSepolia.id) return 6;
  if (chain.id === base.id) return 18;
  throw new Error('Unsupported chain');
};

const chainExplorer = (chain: Chain) => {
  if (chain.id === baseSepolia.id) return 'https://sepolia.basescan.org';
  if (chain.id === base.id) return 'https://basescan.org';
  throw new Error('Unsupported chain');
};

const publicClient = createPublicClient({ chain, transport: http() });

const erc20PermitAbi = [
  ...erc20Abi,
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "nonces",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const permitAbi = [{
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
}];

const turnkeyConfig = {
  apiBaseUrl: import.meta.env.VITE_TURNKEY_API_BASE_URL || 'https://api.turnkey.com',
  rpId: import.meta.env.VITE_TURNKEY_RPID || window.location.hostname,
  iframeUrl: 'https://auth.turnkey.com',
};

function TurnkeyAuth({ ownerAddress, account }: { ownerAddress?: string | null; account?: any } = {}) {
  const { passkeyClient, turnkey } = useTurnkey();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSubOrgId, setUserSubOrgId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [storedAccount, setStoredAccount] = useState<{ subOrgId: string; email: string; walletAddress: string } | null>(null);
  const [eoaEthBalance, setEoaEthBalance] = useState<string | null>(null);
  const [eoaSbcBalance, setEoaSbcBalance] = useState<string | null>(null);
  const [isLoadingEoaBalances, setIsLoadingEoaBalances] = useState(false);

  // Fetch EOA balances when owner address is available
  useEffect(() => {
    if (!ownerAddress) {
      setEoaEthBalance(null);
      setEoaSbcBalance(null);
      return;
    }

    const fetchEoaBalances = async () => {
      setIsLoadingEoaBalances(true);
      try {
        // Fetch ETH balance
        const ethBalance = await publicClient.getBalance({
          address: ownerAddress as `0x${string}`,
        });
        setEoaEthBalance(ethBalance.toString());

        // Fetch SBC balance
        const sbcBalance = await publicClient.readContract({
          address: SBC_TOKEN_ADDRESS(chain) as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [ownerAddress as `0x${string}`],
        });
        setEoaSbcBalance(sbcBalance.toString());
      } catch (error) {
        console.error('Failed to fetch EOA balances:', error);
        setEoaEthBalance(null);
        setEoaSbcBalance(null);
      } finally {
        setIsLoadingEoaBalances(false);
      }
    };

    fetchEoaBalances();
  }, [ownerAddress]);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 [AUTH] Checking authentication status...');

      // Check localStorage for stored account
      const storedSubOrgId = localStorage.getItem('turnkey_sub_org_id');
      const storedEmail = localStorage.getItem('turnkey_user_email');
      const storedWalletAddr = localStorage.getItem('turnkey_wallet_address');

      if (storedSubOrgId) {
        setStoredAccount({
          subOrgId: storedSubOrgId,
          email: storedEmail || 'Unknown',
          walletAddress: storedWalletAddr || 'Unknown',
        });
        console.log('💾 [AUTH] Found stored account:', { storedSubOrgId, storedEmail });
      }

      if (turnkey) {
        console.log('✅ [AUTH] Turnkey instance available');
        try {
          const session = await turnkey.getSession();
          console.log('📋 [AUTH] Session:', session);
          if (session?.organizationId) {
            setIsAuthenticated(true);
            setUserSubOrgId(session.organizationId);
            console.log('✅ [AUTH] User is authenticated', { organizationId: session.organizationId });
          } else {
            console.log('ℹ️ [AUTH] No active session found');
          }
        } catch (err) {
          console.error('❌ [AUTH] Error checking session:', err);
          setIsAuthenticated(false);
        }
      } else {
        console.log('⏳ [AUTH] Turnkey instance not ready yet');
      }
    };
    checkAuth();
  }, [turnkey]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyClient || !userName || !userEmail) return;

    console.log('🚀 [SIGNUP] Starting signup flow...');
    console.log('📝 [SIGNUP] User:', { userName, userEmail });

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create passkey with WebAuthn
      console.log('🔐 [SIGNUP] Step 1: Creating passkey with WebAuthn...');
      console.log('📋 [SIGNUP] passkeyClient available:', !!passkeyClient);

      if (!passkeyClient) {
        throw new Error('Passkey client not initialized');
      }

      const passkeyResponse = await Promise.race([
        passkeyClient.createUserPasskey({
          publicKey: {
            user: {
              name: userEmail,
              displayName: userName,
            },
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Passkey creation timed out after 60s. Did you cancel the browser prompt?')), 60000)
        )
      ]);
      console.log('✅ [SIGNUP] Step 1: Passkey created successfully!');
      console.log('📦 [SIGNUP] Full passkey response:', passkeyResponse);

      // Extract encodedChallenge and attestation from response
      const { encodedChallenge, attestation } = passkeyResponse;
      console.log('📦 [SIGNUP] Extracted data:', {
        hasEncodedChallenge: !!encodedChallenge,
        hasAttestation: !!attestation,
        attestation,
      });

      // Step 2: Call our backend to create sub-org
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      console.log('🌐 [SIGNUP] Step 2: Calling backend at', backendUrl);
      const response = await fetch(`${backendUrl}/api/create-sub-org`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          userEmail,
          attestation,
          challenge: encodedChallenge,
        }),
      });
      console.log('📡 [SIGNUP] Backend response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [SIGNUP] Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to create account');
      }

      const { subOrganizationId, addresses } = await response.json();
      console.log('✅ [SIGNUP] Step 2: Sub-org and wallet created!', { subOrganizationId, addresses });

      // Step 3: Authenticate to the sub-org with the passkey
      console.log('🔐 [SIGNUP] Step 3: Authenticating to sub-org...');
      await passkeyClient.login({
        organizationId: subOrganizationId,
      });
      console.log('✅ [SIGNUP] Step 3: Authenticated to sub-org!');

      const walletAddr = addresses[0];

      // Store account info in localStorage
      localStorage.setItem('turnkey_sub_org_id', subOrganizationId);
      localStorage.setItem('turnkey_user_email', userEmail);
      localStorage.setItem('turnkey_wallet_address', walletAddr);

      setUserSubOrgId(subOrganizationId);
      setWalletAddress(walletAddr);
      setIsAuthenticated(true);

      console.log('🎉 [SIGNUP] Signup complete! Reloading page to initialize...');

      // Reload page to trigger full initialization flow
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('❌ [SIGNUP] Error:', err);
      console.error('❌ [SIGNUP] Error stack:', err.stack);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
      console.log('🏁 [SIGNUP] Signup flow ended');
    }
  };

  const handleLogin = async () => {
    if (!passkeyClient) return;

    console.log('🚀 [LOGIN] Starting login flow...');

    setIsLoading(true);
    setError(null);

    try {
      // Check if we have a stored sub-org ID from previous signup
      const storedSubOrgId = localStorage.getItem('turnkey_sub_org_id');
      const storedWalletAddress = localStorage.getItem('turnkey_wallet_address');

      console.log('📦 [LOGIN] Stored data:', { storedSubOrgId, storedWalletAddress });

      if (!storedSubOrgId) {
        throw new Error('No previous signup found. Please sign up first.');
      }

      // Authenticate with passkey (this verifies the user owns the passkey)
      console.log('🔐 [LOGIN] Authenticating with passkey...');
      await passkeyClient.login({
        organizationId: storedSubOrgId,
      });
      console.log('✅ [LOGIN] Passkey authentication successful!');

      // Set the authenticated state
      setUserSubOrgId(storedSubOrgId);
      setWalletAddress(storedWalletAddress);
      setIsAuthenticated(true);

      console.log('🎉 [LOGIN] Login complete! Reloading page to initialize...', { subOrgId: storedSubOrgId });

      // Reload page to trigger full initialization flow
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('❌ [LOGIN] Error:', err);
      console.error('❌ [LOGIN] Error stack:', err.stack);
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
      console.log('🏁 [LOGIN] Login flow ended');
    }
  };

  const handleLogout = async () => {
    try {
      await turnkey?.logout();
      setIsAuthenticated(false);
      setUserSubOrgId(null);
      setWalletAddress(null);

      console.log('🔓 [LOGOUT] Logged out, reloading page...');
      // Reload page to clear all state
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleClearAccount = () => {
    if (confirm('Clear stored account? This will allow you to sign up again with a new account.')) {
      localStorage.removeItem('turnkey_sub_org_id');
      localStorage.removeItem('turnkey_user_email');
      localStorage.removeItem('turnkey_wallet_address');
      setStoredAccount(null);
      setIsAuthenticated(false);
      setUserSubOrgId(null);
      setWalletAddress(null);
      console.log('🗑️ Cleared stored account');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 text-lg">🔐 Turnkey Authentication</h3>

        {/* Stored Account Info */}
        {storedAccount && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-1">Stored Account</p>
                <p className="text-xs text-blue-600 mb-1">Email: {storedAccount.email}</p>
                <p className="text-xs text-blue-600 font-mono break-all">Sub-Org: {storedAccount.subOrgId}</p>
                <p className="text-xs text-blue-600 font-mono break-all">Wallet: {storedAccount.walletAddress}</p>
              </div>
              <button
                onClick={handleClearAccount}
                className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                title="Clear stored account to sign up again"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Sign Up Form */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Create New Account</h4>
            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={isLoading || !userName || !userEmail}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up with Passkey'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Login Button */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Already Have an Account?</h4>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoading ? 'Logging In...' : 'Login with Passkey'}
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 text-center">
          Uses your device's biometric authentication (Face ID, Touch ID, Windows Hello)
        </p>
      </div>
    );
  }

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

  // Use ownerAddress from props if available, otherwise fallback to local walletAddress
  const displayAddress = ownerAddress || walletAddress;

  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-green-800 mb-2">✅ Authenticated</h3>
          <div className="space-y-1 text-xs">
            <p className="text-green-600">Sub-Organization: {userSubOrgId}</p>
            {displayAddress && (
              <p className="text-green-600 font-mono">Owner (Turnkey): {displayAddress}</p>
            )}
            {ownerAddress && (
              <>
                <p className="text-green-600">
                  ETH Balance: {isLoadingEoaBalances ? 'Loading...' : `${formatEthBalance(eoaEthBalance)} ETH`}
                </p>
                <p className="text-green-600">
                  SBC Balance: {isLoadingEoaBalances ? 'Loading...' : `${formatSbcBalance(eoaSbcBalance)} SBC`}
                </p>
              </>
            )}
            {!ownerAddress && displayAddress && (
              <p className="text-green-600 text-xs italic">⏳ Loading balances and smart account...</p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function SmartAccountInfo({
  account,
  isInitialized,
  refreshAccount,
  isLoadingAccount,
  ownerAddress
}: {
  account: any;
  isInitialized: boolean;
  refreshAccount: () => Promise<void>;
  isLoadingAccount: boolean;
  ownerAddress: string | null;
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
        console.error('Failed to fetch smart account SBC balance:', error);
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
      // Refresh SBC balance
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
          console.error('Failed to refresh smart account SBC balance:', error);
        } finally {
          setIsLoadingBalance(false);
        }
      }
    } catch (error) {
      // error handled
    } finally {
      setIsRefreshing(false);
    }
  };

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
          className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isRefreshing || isLoadingAccount ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-purple-700">Smart Account:</span>
          <span className="font-mono text-xs text-purple-600">{account.address}</span>
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
          <p className="text-xs font-medium text-purple-700 mb-2">Balances:</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-purple-700">ETH:</span>
              <span className="text-purple-600 font-mono text-xs">{formatEthBalance(account.balance)} ETH</span>
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

function TransactionForm({ sbcAppKit, account, ownerAddress }: { sbcAppKit: any; account: any; ownerAddress: string | null }) {
  console.log('[TransactionForm] Render check:', {
    hasSbcAppKit: !!sbcAppKit,
    hasAccount: !!account,
    account: account,
    ownerAddress,
  });

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const walletClient = (sbcAppKit as any)?.walletClient;
  const isFormValid = recipient && /^0x[a-fA-F0-9]{40}$/.test(recipient) && parseFloat(amount) > 0;

  const handleSendTransaction = async () => {
    if (!account || !ownerAddress || !walletClient) return;

    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setTransactionHash(null);

    try {
      const ownerChecksum = getAddress(ownerAddress);
      const spenderChecksum = getAddress(account.address);
      const value = parseUnits(amount, SBC_DECIMALS(chain));
      const deadline = Math.floor(Date.now() / 1000) + 60 * 30;

      console.log('🔐 Requesting permit signature...');
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
        throw new Error('Failed to get permit signature');
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

      console.log('📤 Sending user operation...');
      const result = await sbcAppKit.sendUserOperation({
        calls: [
          { to: SBC_TOKEN_ADDRESS(chain) as `0x${string}`, data: permitCallData },
          { to: SBC_TOKEN_ADDRESS(chain) as `0x${string}`, data: transferFromCallData },
        ],
      });

      console.log('✅ Transaction successful:', result);
      setIsSuccess(true);
      setTransactionHash(result.transactionHash);
    } catch (err) {
      console.error('❌ Transaction failed:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Transaction failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) return null;

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">💸 Send SBC Tokens</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className={`w-full px-3 py-2 text-xs font-mono border rounded-md focus:outline-none focus:ring-2 ${
              recipient && !isFormValid ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {recipient && !/^0x[a-fA-F0-9]{40}$/.test(recipient) && (
            <p className="text-xs text-red-600 mt-1">Invalid Ethereum address</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount (SBC)</label>
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
        </div>
        <button
          onClick={handleSendTransaction}
          disabled={!isFormValid || isLoading || !account || !ownerAddress || !walletClient}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Waiting for signature...' : `Send ${amount} SBC`}
        </button>
        {isSuccess && transactionHash && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800 font-medium">✅ Transaction Successful!</p>
            <p className="text-xs text-green-600 font-mono break-all mt-1">
              <a
                href={`${chainExplorer(chain)}/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View on Explorer: {transactionHash}
              </a>
            </p>
          </div>
        )}
        {isError && error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 font-medium">❌ Transaction Failed</p>
            <p className="text-xs text-red-600 mt-1">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TurnkeyIntegration() {
  const { turnkey, passkeyClient } = useTurnkey();
  const [turnkeyClient, setTurnkeyClient] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [turnkeyWalletClient, setTurnkeyWalletClient] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      if (!turnkey || !passkeyClient) {
        setTurnkeyClient(null);
        setOrganizationId('');
        setWalletAddress(null);
        return;
      }

      try {
        const session = await turnkey.getSession();
        if (!session?.organizationId) {
          setTurnkeyClient(null);
          setOrganizationId('');
          setWalletAddress(null);
          return;
        }

        console.log('[TurnkeyIntegration] Setting up authenticated session...');
        console.log('[TurnkeyIntegration] Organization ID:', session.organizationId);

        // Get wallet address from localStorage
        const storedWalletAddress = localStorage.getItem('turnkey_wallet_address');
        console.log('[TurnkeyIntegration] Stored wallet address:', storedWalletAddress);

        setOrganizationId(session.organizationId);
        setTurnkeyClient(passkeyClient);
        setWalletAddress(storedWalletAddress);
      } catch (err) {
        console.error('[TurnkeyIntegration] Setup failed:', err);
        setTurnkeyClient(null);
        setOrganizationId('');
        setWalletAddress(null);
      }
    };
    checkAuthAndSetup();
  }, [turnkey, passkeyClient]);

  // Create wallet client with deferred account (no passkey prompt until signing)
  useEffect(() => {
    const createWalletClient = async () => {
      console.log('[TurnkeyIntegration] createWalletClient check:', {
        hasOrganizationId: !!organizationId,
        hasTurnkeyClient: !!turnkeyClient,
        hasWalletAddress: !!walletAddress,
        hasTurnkeyWalletClient: !!turnkeyWalletClient,
      });

      // Clear wallet client if session is lost
      if (!organizationId || !turnkeyClient || !walletAddress) {
        if (turnkeyWalletClient) {
          console.log('[TurnkeyIntegration] Clearing wallet client - session ended');
          setTurnkeyWalletClient(null);
        }
        return;
      }

      // Don't recreate if already exists
      if (turnkeyWalletClient) {
        console.log('[TurnkeyIntegration] Wallet client already exists, skipping creation');
        return;
      }

      try {
        console.log('[TurnkeyIntegration] Creating deferred wallet client with address:', walletAddress);

        const { toAccount } = await import('viem/accounts');
        const { createWalletClient: createViemWalletClient, http } = await import('viem');

        // Create a DEFERRED account - no passkey prompt until actually signing
        const deferredAccount = toAccount({
          address: walletAddress as `0x${string}`,
          async signMessage({ message }) {
            console.log('[DeferredAccount] Signing message - will prompt for passkey now');
            const { createAccount } = await import('@turnkey/viem');
            const account = await createAccount({
              client: turnkeyClient,
              organizationId,
              signWith: walletAddress,
              ethereumAddress: walletAddress,
            });
            return account.signMessage({ message });
          },
          async signTransaction(transaction) {
            throw new Error('signTransaction not supported for Turnkey with ERC-4337');
          },
          async signTypedData(typedData) {
            console.log('[DeferredAccount] Signing typed data - will prompt for passkey now');
            const { createAccount } = await import('@turnkey/viem');
            const account = await createAccount({
              client: turnkeyClient,
              organizationId,
              signWith: walletAddress,
              ethereumAddress: walletAddress,
            });
            return account.signTypedData(typedData);
          },
        });

        const walletClient = createViemWalletClient({
          account: deferredAccount,
          chain,
          transport: http(rpcUrl || chain.rpcUrls.default.http[0]),
        });

        console.log('[TurnkeyIntegration] Deferred wallet client created successfully (no passkey prompt yet)');
        setTurnkeyWalletClient(walletClient);
      } catch (err) {
        console.error('[TurnkeyIntegration] Failed to create wallet client:', err);
      }
    };
    createWalletClient();
  }, [organizationId, turnkeyClient, walletAddress]);

  // Only initialize SBC after wallet client is ready
  const sbcResult = useSbcTurnkey({
    apiKey: import.meta.env.VITE_SBC_API_KEY,
    chain,
    turnkeyClient: turnkeyWalletClient ? turnkeyClient : null, // Only pass if wallet client is ready
    organizationId: turnkeyWalletClient ? organizationId : '',
    rpcUrl,
    debug: true,
    turnkeyWalletClient, // Pass the pre-created wallet client
  });

  // Debug: Show initialization status
  console.log('[TurnkeyIntegration] SBC Result:', {
    isInitialized: sbcResult.isInitialized,
    hasError: !!sbcResult.error,
    error: sbcResult.error?.message,
    hasTurnkeyClient: !!turnkeyClient,
    organizationId,
  });

  return (
    <>
      <TurnkeyAuth
        ownerAddress={sbcResult.ownerAddress}
        account={sbcResult.account}
      />

      {/* Show error if any */}
      {sbcResult.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">❌ SBC Initialization Error</p>
          <p className="text-xs text-red-600 mt-1">{sbcResult.error.message}</p>
        </div>
      )}

      {/* Show smart account initialization state */}
      {!sbcResult.isInitialized && !sbcResult.error && turnkeyClient && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">⏳ Initializing smart account...</p>
          <p className="text-xs text-blue-600">
            Setting up your account abstraction wallet. You'll be prompted for your passkey when sending transactions.
          </p>
        </div>
      )}

      {sbcResult.isInitialized && (
        <>
          <SmartAccountInfo
            account={sbcResult.account}
            isInitialized={sbcResult.isInitialized}
            refreshAccount={sbcResult.refreshAccount}
            isLoadingAccount={sbcResult.isLoadingAccount}
            ownerAddress={sbcResult.ownerAddress}
          />
          <TransactionForm
            sbcAppKit={sbcResult.sbcAppKit}
            account={sbcResult.account}
            ownerAddress={sbcResult.ownerAddress}
          />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <TurnkeyProvider config={turnkeyConfig}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <img src="/sbc-logo.png" alt="SBC Logo" width={36} height={36} />
              SBC + Turnkey Integration
            </h1>
            <p className="text-gray-600">Embedded wallet smart accounts with Turnkey passkey authentication</p>
          </div>
          <TurnkeyIntegration />
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Powered by{' '}
              <a href="https://stablecoin.xyz" className="text-blue-600 hover:underline">SBC App Kit</a>
              {' '}+{' '}
              <a href="https://turnkey.com" className="text-blue-600 hover:underline">Turnkey</a>
            </p>
          </div>
        </div>
      </div>
    </TurnkeyProvider>
  );
}

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

    // Don't pass account parameter for Turnkey - it's already attached to walletClient
    const signature = await walletClient.signTypedData({
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
