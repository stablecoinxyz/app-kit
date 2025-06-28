# SBC App Kit

A TypeScript SDK for SBC Account Abstraction infrastructure - send gasless transactions on Base networks.

## 🚀 Quick Start

### Installation

```bash
npm install @sbc/core
```

### Basic Usage

```typescript
import { SbcAppKit } from '@sbc/core';
import { baseSepolia } from 'viem/chains';

const sbcKit = new SbcAppKit({
  apiKey: 'sbc-your-api-key', // Get from SBC dashboard
  chain: baseSepolia,
  privateKey: '0x...', // Optional: auto-generated if not provided
});

// Send gasless transaction
const result = await sbcKit.sendUserOperation({
  to: '0x...',
  data: '0x...',
  value: '0'
});

console.log('Transaction hash:', result.transactionHash);
```

## 📁 Package Structure

- **[@sbc/core](./packages/core)** - Backend SDK (✅ Ready)
- **[@sbc/react](./packages/react)** - React hooks & components (✅ Ready)

## 🔧 Development

```bash
# Install dependencies
npm install

# Build packages
npm run build
npm run build:core

# Run tests
npm test

# Run example
export SBC_API_KEY="sbc-your-key"
npm run examples:backend
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

### Methods

- `sendUserOperation(params)` - Send gasless transaction
- `estimateUserOperation(params)` - Estimate gas costs
- `getAccount()` - Get smart account info
- `getOwnerAddress()` - Get EOA address
- `getChain()` - Get current chain

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
