import type { SbcAppKitConfig, SbcAppKit } from '@stablecoin.xyz/core';
import type { ReactNode } from 'react';

export interface SbcProviderProps {
  /** SBC App Kit configuration */
  config: SbcAppKitConfig;
  /** Child components */
  children: ReactNode;
  /** Optional: Custom error boundary */
  onError?: (error: Error) => void;
}

export interface SbcContextValue {
  /** SBC App Kit instance */
  sbcAppKit: SbcAppKit | null;
  /** Whether the SDK is initialized */
  isInitialized: boolean;
  /** Initialization error if any */
  error: Error | null;
}

export interface UseUserOperationOptions {
  /** Callback fired on successful transaction */
  onSuccess?: (result: import('@stablecoin.xyz/core').UserOperationResult) => void;
  /** Callback fired on transaction error */
  onError?: (error: Error) => void;
  /** Auto-refresh account after successful transaction */
  refreshAccount?: boolean;
}

export interface UserOperationState {
  /** Whether a transaction is currently being sent */
  isLoading: boolean;
  /** Whether the last transaction was successful */
  isSuccess: boolean;
  /** Whether the last transaction failed */
  isError: boolean;
  /** Error from the last transaction */
  error: Error | null;
  /** Result from the last successful transaction */
  data: import('@stablecoin.xyz/core').UserOperationResult | null;
  /** Reset the state */
  reset: () => void;
} 