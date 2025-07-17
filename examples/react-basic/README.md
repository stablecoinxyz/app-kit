# SBC React Basic Example

A minimal React application demonstrating SBC Account Abstraction integration.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/stablecoinxyz/app-kit.git
cd app-kit/examples/react-basic
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 What's Included

- ✅ Basic smart account creation
- ✅ Balance checking (ETH & SBC tokens)
- ✅ Gasless transactions via paymaster
- ✅ Transaction status monitoring
- ✅ TypeScript support

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

## 🏗️ Key Components

- **SbcProvider**: React context for account abstraction
- **useSbcApp**: Hook for smart account operations
- **useUserOperation**: Hook for transaction management

## 📚 Learn More

- [SBC App Kit Documentation](https://github.com/stablecoinxyz/app-kit)
- [Account Abstraction Guide](https://github.com/stablecoinxyz/app-kit#readme)
- [API Reference](https://github.com/stablecoinxyz/app-kit/tree/main/packages)

## 🎯 Next Steps

1. Copy this example to your project
2. Add your own components
3. Deploy to production
4. Scale with confidence!
