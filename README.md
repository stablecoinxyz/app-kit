# SBC App Kit - Monorepo

A comprehensive SDK for SBC Account Abstraction infrastructure, organized as a monorepo with multiple packages for different use cases.

## 📦 Packages

### [@sbc/core](./packages/core)

Core TypeScript SDK for backend and server-side usage.

- ✅ **Backend focused**: Private key management, environment variables
- ✅ **Account Abstraction**: Gasless transactions via ERC-4337
- ✅ **Type-safe**: Full TypeScript support with comprehensive types

### [@sbc/react](./packages/react)

React hooks and components for frontend applications.

- 🚧 **Coming soon**: React hooks for wallet connection and user operations
- 🚧 **Components**: Pre-built UI components for wallet interaction
- 🚧 **State management**: React Context for SBC integration

### [@sbc/vanilla](./packages/vanilla)

Browser-compatible JavaScript SDK for vanilla frontend applications.

- 🚧 **Coming soon**: Browser wallet integration (MetaMask, WalletConnect)
- 🚧 **Framework agnostic**: Works with any frontend framework
- 🚧 **Lightweight**: Minimal dependencies for browser usage

## 🚀 Quick Start

### Backend Usage

```bash
npm install @sbc/core
```

```typescript
import { SbcAppKit } from '@sbc/core';
import { baseSepolia } from 'viem/chains';

const sbcKit = new SbcAppKit({
  apiKey: process.env.SBC_API_KEY!,
  chain: baseSepolia,
  privateKey: process.env.PRIVATE_KEY, // Optional
});

// Send gasless transaction
const result = await sbcKit.sendUserOperation({
  to: '0x...',
  data: '0x...',
  value: '0'
});
```

### React Usage (Coming Soon)

```bash
npm install @sbc/react
```

```tsx
import { SbcProvider, useSbcKit } from '@sbc/react';

function App() {
  return (
    <SbcProvider config={{ apiKey: 'sbc-...', chain: baseSepolia }}>
      <MyComponent />
    </SbcProvider>
  );
}
```

## 🏗️ Development

### Workspace Commands

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Build specific package
npm run build:core
npm run build:react
npm run build:vanilla

# Run tests for all packages
npm run test

# Lint all packages
npm run lint
```

### Examples

- **Backend**: [examples/backend](./examples/backend) - Server-side usage with environment variables
- **React**: [examples/react-app](./examples/react-app) - React application example *(coming soon)*
- **Vanilla**: [examples/vanilla-html](./examples/vanilla-html) - Plain JavaScript example *(coming soon)*

## 📁 Project Structure

```
app-kit/
├── packages/
│   ├── core/          # @sbc/core - Backend SDK
│   ├── react/         # @sbc/react - React hooks (coming soon)
│   └── vanilla/       # @sbc/vanilla - Browser SDK (coming soon)
├── examples/
│   ├── backend/       # Backend examples
│   ├── react-app/     # React examples (coming soon)
│   └── vanilla-html/  # Vanilla JS examples (coming soon)
└── package.json       # Workspace configuration
```

## 🔗 Links

- [Core Package Documentation](./packages/core/README.md)
- [GitHub Repository](https://github.com/stablecoinxyz/app-kit)
- [Issues](https://github.com/stablecoinxyz/app-kit/issues)

## 📄 License

MIT
