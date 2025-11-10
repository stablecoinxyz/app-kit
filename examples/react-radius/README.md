# React Radius Testnet Example

React app demonstrating SBC Account Abstraction on Radius Testnet with SimpleAccount implementation.

## Features

- ✅ **Radius Testnet** - Custom chain with dedicated EntryPoint and Factory
- 🔐 **SimpleAccount** - Uses SimpleAccount (not Kernel) for Radius compatibility
- 💸 **TestSBC Token** - ERC-20 token with EIP-2612 permit support (6 decimals)
- 🌐 **MetaMask Integration** - Connect your wallet to control the smart account
- ⛽ **Gasless Transactions** - All gas fees covered by SBC paymaster
- 📊 **Balance Tracking** - View EOA and SimpleAccount balances for ETH and TestSBC

## Quick Start

```bash
cd examples/react-radius
pnpm install
pnpm run dev
```

The app will open at http://localhost:3000

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
VITE_SBC_API_KEY=your_sbc_api_key_here
VITE_RPC_URL=https://rpc.testnet.radiustech.xyz
```

Get your API key from [SBC Dashboard](https://stablecoin.xyz)

## Radius Testnet Details

- **Chain ID**: 1223953
- **RPC**: https://rpc.testnet.radiustech.xyz
- **Explorer**: https://testnet.radiustech.xyz/testnet/explorer
- **EntryPoint**: 0x9b443e4bd122444852B52331f851a000164Cc83F
- **Factory**: 0x4DEbDe0Be05E51432D9afAf61D84F7F0fEA63495

## TestSBC Token

- **Address**: `0xbc14568925d9359a203b5c5c6de838c8baeebf5a`
- **Decimals**: 6
- **Features**: ERC-20 with EIP-2612 permit support

### How to Get TestSBC

1. Connect your MetaMask to Radius Testnet
2. Import the TestSBC token using the address above
3. Request testnet tokens from the Radius faucet (if available)
4. Or contact the Radius team for test tokens

## How It Works

### 1. Wallet Connection
Connect your MetaMask (EOA) to the app. This wallet becomes the owner/signer of the SimpleAccount.

### 2. SimpleAccount Creation
A deterministic SimpleAccount address is generated based on your EOA. The account deploys automatically on the first transaction.

### 3. Token Transfer Flow

When you send TestSBC tokens:

1. **Permit Signature**: Your wallet signs an EIP-2612 permit message (no gas)
2. **Batch UserOperation**: The SimpleAccount executes two calls:
   - `permit()` - Approves the SimpleAccount to spend your EOA's TestSBC
   - `transferFrom()` - Transfers tokens from your EOA to the recipient
3. **Gasless**: SBC paymaster covers all gas fees

## Development

### Run with local packages

```bash
pnpm run dev:local
```

This links to the local `@stablecoin.xyz/core` and `@stablecoin.xyz/react` packages.

### Build

```bash
pnpm run build
```

### Preview Production Build

```bash
pnpm run preview
```

## Architecture

- **Account Type**: SimpleAccount (custom implementation for Radius)
- **EntryPoint**: v0.7 (custom address)
- **Bundler**: SBC AA Proxy
- **Paymaster**: SBC Paymaster (gasless transactions)

## Troubleshooting

### MetaMask doesn't show Radius Testnet

Add the network manually:
- Network Name: Radius Testnet
- RPC URL: https://rpc.testnet.radiustech.xyz
- Chain ID: 1223953
- Currency Symbol: USD
- Block Explorer: https://testnet.radiustech.xyz/testnet/explorer

### Transaction fails

1. Ensure you have TestSBC tokens in your EOA (not SimpleAccount)
2. Check that MetaMask is connected to Radius Testnet
3. Verify your SBC API key is valid
4. Check browser console for detailed errors

### Balance not updating

Click the "🔄 Refresh" button in the Smart Account Status section.

## Learn More

- [SBC App Kit Documentation](https://docs.stablecoin.xyz)
- [Radius Testnet](https://radiustech.xyz)
- [Account Abstraction (ERC-4337)](https://eips.ethereum.org/EIPS/eip-4337)
- [EIP-2612 Permit](https://eips.ethereum.org/EIPS/eip-2612)

## License

MIT
