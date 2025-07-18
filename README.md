# SBC App Kit

> Account Abstraction SDK for developers who otherwise couldn't care to set up their own paymasters.

## 🚀 Quick Start for Users

Each example is **self-contained** and uses published npm packages. Clone any example and run:

```bash
git clone https://github.com/stablecoinxyz/app-kit.git
cd app-kit/examples/react-basic
npm install
npm run dev
```

## 🔧 Development Setup

### For Contributors (Full Monorepo)

```bash
# Install workspace dependencies
pnpm install
pnpm run build

# Set up all examples with published versions
pnpm run setup:all

# Development with local packages (auto-links to workspace)
pnpm run dev:react     # React basic with local packages
pnpm run dev:nextjs    # Next.js with local packages  
pnpm run dev:wallet    # React wallet with local packages
pnpm run dev:backend   # Backend with local packages
```

### For Package Development

When developing packages, examples automatically use your local changes:

```bash
# Make changes to packages/core or packages/react
pnpm run build  # Build your changes

# Examples will automatically use local versions
pnpm run dev:react  # Uses your local packages
```

## 📋 Dual Workflow Approach

### 🎯 Published Versions (Default)

- **Examples use**: `@stablecoin.xyz/core@^1.0.1`
- **Best for**: Users, demos, production
- **Run**: `npm install && npm run dev`

### 🛠️ Local Development  

- **Examples use**: Linked workspace packages
- **Best for**: Contributors, package development  
- **Run**: `npm run dev:local` or root `pnpm run dev:react`

## 🚀 Native Wallet Integration

SBC App Kit now provides **native wallet integration** that eliminates the complexity of manual wallet connection:

### ✨ Features

- **🔍 Auto-Detection**: Automatically finds available wallets (MetaMask, Coinbase, WalletConnect)
- **🔗 One-Click Connection**: Simple API for wallet connection
- **⚡ Zero Configuration**: Works out of the box with sensible defaults
- **🎯 Multi-Wallet Support**: Support for all major wallets with unified API
- **🛡️ Type-Safe**: Full TypeScript support with proper types

### 🎯 Simple Configuration

```typescript
const sbcConfig = {
  apiKey: 'your-api-key', // Get your API Key at https://dashboard.stablecoin.xyz
  chain: baseSepolia,
  wallet: 'auto', // Automatically detects and connects to available wallets
  debug: true
};
```

### 📱 React Components

```typescript
import { WalletButton, WalletSelector } from '@stablecoin.xyz/react';

// Simple wallet button
<WalletButton walletType="auto">
  Connect Wallet
</WalletButton>

// Or wallet selector for multiple options
<WalletSelector 
  onConnect={(result) => console.log('Connected:', result)}
  onError={(error) => console.error('Failed:', error)}
/>
```

### 📊 Impact

- **📉 95% less code** required for wallet integration
- **⚡ 10x faster** setup time
- **🛡️ Zero wallet-specific** bugs to debug
- **🔄 Automatic updates** when new wallets are supported

## 🎯 Choose Your Pattern

### 1. [Basic React Example](./examples/react-basic)

- Simple React integration
- Great for learning the basics
- **Note**: Uses demo account, not safe for production

### 2. [Next.js Backend Example](./examples/nextjs-backend) ✨ RECOMMENDED

- Secure production pattern
- Private keys on backend
- API-based integration
- Perfect for real applications

### 3. [React Wallet Example](./examples/react-wallet)

- Native wallet integration with auto-detection
- User wallet connection (MetaMask, Coinbase, WalletConnect)
- No private keys in code
- Standard Web3 experience with SBC simplicity


## 🔒 Security Best Practices

Choose your integration pattern based on your security needs:

1. **Backend Integration** (Most Secure)
   - Private keys on server
   - API-based transactions
   - Perfect for businesses
   - Example: [Next.js Backend](./examples/nextjs-backend)

2. **Wallet Integration** (User-Controlled)
   - Users bring their wallet
   - No key management needed
   - Standard Web3 experience
   - Example: [React Wallet](./examples/react-wallet)

3. **Basic Demo** (Learning Only)
   - Simple integration
   - Uses demo account
   - Not for production
   - Example: [React Basic](./examples/react-basic)

## 🚀 Getting Started

1. Choose your pattern based on your needs
2. Follow the README in the respective example directory
3. Read the security considerations
4. Implement in your project

## 📚 Documentation

- [SBC App Kit Documentation](https://docs.stablecoin.xyz)
- [Security Guide](https://docs.stablecoin.xyz/security)
- [API Reference](https://docs.stablecoin.xyz/api)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.
