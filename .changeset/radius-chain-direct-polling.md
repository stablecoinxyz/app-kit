---
"@stablecoin.xyz/core": minor
---

Add chain-direct polling for Radius testnet UserOperation receipts

The bundler's `eth_getUserOperationReceipt` may not return receipts reliably on Radius testnet due to getLogs configuration. This change adds a fallback that polls the EntryPoint contract directly for the `UserOperationEvent` log matching the userOpHash, ensuring transactions are properly confirmed.

Also updates TestSBC contract address to new deployment.
