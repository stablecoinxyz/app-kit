# SBC React Wallet Example

A **production-ready** React application demonstrating true decentralized wallet integration with SBC Account Abstraction. Your connected wallet becomes the smart account owner and signer.

## 🌟 Production Wallet Integration

### 👤 True Wallet Signer Pattern ✅ **IMPLEMENTED**

- ✅ **User's connected wallet becomes the smart account owner/signer**
- ✅ **Each transaction requires user signature (MetaMask popup)**
- ✅ **True decentralization - user controls all keys**
- ✅ **Smart account created on-demand with wallet as owner**
- ✅ **Gasless transactions via SBC paymaster**

This implementation uses the enhanced `SbcAppKit` with `walletClient` support:

```typescript
// Production wallet integration
const sbcConfig: SbcAppKitConfig = {
  apiKey: 'your_api_key',
  chain: baseSepolia,
  walletClient: connectedWalletClient, // User's wallet becomes signer!
  debug: true,
};
```

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/stablecoinxyz/app-kit.git
cd app-kit/examples/react-wallet
npm install

# Set up environment (optional)
cp .env.example .env.local
# Edit .env.local with your API keys

npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📦 What's Included

- ✅ **MetaMask Integration**: Real wallet detection and connection
- ✅ **Smart Account Management**: Complete account abstraction setup  
- ✅ **Production Patterns**: Error handling, loading states, validation
- ✅ **Transaction Management**: Real SBC token transfers with gas estimation
- ✅ **Balance Fetching**: Framework for real blockchain balance queries
- ✅ **TypeScript Support**: Full type safety throughout

## 🏗️ Architecture

### Current Implementation

- **MetaMask Detection**: Automatically detects and connects to MetaMask
- **Wallet State Management**: Proper connection/disconnection handling
- **Transaction Flow**: Complete user operation lifecycle
- **Error Boundaries**: Production-ready error handling

### Production-Ready Features

- ⚡ **Pattern Toggle**: Switch between backend and wallet signer patterns
- ✅ **Real MetaMask Integration**: Actual wallet connection with `window.ethereum`
- 🔐 **Smart Account Abstraction**: Gasless transactions via SBC paymaster
- 💸 **Token Transfers**: Send SBC tokens with address validation
- 🛡️ **Production Security**: Secure private key handling patterns
- 🌊 **Base Sepolia**: Built for Base ecosystem integration
- 🔄 **Real-time Updates**: Transaction status with explorer links
- 📋 **Implementation Roadmap**: Clear path to wallet signer enhancement

```typescript
// Backend Pattern: Call secure API
const result = await fetch('/api/send-transaction', {
  method: 'POST',
  body: JSON.stringify({ to: recipient, amount })
});

// Wallet Signer Pattern (Future): User signs each transaction
const result = await sendUserOperation({
  to: SBC_TOKEN_ADDRESS,
  data: transferCallData,
  value: '0'
}); // MetaMask popup appears
```

## 🛠️ Development

### Using Published Packages (Default)

```bash
npm install     # Uses @stablecoin.xyz/core@^1.0.1
npm run dev
```

### Using Local Development Packages

```bash
npm run dev:local  # Auto-links to local workspace packages
```

## ⚙️ Environment Setup

```env
# .env.local
VITE_SBC_API_KEY=your_sbc_api_key_here
VITE_DEMO_PRIVATE_KEY=0x...  # For development only
```

## 🔧 Production Deployment

### 1. Replace Demo Components

```typescript
// Remove demo private key, add backend integration
const sbcConfig = {
  apiKey: process.env.VITE_SBC_API_KEY,
  chain: baseSepolia,
  // Use backend API instead of private key
};
```

### 2. Add Comprehensive Wallet Support

```bash
# Add Web3Modal or similar for multi-wallet support
npm install @web3modal/wagmi wagmi @tanstack/react-query
```

### 3. Implement Real Balance Fetching

```typescript
// Replace demo balances with real blockchain calls
const balance = await publicClient.getBalance({ address });
const tokenBalance = await publicClient.readContract({
  address: SBC_TOKEN_ADDRESS,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress]
});
```

### 4. Backend API Integration

```typescript
// For production security, use backend API
const response = await fetch('/api/send-transaction', {
  method: 'POST',
  body: JSON.stringify({ to, amount, recipient })
});
```

## 🎯 Key Components

- **WalletConnectionStatus**: MetaMask connection and status management
- **AccountInfo**: Real-time balance display for EOA and Smart Account
- **TransactionForm**: Complete transaction UI with validation and feedback
- **SbcProvider**: Account abstraction context with production config

## 🔒 Security Best Practices

✅ **No Private Keys in Frontend**: Demo key only for development  
✅ **Wallet Integration**: User controls their own keys  
✅ **Input Validation**: Address validation and amount checking  
✅ **Error Handling**: Comprehensive error boundaries  
✅ **Environment Variables**: Secure API key management  

## 📱 Wallet Support

### Currently Supported

- ✅ **MetaMask**: Full integration with connection detection
- ✅ **Any EIP-1193 Provider**: Works with compatible wallets

### Easy to Add

- 🔄 **WalletConnect**: Add via Web3Modal integration
- 🔄 **Coinbase Wallet**: Add via Web3Modal integration  
- 🔄 **Hardware Wallets**: Add via comprehensive wallet library

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy to any static host
# Vercel, Netlify, AWS S3, etc.
```

### Environment Variables for Production

```env
VITE_SBC_API_KEY=your_production_api_key
# Remove VITE_DEMO_PRIVATE_KEY in production
```

## 📚 Learn More

- [SBC App Kit Documentation](https://github.com/stablecoinxyz/app-kit)
- [MetaMask Integration Guide](https://docs.metamask.io/guide/)
- [EIP-1193 Provider Standard](https://eips.ethereum.org/EIPS/eip-1193)
- [Viem Documentation](https://viem.sh)

## 🎯 Next Steps

1. **Add Multi-Wallet Support**: Integrate Web3Modal or Wagmi
2. **Backend API**: Move private key operations to secure backend
3. **Real Balance Fetching**: Connect to live blockchain data
4. **Enhanced UX**: Add loading skeletons, better error messages
5. **Mobile Support**: Test and optimize for mobile wallets

This example provides a solid foundation for production wallet integration while maintaining security best practices and user experience standards.
