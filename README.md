# SBC App Kit

A TypeScript SDK for SBC Account Abstraction infrastructure - send gasless transactions on Base and Base Sepolia.

## 🚀 Quick Start

### Installation

```bash
npm install @stablecoin.xyz/core
```

### Basic Usage

```typescript
import { SbcAppKit } from '@stablecoin.xyz/core';
import { baseSepolia } from 'viem/chains';

const sbcAppKit = new SbcAppKit({
  apiKey: 'sbc-your-api-key', // Get from SBC dashboard
  chain: baseSepolia,
  privateKey: '0x...', // Optional: auto-generated if not provided
});

// Send gasless transaction
const result = await sbcAppKit.sendUserOperation({
  to: '0x...',
  data: '0x...',
  value: '0'
});

console.log('Transaction hash:', result.transactionHash);
```

## 📁 Package Structure

- **[@stablecoin.xyz/core](./packages/core)** - Backend SDK (✅ Ready)
- **[@stablecoin.xyz/react](./packages/react)** - React hooks & components (✅ Ready)

## 🔧 Development

```bash
# Install dependencies
npm install

# Build packages
npm run build
npm run build:core

# Run tests
npm test

# Run backend example
cd examples/backend
echo "SBC_API_KEY=sbc-your-key" > .env
npm run start
```

## 📖 API Reference

### SbcAppKit

```typescript
interface SbcAppKitConfig {
  apiKey: string;                    // SBC API key
  chain: Chain;                      // viem Chain object
  privateKey?: string;               // Optional: Custom private key (default: auto-generated)
  rpcUrl?: string;                   // Optional: Custom RPC URL (default: chain's default RPC)
  debug?: boolean;                   // Optional: Enable debug logging (default: false)
  logging?: LoggingConfig;           // Optional: Production logging configuration (default: disabled)
}
```

## 📚 API Reference

### Core SDK (@stablecoin.xyz/core)

#### SbcAppKit Class

```typescript
class SbcAppKit {
  constructor(config: SbcAppKitConfig)
  
  // Transaction Methods
  sendUserOperation(params: SendUserOperationParams): Promise<UserOperationResult>
  estimateUserOperation(params: UserOperationParams): Promise<UserOperationEstimate>
  
  // Account Methods
  getAccount(): Promise<AccountInfo>
  getOwnerAddress(): string
  
  // Chain & Configuration
  getChain(): Chain
  getChainConfig(): ChainConfig
}
```

#### Key Types

```typescript
interface SendUserOperationParams {
  to: string;                          // Target contract address
  data?: string;                       // Encoded transaction data (default: '0x')
  value?: string;                      // ETH value to send (default: '0')
}

interface UserOperationResult {
  transactionHash: string;             // Final transaction hash
  userOperationHash: string;           // User operation hash
  receipt: TransactionReceipt;         // Transaction receipt
}

interface AccountInfo {
  address: string;                     // Smart account address
  deploymentTransaction?: string;      // Deployment tx (if newly created)
}
```

### React SDK (@stablecoin.xyz/react)

#### Hooks

```typescript
// Main hook for SBC App Kit functionality
function useSbcApp(): {
  sbcAppKit: SbcAppKit | null;           // SDK instance
  isInitialized: boolean;             // Whether SDK is ready
  error: Error | null;                // Initialization error
  account: AccountInfo | null;        // Smart account info
  isLoadingAccount: boolean;          // Account loading state
  accountError: Error | null;         // Account loading error
  refreshAccount: () => Promise<void>; // Refresh account data
}

// Hook for sending transactions
function useUserOperation(options?): {
  sendUserOperation: (params: SendUserOperationParams) => Promise<void>;
  isLoading: boolean;                 // Transaction in progress
  isSuccess: boolean;                 // Transaction succeeded
  isError: boolean;                   // Transaction failed
  error: Error | null;                // Transaction error
  data: UserOperationResult | null;   // Transaction result
  reset: () => void;                  // Reset hook state
}
```

#### Components

```typescript
// Provider component for React app
<SbcProvider config={SbcAppKitConfig}>
  {children}
</SbcProvider>

// Optional wallet connection UI
<WalletConnect />
```

### Supported Chains

- Base Mainnet (`base`)
- Base Sepolia (`baseSepolia`)

## 📝 Examples

- [Backend Usage](./examples/backend) - Complete Node.js examples
- [Error Handling](./examples/backend/error-handling-demo.ts) - Error decoding examples

## 🔗 Links

- [Core Package Docs](./packages/core)
- [GitHub Issues](https://github.com/stablecoinxyz/app-kit/issues)

## 📄 License

MIT
