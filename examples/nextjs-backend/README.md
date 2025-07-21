# Next.js Backend Example

Next.js app with backend SBC integration (most secure pattern).

## Quick Start

```bash
cd examples/nextjs-backend
pnpm install
pnpm run dev
```

## Features

- Backend private key management
- API-based transactions
- Production security
- Real-time balance display

## Environment

```env
NEXT_PUBLIC_CHAIN="baseSepolia"
SBC_API_KEY=your_api_key
OWNER_PRIVATE_KEY=0x...
```

## Security

- Private keys stay on server
- No wallet connection needed