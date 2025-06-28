---
"@sbc/core": major
---

Consolidate chain configuration and add block explorer URLs

BREAKING CHANGE: Added required `blockExplorerUrl` and `idString` fields to `ChainConfig` interface. This consolidates all chain-related configuration in one place and enables clickable transaction hash links.

- Add `blockExplorerUrl` field to `ChainConfig` interface for blockchain explorer links
- Add `idString` field to `ChainConfig` interface, consolidating chain identifiers
- Remove separate `CHAIN_ID_TO_IDENTIFIER` mapping in favor of unified config
- Update `CHAIN_CONFIGS` with Base and Base Sepolia explorer URLs and identifiers
- Simplify `buildAaProxyUrl()` to use consolidated chain configuration
- Add `getChainConfig()` method to `SbcAppKit` for accessing chain configuration
- Enhance React example with recipient address input validation
- Make transaction hashes clickable links to chain explorers
- Improve form UX with real-time validation and visual feedback 