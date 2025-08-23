import { useAccount, useClient } from "@getpara/react-sdk";
import { createPublicClient, http, type WalletClient, type PublicClient, type LocalAccount } from "viem";
import { createParaAccount, createParaViemClient } from "@getpara/viem-v2-integration";
import { Chain } from "viem/chains";
import { useState, useEffect, useMemo } from "react";

/**
 * Hook to create viem clients for Para wallet integration
 * Provides publicClient, walletClient, and account information for external wallet signing
 */
export function useParaViem(chain: Chain, rpcUrl: string) {
  const { isConnected } = useAccount();
  const para = useClient();
  
  // Create a stable public client that doesn't change unless chain/rpc changes
  const publicClient = useMemo(() => createPublicClient({
    chain,
    transport: http(rpcUrl)
  }), [chain.id, rpcUrl]);

  const [clients, setClients] = useState<{
    publicClient: PublicClient;
    walletClient: WalletClient | null;
    account: LocalAccount | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupClients = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isConnected && para) {
          // Create Para account and wallet client for signing
          const viemAccount = createParaAccount(para);
          const walletClient = createParaViemClient(para, {
            account: viemAccount,
            chain,
            transport: http(rpcUrl)
          });

          if (isMounted) {
            setClients({
              publicClient,
              walletClient,
              account: viemAccount
            });
            setIsLoading(false);
          }
        } else {
          // Not connected - only provide public client
          if (isMounted) {
            setClients({
              publicClient,
              walletClient: null,
              account: null
            });
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to setup Para viem clients'));
          setIsLoading(false);
        }
      }
    };

    setupClients();

    return () => {
      isMounted = false;
    };
  }, [chain.id, rpcUrl, isConnected]);

  return { 
    clients, 
    isLoading, 
    error
  };
}