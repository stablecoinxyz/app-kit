# @stablecoin.xyz/react

React hooks and components for SBC Account Abstraction.

## Installation

```bash
npm install @stablecoin.xyz/react @stablecoin.xyz/core viem
```

## Setup

```tsx
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

## Usage

```tsx
import { useSbcApp, useUserOperation } from '@stablecoin.xyz/react';

function Dashboard() {
  const { account, isInitialized } = useSbcApp();
  const { sendUserOperation, isLoading } = useUserOperation();

  const handleSend = () => sendUserOperation({
    to: '0x742d35Cc6635C0532925a3b8c17f21c5F8E63231',
    value: '1000000000000000'
  });

  if (!isInitialized) return <div>Loading...</div>;

  return (
    <div>
      <p>Account: {account?.address}</p>
      <button onClick={handleSend} disabled={isLoading}>
        Send ETH
      </button>
    </div>
  );
}
```

## API

### Hooks

- `useSbcApp()` - Account info and state
- `useUserOperation()` - Send transactions

### Components

- `SbcProvider` - App wrapper
- `WalletButton` - Connect wallet button
