import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SbcAppKit, type SbcAppKitConfig } from '@stablecoin.xyz/core';
import type { SbcProviderProps, SbcContextValue } from '../types';

const SbcContext = createContext<SbcContextValue | undefined>(undefined);

export function SbcProvider({ config, children, onError }: SbcProviderProps) {
  const [sbcAppKit, setSbcAppKit] = useState<SbcAppKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = useCallback(async () => {
    try {
      setError(null);
      setIsInitialized(false);
      
      const appKit = new SbcAppKit(config as SbcAppKitConfig);
      
      setSbcAppKit(appKit);
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize SBC App Kit');
      setError(error);
      setSbcAppKit(null);
      setIsInitialized(false);
      onError?.(error);
    }
  }, [config, onError]);

  // Initialize on mount and config changes
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sbcAppKit) {
        // If we add cleanup methods to core SDK later
        // sbcAppKit.destroy?.();
      }
    };
  }, [sbcAppKit]);

  const contextValue: SbcContextValue = {
    sbcAppKit,
    isInitialized,
    error,
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