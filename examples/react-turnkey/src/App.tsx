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

// Turnkey SDK configuration - passkey authentication only
const turnkeyConfig = {
  apiBaseUrl: import.meta.env.VITE_TURNKEY_API_BASE_URL || 'https://api.turnkey.com',
  defaultOrganizationId: '', // Not used for sub-org pattern
  rpId: import.meta.env.VITE_TURNKEY_RPID || window.location.hostname,
  // Don't set iframeUrl - loads on demand when passkey auth is actually used
  // Don't set ethereumWalletInterface - we handle MetaMask directly in wallet flow
};

interface AccountHistoryItem {
  subOrgId: string;
  email?: string;
  walletAddress?: string;
  authType: 'passkey' | 'wallet';
  lastUsed: number; // timestamp
}

function TurnkeyAuth({ ownerAddress, turnkeyWalletClient }: { ownerAddress?: string | null; account?: any; turnkeyWalletClient?: any } = {}) {
  const { passkeyClient, turnkey } = useTurnkey();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSubOrgId, setUserSubOrgId] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [storedAccount, setStoredAccount] = useState<{ subOrgId: string; email: string; walletAddress: string } | null>(null);
  const [showPasskeyForm, setShowPasskeyForm] = useState(false);
  const [eoaEthBalance, setEoaEthBalance] = useState<string | null>(null);
  const [eoaSbcBalance, setEoaSbcBalance] = useState<string | null>(null);
  const [isLoadingEoaBalances, setIsLoadingEoaBalances] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [accountHistory, setAccountHistory] = useState<AccountHistoryItem[]>([]);

  // IMMEDIATE auth check on mount - before Turnkey SDK loads
  useEffect(() => {
    const storedSubOrgId = localStorage.getItem('turnkey_sub_org_id');
    const storedAuthType = localStorage.getItem('turnkey_auth_type');
    const storedWalletAddress = localStorage.getItem('turnkey_wallet_address');
    const walletReady = localStorage.getItem('turnkey_wallet_ready');

    // If we have stored credentials (passkey OR wallet), load account data
    if (storedSubOrgId && storedAuthType) {
      console.log('⚡️ [FAST_AUTH] Found stored credentials, loading account data', {
        authType: storedAuthType,
        walletReady,
      });
      setUserSubOrgId(storedSubOrgId);
      setWalletAddress(storedWalletAddress);

      // Only set isAuthenticated=true if wallet is ready to auto-connect
      // For wallet users: check if turnkey_wallet_ready flag exists
      // For passkey users: will be set by checkAuth effect when Turnkey session loads
      if (storedAuthType === 'wallet' && walletReady === 'true') {
        setIsAuthenticated(true);
      }

      setIsLoading(false);

      // Load email if available
      const storedEmail = localStorage.getItem('turnkey_user_email');
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
    }
  }, []);

  // Load account history from localStorage
  useEffect(() => {
    const historyJson = localStorage.getItem('turnkey_account_history');
    if (historyJson) {
      try {
        const history = JSON.parse(historyJson) as AccountHistoryItem[];
        setAccountHistory(history);
      } catch (e) {
        console.error('Failed to parse account history:', e);
        setAccountHistory([]);
      }
    }
  }, []);

  // Helper: Add or update account in history
  const saveAccountToHistory = (account: Omit<AccountHistoryItem, 'lastUsed'>) => {
    const historyJson = localStorage.getItem('turnkey_account_history');
    let history: AccountHistoryItem[] = [];

    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch (e) {
        history = [];
      }
    }

    // Check if account already exists
    const existingIndex = history.findIndex(h => h.subOrgId === account.subOrgId);
    const newAccount: AccountHistoryItem = {
      ...account,
      lastUsed: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing account
      history[existingIndex] = newAccount;
    } else {
      // Add new account
      history.push(newAccount);
    }

    // Sort by lastUsed (most recent first)
    history.sort((a, b) => b.lastUsed - a.lastUsed);

    localStorage.setItem('turnkey_account_history', JSON.stringify(history));
    setAccountHistory(history);
  };

  // Helper: Switch to a different account
  const switchToAccount = (account: AccountHistoryItem) => {
    localStorage.setItem('turnkey_sub_org_id', account.subOrgId);
    localStorage.setItem('turnkey_auth_type', account.authType);
    if (account.email) {
      localStorage.setItem('turnkey_user_email', account.email);
    }
    if (account.walletAddress) {
      localStorage.setItem('turnkey_wallet_address', account.walletAddress);
    }

    // Clear wallet ready flag when switching accounts (requires re-connection)
    localStorage.removeItem('turnkey_wallet_ready');

    // Update last used timestamp
    saveAccountToHistory(account);

    // Reload page to reinitialize with new account
    window.location.reload();
  };

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

          // Check if this is a passkey user (only they use Turnkey sessions)
          const storedAuthType = localStorage.getItem('turnkey_auth_type');

          if (session?.organizationId) {
            setIsAuthenticated(true);
            setUserSubOrgId(session.organizationId);
            setIsLoading(false); // Make sure loading is false when auto-authenticated
            console.log('✅ [AUTH] User is authenticated', { organizationId: session.organizationId });
          } else if (storedAuthType === 'passkey') {
            // Only reset isAuthenticated for passkey users who have no session
            // Wallet users don't use Turnkey sessions, so don't reset their auth state
            console.log('ℹ️ [AUTH] No active Turnkey session found (passkey user)');
            setIsAuthenticated(false);
          } else {
            console.log('ℹ️ [AUTH] No Turnkey session needed (wallet user)');
          }
        } catch (err) {
          console.error('❌ [AUTH] Error checking session:', err);
          // Only reset for passkey users
          const storedAuthType = localStorage.getItem('turnkey_auth_type');
          if (storedAuthType === 'passkey') {
            setIsAuthenticated(false);
          }
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
      localStorage.setItem('turnkey_auth_type', 'passkey'); // Mark as passkey auth

      // Save to account history (NEVER LOSE THIS ACCOUNT!)
      saveAccountToHistory({
        subOrgId: subOrganizationId,
        email: userEmail,
        walletAddress: walletAddr,
        authType: 'passkey',
      });

      setUserSubOrgId(subOrganizationId);
      setWalletAddress(walletAddr);
      setIsAuthenticated(true);

      console.log('🎉 [SIGNUP] Signup complete! Reloading page...');

      // Reload page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err: any) {
      console.error('❌ [SIGNUP] Error:', err);
      console.error('❌ [SIGNUP] Error stack:', err.stack);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
      console.log('🏁 [SIGNUP] Signup flow ended');
    }
  };


  const handleLogout = async () => {
    try {
      // Save current account to history before logging out (NEVER LOSE ACCOUNT!)
      const currentSubOrgId = localStorage.getItem('turnkey_sub_org_id');
      const currentEmail = localStorage.getItem('turnkey_user_email');
      const currentWallet = localStorage.getItem('turnkey_wallet_address');
      const currentAuthType = localStorage.getItem('turnkey_auth_type');

      if (currentSubOrgId && currentAuthType) {
        saveAccountToHistory({
          subOrgId: currentSubOrgId,
          email: currentEmail || undefined,
          walletAddress: currentWallet || undefined,
          authType: currentAuthType as 'passkey' | 'wallet',
        });
      }

      await turnkey?.logout();

      // Clear session-specific data but KEEP organizationId, walletAddress, and auth_type for fast re-login
      // This allows quick re-authentication with the same method
      localStorage.removeItem('turnkey_user_email');
      localStorage.removeItem('turnkey_wallet_ready'); // Clear wallet ready flag
      // Keep: turnkey_sub_org_id, turnkey_auth_type, turnkey_wallet_address

      setIsAuthenticated(false);
      setUserSubOrgId(null);
      setWalletAddress(null);

      console.log('🔓 [LOGOUT] Logged out (kept auth data for re-login), reloading page...');
      // Reload page to clear all state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleContinueWithPasskey = async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('⏸️ [CONTINUE_PASSKEY] Already in progress, ignoring duplicate call');
      return;
    }

    console.log('🚀 [CONTINUE_PASSKEY] Starting unified passkey flow...');

    setIsLoading(true);
    setError(null);

    try {
      // Check stored auth type - if user previously used wallet, clear that session
      const storedAuthType = localStorage.getItem('turnkey_auth_type');
      if (storedAuthType === 'wallet') {
        console.log('🔄 [CONTINUE_PASSKEY] Switching from wallet to passkey - clearing old session');
        localStorage.removeItem('turnkey_sub_org_id');
        localStorage.removeItem('turnkey_wallet_address');
        localStorage.removeItem('turnkey_auth_type');
      }

      // Check if we have a stored sub-org ID from previous signup/login
      const storedSubOrgId = localStorage.getItem('turnkey_sub_org_id');
      const storedWalletAddress = localStorage.getItem('turnkey_wallet_address');

      console.log('📦 [CONTINUE_PASSKEY] Stored data:', { storedSubOrgId, storedWalletAddress });

      if (storedSubOrgId) {
        // Try to login with passkey for this organization
        console.log('🔐 [CONTINUE_PASSKEY] Attempting passkey login for org:', storedSubOrgId);

        try {
          await passkeyClient!.login({
            organizationId: storedSubOrgId,
          });
          console.log('✅ [CONTINUE_PASSKEY] Passkey authentication successful!');

          // Fetch wallet address if we don't have it
          let walletAddr = storedWalletAddress;
          if (!walletAddr) {
            console.log('💼 [CONTINUE_PASSKEY] Fetching wallet info...');
            const wallets = await passkeyClient!.getWallets({
              organizationId: storedSubOrgId,
            });

            const walletId = wallets?.wallets[0]?.walletId;
            if (walletId) {
              const accounts = await passkeyClient!.getWalletAccounts({
                organizationId: storedSubOrgId,
                walletId,
              });
              walletAddr = accounts?.accounts[0]?.address;
              if (walletAddr) {
                localStorage.setItem('turnkey_wallet_address', walletAddr);
              }
            }
          }

          // Ensure auth type is set for passkey users
          localStorage.setItem('turnkey_auth_type', 'passkey');

          // Save to account history
          const storedEmail = localStorage.getItem('turnkey_user_email');
          saveAccountToHistory({
            subOrgId: storedSubOrgId,
            email: storedEmail || undefined,
            walletAddress: walletAddr || undefined,
            authType: 'passkey',
          });

          console.log('🎯 [CONTINUE_PASSKEY] Setting authenticated state...');
          setUserSubOrgId(storedSubOrgId);
          setWalletAddress(walletAddr);
          setIsAuthenticated(true);

          console.log('🎉 [CONTINUE_PASSKEY] Login complete! Reloading page...');
          setTimeout(() => {
            window.location.reload();
          }, 100);
          return;
        } catch (loginError: any) {
          console.error('❌ [CONTINUE_PASSKEY] Passkey login failed:', loginError);
          setError(loginError.message || 'Failed to authenticate with passkey. Please try again or create a new account.');
          setIsLoading(false);
          return;
        }
      }

      // No stored account - show signup form
      console.log('📝 [CONTINUE_PASSKEY] No stored account, showing signup form...');
      setShowPasskeyForm(true);
    } catch (err: any) {
      console.error('❌ [CONTINUE_PASSKEY] Error:', err);
      setError(err.message || 'Failed to continue with passkey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask not found. Please install MetaMask browser extension.');
      return;
    }

    console.log('🚀 [CONNECT_WALLET] Starting unified wallet connection flow...');

    setIsLoading(true);
    setError(null);

    try {
      // Check stored auth type - if switching from passkey, clear that session
      const storedAuthType = localStorage.getItem('turnkey_auth_type');
      if (storedAuthType === 'passkey') {
        console.log('🔄 [CONNECT_WALLET] Switching from passkey to wallet - clearing old session');
        localStorage.removeItem('turnkey_sub_org_id');
        localStorage.removeItem('turnkey_wallet_address');
        localStorage.removeItem('turnkey_auth_type');
      } else if (storedAuthType === 'wallet') {
        console.log('🔄 [CONNECT_WALLET] Re-connecting wallet - clearing old session for fresh connection');
        // Clear to allow connecting different wallet or re-authenticating
        localStorage.removeItem('turnkey_sub_org_id');
        localStorage.removeItem('turnkey_wallet_address');
        localStorage.removeItem('turnkey_auth_type');
      }

      const ethereum = window.ethereum!;

      // Step 1: Connect to MetaMask and get account
      console.log('🔐 [CONNECT_WALLET] Step 1: Connecting to MetaMask...');
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const address = accounts[0];
      console.log('✅ [CONNECT_WALLET] Connected to address:', address);

      // Step 2: Request signature to derive public key
      console.log('🔑 [CONNECT_WALLET] Step 2: Requesting signature to derive public key...');
      const message = 'Sign this message to authenticate with Turnkey';
      const signature = await (ethereum.request as any)({
        method: 'personal_sign',
        params: [message, address],
      }) as string;
      console.log('✅ [CONNECT_WALLET] Signature received');

      // Step 3: Recover public key from signature
      console.log('🔑 [CONNECT_WALLET] Step 3: Recovering public key from signature...');
      const { recoverPublicKey, hashMessage } = await import('viem');
      const messageHash = hashMessage(message);
      const uncompressedPublicKey = await recoverPublicKey({
        hash: messageHash,
        signature: signature as `0x${string}`,
      });
      console.log('✅ [CONNECT_WALLET] Uncompressed public key:', uncompressedPublicKey);

      // Remove 0x prefix for Turnkey (it expects keys without prefix)
      const publicKeyWithoutPrefix = uncompressedPublicKey.startsWith('0x')
        ? uncompressedPublicKey.slice(2)
        : uncompressedPublicKey;
      console.log('✅ [CONNECT_WALLET] Public key (without 0x):', publicKeyWithoutPrefix);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

      // Step 4: Try to find existing sub-org (LOGIN ATTEMPT)
      console.log('🔍 [CONNECT_WALLET] Step 4: Checking for existing account...');
      const loginResponse = await fetch(`${backendUrl}/api/get-sub-org-by-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: publicKeyWithoutPrefix }),
      });

      if (!loginResponse.ok) {
        throw new Error('Failed to check for existing account');
      }

      const loginData = await loginResponse.json();
      console.log('📦 [CONNECT_WALLET] Login check response:', loginData);

      let subOrganizationId: string;
      let walletAddr: string;

      // Check if existing sub-org found AND if the wallet address matches the connected wallet
      const hasExistingSubOrg = loginData.subOrganizationId && loginData.addresses?.length > 0;
      const existingWalletMatches = hasExistingSubOrg &&
        loginData.addresses[0]?.toLowerCase() === address.toLowerCase();

      if (hasExistingSubOrg && existingWalletMatches) {
        // EXISTING USER - LOGIN (with matching wallet address)
        console.log('✅ [CONNECT_WALLET] Found existing account with matching wallet! Logging in...');
        subOrganizationId = loginData.subOrganizationId;
        walletAddr = loginData.addresses[0];
      } else {
        // NEW USER - SIGNUP (or old sub-org with Turnkey wallet that doesn't match)
        if (hasExistingSubOrg) {
          console.log('⚠️  [CONNECT_WALLET] Found old sub-org but wallet address doesn\'t match. Creating new account...');
          console.log(`  Expected: ${address}, Found: ${loginData.addresses[0]}`);
        } else {
          console.log('🆕 [CONNECT_WALLET] No existing account found. Creating new account...');
        }

        // Use wallet address as username and create placeholder email
        const walletUserName = `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`;
        const walletEmail = `${address.toLowerCase()}@wallet.turnkey`;

        const signupResponse = await fetch(`${backendUrl}/api/create-sub-org-with-wallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: walletUserName,
            userEmail: walletEmail,
            publicKey: publicKeyWithoutPrefix,
            walletAddress: address,
          }),
        });

        if (!signupResponse.ok) {
          const errorData = await signupResponse.json();
          throw new Error(errorData.error || 'Failed to create account');
        }

        const signupData = await signupResponse.json();
        console.log('✅ [CONNECT_WALLET] New account created!', signupData);

        subOrganizationId = signupData.subOrganizationId;
        walletAddr = signupData.addresses[0];

        // Store email for new users
        localStorage.setItem('turnkey_user_email', walletEmail);
      }

      // Step 5: Store account info and set state
      console.log('💾 [CONNECT_WALLET] Step 5: Storing account info...');
      localStorage.setItem('turnkey_sub_org_id', subOrganizationId);
      localStorage.setItem('turnkey_wallet_address', walletAddr);
      localStorage.setItem('turnkey_auth_type', 'wallet'); // Mark as wallet auth

      // Save to account history
      const walletEmail = localStorage.getItem('turnkey_user_email');
      saveAccountToHistory({
        subOrgId: subOrganizationId,
        email: walletEmail || undefined,
        walletAddress: walletAddr,
        authType: 'wallet',
      });

      setUserSubOrgId(subOrganizationId);
      setWalletAddress(walletAddr);
      setIsAuthenticated(true);

      // Set flag to indicate wallet client should be created after reload
      localStorage.setItem('turnkey_wallet_ready', 'true');

      console.log('🎉 [CONNECT_WALLET] Wallet connection complete! Reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err: any) {
      console.error('❌ [CONNECT_WALLET] Error:', err);
      console.error('❌ [CONNECT_WALLET] Error stack:', err.stack);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
      console.log('🏁 [CONNECT_WALLET] Wallet connection flow ended');
    }
  };


  const handleShowAccountSelector = () => {
    setShowAccountSelector(true);
  };

  console.log('🎨 [RENDER] TurnkeyAuth render state:', {
    isAuthenticated,
    isLoading,
    userSubOrgId,
    walletAddress,
    storedAccount,
  });

  if (!isAuthenticated) {
    return (
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 text-lg">🔐 Turnkey Authentication</h3>

        {/* Account Selector Modal */}
        {showAccountSelector && accountHistory.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-300 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-800">Select Account</h4>
              <button
                onClick={() => setShowAccountSelector(false)}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                ✕ Cancel
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {accountHistory.map((acc) => (
                <button
                  key={acc.subOrgId}
                  onClick={() => switchToAccount(acc)}
                  className="w-full p-3 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 text-left transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {acc.email || `${acc.authType === 'passkey' ? '🔐 Passkey' : '👛 Wallet'} Account`}
                      </p>
                      {acc.walletAddress && (
                        <p className="text-xs text-gray-600 font-mono mt-1">{acc.walletAddress.slice(0, 10)}...{acc.walletAddress.slice(-8)}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Last used: {new Date(acc.lastUsed).toLocaleDateString()}
                      </p>
                    </div>
                    {storedAccount?.subOrgId === acc.subOrgId && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Current</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <button
                onClick={() => {
                  // Allow creating a new account by just closing the selector
                  // and letting them use the normal signup flow
                  setShowAccountSelector(false);
                  setShowPasskeyForm(true);
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Create New Account
              </button>
            </div>
          </div>
        )}

        {/* Stored Account Info - shown when not selecting accounts */}
        {storedAccount && !showAccountSelector && accountHistory.length > 1 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-1">Current Account</p>
                <p className="text-xs text-blue-600 mb-1">
                  {storedAccount.email !== 'Unknown' ? `Email: ${storedAccount.email}` : 'Passkey Account'}
                </p>
                <p className="text-xs text-blue-600 font-mono break-all">ID: {storedAccount.subOrgId.slice(0, 20)}...</p>
              </div>
              <button
                onClick={handleShowAccountSelector}
                className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                title="Switch to a different account"
              >
                Switch ({accountHistory.length})
              </button>
            </div>
          </div>
        )}

        {error && !showAccountSelector && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        {!showAccountSelector && (
        <div className="space-y-6">
          {/* Unified Passkey Flow */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Continue with Passkey</h4>

            {!showPasskeyForm ? (
              // Initial state - just show the Continue button
              <>
                <button
                  onClick={handleContinueWithPasskey}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Checking...' : 'Continue with Passkey'}
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  Uses biometric authentication (Face ID, Touch ID, Windows Hello)
                </p>
              </>
            ) : (
              // Show signup form if needed
              <>
                <p className="text-sm text-gray-600 mb-3">Let's create your account</p>
                <form onSubmit={handleSignup} className="space-y-3">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoFocus
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
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>
                <button
                  onClick={() => setShowPasskeyForm(false)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back
                </button>
              </>
            )}
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

          {/* Wallet Connect (Unified Login/Signup) */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Connect with Wallet</h4>
            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              💡 Works across devices with MetaMask/Coinbase • No email required • Auto creates account if needed
            </p>
          </div>

        </div>
        )}

        {!showAccountSelector && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          Choose your preferred authentication method above
        </p>
        )}
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
          <h3 className="font-semibold text-green-800 mb-2">
            {turnkeyWalletClient ? '✅ Authenticated' : '🔐 Re-authentication Required'}
          </h3>
          <div className="space-y-1 text-xs">
            <p className="text-green-600">Sub-Organization: {userSubOrgId}</p>
            {userEmail && (
              <p className="text-green-600">Owner (Email): {userEmail}</p>
            )}
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
}: {
  account: any;
  isInitialized: boolean;
  refreshAccount: () => Promise<void>;
  isLoadingAccount: boolean;
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

  // INSTANT INITIALIZATION - Read from localStorage immediately on mount
  useEffect(() => {
    const storedSubOrgId = localStorage.getItem('turnkey_sub_org_id');
    const storedWalletAddress = localStorage.getItem('turnkey_wallet_address');
    const storedAuthType = localStorage.getItem('turnkey_auth_type');

    if (storedSubOrgId && storedWalletAddress && storedAuthType === 'passkey') {
      console.log('⚡️ [TurnkeyIntegration FAST_INIT] Found passkey credentials, setting state immediately');
      setOrganizationId(storedSubOrgId);
      setWalletAddress(storedWalletAddress);
      // Don't set turnkeyClient yet - wait for SDK to load in the other useEffect
    }
  }, []);

  useEffect(() => {
    const checkAuthAndSetup = async () => {
      // Check for stored authentication data
      const storedSubOrgId = localStorage.getItem('turnkey_sub_org_id');
      const storedWalletAddress = localStorage.getItem('turnkey_wallet_address');
      const storedAuthType = localStorage.getItem('turnkey_auth_type');

      console.log('[TurnkeyIntegration] Checking authentication:', {
        storedSubOrgId,
        storedWalletAddress,
        storedAuthType,
      });

      // If we have stored credentials, use auth_type flag to determine flow
      if (storedSubOrgId && storedWalletAddress && storedAuthType) {
        if (storedAuthType === 'wallet') {
          // WALLET AUTHENTICATION FLOW
          console.log('[TurnkeyIntegration] Using wallet authentication (MetaMask/Coinbase)');
          setOrganizationId(storedSubOrgId);
          setTurnkeyClient(null); // No passkey client for wallet users
          setWalletAddress(storedWalletAddress);
          return;
        } else if (storedAuthType === 'passkey') {
          // PASSKEY AUTHENTICATION FLOW
          console.log('[TurnkeyIntegration] Using passkey authentication');

          if (!turnkey || !passkeyClient) {
            console.log('[TurnkeyIntegration] Waiting for Turnkey SDK to initialize...');
            setTurnkeyClient(null);
            // Don't clear organizationId and walletAddress - they may have been set by instant init
            // We'll update them when Turnkey SDK is ready
            return;
          }

          try {
            const session = await turnkey.getSession();
            if (session?.organizationId) {
              console.log('[TurnkeyIntegration] Passkey session active:', session.organizationId);
              setOrganizationId(session.organizationId);
              setTurnkeyClient(passkeyClient);
              setWalletAddress(storedWalletAddress);
              return;
            } else {
              console.log('[TurnkeyIntegration] No active passkey session found');
              setTurnkeyClient(null);
              setOrganizationId('');
              setWalletAddress(null);
              return;
            }
          } catch (err) {
            console.error('[TurnkeyIntegration] Failed to get passkey session:', err);
            setTurnkeyClient(null);
            setOrganizationId('');
            setWalletAddress(null);
            return;
          }
        }
      }

      // FALLBACK: Old logic for backwards compatibility (no auth_type flag)
      // This handles existing users who authenticated before the auth_type flag was added
      if (storedSubOrgId && storedWalletAddress && !storedAuthType) {
        console.log('[TurnkeyIntegration] No auth_type flag found, using legacy detection...');

        // Try to detect based on Turnkey session
        if (turnkey && passkeyClient) {
          try {
            const session = await turnkey.getSession();
            if (!session?.organizationId) {
              // No session = wallet user
              console.log('[TurnkeyIntegration] Legacy: Wallet user detected (no session)');
              setOrganizationId(storedSubOrgId);
              setTurnkeyClient(null);
              setWalletAddress(storedWalletAddress);
              // Set auth_type for future
              localStorage.setItem('turnkey_auth_type', 'wallet');
              return;
            } else {
              // Has session = passkey user
              console.log('[TurnkeyIntegration] Legacy: Passkey user detected (has session)');
              setOrganizationId(session.organizationId);
              setTurnkeyClient(passkeyClient);
              setWalletAddress(storedWalletAddress);
              // Set auth_type for future
              localStorage.setItem('turnkey_auth_type', 'passkey');
              return;
            }
          } catch (err) {
            console.log('[TurnkeyIntegration] Legacy: Session check failed, assuming wallet user');
            setOrganizationId(storedSubOrgId);
            setTurnkeyClient(null);
            setWalletAddress(storedWalletAddress);
            localStorage.setItem('turnkey_auth_type', 'wallet');
            return;
          }
        } else {
          // Turnkey SDK not ready, assume wallet user
          console.log('[TurnkeyIntegration] Legacy: Turnkey not ready, assuming wallet user');
          setOrganizationId(storedSubOrgId);
          setTurnkeyClient(null);
          setWalletAddress(storedWalletAddress);
          localStorage.setItem('turnkey_auth_type', 'wallet');
          return;
        }
      }

      // NO STORED CREDENTIALS - clear state
      console.log('[TurnkeyIntegration] No stored credentials found, clearing state');
      setTurnkeyClient(null);
      setOrganizationId('');
      setWalletAddress(null);
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
      if (!organizationId || !walletAddress) {
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
        const { toAccount } = await import('viem/accounts');
        const { createWalletClient: createViemWalletClient, http, custom } = await import('viem');

        // Check auth_type to determine which wallet client to create
        const storedAuthType = localStorage.getItem('turnkey_auth_type');

        // Check if wallet is ready to connect (flag set after Connect Wallet success)
        const walletReady = localStorage.getItem('turnkey_wallet_ready');

        // Create wallet client for WALLET users only if they just connected (flag exists)
        if (!turnkeyClient && storedAuthType === 'wallet' && walletReady === 'true' && typeof window !== 'undefined' && window.ethereum) {
          console.log('[TurnkeyIntegration] Creating MetaMask wallet client (post-connection)');

          const ethereum = window.ethereum!;

          // Connect to MetaMask and verify it's the same account
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
          const connectedAddress = accounts[0];
          console.log('[TurnkeyIntegration] Connected MetaMask address:', connectedAddress);

          // Create wallet client from MetaMask
          const metamaskAccount = toAccount({
            address: connectedAddress as `0x${string}`,
            async signMessage({ message }) {
              console.log('[MetaMask] Signing message');
              return await (ethereum.request as any)({
                method: 'personal_sign',
                params: [typeof message === 'string' ? message : message.raw, connectedAddress],
              }) as `0x${string}`;
            },
            async signTransaction(_transaction) {
              throw new Error('signTransaction not supported for wallet-based authentication with ERC-4337');
            },
            async signTypedData(typedData) {
              console.log('[MetaMask] Signing typed data');
              return await (ethereum.request as any)({
                method: 'eth_signTypedData_v4',
                params: [connectedAddress, JSON.stringify(typedData)],
              }) as `0x${string}`;
            },
          });

          const walletClient = createViemWalletClient({
            account: metamaskAccount,
            chain,
            transport: custom(ethereum),
          });

          console.log('[TurnkeyIntegration] MetaMask wallet client created successfully');
          setTurnkeyWalletClient(walletClient);
          // Clear flag after successful creation
          localStorage.removeItem('turnkey_wallet_ready');
        } else if (turnkeyClient && storedAuthType === 'passkey') {
          console.log('[TurnkeyIntegration] Creating Turnkey deferred wallet client for passkey user');

          // Create a DEFERRED account - no passkey prompt until actually signing
          const deferredAccount = toAccount({
            address: walletAddress as `0x${string}`,
            async signMessage({ message }) {
              console.log('[DeferredAccount] Signing message - will prompt for passkey now');
              const { createAccount } = await import('@turnkey/viem');
              const account = await createAccount({
                client: turnkeyClient!,
                organizationId,
                signWith: walletAddress,
                ethereumAddress: walletAddress,
              });
              return account.signMessage({ message });
            },
            async signTransaction(_transaction) {
              throw new Error('signTransaction not supported for Turnkey with ERC-4337');
            },
            async signTypedData(typedData) {
              console.log('[DeferredAccount] Signing typed data - will prompt for passkey now');
              const { createAccount } = await import('@turnkey/viem');
              const account = await createAccount({
                client: turnkeyClient!,
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

          console.log('[TurnkeyIntegration] Turnkey deferred wallet client created successfully (no passkey prompt yet)');
          setTurnkeyWalletClient(walletClient);
        } else {
          // Waiting for Turnkey client to initialize for passkey users, or wrong configuration
          if (storedAuthType === 'passkey' && !turnkeyClient) {
            console.log('[TurnkeyIntegration] Waiting for Turnkey SDK to initialize for passkey user...');
          } else {
            console.log('[TurnkeyIntegration] Cannot create wallet client - unexpected state:', {
              storedAuthType,
              hasTurnkeyClient: !!turnkeyClient,
              hasMetaMask: typeof window !== 'undefined' && !!window.ethereum,
            });
          }
        }
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
        turnkeyWalletClient={turnkeyWalletClient}
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

      {sbcResult.isInitialized && turnkeyWalletClient && (
        <>
          <SmartAccountInfo
            account={sbcResult.account}
            isInitialized={sbcResult.isInitialized}
            refreshAccount={sbcResult.refreshAccount}
            isLoadingAccount={sbcResult.isLoadingAccount}
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

    // walletClient.account is available on the client
    const signature = await walletClient.signTypedData({
      account: walletClient.account!,
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
