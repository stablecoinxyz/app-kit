import { useState, useEffect, useCallback } from 'react';
import { SbcAppKit } from '@stablecoin.xyz/core';
import type { AccountInfo, SbcAppKitConfig } from '@stablecoin.xyz/core';

export interface UseSbcDynamicReturn {
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
  /** EOA address from Dynamic that owns the smart account */
  ownerAddress: string | null;
  /** Disconnect the wallet and clear all state */
  disconnectWallet: () => void;
}

export interface UseSbcDynamicConfig {
  /** Your SBC API key */
  apiKey: string;
  /** Blockchain network to operate on */
  chain: import('viem').Chain;
  /** Dynamic primary wallet from useDynamicContext() */
  primaryWallet: any;
  /** Optional: Custom RPC URL */
  rpcUrl?: string;
  /** Optional: Enable debug logging */
  debug?: boolean;
}

/**
 * Simplified hook for Dynamic + SBC integration
 * Automatically handles wallet client creation and SBC initialization
 */
export function useSbcDynamic(config: UseSbcDynamicConfig): UseSbcDynamicReturn {
  const [sbcAppKit, setSbcAppKit] = useState<SbcAppKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<Error | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);

  // Initialize SBC AppKit when Dynamic wallet is available
  useEffect(() => {
    const initializeSbc = async () => {
      if (!config.primaryWallet?.address) {
        setSbcAppKit(null);
        setIsInitialized(false);
        setError(null);
        return;
      }

      try {
        setError(null);
        
        // Get Dynamic wallet client - it doesn't need an account property
        let dynamicWalletClient = null;
        
        try {
          dynamicWalletClient = await config.primaryWallet.connector.getWalletClient();
          if (config.debug) {
            console.log(`[useSbcDynamic] Dynamic wallet client obtained:`, {
              hasClient: !!dynamicWalletClient,
              walletAddress: config.primaryWallet.address
            });
          }
        } catch (e) {
          throw new Error(`Failed to get Dynamic wallet client: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
        
        if (!dynamicWalletClient) {
          throw new Error('Dynamic wallet client not available');
        }
        
        // Create SBC AppKit with Dynamic integration
        const sbcConfig: SbcAppKitConfig = {
          apiKey: config.apiKey,
          chain: config.chain,
          wallet: 'dynamic',
          walletOptions: {
            dynamicContext: {
              primaryWallet: config.primaryWallet,
            },
          },
          rpcUrl: config.rpcUrl,
          debug: config.debug,
        };

        const appKit = new SbcAppKit(sbcConfig);
        
        // Connect to Dynamic wallet
        await appKit.connectWallet('dynamic');
        
        setSbcAppKit(appKit);
        setIsInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize SBC with Dynamic');
        setError(error);
        setSbcAppKit(null);
        setIsInitialized(false);
      }
    };

    initializeSbc();
  }, [config.primaryWallet?.address, config.apiKey, config.chain, config.rpcUrl, config.debug]);

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