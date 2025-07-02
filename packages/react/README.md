# @stablecoin.xyz/react

React hooks and components for SBC Account Abstraction. Build seamless gasless transaction experiences in your React applications.

## Installation

```bash
npm install @stablecoin.xyz/react @stablecoin.xyz/core viem react react-dom
```

## Quick Start

### 1. Setup the Provider

Wrap your app with the `SbcProvider`:

```tsx
import React from 'react';
import { base } from 'viem/chains';
import { SbcProvider, type SbcAppKitConfig } from '@stablecoin.xyz/react';

const config: SbcAppKitConfig = {
  apiKey: process.env.REACT_APP_SBC_API_KEY!,
  chain: base,
  debug: true, // Enable debug logging for development
  // Optional: Production logging
  logging: {
    enabled: true,
    level: 'info',
    logger: (level, message, metadata) => console.log(level, message, metadata),
    context: {
      appName: 'my-dapp',
      environment: 'development'
    }
  }
};

function App() {
  return (
    <SbcProvider 
      config={config}
      onError={(error) => console.error('SBC Error:', error)}
    >
      <YourApp />
    </SbcProvider>
  );
}
```

### 2. Use the Hooks

```tsx
import React from 'react';
import { useSbcApp, useUserOperation } from '@stablecoin.xyz/react';

function Dashboard() {
  const { 
    account, 
    isInitialized, 
    error,
    refreshAccount 
  } = useSbcApp();

  const { 
    sendUserOperation, 
    isLoading, 
    isSuccess, 
    error: txError 
  } = useUserOperation({
    onSuccess: (result) => {
      console.log('Transaction successful!', result);
    }
  });

  const handleSendETH = async () => {
    await sendUserOperation({
      to: '0x742d35Cc6635C0532925a3b8c17f21c5F8E63231',
      data: '0x',
      value: '1000000000000000' // 0.001 ETH in wei
    });
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  return (
    <div>
      <h2>Smart Account: {account?.address}</h2>
      <p>Deployed: {account?.isDeployed ? 'Yes' : 'No'}</p>
      
      <button 
        onClick={handleSendETH}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send 0.001 ETH'}
      </button>
      
      {isSuccess && <p>✅ Transaction sent!</p>}
      {txError && <p>❌ Error: {txError.message}</p>}
    </div>
  );
}
```

## API Reference

### Components

#### `SbcProvider`

The main provider component that initializes the SBC SDK and provides context to child components.

```tsx
interface SbcProviderProps {
  config: SbcAppKitConfig;
  children: ReactNode;
  onError?: (error: Error) => void;
}
```

### Hooks

#### `useSbcApp()`

Main hook for accessing SBC functionality and account information.

```tsx
const {
  sbcAppKit,           // SBC SDK instance
  isInitialized,    // Whether SDK is ready
  error,            // Initialization error
  reinitialize,     // Re-initialize SDK
  account,          // Account information
  isLoadingAccount, // Loading account state
  accountError,     // Account loading error
  refreshAccount    // Refresh account info
} = useSbcApp();
```

#### `useUserOperation(options?)`

Hook for sending transactions with automatic state management.

```tsx
const {
  sendUserOperation,     // Send a transaction
  estimateUserOperation, // Estimate gas costs
  isLoading,            // Transaction in progress
  isSuccess,            // Last transaction succeeded
  isError,              // Last transaction failed
  error,                // Transaction error
  data,                 // Transaction result
  reset                 // Reset state
} = useUserOperation({
  onSuccess: (result) => void,
  onError: (error) => void,
  refreshAccount: boolean // Auto-refresh account (default: true)
});
```

### Transaction Types

#### Single Transaction

```tsx
await sendUserOperation({
  to: '0x742d35Cc6635C0532925a3b8c17f21c5F8E63231', // Target contract address
  data: '0x', // Encoded function call
  value: '1000000000000000' // Wei amount (optional)
});
```

#### Batch Transactions

```tsx
await sendUserOperation({
  calls: [
    {
      to: '0x...',
      data: '0x...',
      value: 1000000000000000n // BigInt for batch calls
    },
    {
      to: '0x...',
      data: '0x...'
    }
  ]
});
```

## Framework Support

This package works with all React-based frameworks:

- ✅ **Create React App**
- ✅ **Next.js** (App Router & Pages Router)
- ✅ **Vite**
- ✅ **Remix**
- ✅ **Gatsby**

## TypeScript Support

Full TypeScript support with proper type inference:

```tsx
import type { 
  SbcAppKitConfig,
  UserOperationResult,
  AccountInfo 
} from '@stablecoin.xyz/react';
```

## Error Handling

The hooks provide comprehensive error handling:

```tsx
const { error, isError } = useUserOperation({
  onError: (error) => {
    if (error.message.includes('insufficient funds')) {
      alert('Not enough balance');
    } else if (error.message.includes('user denied')) {
      alert('Transaction cancelled');
    } else {
      alert(`Transaction failed: ${error.message}`);
    }
  }
});
```

## Configuration

### Environment Variables

```bash
# Required
REACT_APP_SBC_API_KEY=your_api_key_here

# Optional
REACT_APP_SBC_DEBUG=true
```
## Examples

- [Complete React App](../../examples/react-app/) - Full example with UI

## License

MIT 