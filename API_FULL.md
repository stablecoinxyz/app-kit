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
