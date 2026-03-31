# React Radius Mainnet Example

React app demonstrating SBC Account Abstraction on Radius Mainnet (Chain ID 723487) with SimpleAccount implementation.

## Features

- **Radius Mainnet** - Production chain with dedicated EntryPoint and Factory
- **SimpleAccount** - Uses SimpleAccount (not Kernel) for Radius compatibility
- **SBC Token** - ERC-20 token with EIP-2612 permit support (6 decimals)
- **MetaMask Integration** - Connect your wallet to control the smart account
- **Gasless Transactions** - All gas fees covered by SBC paymaster

## Quick Start

```bash
cd examples/react-radius-mainnet
pnpm install
pnpm run dev
```

The app will open at http://localhost:3000

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
VITE_SBC_API_KEY=your_sbc_api_key_here
VITE_RPC_URL=https://rpc.radiustech.xyz
```

Get your API key from [SBC Dashboard](https://stablecoin.xyz)

## Radius Mainnet Details

- **Chain ID**: 723487
- **RPC**: https://rpc.radiustech.xyz
- **Explorer**: https://network.radiustech.xyz
- **EntryPoint**: 0xfA15FF1e8e3a66737fb161e4f9Fa8935daD7B04F
- **Factory**: 0x7d8fB3E53d345601a02C3214e314f28668510b03

## SBC Token

- **Address**: `0x33ad9e4BD16B69B5BFdED37D8B5D9fF9aba014Fb`
- **Decimals**: 6
- **Features**: ERC-20 with EIP-2612 permit support

## How It Works

### 1. Wallet Connection
Connect your MetaMask (EOA) to the app. This wallet becomes the owner/signer of the SimpleAccount.

### 2. SimpleAccount Creation
A deterministic SimpleAccount address is generated based on your EOA. The account deploys automatically on the first transaction.

### 3. Token Transfer Flow

When you send SBC tokens:

1. **Permit Signature**: Your wallet signs an EIP-2612 permit message (no gas)
2. **Batch UserOperation**: The SimpleAccount executes two calls:
   - `permit()` - Approves the SimpleAccount to spend your EOA's SBC
   - `transferFrom()` - Transfers tokens from your EOA to the recipient
3. **Gasless**: SBC paymaster covers all gas fees

## Development

### Run with local packages

```bash
pnpm run dev:local
```

### Build

```bash
pnpm run build
```

## Troubleshooting

### MetaMask doesn't show Radius

Add the network manually:
- Network Name: Radius
- RPC URL: https://rpc.radiustech.xyz
- Chain ID: 723487
- Currency Symbol: RUSD
- Block Explorer: https://network.radiustech.xyz

## Learn More

- [SBC App Kit Documentation](https://docs.stablecoin.xyz)
- [Radius](https://radiustech.xyz)
- [Account Abstraction (ERC-4337)](https://eips.ethereum.org/EIPS/eip-4337)
