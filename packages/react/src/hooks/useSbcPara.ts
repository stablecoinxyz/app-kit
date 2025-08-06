import { useState, useEffect, useCallback, useRef } from 'react';
import { Chain } from 'viem';
import { SbcAppKit } from '@stablecoin.xyz/core';

export interface UseSbcParaConfig {
  /** SBC API key */
  apiKey: string;
  /** Target blockchain chain */
  chain: Chain;
  /** Para account object from the useAccount hook */
  paraAccount: any;
  /** Optional RPC URL override */
  rpcUrl?: string;
  /** Enable debug logging */
  debug?: boolean;

}

export interface UseSbcParaResult {
  /** SBC AppKit instance (available when initialized) */
  sbcAppKit: SbcAppKit | null;
  /** Whether SBC is initialized and ready */
  isInitialized: boolean;
  /** Initialization or runtime error */
  error: Error | null;
  /** Smart account information */
  account: any;
  /** Whether account information is loading */
  isLoadingAccount: boolean;
  /** Account loading error */
  accountError: Error | null;
  /** Owner address (Para wallet address) */
  ownerAddress: string | null;
  /** Function to refresh account data */
  refreshAccount: () => Promise<void>;
  /** Function to disconnect and cleanup */
  disconnectWallet: () => Promise<void>;
}

/**
 * React hook for integrating SBC AppKit with Para embedded wallets
 * 
 * This hook should be used within a ParaProvider context and requires
 * a Para account from the useAccount hook.
 * 
 * @example
 * ```tsx
 * import { ParaProvider, useAccount } from "@getpara/react-sdk";
 * import "@getpara/react-sdk/styles.css";
 * 
 * function App() {
 *   return (
 *     <ParaProvider
 *       paraClientConfig={{
 *         env: "development",
 *         apiKey: "your-para-api-key",
 *       }}
 *       config={{
 *         appName: "Your App Name",
 *       }}
 *     >
 *       <YourAppComponent />
 *     </ParaProvider>
 *   );
 * }
 * 
 * function YourAppComponent() {
 *   const paraAccount = useAccount();
 * 
 *   const {
 *     sbcAppKit,
 *     isInitialized,
 *     account,
 *     ownerAddress
 *   } = useSbcPara({
 *     apiKey: 'your-sbc-api-key',
 *     chain: baseSepolia,
 *     paraAccount
 *   });
 * 
 *   return <div>Smart Account: {account?.address}</div>;
 * }
 * ```
 */
export function useSbcPara(config: UseSbcParaConfig): UseSbcParaResult {
  const [sbcAppKit, setSbcAppKit] = useState<SbcAppKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<Error | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const { apiKey, chain, paraAccount, rpcUrl, debug = false } = config;

  // Initialize SBC when Para wallet is connected
  useEffect(() => {
    if (!paraAccount.isConnected || !paraAccount.embedded?.wallets?.length) {
      setSbcAppKit(null);
      setIsInitialized(false);
      setOwnerAddress(null);
      return;
    }

    const initializeSbc = async () => {
      try {
        setError(null);
        if (debug) console.log('Initializing SBC with Para wallet...');

        const paraWalletAddress = paraAccount.embedded?.wallets?.[0]?.address;
        
        if (!paraWalletAddress) {
          throw new Error('No Para wallet address found');
        }

        // Initialize SBC AppKit with Para wallet configuration
        const appKit = new SbcAppKit({
          apiKey,
          chain,
          wallet: 'para',
          rpcUrl,
          walletOptions: {
            paraContext: {
              user: paraAccount,
              paraWallet: paraAccount,
            },
          },
        });

        // Connect the wallet so SBC recognizes it as connected
        if (debug) console.log('Connecting Para wallet to SBC...');
        await appKit.connectWallet('para');

        setSbcAppKit(appKit);
        setOwnerAddress(paraWalletAddress);
        setIsInitialized(true);
        
        if (debug) console.log('SBC initialized and connected with Para wallet');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during SBC initialization';
        if (debug) console.error('SBC initialization failed:', errorMessage);
        setError(new Error(`SBC initialization failed: ${errorMessage}`));
        setSbcAppKit(null);
        setIsInitialized(false);
      }
    };

    initializeSbc();
  }, [apiKey, chain, rpcUrl, debug, paraAccount.isConnected, paraAccount.embedded?.wallets?.[0]?.address]);

  // Load account information when SBC is initialized
  useEffect(() => {
    if (!sbcAppKit || !isInitialized || isLoadingRef.current) {
      return;
    }

    const loadAccount = async () => {
      if (isLoadingRef.current) return; // Prevent multiple concurrent loads
      
      isLoadingRef.current = true;
      setIsLoadingAccount(true);
      setAccountError(null);
      
      try {
        if (debug) console.log('Loading Para smart account...');
        const accountInfo = await sbcAppKit.getAccount();
        setAccount(accountInfo);
        if (debug) console.log('Para smart account loaded:', accountInfo);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading account';
        if (debug) console.error('Failed to load Para smart account:', errorMessage);
        setAccountError(new Error(`Failed to load account: ${errorMessage}`));
      } finally {
        setIsLoadingAccount(false);
        isLoadingRef.current = false;
      }
    };

    loadAccount();
  }, [sbcAppKit, isInitialized, debug]);

  // Refresh account data
  const refreshAccount = useCallback(async () => {
    if (!sbcAppKit || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoadingAccount(true);
    setAccountError(null);
    
    try {
      if (debug) console.log('Refreshing Para smart account...');
      const accountInfo = await sbcAppKit.getAccount();
      setAccount(accountInfo);
      if (debug) console.log('Para smart account refreshed:', accountInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error refreshing account';
      if (debug) console.error('Failed to refresh Para smart account:', errorMessage);
      setAccountError(new Error(`Failed to refresh account: ${errorMessage}`));
    } finally {
      setIsLoadingAccount(false);
      isLoadingRef.current = false;
    }
  }, [sbcAppKit, debug]);

  // Disconnect and cleanup
  const disconnectWallet = useCallback(async () => {
    try {
      if (debug) console.log('Cleaning up SBC integration...');
      
      // Reset all state
      setSbcAppKit(null);
      setIsInitialized(false);
      setAccount(null);
      setOwnerAddress(null);
      setError(null);
      setAccountError(null);
      
      if (debug) console.log('SBC cleanup successful');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during cleanup';
      if (debug) console.error('Failed to cleanup SBC:', errorMessage);
      setError(new Error(`Failed to cleanup: ${errorMessage}`));
    }
  }, [debug]);

  return {
    sbcAppKit,
    isInitialized,
    error,
    account,
    isLoadingAccount,
    accountError,
    ownerAddress,
    refreshAccount,
    disconnectWallet
  };
} 