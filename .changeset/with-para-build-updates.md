---
"@stablecoin.xyz/core": minor
"@stablecoin.xyz/react": patch
---

feat(core): simplify Para integration to require Para viem clients

- Remove fallback EIP-712/typed-data logic in wallet manager
- Use provided Para viem walletClient/account directly

chore(build): use esbuild for JS bundles and rollup-plugin-dts for types

- Faster transpile-only builds (no node_modules type-checking)
- Generate `dist/index.d.ts` via dts plugin

docs(examples): clarify react-para README; remove unused context dir


