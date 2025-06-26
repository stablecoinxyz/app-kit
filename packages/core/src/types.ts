import { Address, Hex, Chain } from 'viem';

export interface SbcAppKitConfig {
  /** Your SBC API key for accessing paymaster services */
  apiKey: string;
  
  /** Blockchain network to operate on */
  chain: Chain;
  
  /** Optional: Custom wallet private key. If not provided, a random wallet will be generated */
  privateKey?: Hex;
  
  /** Optional: Custom RPC URL for the blockchain */
  rpcUrl?: string;
  
  /** Optional: Custom paymaster URL */
  paymasterUrl?: string;
  
  /** Optional: Use staging environment */
  staging?: boolean;
  
  /** Optional: Enable debug logging */
  debug?: boolean;
  
  /** Optional: Production logging configuration */
  logging?: LoggingConfig;
}

export interface LoggingConfig {
  /** Enable production logging */
  enabled: boolean;
  
  /** Log level: 'error' | 'warn' | 'info' | 'debug' */
  level: 'error' | 'warn' | 'info' | 'debug';
  
  /** Logger function - implement your own or use provided adapters */
  logger: (level: string, message: string, metadata: Record<string, any>) => void | Promise<void>;
  
  /** Application context for log enrichment */
  context?: {
    /** Your application name */
    appName?: string;
    /** Environment (production, staging, development) */
    environment?: string;
    /** Application version */
    version?: string;
    /** User ID for tracking user-specific operations */
    userId?: string;
    /** Session ID for tracking related operations */
    sessionId?: string;
    /** Additional custom fields */
    [key: string]: any;
  };
  
  /** Include sensitive data in logs (default: false for production) */
  includeSensitive?: boolean;
  
  /** Sampling rate for performance logs (0.0 to 1.0, default: 1.0) */
  samplingRate?: number;
}

export interface UserOperationParams {
  /** Target contract address */
  to: Address;
  
  /** Encoded function call data */
  data: Hex;
  
  /** Value to send in wei (default: '0') */
  value?: string;
}

export interface CallParams {
  /** Target contract address */
  to: Address;
  
  /** Encoded function call data */
  data: Hex;
  
  /** Value to send in wei (default: 0n) */
  value?: bigint;
}

export type SendUserOperationParams = UserOperationParams | { calls: CallParams[] };

export interface UserOperationResult {
  /** Hash of the user operation */
  userOperationHash: string;
  
  /** Hash of the executed transaction */
  transactionHash: string;
  
  /** Block number where transaction was included */
  blockNumber: string;
  
  /** Gas used for the transaction */
  gasUsed: string;
}

export interface UserOperationEstimate {
  /** Gas for verification overhead */
  preVerificationGas: string;
  
  /** Gas limit for account verification */
  verificationGasLimit: string;
  
  /** Gas limit for the main call */
  callGasLimit: string;
  
  /** Maximum fee per gas unit */
  maxFeePerGas: string;
  
  /** Maximum priority fee per gas unit */
  maxPriorityFeePerGas: string;
  
  /** Total expected gas used */
  totalGasUsed: string;
  
  /** Total gas cost in wei (including paymaster costs and buffer) */
  totalGasCost: string;
  
  /** Paymaster verification gas limit */
  paymasterVerificationGasLimit?: string;
  
  /** Paymaster post-operation gas limit */
  paymasterPostOpGasLimit?: string;
}

export interface AccountInfo {
  /** Smart contract account address */
  address: Address;
  
  /** Whether the account contract is deployed */
  isDeployed: boolean;
  
  /** Current nonce of the account */
  nonce: number;
}

export interface ChainConfig {
  /** Chain ID */
  id: number;
  
  /** Chain name */
  name: string;
  
  /** Default RPC URL */
  rpcUrl: string;
  
  /** SBC AA Proxy URL */
  aaProxyUrl: string;
}
