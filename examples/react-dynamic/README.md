# SBC AppKit + Dynamic Integration Example

This example demonstrates how to integrate Dynamic SDK with SBC AppKit for gasless transactions on Base and Base Sepolia networks.

## Architecture

**Dynamic Wallet Client Injection** - Dynamic SDK handles wallet connection and provides the wallet client to SBC AppKit.

## Prerequisites

### Dynamic SDK Setup

1. Create a Dynamic account at [Dynamic Dashboard](https://app.dynamic.xyz/)
2. Get your environment ID from the dashboard
3. Ensure Base and Base Sepolia are enabled

### SBC API Key

Get your SBC API key from the [SBC Dashboard](https://app.stablecoin.xyz/)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set environment variables:

```bash
# Required
VITE_SBC_API_KEY=your-sbc-api-key
VITE_DYNAMIC_ENVIRONMENT_ID=your-dynamic-env-id

# Optional - defaults to Base Sepolia
VITE_CHAIN=base  # or omit for baseSepolia
VITE_RPC_URL=your-custom-rpc-url  # optional custom RPC
```

3. Run the example:

```bash
pnpm dev:local
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

### Dynamic Wallet Client Injection

```typescript
import { DynamicContextProvider, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { SbcProvider } from '@stablecoin.xyz/react';

// 1. Dynamic SDK handles wallet connection
const { primaryWallet } = useDynamicContext();

// 2. Get wallet client from Dynamic and create compatible client
const dynamicWalletClient = await primaryWallet.connector.getWalletClient();
const compatibleWalletClient = {
  account: {
    address: primaryWallet.address as `0x${string}`,
    type: 'local' as const,
    signMessage: async ({ message }: { message: string }) => {
      return await dynamicWalletClient.signMessage({ 
        message, 
        account: primaryWallet.address as `0x${string}` 
      });
    },
    signTransaction: async (transaction: any) => {
      return await dynamicWalletClient.signTransaction({ 
        ...transaction, 
        account: primaryWallet.address as `0x${string}` 
      });
    },
    signTypedData: async (typedData: any) => {
      return await dynamicWalletClient.signTypedData({ 
        ...typedData, 
        account: primaryWallet.address as `0x${string}` 
      });
    },
  },
  chain: baseSepolia,
  signTypedData: dynamicWalletClient.signTypedData,
};

// 3. Pass compatible wallet client to SBC
<SbcProvider config={{
  apiKey: 'your-sbc-api-key',
  chain: baseSepolia,
  walletClient: compatibleWalletClient,
  debug: true
}}>
  {/* Your app components */}
</SbcProvider>
```

## Integration Flow

1. **Dynamic SDK Initialization**: DynamicContextProvider wraps the app with wallet connectors
2. **Wallet Connection**: User connects wallet through Dynamic's interface
3. **Wallet Client Extraction**: SBC gets the wallet client from Dynamic
4. **Compatible Client Creation**: Creates a compatible wallet client with proper LocalAccount structure
5. **Smart Account Creation**: SBC creates Kernel smart account with Dynamic wallet as owner
6. **Transaction Signing**: Dynamic wallet signs user operations for smart account
7. **Gasless Transactions**: SBC paymaster covers gas costs

## UI Features

### Dynamic Wallet Status
- Shows connected wallet address and connector name
- Displays current chain information
- Shows ETH and SBC balances for the connected EOA wallet
- Disconnect wallet functionality

### Smart Account Information
- Smart account address and deployment status
- SBC balance for the smart account
- Refresh functionality

### Transaction Form
- Send SBC tokens to any address
- Permit-based token transfers (EIP-2612)
- Real-time transaction status
- Transaction hash links to chain explorer

## Key Technical Details

### Wallet Client Compatibility

Dynamic's wallet client structure differs from traditional wallet clients. The integration creates a compatible client:

```typescript
// Dynamic wallet client doesn't have account property initially
const dynamicWalletClient = await primaryWallet.connector.getWalletClient();

// Create compatible LocalAccount for SBC
const compatibleAccount = {
  address: primaryWallet.address as `0x${string}`,
  type: 'local' as const,
  signMessage: async ({ message }: { message: string }) => {
    return await dynamicWalletClient.signMessage({ 
      message, 
      account: primaryWallet.address as `0x${string}` 
    });
  },
  // ... other signing methods
};
```

### Signing Method Delegation

All signing operations delegate to Dynamic's wallet client while maintaining SBC's expected interface:

- **signMessage**: For smart account initialization
- **signTransaction**: For transaction signing
- **signTypedData**: For permit-based token transfers

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

### Dynamic SDK Not Found

Make sure you've installed the required packages:

```bash
pnpm add @dynamic-labs/sdk-react-core @dynamic-labs/ethereum @dynamic-labs/ethereum-aa @dynamic-labs/sdk-react
```

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
  "@dynamic-labs/sdk-react-core": "^1.0.0",
  "@dynamic-labs/sdk-react": "^0.18.30",
  "@dynamic-labs/ethereum": "^1.0.0",
  "@dynamic-labs/ethereum-aa": "^1.0.0",
  "viem": "^2.33.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```
