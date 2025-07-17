# SBC React App Example

This example demonstrates basic integration with SBC Account Abstraction in a React application.

⚠️ **IMPORTANT: Demo vs Production Usage**

This example uses a demo account for illustration purposes. For production applications, follow these security best practices:

## Security Best Practices

1. **NEVER expose private keys in client-side code**
   - Private keys should be kept secure on a backend server
   - Use proper wallet integration for user accounts

2. **Recommended Production Patterns:**

   ### A. Next.js Backend Integration

   ```typescript
   // Frontend (React/Next.js)
   const sendTransaction = async () => {
     const response = await fetch('/api/send-transaction', {
       method: 'POST',
       body: JSON.stringify({
         to: recipient,
         amount: amount
       })
     });
   };

   // Backend (Next.js API route)
   export async function handler(req, res) {
     const privateKey = process.env.PRIVATE_KEY; // Safely stored
     const sbcAppKit = new SbcAppKit({
       privateKey,
       // other config
     });
     // Handle transaction
   }
   ```

   ### B. Wallet Integration

   ```typescript
   import { WalletConnect } from '@web3-react/walletconnect';
   
   const config = {
     apiKey: process.env.VITE_SBC_API_KEY,
     // Get signer from wallet instead of private key
     signer: wallet.getSigner()
   };
   ```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` file:

   ```
   VITE_SBC_API_KEY=your_api_key_here
   ```

3. Start the development server:

   ```bash
   npm start
   ```

## Features Demonstrated

- Smart SBC token transfers
- Automatic permit fallback
- Real-time balance tracking
- Gas estimation
- Error handling

## Learn More

- [SBC App Kit Documentation](https://docs.stablecoin.xyz)
- [Account Abstraction Guide](https://docs.stablecoin.xyz/guides/account-abstraction)
- [Security Best Practices](https://docs.stablecoin.xyz/security)
