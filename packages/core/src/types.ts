import { Address, Hex, Chain, WalletClient } from 'viem';

// Wallet Integration Types
export type SupportedWalletType = 'auto' | 'metamask' | 'coinbase' | 'walletconnect' | 'custom';

export interface WalletOptions {
  /** WalletConnect project ID (required for WalletConnect) */
  projectId?: string;
  /** Automatically connect to wallet on initialization */
  autoConnect?: boolean;
  /** Preferred wallets in order of preference */
  preferredWallets?: SupportedWalletType[];
  /** Custom wallet connection options */
  customOptions?: Record<string, any>;
}

export interface DetectedWallet {
  /** Wallet type identifier */
  type: SupportedWalletType;
  /** Human-readable wallet name */
  name: string;
  /** Whether the wallet is available/installed */
  available: boolean;
  /** Wallet icon/logo URL */
  icon?: string;
  /** Provider object for connection */
  provider?: any;
}

export interface WalletConnectionResult {
  /** Connected wallet client ready for use */
  walletClient: WalletClient;
  /** Connected wallet information */
  wallet: DetectedWallet;
  /** Connected account address */
  address: Address;
}

export interface WalletManagerConfig {
  /** Target blockchain chain */
  chain: Chain;
  /** Wallet connection options */
  options?: WalletOptions;
  /** Custom RPC URL */
  rpcUrl?: string;
}

export interface AaProxyConfig {
  /** Blockchain network to operate on */
  chain: Chain;
  /** SBC API key for accessing services */
  apiKey: string;
  /** Whether to use staging environment */
  staging?: boolean;
}

export interface SbcAppKitConfig {
  /** Your SBC API key for accessing paymaster services */
  apiKey: string;
  
  /** Blockchain network to operate on */
  chain: Chain;
  
  /** 
   * Wallet integration - specify wallet type or 'auto' for automatic detection
   * @default 'auto' - Automatically detect and connect to available wallets
   */
  wallet?: SupportedWalletType;
  
  /** 
   * Optional: Wallet connection options and preferences
   */
  walletOptions?: WalletOptions;
  
  /** 
   * Optional: Pre-configured wallet client for advanced use cases
   * Use this when you need full control over wallet client creation
   * @deprecated Use 'wallet' option for standard wallet integration
   */
  walletClient?: WalletClient;
  
  /** 
   * Optional: Custom wallet private key 
   * @default Auto-generated random private key
   * @deprecated Use 'wallet' option for production wallet integration
   */
  privateKey?: Hex;
  
  /** 
   * Optional: Custom RPC URL for the blockchain 
   * @default Chain's default RPC URL
   */
  rpcUrl?: string;
  
  /** 
   * Internal: Use staging environment (for SBC development only)
   * @internal
   */
  staging?: boolean;
  
  /** 
   * Optional: Enable debug logging 
   * @default false
   */
  debug?: boolean;
  
  /** 
   * Optional: Production logging configuration 
   * @default Logging disabled
   */
  logging?: LoggingConfig;
}

export interface LoggingConfig {
  /** Enable production logging */
  enabled: boolean;
  
  /** Log level: 'error' | 'warn' | 'info' | 'debug' */
  level: 'error' | 'warn' | 'info' | 'debug';
  
  /** Logger function - implement your own or use provided adapters */
  logger: (level: string, message: string, metadata: Record<string, any>) => void | Promise<void>;
  
  /** 
   * Optional: Application context for log enrichment 
   * @default No additional context
   */
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
  
  /** 
   * Optional: Include sensitive data in logs 
   * @default false
   */
  includeSensitive?: boolean;
  
  /** 
   * Optional: Sampling rate for performance logs (0.0 to 1.0) 
   * @default 1.0 (log all operations)
   */
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
  
  /** Account balance in wei */
  balance: string;
}

export interface ChainConfig {
  /** Chain ID */
  id: number;
  
  /** Chain name */
  name: string;
  
  /** Stringidentifier for API endpoints */
  idString: string;
  
  /** Default RPC URL */
  rpcUrl: string;
  
  /** SBC AA Proxy URL */
  aaProxyUrl: string;
  
  /** Block explorer URL */
  blockExplorerUrl: string;
}
