import { useAccount, useWallet } from "@getpara/react-sdk";
import { useParaViem } from "./useParaViem";
import { baseSepolia, base } from 'viem/chains';

// default to baseSepolia, but can be overridden with VITE_CHAIN=base
const chain = (import.meta.env.VITE_CHAIN === 'base') ? base : baseSepolia;
const rpcUrl = import.meta.env.VITE_RPC_URL;

/**
 * Custom hook that provides Para wallet and viem clients for signing operations
 * @returns Object containing wallet info and viem clients for typed data signing
 */
export function usePara() {
  const { isConnected } = useAccount();
  const { data: wallet } = useWallet();
  const { clients, isLoading, error } = useParaViem(chain, rpcUrl || 'https://sepolia.base.org');

  const address = wallet?.address as `0x${string}` | undefined;
  const walletId = wallet?.id;

  return {
    // Connection state
    isConnected,
    address,
    walletId,
    
    // Viem clients for blockchain operations
    publicClient: clients?.publicClient || null,
    walletClient: clients?.walletClient || null,
    account: clients?.account || null,
    
    // Loading states
    isLoading,
    error,
    
    // Legacy support - keeping the original structure for backwards compatibility
    wallet: { isConnected, address, walletId },
    viem: clients
  };
}
