# SBC AppKit + Para Integration Example

This example demonstrates how to integrate Para's Universal Embedded Wallet with SBC AppKit for gasless transactions on Base and Base Sepolia networks.

## Architecture

**Simple Para Integration** - Uses the `useSbcPara` hook to automatically handle Para wallet client integration with SBC AppKit. All wallet client complexity is abstracted away.

**Universal Embedded Wallet** - Para provides universal wallet portability across applications with their embedded wallet technology, allowing users to seamlessly access the same wallet across different dApps.

## Prerequisites

### Para SDK Setup

1. Create a Para account and get your API key from [Para Dashboard](https://docs.getpara.com/)
2. Configure your Para project for Ethereum/Base networks
3. Enable email authentication and social login options
4. Note: This example shows the integration pattern with the actual Para SDK structure

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
VITE_PARA_API_KEY=your-para-api-key
VITE_PARA_ENV=development

# Optional
VITE_CHAIN=base  # set to 'base' for mainnet, omit or set to anything else for baseSepolia
VITE_RPC_URL=https://your-custom-rpc-url.com  # optional custom RPC
```

Note: The Para environment is set to `Environment.BETA` (or `Environment.DEVELOPMENT`) in the `providers.tsx` file. Change to `Environment.PROD` for production.

Copy from `.env.example` and fill in your values.

3. Run the example:

```bash
# For development with local packages
pnpm dev:local

# Or from root directory
pnpm dev:para
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

### Simplified Para Integration with useSbcPara Hook

```typescript
import { ParaProvider } from '@getpara/react-sdk';
import '@getpara/react-sdk/styles.css';
import { useSbcPara } from '@stablecoin.xyz/react';
import { baseSepolia } from 'viem/chains';

// 1. Para SDK integration with universal embedded wallet
function App() {
  return (
    <ParaProvider
      paraClientConfig={{
        env: import.meta.env.VITE_PARA_ENV,
        apiKey: import.meta.env.VITE_PARA_API_KEY,
      }}
      config={{
        appName: "Your App",
      }}
      paraModalConfig={{
        logo: "/your-logo.png",
      }}
    >
      <ParaAppComponent />
    </ParaProvider>
  );
}

function ParaAppComponent() {
  const {
    sbcAppKit,
    isInitialized,
    error,
    account,
    isConnected,
    connectPara,
    paraUser,
    refreshAccount
  } = useSbcPara({
    apiKey: import.meta.env.VITE_SBC_API_KEY,
    chain: baseSepolia,
    debug: true
  });

  if (!isConnected) {
    return (
      <button onClick={connectPara}>
        Connect with Para
      </button>
    );
  }

  if (!isInitialized) {
    return <div>Initializing SBC...</div>;
  }

  return (
    <div>
      <p>User: {paraUser?.email}</p>
      <p>Wallet: {paraUser?.address}</p>
      <p>Smart Account: {account?.address}</p>
      {/* Your app components */}
    </div>
  );
}
```

## Authentication Options

This example supports Para's universal embedded wallet authentication:

### Universal Embedded Wallet Authentication

- **Email & Social Auth** - Users can authenticate with email or social providers
- **Universal Portability** - Same wallet works across all Para-integrated applications
- **No Installation Required** - No browser extensions or mobile apps needed
- **Seamless Experience** - Wallet persists across apps and sessions
- **Multi-Party Computation** - Advanced security with MPC key management

Para's approach differs from traditional embedded wallets by providing true universal portability. Users can access their same wallet across any application that integrates Para, with granular permissions for each app.

## Integration Flow

1. **Para SDK Initialization**: Para SDK initializes with your project configuration
2. **User Authentication**: User authenticates via email/social through Para's unified interface
3. **Universal Wallet Access**: Para provides access to user's universal embedded wallet
4. **Simplified Hook Usage**: `useSbcPara` hook handles all wallet client complexity internally
5. **Automatic SBC Integration**: Hook automatically configures SBC AppKit with Para's wallet
6. **Smart Account Creation**: SBC creates Kernel smart account with Para wallet as owner
7. **Transaction Signing**: Para wallet signs user operations for smart account
8. **Gasless Transactions**: SBC paymaster covers gas costs

## Key Technical Details

### Simplified Integration

The `useSbcPara` hook abstracts all wallet client complexity:

```typescript
// ✅ Simple - just pass Para project ID
const { account, sbcAppKit, error, authenticate, isAuthenticated } = useSbcPara({
  apiKey: 'your-api-key',
  chain: baseSepolia,
  projectId: 'your-para-project-id',
  debug: true
});

// ✅ All wallet compatibility handled internally
// ✅ No manual wallet client creation needed
// ✅ Direct access to SBC functionality
```

### Automatic Wallet Client Creation

The hook automatically handles Para wallet client integration:

- **Retrieves Para wallet client** from Para's embedded wallet service
- **Creates compatible account structure** with proper signing methods for embedded wallets
- **Initializes SBC AppKit** with Para wallet as owner
- **Provides standard SBC interface** through returned values

### Universal Wallet Portability

Para's key differentiator is universal wallet portability:

```typescript
// User's wallet address remains the same across all Para-integrated apps
const paraUser = {
  id: 'para_user_12345',
  address: '0x1234...5678',  // Same address in all apps
  email: 'user@example.com'
};

// Different apps can request different permissions
const permissions = {
  'app1': ['read', 'sign_messages'],
  'app2': ['read', 'sign_transactions', 'manage_assets'],
  'app3': ['read']  // Minimal permissions
};
```

### Chain Configuration

Para chain selection based on environment variables:

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

## Para Universal Embedded Wallet Features

### Cross-App Portability

Para's universal embedded wallets provide unique advantages:

- **Single Wallet Across Apps** - Users have one wallet that works everywhere
- **Granular Permissions** - Each app gets only the permissions it needs
- **Seamless Authentication** - Login once, use everywhere
- **Enhanced Security** - MPC-based key management with encrypted key sharing

### Developer Benefits

- **Easy User Onboarding** - Users with existing Para wallets connect instantly
- **Rich Transaction History** - Access to cross-app transaction data
- **Multi-App Experiences** - Build ecosystems that span applications
- **Simplified Integration** - Single SDK for universal wallet access

## Production Implementation Notes

This example uses a simulated Para SDK for demonstration purposes. In a production implementation:

1. **Install Official Para SDK**:
```bash
npm install @para/sdk  # (Actual package name would be provided by Para)
```

2. **Replace Simulated Components**:
```typescript
import { ParaSDK } from '@para/sdk';

// Real Para integration
const para = new ParaSDK({
  projectId: 'your-project-id',
  environment: 'production'
});
```

3. **Configure Para Dashboard**:
- Set up application permissions
- Configure authentication methods
- Enable required blockchain networks
- Set up webhooks for cross-app functionality

## Troubleshooting

### Authentication Issues

Check that your Para project is properly configured in the Para dashboard with the correct authentication methods enabled.

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
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "viem": "^2.33.0",
  "tailwindcss": "^3.4.17",
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0"
}
```

## Para vs Other Wallet Solutions

### Para Universal Embedded Wallets vs Traditional Approaches

| Feature | Traditional Embedded Wallets | External Wallets | Para Universal Embedded Wallets |
|---------|------------------------------|------------------|--------------------------------|
| Cross-app portability | ❌ | ✅ | ✅ |
| Smooth in-app UX | ✅ | ❌ | ✅ |
| No browser extensions | ✅ | ❌ | ✅ |
| Granular app permissions | ❌ | ❌ | ✅ |
| Universal user identity | ❌ | ❌ | ✅ |
| MPC security | ❌ | ❌ | ✅ |

Para combines the best of embedded wallets (smooth UX) with the portability of external wallets, while adding unique features like granular permissions and universal identity. 