import { useState, useCallback } from 'react';
import { useSbcContext } from '../components/SbcProvider';
import { useSbcApp } from './useSbcApp';
import type { 
  SendUserOperationParams, 
  UserOperationResult,
  UserOperationEstimate
} from '@stablecoin.xyz/core';
import type { UseUserOperationOptions, UserOperationState } from '../types';

export interface UseUserOperationReturn extends UserOperationState {
  /** Send a user operation */
  sendUserOperation: (params: SendUserOperationParams) => Promise<UserOperationResult | undefined>;
  /** Estimate gas for a user operation */
  estimateUserOperation: (params: SendUserOperationParams) => Promise<UserOperationEstimate | undefined>;
}

/**
 * Hook for sending user operations with automatic state management
 */
export function useUserOperation(options: UseUserOperationOptions = {}): UseUserOperationReturn {
  const { sbcKit, isInitialized } = useSbcContext();
  const { refreshAccount } = useSbcApp();
  const { onSuccess, onError, refreshAccount: shouldRefreshAccount = true } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<UserOperationResult | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setData(null);
  }, []);

  const sendUserOperation = useCallback(async (params: SendUserOperationParams): Promise<UserOperationResult | undefined> => {
    if (!sbcKit || !isInitialized) {
      const error = new Error('SBC App Kit is not initialized');
      setError(error);
      setIsError(true);
      onError?.(error);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      setIsSuccess(false);

      const result = await sbcKit.sendUserOperation(params);
      
      setData(result);
      setIsSuccess(true);
      onSuccess?.(result);

      // Auto-refresh account if enabled
      if (shouldRefreshAccount) {
        refreshAccount();
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send user operation');
      setError(error);
      setIsError(true);
      setData(null);
      onError?.(error);
      return;
    } finally {
      setIsLoading(false);
    }
  }, [sbcKit, isInitialized, onSuccess, onError, shouldRefreshAccount, refreshAccount]);

  const estimateUserOperation = useCallback(async (params: SendUserOperationParams): Promise<UserOperationEstimate | undefined> => {
    if (!sbcKit || !isInitialized) {
      const error = new Error('SBC App Kit is not initialized');
      setError(error);
      setIsError(true);
      onError?.(error);
      return;
    }

    try {
      return await sbcKit.estimateUserOperation(params);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to estimate user operation');
      setError(error);
      setIsError(true);
      onError?.(error);
      return;
    }
  }, [sbcKit, isInitialized, onError]);

  return {
    sendUserOperation,
    estimateUserOperation,
    isLoading,
    isSuccess,
    isError,
    error,
    data,
    reset,
  };
} 