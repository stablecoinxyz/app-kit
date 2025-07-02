# SBC React App Example

A complete React application demonstrating how to integrate SBC Account Abstraction using the `@stablecoin.xyz/react` package. This example shows gasless transactions, smart account management, and real-time transaction tracking.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- An SBC API key (get one from [SBC Dashboard](https://dashboard.stablecoin.xyz))
- Basic knowledge of React and Web3

### Installation

```bash
# Clone the repository
git clone https://github.com/stablecoinxyz/app-kit.git
cd app-kit/examples/react-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Configuration

Update `.env.local` with your credentials:

```bash
REACT_APP_SBC_API_KEY=your_sbc_api_key_here
REACT_APP_SBC_DEBUG=true  # Optional: Enable debug logging (default: false)
```

### Run the App

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to see the app in action.

## 📁 Project Structure

```text
src/
├── App.tsx          # Main app component with SBC configuration
├── App.css          # Styling for the demo
├── index.tsx        # React app entry point
└── index.css        # Global styles
```

## 🔧 Key Implementation Details

### 1. SBC Configuration

The app is configured to use Base Sepolia testnet with proper viem chain integration:

```tsx
import { baseSepolia } from 'viem/chains';
import { SbcProvider, type SbcAppKitConfig } from '@stablecoin.xyz/react';

const config: SbcAppKitConfig = {
  apiKey: process.env.REACT_APP_SBC_API_KEY || 'your_api_key_here',
  chain: baseSepolia,
  debug: true, // Enable debug logging for development
};
```

### 2. Provider Setup

Wrap your app with `SbcProvider` to enable SBC functionality:

```tsx
function App() {
  return (
    <SbcProvider 
      config={config}
      onError={(error) => console.error('SBC Provider Error:', error)}
    >
      <Dashboard />
    </SbcProvider>
  );
}
```

### 3. Using SBC Hooks

The app demonstrates the two main hooks:

#### `useSbcApp()` - Account Management

```tsx
const { 
  sbcAppKit,           // SBC SDK instance
  isInitialized,    // Whether SDK is ready
  error,            // Initialization error
  account,          // Smart account info
  isLoadingAccount, // Loading state
  refreshAccount    // Refresh account data
} = useSbcApp();
```

#### `useUserOperation()` - Transaction Management

```tsx
const { 
  sendUserOperation,     // Send transactions
  estimateUserOperation, // Estimate gas costs
  isLoading,            // Transaction in progress
  isSuccess,            // Last transaction status
  error,                // Transaction errors
  data,                 // Transaction results
  reset                 // Reset state
} = useUserOperation({
  onSuccess: (result) => console.log('Success!', result),
  onError: (error) => console.error('Failed:', error)
});
```

## 🌟 Features Demonstrated

### Smart Account Information

- ✅ Display smart account address
- ✅ Show deployment status
- ✅ Real-time nonce tracking
- ✅ Account refresh functionality

### Gasless Transactions

- ✅ Send ETH transfers
- ✅ Gas estimation
- ✅ Transaction status tracking
- ✅ Error handling

### User Experience

- ✅ Loading states
- ✅ Success/error feedback
- ✅ Debug information panel
- ✅ Clean, responsive UI

## 💡 Code Examples

### Basic ETH Transfer

```tsx
const handleSendETH = async () => {
  try {
    await sendUserOperation({
      to: '0x742d35Cc6635C0532925a3b8c17f21c5F8E63231',
      data: '0x', // Empty data for ETH transfer
      value: '1000000000000000' // 0.001 ETH in wei
    });
  } catch (error) {
    console.error('Transaction failed:', error);
  }
};
```

### Contract Interaction

```tsx
import { encodeFunctionData } from 'viem';

const handleContractCall = async () => {
  const data = encodeFunctionData({
    abi: contractABI,
    functionName: 'transfer',
    args: [recipient, amount]
  });

  await sendUserOperation({
    to: contractAddress,
    data,
    value: '0'
  });
};
```

### Batch Transactions

```tsx
const handleBatchTransactions = async () => {
  await sendUserOperation({
    calls: [
      {
        to: '0x...',
        data: '0x...',
        value: 1000000000000000n
      },
      {
        to: '0x...',
        data: '0x...'
      }
    ]
  });
};
```

## 🎨 Styling & UI

The app includes a clean, modern UI with:

- **Card-based layout** for organized information
- **Loading states** with spinner animations
- **Status indicators** with emojis and colors
- **Responsive design** that works on mobile
- **Debug panel** for development insights

### CSS Custom Properties

The styling uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #007bff;
  --success-color: #28a745;
  --error-color: #dc3545;
  --border-color: #e0e4e7;
  --bg-light: #f8f9fa;
}
```

## 🔍 Error Handling

Comprehensive error handling for common scenarios:

```tsx
const { error } = useUserOperation({
  onError: (error) => {
    if (error.message.includes('insufficient funds')) {
      alert('Not enough balance for this transaction');
    } else if (error.message.includes('user denied')) {
      alert('Transaction was cancelled');
    } else {
      alert(`Transaction failed: ${error.message}`);
    }
  }
});
```

## 🌐 Network Support

The app is configured for Base Sepolia testnet, but can easily be switched to other supported networks:

```tsx
import { base, baseSepolia, polygon } from 'viem/chains';

// Switch between networks
const config: SbcAppKitConfig = {
  apiKey: process.env.REACT_APP_SBC_API_KEY!,
  chain: base, // or baseSepolia, polygon, etc.
  staging: false, // Use production for mainnets
};
```

## 🧪 Testing

The app includes basic error scenarios for testing:

1. **Invalid API Key** - Test error handling
2. **Network Issues** - Test retry logic  
3. **Transaction Failures** - Test error states
4. **Account Loading** - Test loading states

## 📚 Learn More

- **[SBC Documentation](https://docs.stablecoin.xyz)** - Complete SBC guides
- **[@stablecoin.xyz/react Package](../../packages/react/)** - React package docs
- **[Viem Documentation](https://viem.sh)** - Blockchain interaction library
- **[Base Network](https://base.org)** - Layer 2 network information

## 🛠️ Development

### Adding New Features

1. **New Transaction Types**: Add to the `handleSendTransaction` function
2. **Additional Hooks**: Import more hooks from `@stablecoin.xyz/react`
3. **Custom Components**: Create reusable components for common patterns
4. **Enhanced UI**: Extend the CSS for better user experience

### Debugging

Enable debug mode to see detailed logs:

```tsx
const config: SbcAppKitConfig = {
  // ... other config
  debug: true, // Shows detailed logs in console
};
```

## 🤝 Contributing

Found an issue or want to improve the example?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This example is part of the SBC App Kit and is licensed under MIT.

---

**Need help?** Join our [Telegram community](https://t.me/stablecoin_xyz) or check the [documentation](https://docs.stablecoin.xyz).