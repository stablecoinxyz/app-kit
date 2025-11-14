import { useState, useEffect, useCallback } from 'react';
import { SbcAppKit } from '@stablecoin.xyz/core';
import type { AccountInfo, SbcAppKitConfig } from '@stablecoin.xyz/core';

export interface UseSbcTurnkeyReturn {
  /** SBC App Kit instance */
  sbcAppKit: SbcAppKit | null;
  /** Whether the SDK is initialized */
  isInitialized: boolean;
  /** Initialization error if any */
  error: Error | null;
  /** Account information */
  account: AccountInfo | null;
  /** Whether account info is loading */
  isLoadingAccount: boolean;
  /** Error loading account info */
  accountError: Error | null;
  /** Refresh account information */
  refreshAccount: () => Promise<void>;
  /** EOA address from Turnkey that owns the smart account */
  ownerAddress: string | null;
  /** Disconnect the wallet and clear all state */
  disconnectWallet: () => void;
}

export interface UseSbcTurnkeyConfig {
  /** Your SBC API key */
  apiKey: string;
  /** Blockchain network to operate on */
  chain: import('viem').Chain;
  /** Turnkey client from getActiveClient() */
  turnkeyClient: any;
  /** Organization ID from Turnkey */
  organizationId: string;
  /** Optional: Custom RPC URL */
  rpcUrl?: string;
  /** Optional: Enable debug logging */
  debug?: boolean;
  /** Optional: Pre-created Turnkey viem wallet client */
  turnkeyWalletClient?: any;
}

/**
 * Simplified hook for Turnkey + SBC integration
 * Automatically handles wallet client creation and SBC initialization
 *
 * @example
 * ```tsx
 * import { TurnkeyProvider, useTurnkey } from "@turnkey/sdk-react";
 * import { useSbcTurnkey } from "@stablecoin.xyz/react";
 * import { baseSepolia } from "viem/chains";
 * import { useState, useEffect } from "react";
 *
 * function App() {
 *   return (
 *     <TurnkeyProvider config={turnkeyConfig}>
 *       <YourComponent />
 *     </TurnkeyProvider>
 *   );
 * }
 *
 * function YourComponent() {
 *   const { turnkey, passkeyClient } = useTurnkey();
 *   const [turnkeyClient, setTurnkeyClient] = useState(null);
 *   const [organizationId, setOrganizationId] = useState('');
 *
 *   // Check authentication and get organization ID
 *   useEffect(() => {
 *     const checkAuth = async () => {
 *       if (turnkey) {
 *         const session = await turnkey.getSession();
 *         if (session?.organizationId) {
 *           setOrganizationId(session.organizationId);
 *           setTurnkeyClient(passkeyClient);
 *         }
 *       }
 *     };
 *     checkAuth();
 *   }, [turnkey, passkeyClient]);
 *
 *   const {
 *     sbcAppKit,
 *     isInitialized,
 *     account,
 *     ownerAddress
 *   } = useSbcTurnkey({
 *     apiKey: 'your-sbc-api-key',
 *     chain: baseSepolia,
 *     turnkeyClient,
 *     organizationId,
 *   });
 *
 *   return <div>Smart Account: {account?.address}</div>;
 * }
 * ```
 */
export function useSbcTurnkey(config: UseSbcTurnkeyConfig): UseSbcTurnkeyReturn {
  const [sbcAppKit, setSbcAppKit] = useState<SbcAppKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<Error | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);

  // Initialize SBC AppKit when Turnkey client is available
  useEffect(() => {
    const initializeSbc = async () => {
      if (!config.turnkeyClient || !config.organizationId) {
        setSbcAppKit(null);
        setIsInitialized(false);
        setError(null);
        return;
      }

      try {
        setError(null);

        if (config.debug) {
          console.log('[useSbcTurnkey] Initializing SBC with Turnkey...', {
            hasClient: !!config.turnkeyClient,
            organizationId: config.organizationId,
            hasWalletClient: !!config.turnkeyWalletClient,
          });
        }

        // Get wallet address from Turnkey
        let walletAddress: string | null = null;

        if (config.debug) {
          console.log('[useSbcTurnkey] Checking for wallet address:', {
            hasTurnkeyWalletClient: !!config.turnkeyWalletClient,
            hasAccount: !!config.turnkeyWalletClient?.account,
            hasAddress: !!config.turnkeyWalletClient?.account?.address,
            address: config.turnkeyWalletClient?.account?.address,
          });
        }

        // If wallet client is provided, get address from it
        if (config.turnkeyWalletClient?.account?.address) {
          walletAddress = config.turnkeyWalletClient.account.address;
          if (config.debug) {
            console.log('[useSbcTurnkey] Using address from wallet client:', walletAddress);
          }
        } else {
          // Otherwise, fetch wallet info from Turnkey
          if (config.debug) {
            console.log('[useSbcTurnkey] No wallet client address found, fetching from Turnkey...');
          }
          try {
            const wallets = await config.turnkeyClient.getWallets({
              organizationId: config.organizationId
            });

            const walletId = wallets?.wallets[0]?.walletId;
            if (walletId) {
              const accounts = await config.turnkeyClient.getWalletAccounts({
                organizationId: config.organizationId,
                walletId,
              });
              walletAddress = accounts?.accounts[0]?.address;
            }
          } catch (e) {
            throw new Error(`Failed to fetch Turnkey wallet info: ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }

        if (!walletAddress) {
          throw new Error('No Turnkey wallet address found. Create a wallet first.');
        }

        // Create SBC AppKit with Turnkey integration
        const sbcConfig: SbcAppKitConfig = {
          apiKey: config.apiKey,
          chain: config.chain,
          wallet: 'turnkey',
          walletOptions: {
            turnkeyContext: {
              turnkeyClient: config.turnkeyClient,
              organizationId: config.organizationId,
              turnkeyWalletClient: config.turnkeyWalletClient,
            },
          },
          rpcUrl: config.rpcUrl,
          debug: config.debug,
        };

        const appKit = new SbcAppKit(sbcConfig);

        // Connect to Turnkey wallet
        await appKit.connectWallet('turnkey');

        setSbcAppKit(appKit);
        setOwnerAddress(walletAddress);
        setIsInitialized(true);

        if (config.debug) {
          console.log('[useSbcTurnkey] SBC initialized successfully');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize SBC with Turnkey');
        setError(error);
        setSbcAppKit(null);
        setIsInitialized(false);
        if (config.debug) {
          console.error('[useSbcTurnkey] Initialization failed:', error);
        }
      }
    };

    initializeSbc();
  }, [config.turnkeyClient, config.organizationId, config.apiKey, config.chain, config.rpcUrl, config.debug, config.turnkeyWalletClient]);

  const refreshAccount = useCallback(async () => {
    if (!sbcAppKit || !isInitialized) {
      setAccount(null);
      setOwnerAddress(null);
      return;
    }

    try {
      setIsLoadingAccount(true);
      setAccountError(null);

      // Get owner address and account info
      const owner = sbcAppKit.getOwnerAddress();
      setOwnerAddress(owner);

      const accountInfo = await sbcAppKit.getAccount();
      setAccount(accountInfo);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load account');
      setAccountError(error);
      setAccount(null);
      setOwnerAddress(null);
    } finally {
      setIsLoadingAccount(false);
    }
  }, [sbcAppKit, isInitialized]);

  // Disconnect wallet and clear state
  const disconnectWallet = useCallback(() => {
    if (sbcAppKit) {
      try {
        sbcAppKit.disconnectWallet();
      } catch {}
    }
    setAccount(null);
    setOwnerAddress(null);
  }, [sbcAppKit]);

  // Load account when SDK is initialized
  useEffect(() => {
    if (isInitialized && sbcAppKit) {
      refreshAccount();
    } else {
      setAccount(null);
      setAccountError(null);
      setOwnerAddress(null);
    }
  }, [isInitialized, sbcAppKit, refreshAccount]);

  return {
    sbcAppKit,
    isInitialized,
    error,
    account,
    isLoadingAccount,
    accountError,
    refreshAccount,
    ownerAddress,
    disconnectWallet,
  };
}
