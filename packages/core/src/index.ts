// Main SDK exports
export { SbcAppKit } from './app-kit';
export { WalletManager } from './wallet-manager';

// Type exports for users
export type {
  SbcAppKitConfig,
  LoggingConfig,
  UserOperationParams,
  SendUserOperationParams,
  CallParams,
  UserOperationResult,
  UserOperationEstimate,
  AccountInfo,
  ChainConfig,
  // Wallet Integration Types
  SupportedWalletType,
  WalletOptions,
  DetectedWallet,
  WalletConnectionResult,
  WalletManagerConfig
} from './types';

// Public constants and utilities
export {
  CHAIN_CONFIGS
} from './constants';

export {
  getChainConfig
} from './utils';

// Optional logging adapters - import only what you need
export * from './logging-adapters';
