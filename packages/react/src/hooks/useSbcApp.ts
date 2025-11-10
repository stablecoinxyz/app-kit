import { useState, useEffect, useCallback } from 'react';
import { useSbcContext } from '../components/SbcProvider';
import type { AccountInfo } from '@stablecoin.xyz/core';

export interface UseSbcAppReturn {
  /** SBC App Kit instance */
  sbcAppKit: import('@stablecoin.xyz/core').SbcAppKit | null;
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
  /** EOA address (MetaMask, etc) that owns the smart account */
  ownerAddress: string | null;
  /** Disconnect the wallet and clear all state */
  disconnectWallet: () => void;
}

/**
 * Main hook for accessing SBC App Kit functionality
 */
export function useSbcApp(): UseSbcAppReturn {
  const { sbcAppKit, isInitialized, error } = useSbcContext();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<Error | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);

  const refreshAccount = useCallback(async () => {
    if (!sbcAppKit || !isInitialized) {
      setAccount(null);
      setOwnerAddress(null);
      return;
    }

    try {
      setIsLoadingAccount(true);
      setAccountError(null);
      
      // First try to get owner address to check if wallet is connected
      try {
        const owner = sbcAppKit.getOwnerAddress();
        setOwnerAddress(owner);
        
        // Only try to get account if wallet is connected
        const accountInfo = await sbcAppKit.getAccount();
        setAccount(accountInfo);
      } catch (ownerError) {
        // No wallet connected yet - this is normal for 'auto' wallet config
        setOwnerAddress(null);
        setAccount(null);
        // Don't set this as an error - it's expected behavior
        return;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load account');

      // Log to console if debug mode is enabled
      if (sbcAppKit && (sbcAppKit as any).debug) {
        console.error('[SBC App Kit] Failed to load account:', error);
      }

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