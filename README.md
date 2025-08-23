# SBC App Kit

Account Abstraction SDK for developers who want gasless transactions but don't want to set up paymasters.

## Developer Quickstart

For developers who want to use SBC App Kit in their own apps (install from npm):

```bash
pnpm add @stablecoin.xyz/react @stablecoin.xyz/core
# or
npm install @stablecoin.xyz/react @stablecoin.xyz/core
```

```typescript
import { SbcProvider, WalletButton } from '@stablecoin.xyz/react';
import { baseSepolia } from 'viem/chains';

const config = {
  apiKey: 'your-api-key',
  chain: baseSepolia,
  wallet: 'auto'
};

<SbcProvider config={config}>
  <WalletButton>Connect Wallet</WalletButton>
</SbcProvider>
```

## Contributor Quickstart

For contributors who want to develop or improve the App Kit locally (using workspace packages):

```bash
git clone https://github.com/stablecoinxyz/app-kit.git
cd app-kit
pnpm install

# Run specific examples
pnpm dev:react     # Basic React example
pnpm dev:wallet    # React with wallet integration
pnpm dev:dynamic   # React with Dynamic SDK
pnpm dev:nextjs    # Next.js example
pnpm dev:backend   # Backend/Node.js example
pnpm dev:para      # React with Para embedded wallet
```

- Use the `examples/` directory for advanced usage patterns.

## API Reference

### SbcProvider

Wrap your app with `SbcProvider` to provide SBC context. Requires a `config` object.

```tsx
<SbcProvider config={config}>
  {/* your app */}
</SbcProvider>
```

**Config object:**

- `apiKey` (string, required): Your SBC API key
- `chain` (object, required): Chain config (e.g. `baseSepolia` from `viem/chains`)
- `wallet` (string, optional): Wallet type (`'auto'`, `'metamask'`, `'coinbase'`, etc.)
- `walletOptions` (object, optional): Wallet connection preferences

### WalletButton

A button for connecting to a wallet. Handles loading and error states.

```tsx
<WalletButton walletType="auto" onConnect={...} onError={...}>
  Connect Wallet
</WalletButton>
```

**Props:**

- `walletType` (string, optional): `'auto'`, `'metamask'`, `'coinbase'`, etc. (default: `'auto'`)
- `onConnect` (function, optional): Called with connection result on success
- `onError` (function, optional): Called with error on failure
- `children` (ReactNode, optional): Custom button text
- `showLoading` (boolean, optional): Show loading spinner (default: true)
- `disabled` (boolean, optional): Disable the button

### useSbcApp (React Hook)

Access SBC state and actions in your components.

```js
const {
  sbcAppKit,        // SBC App Kit instance
  account,          // Smart account info (address, balance, ...)
  ownerAddress,     // EOA (wallet) address
  isLoadingAccount, // Loading state
  accountError,     // Error (if any)
  refreshAccount,   // Refresh account info
  disconnectWallet, // Disconnect wallet
} = useSbcApp()
```

**Returns:**

- `sbcAppKit`: SBC App Kit instance
- `account`: Smart account info (address, balance, etc.)
- `ownerAddress`: EOA (wallet) address
- `isLoadingAccount`: Loading state
- `accountError`: Error loading account
- `refreshAccount()`: Refresh account info
- `disconnectWallet()`: Disconnect wallet

### useSbcDynamic (React Hook)

Simplified hook for Dynamic SDK integration. Automatically handles wallet client creation and SBC initialization. Supports both wallet connection and email authentication.

```js
const {
  sbcAppKit,        // SBC App Kit instance
  isInitialized,    // Whether SDK is ready
  error,            // Initialization error
  account,          // Smart account info
  isLoadingAccount, // Loading state
  accountError,     // Account error
  ownerAddress,     // EOA address from Dynamic
  refreshAccount,   // Refresh account info
  disconnectWallet, // Disconnect wallet
} = useSbcDynamic({
  apiKey: 'your-sbc-api-key',
  chain: baseSepolia,
  primaryWallet,    // From useDynamicContext()
  rpcUrl: 'optional-custom-rpc',
  debug: true
})
```

**Parameters:**

- `apiKey` (string): Your SBC API key
- `chain` (Chain): Blockchain network (from viem/chains)
- `primaryWallet` (object): Dynamic's primaryWallet from `useDynamicContext()`
- `rpcUrl` (string, optional): Custom RPC URL
- `debug` (boolean, optional): Enable debug logging

**Returns:** Same as `useSbcApp` plus initialization states (`isInitialized`, `error`)

---

For full documentation, see [API_FULL.md](./API_FULL.md)

## Examples

1. **[React Basic](./examples/react-basic)** - Simple demo (learning only)
2. **[Next.js Backend](./examples/nextjs-backend)** - Secure production pattern
3. **[React Wallet](./examples/react-wallet)** - User wallet integration
4. **[React Dynamic](./examples/react-dynamic)** - Dynamic SDK integration with wallet & email auth
5. **[React Para](./examples/react-para)** - Para embedded wallet integration (gasless permit + transfer)

> **Note**: Examples use the `latest` version to showcase the most recent published features. For development, use the `dev:local` scripts to link to workspace packages.

## Security

- **Backend**: Private keys on server (most secure)
- **Wallet**: User-controlled keys (standard Web3)
- **Demo**: Not for production use

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Contact

Reach out to us via [Telegram](https://t.me/stablecoin_xyz)
