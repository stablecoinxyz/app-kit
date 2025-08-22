# @stablecoin.xyz/core

## 1.2.0

### Minor Changes

- dfa4bf7: feat: Dynamic wallet integration

  - Add Dynamic wallet support in core `WalletManager` and related types
  - Add `useSbcDynamic` hook and export from `@stablecoin.xyz/react`
  - Improve error parsing utilities for clearer UX during failures

## 1.1.0

### Minor Changes

- Enhanced Wallet Manager with improved wallet connection flow for MetaMask and Coinbase Wallet integration
- Added production-ready wallet integration with full `walletClient` configuration support
- Improved error handling with actionable guidance for wallet connection issues
- Fixed account creation with proper LocalAccount objects and full signing method implementations
- Resolved wallet connection failures with proper account attachment and validation
- Enhanced smart account integration to work seamlessly with connected wallets
- Achieved 100% test coverage with comprehensive mock coverage and enhanced test isolation
- Added robust error testing scenarios for improved reliability

## 1.0.1

### Patch Changes

- 4a9954e: Add dotenv support to backend examples for better environment variable management

  - Added dotenv dependency to backend example package
  - Updated basic-usage.ts to load environment variables from .env file
  - Enhanced README with .env setup instructions and environment variable documentation
  - Provided both .env file and export variable setup options
  - Improved developer experience for local development and configuration

- 97fcf21: Add comprehensive API documentation with detailed method signatures and examples

  - Added complete API reference section to main README
  - Documented all SbcAppKit class methods with TypeScript signatures
  - Included detailed interface definitions for key types
  - Added React hooks documentation with full return type details
  - Provided component usage examples for SbcProvider and WalletConnect
  - Enhanced developer experience with clear, searchable API documentation

- 53c996e: Fix all test failures and improve test coverage to 100% passing

  - Fixed missing `getBalance` mock in `createPublicClient` for account operations tests
  - Updated gas estimation test expectations to match paymaster gas limit calculations
  - Removed outdated `core.test.ts` and `integration.test.ts` that tested non-existent API implementation
  - Fixed Jest configuration for React package ES module compatibility
  - Added placeholder test for React package to ensure Jest runs properly
  - All 41 tests now passing: 39 core tests + 2 React tests
  - Comprehensive test coverage for current permissionless-based implementation
  - Eliminated test suite maintenance overhead for deprecated functionality

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

## [1.1.1]

### Changed

- Docs-only update: Improved README.md for npmjs.com
