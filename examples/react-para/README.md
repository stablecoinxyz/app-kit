# SBC + Para (Gasless User Operation)

Single-path demo: EOA holds SBC, smart account moves them via one gasless user operation through SBC AppKit.

## How it works

1) We compute EIP‑2612 Permit (domain/types/message) for the SBC token.
2) We hash the typed data to the EIP‑712 digest (client-side, with viem).
3) We ask Para to sign the digest using `signMessage` (no `eth_signTypedData_v4`).
4) We submit a single gasless user operation containing two calls:
   - `permit(owner → smartAccount)`
   - `transferFrom(owner → recipient)`

SBC paymaster sponsors gas. Only a message signature is required from Para. Para docs confirm `signMessage` can sign typed data digests: see “Sign Messages with Para” → Core Signing Methods → signMessage [docs](https://docs.getpara.com/v2/react/guides/web3-operations/sign-with-para#signmessage-with-client).

## Quick start

1. Create `.env`:

```env
VITE_PARA_API_KEY=your_para_api_key
VITE_SBC_API_KEY=your_sbc_api_key
VITE_CHAIN=baseSepolia
VITE_RPC_URL=https://sepolia.base.org
```

1. Install & run

```bash
pnpm install
pnpm dev
```

1. Connect Para wallet, enter recipient and amount (SBC), click “Send”.

## What changed
 
- Removed eth_signTypedData_v4 usage (Base blocks it). We hash EIP‑712 locally and sign the digest via Para `signMessage`.
- Added `utils/permit.ts` with typed-data helpers and robust signature normalization (hex/base64/DER) plus `deriveVForRS` to compute `v` when missing.
- SBC initialization now waits for the Para viem wallet client and uses it directly (no fallback connect path).
- Wrapped the Para wallet client so both `account.signMessage` and `walletClient.signMessage` route to Para `signMessage` for user-op signing.
- Single path: [permit, transferFrom] sent in one gasless user operation.

## Troubleshooting

- “No signing method available for Para wallet”: ensure the Para wallet is connected; the hook waits for the Para viem wallet client before initializing SBC. The wrapper exposes `signMessage` at both `account` and top-level `walletClient`.
- “Invalid typed array length”: the wrapper normalizes messages (hex/string/bytes) to raw bytes before base64-encoding for Para `signMessage`.

## Notes

- This example keeps all complexity inside AppKit + a small helper. No typed-data RPC is used; only Para `signMessage` over the precomputed digest.
- Keep tokens in the EOA? This demo signs a permit to let the smart account spend them, in the same gasless user operation that executes `transferFrom`.
