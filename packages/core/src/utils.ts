import { createPublicClient, createWalletClient, http, decodeAbiParameters, Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { CHAIN_CONFIGS, SBC_API_KEY_PREFIX } from './constants';
import { ChainConfig, RetryParams } from './types';
import { Chain } from 'viem';

// Static mapping from chain ID to viem export variable name
// This ensures we use the exact same identifier as in viem/chains exports
const CHAIN_ID_TO_IDENTIFIER = {
  [base.id]: 'base',           // 8453
  [baseSepolia.id]: 'baseSepolia', // 84532
  // Add more chains as needed...
} as const;

/**
 * Get chain configuration for a supported chain
 */
export function getChainConfig(chain: Chain): ChainConfig {
  const config = CHAIN_CONFIGS.get(chain.id);
  if (!config) {
    throw new Error(`Unsupported chain: ${chain.name}`);
  }
  return config;
}

/**
 * Create a public client for blockchain interactions
 */
export function createSbcPublicClient(chain: Chain, rpcUrl?: string) {
  const config = getChainConfig(chain);
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl || config.rpcUrl)
  }) as any; // Type assertion to avoid viem internal type conflicts
}

/**
 * Create a wallet client with the provided or generated private key
 */
export function createSbcWalletClient(
  chain: Chain, 
  privateKey?: `0x${string}`, 
  rpcUrl?: string
): any {
  const config = getChainConfig(chain);
  
  // Generate a random private key if none provided
  const key = privateKey || generatePrivateKey();
  const account = privateKeyToAccount(key);
  
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl || config.rpcUrl)
  });
}

/**
 * Validate that the API key has the correct SBC prefix
 */
export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith(SBC_API_KEY_PREFIX) && apiKey.length > SBC_API_KEY_PREFIX.length;
}

/**
 * Build the AA proxy URL for API calls
 */
export function buildAaProxyUrl(
  chain: Chain, 
  apiKey: string, 
  staging?: boolean,
  customUrl?: string
): string {
  const config = getChainConfig(chain);
  const baseUrl = customUrl || config.aaProxyUrl;
  const stagingParam = staging ? '?staging=true' : '';
  
  // Use static mapping for reliable chain identifier matching viem export names
  const chainIdentifier = CHAIN_ID_TO_IDENTIFIER[chain.id as keyof typeof CHAIN_ID_TO_IDENTIFIER];
  
  if (!chainIdentifier) {
    throw new Error(`Chain identifier not found for chain ${chain.name} (ID: ${chain.id}). Please add it to CHAIN_ID_TO_IDENTIFIER mapping.`);
  }
  
  return `${baseUrl}/rpc/v1/${chainIdentifier}/${apiKey}${stagingParam}`;
}

/**
 * Decode standard Ethereum revert errors
 */
export function decodeRevertReason(errorData: string): string | null {
  try {
    if (!errorData.startsWith('0x')) {
      return null;
    }

    // Check for standard Error(string) signature: 0x08c379a0
    if (errorData.startsWith('0x08c379a0')) {
      const decoded = decodeAbiParameters(
        [{ type: 'string' }], 
        ('0x' + errorData.slice(10)) as Hex
      );
      return decoded[0];
    }

    // Check for Panic(uint256) signature: 0x4e487b71
    if (errorData.startsWith('0x4e487b71')) {
      const decoded = decodeAbiParameters(
        [{ type: 'uint256' }], 
        ('0x' + errorData.slice(10)) as Hex
      );
      const panicCode = decoded[0];
      return getPanicReason(Number(panicCode));
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get human-readable panic error reasons
 */
function getPanicReason(code: number): string {
  const panicReasons: Record<number, string> = {
    0x00: 'Generic compiler inserted panic',
    0x01: 'Assertion failed',
    0x11: 'Arithmetic overflow/underflow',
    0x12: 'Division or modulo by zero',
    0x21: 'Invalid enum value',
    0x22: 'Invalid storage byte array access',
    0x31: 'Pop on empty array',
    0x32: 'Array index out of bounds',
    0x41: 'Out of memory',
    0x51: 'Invalid function selector'
  };
  
  return panicReasons[code] || `Unknown panic code: 0x${code.toString(16)}`;
}

/**
 * Enhanced error message parsing for UserOperation errors
 */
export function parseUserOperationError(error: unknown): string {
  const baseMessage = formatError(error);
  
  // Look for revert reason in the error message
  const revertReasonMatch = baseMessage.match(/reason:\s*(0x[a-fA-F0-9]+)/);
  if (revertReasonMatch) {
    const decoded = decodeRevertReason(revertReasonMatch[1]);
    if (decoded) {
      return `${baseMessage}\n\nDecoded reason: ${decoded}`;
    }
  }

  // Look for other common error patterns
  if (baseMessage.includes('insufficient funds')) {
    return `${baseMessage}\n\nSuggestion: Ensure your account has enough ETH/tokens for this transaction`;
  }

  if (baseMessage.includes('nonce too low')) {
    return `${baseMessage}\n\nSuggestion: Try refreshing and sending the transaction again`;
  }

  if (baseMessage.includes('gas')) {
    return `${baseMessage}\n\nSuggestion: Try increasing gas limits or check network congestion`;
  }

  return baseMessage;
}

/**
 * Format error messages consistently
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function up to a maximum number of times with exponential backoff
 * @param fn - The function to retry
 * @param params - The parameters for the retry
 * @returns The result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  params: RetryParams = {}
): Promise<T> {
  const { retries = 3, delay = 1000 } = params;
  let lastError: Error | undefined;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await sleep(delay * Math.pow(2, i)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}
