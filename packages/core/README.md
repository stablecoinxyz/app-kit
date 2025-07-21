# @stablecoin.xyz/core

Core SDK for the SBC App Kit – Account Abstraction for gasless transactions, paymaster integration, and smart account management.

## Installation

```bash
npm install @stablecoin.xyz/core
# or
yarn add @stablecoin.xyz/core
# or
pnpm add @stablecoin.xyz/core
```

## Usage Example

```typescript
import { SbcAppKit } from '@stablecoin.xyz/core';
import { baseSepolia } from 'viem/chains';

const kit = new SbcAppKit({
  apiKey: 'your-api-key',
  chain: baseSepolia,
  wallet: 'auto',
});

// Connect wallet, get account info, send user operations, etc.
```

For full documentation and advanced usage, see the [main SBC App Kit README](https://github.com/stablecoinxyz/app-kit#readme).
