# @stablecoin.xyz/react

React bindings for the SBC App Kit – Account Abstraction for gasless transactions, paymaster integration, and smart account management in React apps.

## Installation

```bash
npm install @stablecoin.xyz/react @stablecoin.xyz/core
# or
yarn add @stablecoin.xyz/react @stablecoin.xyz/core
```

## Usage Example

```tsx
import { SbcProvider, WalletButton } from '@stablecoin.xyz/react';
import { baseSepolia } from 'viem/chains';

const config = {
  apiKey: 'your-api-key',
  chain: baseSepolia,
  wallet: 'auto',
};

<SbcProvider config={config}>
  <WalletButton>Connect Wallet</WalletButton>
</SbcProvider>
```

For full documentation and advanced usage, see the [main SBC App Kit README](https://github.com/stablecoinxyz/app-kit#readme).
