# SBC Next.js Backend Example

A full-stack Next.js application demonstrating SBC Account Abstraction with backend API integration.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/stablecoinxyz/app-kit.git
cd app-kit/examples/nextjs-backend
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

### Frontend (React)
- Smart account management
- Transaction UI components
- Real-time balance updates
- Error handling & status

### Backend (API Routes)
- `/api/account-info` - Account details & balances
- `/api/send-transaction` - Secure transaction execution
- `/api/owner-address` - EOA address retrieval

## 📦 What's Included

- ✅ Full-stack account abstraction
- ✅ Secure backend transaction signing
- ✅ Multi-token balance management
- ✅ Smart account deployment
- ✅ Permit + transfer multicalls
- ✅ Explorer integration
- ✅ TypeScript throughout

## ⚙️ Environment Setup

```env
# .env.local
OWNER_PRIVATE_KEY=0x...  # Your EOA private key
SBC_PAYMASTER_URL=https://paymaster.stablecoin.xyz
SBC_TOKEN_ADDRESS=0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16
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

## 🚀 Deployment

1. Deploy to Vercel/Netlify
2. Add environment variables
3. Update API URLs if needed
4. Test transaction flow

## 📚 Learn More

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [SBC App Kit Documentation](https://github.com/stablecoinxyz/app-kit)
- [Account Abstraction Best Practices](https://github.com/stablecoinxyz/app-kit#readme) 