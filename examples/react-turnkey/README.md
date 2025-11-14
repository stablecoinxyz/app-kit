# SBC + Turnkey Example (Production-Ready)

This example demonstrates a **production-ready** integration of Turnkey's embedded wallets with SBC App Kit for gasless smart account transactions.

## Features

- ✅ **Backend Architecture**: Express server handling Turnkey sub-org creation
- ✅ **Passkey Authentication**: Users create wallets with biometric auth (Face ID/Touch ID)
- ✅ **Embedded Wallets**: Non-custodial wallets managed by Turnkey
- ✅ **Smart Accounts**: ERC-4337 account abstraction with SBC paymaster
- ✅ **Gasless Transactions**: All gas fees sponsored by SBC
- ✅ **Production Ready**: Follows official Turnkey architecture patterns

## Architecture

### Implementation Approach

This example uses **Turnkey's official passkeyClient pattern** (from their example repository):

```
Frontend: passkeyClient.createUserPasskey()
   ↓
Your Backend: /api/create-sub-org
   ↓
Turnkey API: Creates sub-org + wallet
```

**Why This Approach:**
- ✅ **Official Pattern**: Used in Turnkey's `with-federated-passkeys` example
- ✅ **Full Control**: You own the backend, can customize the flow
- ✅ **Transparent**: See exactly what API calls are made
- ✅ **No External Dependencies**: No Auth Proxy Config needed

**Alternative:** Turnkey's `Auth` component + Auth Proxy (managed service, less control)

### Sub-Organizations Explained

Each user gets their own sub-organization:

```
Your Turnkey Org (Parent)
├── User A's Sub-Org → User A's Wallet (they own & control)
├── User B's Sub-Org → User B's Wallet (they own & control)
└── User C's Sub-Org → User C's Wallet (they own & control)
```

**Benefits:**
- ✅ **User Sovereignty**: Each user truly owns their wallet
- ✅ **Security Isolation**: Users can't access each other's keys
- ✅ **Compliance**: Clear data separation

### Complete Flow

```
1. User clicks "Sign Up with Passkey"
   ↓
2. Browser: passkeyClient.createUserPasskey()
   → WebAuthn creates passkey (Face ID/Touch ID)
   → Returns attestation + challenge
   ↓
3. Frontend → Backend: POST /api/create-sub-org
   → Sends: { userEmail, userName, attestation, challenge }
   ↓
4. Backend → Turnkey API: createSubOrganization()
   → Uses your API keys (secret)
   → Creates sub-org with user's passkey
   → Creates Ethereum wallet automatically
   ↓
5. Backend → Frontend: Returns { subOrgId, walletId, address }
   ↓
6. Frontend → SBC: useSbcTurnkey()
   → Creates smart account with Turnkey wallet as owner
   ↓
7. User can sign transactions with their passkey!
```

## Prerequisites

1. **SBC API Key**: Get from https://dashboard.stablecoin.xyz
2. **Turnkey Organization + API Keys**: Get from https://app.turnkey.com

**Important:** This example uses the **passkeyClient approach** (Turnkey's official pattern). You do NOT need:
- ❌ Auth Proxy Config
- ❌ Auth Proxy Config ID
- ❌ Turnkey's managed backend service

You only need **API keys** for your backend server.

## Setup Instructions

### 1. Create Turnkey Organization & Get API Keys

1. Go to https://app.turnkey.com and sign up
2. Create a new organization (or use existing)
3. Navigate to **Settings** → **API Keys**
4. Click **"Create API Key"**
5. **Save both keys securely**:
   - Copy the **API Public Key**
   - Copy the **API Private Key** (shown only once!)
6. Copy your **Organization ID** from Settings

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```bash
   # SBC Configuration
   VITE_SBC_API_KEY=your_sbc_api_key_here

   # Turnkey Frontend (Public - safe for browser)
   VITE_TURNKEY_API_BASE_URL=https://api.turnkey.com
   VITE_TURNKEY_RPID=localhost

   # Turnkey Backend (Secret - never expose to frontend!)
   TURNKEY_API_BASE_URL=https://api.turnkey.com
   TURNKEY_ORGANIZATION_ID=your_turnkey_org_id_here
   TURNKEY_API_PUBLIC_KEY=your_turnkey_public_key_here
   TURNKEY_API_PRIVATE_KEY=your_turnkey_private_key_here

   # Backend Server
   PORT=3001
   VITE_BACKEND_URL=http://localhost:3001
   ```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

**Option A: Run both frontend and backend together (recommended)**
```bash
pnpm dev:fullstack
```

This starts:
- Backend server on `http://localhost:3001`
- Frontend on `http://localhost:5173`

**Option B: Run separately**
```bash
# Terminal 1 - Backend
pnpm dev:backend

# Terminal 2 - Frontend
pnpm dev:local
```

## How It Works

### User Onboarding Flow

1. **User visits app** → Sees "Sign Up" button
2. **User clicks "Sign Up"** → Frontend initiates passkey creation
3. **Passkey created** → Browser uses WebAuthn (Face ID/Touch ID)
4. **Frontend calls backend** → `POST /api/create-sub-org` with passkey attestation
5. **Backend creates sub-org** → Uses Turnkey API keys to create user's sub-organization
6. **Backend creates wallet** → `POST /api/create-wallet` creates Ethereum wallet
7. **SBC creates smart account** → User's Turnkey wallet becomes smart account owner
8. **User can transact** → Sign transactions with passkey, gas sponsored by SBC

### Transaction Flow

1. User initiates transaction (e.g., "Send 1 SBC")
2. Frontend builds transaction data
3. User signs with passkey (biometric auth)
4. SBC sponsors gas fees
5. Transaction executes on-chain

## Security Notes

⚠️ **IMPORTANT**: Never expose Turnkey API keys to the frontend!

- API keys stay on the backend only
- Frontend uses passkeys for user authentication
- Each user gets their own isolated sub-organization

## Production Deployment

### Backend Deployment
Deploy the Express server to:
- Railway, Render, Fly.io (Node.js)
- Vercel, Netlify (Serverless functions)
- AWS Lambda, Google Cloud Functions

### Frontend Deployment
Deploy the Vite app to:
- Vercel, Netlify, CloudFlare Pages
- Any static hosting service

### Environment Variables

**Frontend (.env):**
```bash
VITE_SBC_API_KEY=prod_key_here
VITE_TURNKEY_API_BASE_URL=https://api.turnkey.com
VITE_TURNKEY_RPID=yourdomain.com  # Your production domain
VITE_BACKEND_URL=https://your-backend.com
```

**Backend (.env):**
```bash
TURNKEY_API_BASE_URL=https://api.turnkey.com
TURNKEY_ORGANIZATION_ID=prod_org_id
TURNKEY_API_PUBLIC_KEY=prod_public_key
TURNKEY_API_PRIVATE_KEY=prod_private_key
PORT=3001
```

## Troubleshooting

### "Failed to create sub-org"
- Check backend logs for detailed error
- Verify `TURNKEY_API_PUBLIC_KEY` and `TURNKEY_API_PRIVATE_KEY` are correct
- Ensure `TURNKEY_ORGANIZATION_ID` matches your Turnkey org

### "Network Error" when signing up
- Make sure backend is running (`pnpm dev:backend`)
- Check `VITE_BACKEND_URL` points to correct backend URL
- Verify CORS is configured (backend allows frontend origin)

### Passkey creation fails
- Use HTTPS in production (passkeys require secure context)
- For localhost: use `http://localhost` (not `127.0.0.1`)
- Check `VITE_TURNKEY_RPID` matches your domain

## Resources

- [Turnkey Documentation](https://docs.turnkey.com)
- [Turnkey Dashboard](https://app.turnkey.com)
- [SBC App Kit Docs](https://docs.stablecoin.xyz)
- [Turnkey SDK GitHub](https://github.com/tkhq/sdk)
