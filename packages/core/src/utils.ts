import { createPublicClient, createWalletClient, http, decodeAbiParameters, Hex, PublicClient, WalletClient, Chain } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIGS, SBC_API_KEY_PREFIX } from './constants';
import { ChainConfig, AaProxyConfig } from './types';

/**
 * Get chain configuration for a supported chain
 */
export function getChainConfig(chain: Chain): ChainConfig {
  const config = CHAIN_CONFIGS.get(chain.id);
  if (!config) {
    const supportedChains = Array.from(CHAIN_CONFIGS.values()).map(c => c.name).join(', ');
    throw new Error(`Unsupported chain: ${chain.name}. Supported chains: ${supportedChains}`);
  }
  return config;
}

/**
 * Create a public client for blockchain interactions
 */
export function createSbcPublicClient(chain: Chain, rpcUrl?: string): PublicClient {
  const config = getChainConfig(chain);
  
  return createPublicClient({
    chain,
    transport: http(rpcUrl || config.rpcUrl)
  });
}

/**
 * Create a wallet client with the provided or generated private key
 */
export function createSbcWalletClient(
  chain: Chain, 
  privateKey?: `0x${string}`, 
  rpcUrl?: string
): WalletClient {
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
export function buildAaProxyUrl(config: AaProxyConfig): string {
  const chainConfig = getChainConfig(config.chain);
  
  // Use URL constructor for safer URL building
  const url = new URL(`/rpc/v1/${chainConfig.idString}/${config.apiKey}`, chainConfig.aaProxyUrl);
  
  if (config.staging) {
    url.searchParams.set('staging', 'true');
  }
  
  return url.toString();
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
  if (baseMessage.includes('AA21 didn\'t pay prefund')) {
    return `${baseMessage}\n\nSuggestion: Your smart account needs a small amount of ETH (even for gasless transactions) to cover verification costs. Please fund your smart account with at least 0.001 ETH.`;
  }

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
