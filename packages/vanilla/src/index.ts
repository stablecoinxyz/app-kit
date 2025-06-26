// Browser-compatible JavaScript SDK for SBC Account Abstraction
export * from './SbcBrowserKit';
export * from './wallet-connectors';
export * from './utils';

// Re-export core functionality
export { SbcAppKit } from '@sbc/core';
export type {
  SbcAppKitConfig,
  UserOperationParams,
  UserOperationResult,
  UserOperationEstimate,
  AccountInfo,
  ChainConfig,
  RetryParams
} from '@sbc/core'; 