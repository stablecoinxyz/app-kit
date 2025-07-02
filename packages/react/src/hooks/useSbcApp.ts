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
}

/**
 * Main hook for accessing SBC App Kit functionality
 */
export function useSbcApp(): UseSbcAppReturn {
  const { sbcAppKit, isInitialized, error } = useSbcContext();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<Error | null>(null);

  const refreshAccount = useCallback(async () => {
    if (!sbcAppKit || !isInitialized) {
      setAccount(null);
      return;
    }

    try {
      setIsLoadingAccount(true);
      setAccountError(null);
      const accountInfo = await sbcAppKit.getAccount();
      setAccount(accountInfo);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load account');
      setAccountError(error);
      setAccount(null);
    } finally {
      setIsLoadingAccount(false);
    }
  }, [sbcAppKit, isInitialized]);

  // Load account when SDK is initialized
  useEffect(() => {
    if (isInitialized && sbcAppKit) {
      refreshAccount();
    } else {
      setAccount(null);
      setAccountError(null);
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
  };
} 