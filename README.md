# SBC App Kit

Account Abstraction SDK for developers who want gasless transactions but don't want to set up paymasters.

## Quick Start

```bash
git clone https://github.com/stablecoinxyz/app-kit.git
cd app-kit/examples/react-basic
npm install && npm run dev
```

## Installation

```bash
npm install @stablecoin.xyz/react @stablecoin.xyz/core
```

## Basic Usage

```typescript
import { SbcProvider, WalletButton } from '@stablecoin.xyz/react';

const config = {
  apiKey: 'your-api-key',
  chain: baseSepolia,
  wallet: 'auto'
};

<SbcProvider config={config}>
  <WalletButton>Connect Wallet</WalletButton>
</SbcProvider>
```

## Examples

1. **[React Basic](./examples/react-basic)** - Simple demo (learning only)
2. **[Next.js Backend](./examples/nextjs-backend)** - Secure production pattern
3. **[React Wallet](./examples/react-wallet)** - User wallet integration

## Security

- **Backend**: Private keys on server (most secure)
- **Wallet**: User-controlled keys (standard Web3)
- **Demo**: Not for production use

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Contact

Reach out to us via [Telegram](https://t.me/stablecoin_xyz)
