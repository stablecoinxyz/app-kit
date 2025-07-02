import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SbcAppKit } from '@stablecoin.xyz/core';
import type { SbcProviderProps, SbcContextValue } from '../types';

const SbcContext = createContext<SbcContextValue | undefined>(undefined);

export function SbcProvider({ config, children, onError }: SbcProviderProps) {
  const [sbcKit, setSbcKit] = useState<SbcAppKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async () => {
    try {
      setError(null);
      setIsInitialized(false);
      
      const kit = new SbcAppKit(config);
      
      setSbcKit(kit);
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize SBC App Kit');
      setError(error);
      setSbcKit(null);
      setIsInitialized(false);
      onError?.(error);
    }
  }, [config, onError]);

  const reinitialize = useCallback(() => {
    initialize();
  }, [initialize]);

  // Initialize on mount and config changes
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sbcKit) {
        // If we add cleanup methods to core SDK later
        // sbcKit.destroy?.();
      }
    };
  }, [sbcKit]);

  const contextValue: SbcContextValue = {
    sbcKit,
    isInitialized,
    error,
    reinitialize,
  };

  return (
    <SbcContext.Provider value={contextValue}>
      {children}
    </SbcContext.Provider>
  );
}

export function useSbcContext(): SbcContextValue {
  const context = useContext(SbcContext);
  if (context === undefined) {
    throw new Error('useSbcContext must be used within a SbcProvider');
  }
  return context;
} 