# SBC AppKit + Dynamic Integration Example

This example demonstrates how to integrate Dynamic SDK with SBC AppKit for gasless transactions on Base and Base Sepolia networks.

## Architecture

**Simple Dynamic Integration** - Uses the `useSbcDynamic` hook to automatically handle Dynamic wallet client integration with SBC AppKit. All wallet client complexity is abstracted away.

**Authentication Options** - Supports both wallet connection and email authentication through Dynamic's unified auth flow.

## Prerequisites

### Dynamic SDK Setup

1. Create a Dynamic account at [Dynamic Dashboard](https://app.dynamic.xyz/)
2. Get your environment ID from the dashboard
3. Ensure Base and Base Sepolia are enabled
4. Enable email authentication in your Dynamic dashboard settings

### SBC API Key

Get your SBC API key from the [SBC Dashboard](https://app.stablecoin.xyz/)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set environment variables (create `.env` file):

```bash
# Required
VITE_SBC_API_KEY=sbc-your-api-key-here
VITE_DYNAMIC_ENVIRONMENT_ID=your-dynamic-environment-id

# Optional - defaults to Base Sepolia
VITE_CHAIN=base  # set to 'base' for mainnet, omit or set to anything else for baseSepolia
VITE_RPC_URL=https://your-custom-rpc-url.com  # optional custom RPC
```

Copy from `.env.example` and fill in your values.

3. Run the example:

```bash
# For development with local packages
pnpm dev:local

# Or from root directory
pnpm dev:dynamic
```

## Chain Support

This example supports both Base networks:

- **Base Sepolia** (default): Testnet with SBC token at `0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16`
- **Base** (mainnet): Set `VITE_CHAIN=base` for mainnet with SBC token at `0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798`

### Token Details

| Chain | Token Address | Decimals | Explorer |
|-------|---------------|----------|----------|
| Base Sepolia | `0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16` | 6 | [Sepolia Basescan](https://sepolia.basescan.org) |
| Base | `0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798` | 18 | [Basescan](https://basescan.org) |

## How It Works

### Simplified Dynamic Integration with useSbcDynamic Hook

```typescript
import { DynamicContextProvider, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { ZeroDevSmartWalletConnectors } from '@dynamic-labs/ethereum-aa';
import { useSbcDynamic } from '@stablecoin.xyz/react';

// 1. Dynamic SDK initialization with email auth enabled
<DynamicContextProvider
  settings={{
    environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
    walletConnectors: [EthereumWalletConnectors, ZeroDevSmartWalletConnectors],
  }}
>
  <App />
</DynamicContextProvider>

// 2. Use the simplified useSbcDynamic hook (handles all wallet client complexity internally)
function App() {
  const { primaryWallet } = useDynamicContext();
  
  const {
    sbcAppKit,
    isInitialized,
    error,
    account,
    isLoadingAccount,
    accountError,
    ownerAddress,
    refreshAccount,
    disconnectWallet
  } = useSbcDynamic({
    apiKey: import.meta.env.VITE_SBC_API_KEY,
    chain,
    primaryWallet,
    rpcUrl,
    debug: true
  });

  if (!primaryWallet) {
    return <div>Please connect your wallet</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isInitialized) {
    return <div>Initializing SBC...</div>;
  }

  return (
    <div>
      <p>Owner: {ownerAddress}</p>
      <p>Smart Account: {account?.address}</p>
      {/* Your app components */}
    </div>
  );
}
```

## Authentication Options

This example supports two authentication methods through Dynamic:

### 1. Wallet Connection

- Connect existing wallets (MetaMask, Coinbase Wallet, etc.)
- Traditional Web3 wallet authentication
- Full wallet control and signing capabilities

### 2. Email Authentication  

- Sign in/sign up with email address
- Dynamic creates and manages wallet automatically
- Seamless onboarding for non-Web3 users
- Same smart account functionality as wallet connection

Both methods provide identical SBC AppKit integration and smart account capabilities.

## Integration Flow

1. **Dynamic SDK Initialization**: DynamicContextProvider wraps the app with wallet connectors and email auth
2. **Authentication**: User connects wallet OR signs in with email through Dynamic's unified interface
3. **Simplified Hook Usage**: `useSbcDynamic` hook handles all wallet client complexity internally
4. **Automatic SBC Integration**: Hook automatically configures SBC AppKit with Dynamic's wallet
5. **Smart Account Creation**: SBC creates Kernel smart account with Dynamic wallet as owner
6. **Transaction Signing**: Dynamic wallet signs user operations for smart account
7. **Gasless Transactions**: SBC paymaster covers gas costs

## Key Technical Details

### Simplified Integration

The `useSbcDynamic` hook abstracts all wallet client complexity:

```typescript
// ✅ Simple - just pass Dynamic's primaryWallet
const { account, sbcAppKit, error } = useSbcDynamic({
  apiKey: 'your-api-key',
  chain: baseSepolia,
  primaryWallet,  // From useDynamicContext()
  debug: true
});

// ✅ All wallet compatibility handled internally
// ✅ No manual wallet client creation needed
// ✅ Direct access to SBC functionality
```

### Automatic Wallet Client Creation

The hook automatically handles Dynamic wallet client integration:

- **Retrieves Dynamic wallet client** from `primaryWallet.connector.getWalletClient()`
- **Creates compatible account structure** with proper signing methods
- **Initializes SBC AppKit** with Dynamic wallet as owner
- **Provides standard SBC interface** through returned values

### Chain Configuration

Dynamic chain selection based on environment variables:

```typescript
const chain = (import.meta.env.VITE_CHAIN === 'base') ? base : baseSepolia;
const rpcUrl = import.meta.env.VITE_RPC_URL;

const SBC_TOKEN_ADDRESS = (chain: Chain) => {
  if (chain.id === baseSepolia.id) {
    return '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16';
  } else if (chain.id === base.id) {
    return '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798';
  }
  throw new Error('Unsupported chain');
};
```

## Troubleshooting

### Environment ID Missing

Ensure `VITE_DYNAMIC_ENVIRONMENT_ID` is set in your environment variables.

### Wallet Connection Issues

Check that your Dynamic environment is properly configured in the Dynamic dashboard.

### Chain Configuration

Verify your `VITE_CHAIN` environment variable:

- Omit or set to anything other than `'base'` for Base Sepolia
- Set to `'base'` for Base mainnet

### SBC API Key

Ensure your SBC API key is valid and has access to the selected chain.

## Dependencies

```json
{
  "@stablecoin.xyz/core": "workspace:*",
  "@stablecoin.xyz/react": "workspace:*",
  "@dynamic-labs/ethereum": "^4.25.7",
  "@dynamic-labs/ethereum-aa": "^4.25.7",
  "@dynamic-labs/sdk-react-core": "^4.25.7",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "viem": "^2.33.0"
}
```

### Dev dependencies

```json
{
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "@vitejs/plugin-react": "^4.0.0",
  "autoprefixer": "^10.4.0",
  "eslint": "^8.0.0",
  "eslint-plugin-react-hooks": "^4.6.0",
  "eslint-plugin-react-refresh": "^0.4.0",
  "postcss": "^8.4.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.0.0",
  "vite": "^4.0.0"
}
```
