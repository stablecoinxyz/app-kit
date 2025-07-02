# @stablecoin.xyz/core

## 1.0.0

### Major Changes

- fe14a91: Consolidate chain configuration and add block explorer URLs

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

### Minor Changes

- 2b29daf: Rename useSbcKit hook to useSbcApp for better naming consistency

  **BREAKING CHANGE**: The `useSbcKit()` hook has been renamed to `useSbcApp()` and the `UseSbcKitReturn` type has been renamed to `UseSbcAppReturn`.

  To migrate:

  - Replace `useSbcKit` imports with `useSbcApp`
  - Replace `UseSbcKitReturn` type references with `UseSbcAppReturn`

  All functionality remains identical - only the names have changed.

### Patch Changes

- 3bad4e7: Add react package with hooks and components
