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
  
  /** Optional: Custom bundler URL */
  bundlerUrl?: string;
  
  /** Optional: Custom paymaster URL */
  paymasterUrl?: string;
  
  /** Optional: Use staging environment */
  staging?: boolean;
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
  blockNumber: number;
  
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
  
  /** Default bundler URL */
  bundlerUrl: string;
  
  /** SBC AA Proxy URL */
  aaProxyUrl: string;
}

export interface RetryParams {
  /** Number of retry attempts (default: 3) */
  retries?: number;
  
  /** Initial delay between retries in milliseconds (default: 1000) */
  delay?: number;
}
