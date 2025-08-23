# SBC App Kit – Full API Documentation

## SbcProvider

Wrap your app with `SbcProvider` to provide SBC context and configuration.

### Usage

```tsx
<SbcProvider config={config}>
  {/* your app */}
</SbcProvider>
```

### Config Object

| Name           | Type                | Required | Description |
|----------------|---------------------|----------|-------------|
| apiKey         | string              | Yes      | Your SBC API key |
| chain          | Chain (from viem)   | Yes      | Blockchain network config (e.g. `baseSepolia`) |
| wallet         | string              | No       | Wallet type: `'auto'`, `'metamask'`, `'coinbase'`, `'walletconnect'`, etc. (default: `'auto'`) |
| walletOptions  | WalletOptions       | No       | Wallet connection preferences (see below) |
| walletClient   | WalletClient        | No       | Advanced: custom wallet client instance |
| privateKey     | string (hex)        | No       | Advanced: custom private key (for backend) |
| rpcUrl         | string              | No       | Custom RPC URL for the chain |
| staging        | boolean             | No       | Use SBC staging environment |
| debug          | boolean             | No       | Enable debug logging |
| logging        | LoggingConfig       | No       | Production logging configuration |

#### WalletOptions

- `projectId` (string): WalletConnect project ID
- `autoConnect` (boolean): Automatically connect on init
- `preferredWallets` (string[]): Order of wallet preference
- `customOptions` (object): Custom wallet connection options

---

## WalletButton

A button for connecting to a wallet. Handles loading, error, and disabled states.

### Usage

```tsx
<WalletButton
  walletType="auto"
  onConnect={result => { /* handle success */ }}
  onError={err => { /* handle error */ }}
  showLoading={true}
  disabled={false}
>
  Connect Wallet
</WalletButton>
```

### Props

| Name        | Type                      | Default | Description |
|-------------|---------------------------|---------|-------------|
| walletType  | string                    | 'auto'  | Wallet type: `'auto'`, `'metamask'`, `'coinbase'`, `'walletconnect'`, etc. |
| onConnect   | (result) => void          |         | Called with connection result on success |
| onError     | (error: Error) => void    |         | Called with error on failure |
| children    | ReactNode                 |         | Custom button text |
| showLoading | boolean                   | true    | Show loading spinner |
| disabled    | boolean                   | false   | Disable the button |
| className   | string                    |         | Custom CSS class |

---

## useSbcApp (React Hook)

Access SBC state and actions in your components.

### Usage

```js
const {
  sbcAppKit,        // SBC App Kit instance
  isInitialized,    // SDK initialized
  error,            // Initialization error
  account,          // Smart account info (address, balance, ...)
  isLoadingAccount, // Loading state
  accountError,     // Error loading account
  refreshAccount,   // Refresh account info
  ownerAddress,     // EOA (wallet) address
  disconnectWallet, // Disconnect wallet
} = useSbcApp()
```

### Return Values

| Name             | Type         | Description |
|------------------|-------------|-------------|
| sbcAppKit        | SbcAppKit    | SBC App Kit instance |
| isInitialized    | boolean      | SDK initialized |
| error            | Error/null   | Initialization error |
| account          | AccountInfo/null | Smart account info (address, balance, etc.) |
| isLoadingAccount | boolean      | Loading state for account info |
| accountError     | Error/null   | Error loading account info |
| refreshAccount   | () => Promise<void> | Refresh account info |
| ownerAddress     | string/null  | EOA (wallet) address |
| disconnectWallet | () => void   | Disconnect wallet and clear state |

#### AccountInfo

- `address` (string): Smart account address
- `balance` (bigint): Smart account ETH balance (wei)
- `isDeployed` (boolean): Whether the smart account is deployed
- `nonce` (number): Smart account nonce

---

## useSbcDynamic (React Hook)

Simplified hook for Dynamic SDK integration. Automatically handles wallet client creation and SBC initialization. Supports both wallet connection and email authentication through Dynamic's unified auth flow.

### Usage

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

### Parameters

| Name          | Type     | Required | Description |
|---------------|----------|----------|-------------|
| apiKey        | string   | Yes      | Your SBC API key |
| chain         | Chain    | Yes      | Blockchain network (from viem/chains) |
| primaryWallet | object   | Yes      | Dynamic's primaryWallet from `useDynamicContext()` |
| rpcUrl        | string   | No       | Custom RPC URL |
| debug         | boolean  | No       | Enable debug logging |

### Return Values

Returns the same values as `useSbcApp` with additional initialization states:

| Name             | Type         | Description |
|------------------|-------------|-------------|
| sbcAppKit        | SbcAppKit/null | SBC App Kit instance (null until initialized) |
| isInitialized    | boolean      | Whether the SDK is ready to use |
| error            | Error/null   | Initialization error (if any) |
| account          | AccountInfo/null | Smart account info |
| isLoadingAccount | boolean      | Loading state for account info |
| accountError     | Error/null   | Error loading account info |
| ownerAddress     | string/null  | EOA address from Dynamic wallet |
| refreshAccount   | () => Promise<void> | Refresh account info |
| disconnectWallet | () => void   | Disconnect wallet and clear state |

### Prerequisites

1. Install Dynamic SDK packages:

   ```bash
   pnpm add @dynamic-labs/sdk-react-core @dynamic-labs/ethereum @dynamic-labs/ethereum-aa
   ```

2. Wrap app with Dynamic provider:

   ```tsx
   import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
   import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
   
   <DynamicContextProvider settings={{
     environmentId: 'your-dynamic-env-id',
     walletConnectors: [EthereumWalletConnectors],
   }}>
     <YourApp />
   </DynamicContextProvider>
   ```

---

## useSbcPara (React Hook)

Integrate SBC AppKit with Para embedded wallets. Requires Para provider context and the Para account. The hook waits for Para's viem v2 wallet client to be ready and initializes SBC using that client so `signMessage` works for gasless user operations.

### Usage

```tsx
import { useSbcPara } from '@stablecoin.xyz/react';
import { ParaProvider, useAccount } from '@getpara/react-sdk';
import '@getpara/react-sdk/styles.css';

function App() {
  return (
    <ParaProvider 
      paraClientConfig={{ env: 'development', apiKey: 'your-para-api-key' }} 
      config={{ appName: 'Your App' }}
    >
      <Inner />
    </ParaProvider>
  );
}

function Inner() {
  const paraAccount = useAccount();
  const { sbcAppKit, isInitialized, error, account, ownerAddress } = useSbcPara({
    apiKey: 'your-sbc-api-key',
    chain: baseSepolia,
    paraAccount
  });
  if (!isInitialized) return <div>Initializing...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>Owner: {ownerAddress} — Smart Account: {account?.address}</div>;
}
```

### Parameters

| Name            | Type     | Required | Description |
|-----------------|----------|----------|-------------|
| apiKey          | string   | Yes      | Your SBC API key |
| chain           | Chain    | Yes      | Blockchain network (from viem/chains) |
| paraAccount     | any      | Yes      | Para account object from `useAccount()` |
| rpcUrl          | string   | No       | Optional custom RPC URL |
| debug           | boolean  | No       | Enable debug logging |
| paraViemClients | object   | No       | Advanced: `{ publicClient, walletClient, account }` from Para viem integration |

### Return Values

Same shape as `useSbcApp` with Para-specific owner address:

| Name             | Type                | Description |
|------------------|---------------------|-------------|
| sbcAppKit        | SbcAppKit/null      | SBC App Kit instance |
| isInitialized    | boolean             | Whether SBC is ready |
| error            | Error/null          | Initialization error |
| account          | AccountInfo/null    | Smart account info |
| isLoadingAccount | boolean             | Loading state for account info |
| accountError     | Error/null          | Error loading account info |
| ownerAddress     | string/null         | Para wallet EOA address |
| refreshAccount   | () => Promise<void> | Refresh account info |
| disconnectWallet | () => Promise<void> | Disconnect and cleanup |

### Notes

- The hook prefers Para's official viem v2 wallet client. It will wait until `walletClient` is available rather than falling back, ensuring `signMessage` covers EIP-712 digests for gasless flows.
- See the [React Para example](./examples/react-para) for a complete, runnable demo with permit + transfer in a single gasless user operation.

---

## WalletSelector

Component for displaying and selecting from available wallets.

### Usage

```tsx
<WalletSelector
  onConnect={result => { /* handle success */ }}
  onError={err => { /* handle error */ }}
  showOnlyAvailable={true}
  className="my-wallet-selector"
/>
```

### Props

| Name              | Type                      | Default | Description |
|-------------------|---------------------------|---------|-------------|
| className         | string                    |         | Custom CSS class |
| onConnect         | (result) => void          |         | Called with connection result on success |
| onError           | (error: Error) => void    |         | Called with error on failure |
| showOnlyAvailable | boolean                   | true    | Show only available wallets |
| wallets           | DetectedWallet[]          |         | Custom wallet list (overrides auto-detection) |

---

## Types

### SbcAppKit

Main SDK class for advanced usage. See source for full API.

### DetectedWallet

- `type` (string): Wallet type
- `name` (string): Wallet name
- `available` (boolean): Is wallet available
- `icon` (string): Wallet icon URL
- `provider` (object): Wallet provider instance

### WalletConnectionResult

- `walletClient` (WalletClient): Connected wallet client
- `wallet` (DetectedWallet): Wallet info
- `address` (string): Connected address

---

## Advanced Usage

- Use `SbcAppKit` directly for custom flows.
- Use `walletClient` or `privateKey` in config for backend/server-side integration.
- Use `refreshAccount()` to update state after transactions.

---

For more, see the source code and examples directory.
