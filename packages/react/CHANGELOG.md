# @stablecoin.xyz/react

## 0.6.1

### Patch Changes

- 6b86df6: Fix useSbcTurnkey hook to properly support wallet-based authentication when turnkeyWalletClient is provided without turnkeyClient

## 0.6.0

### Minor Changes

- 371bfdb: Add Radius Testnet support and debug logging

  **Core Package:**

  - Add Radius Testnet network support with custom EntryPoint
  - Implement Radius SimpleAccount integration
  - Add new example application for Radius Testnet

  **React Package:**

  - Add console error logging in debug mode for all React components and hooks
  - Add 81 new tests across 4 test suites (useSbcPara, useSbcApp, useUserOperation, SbcProvider)
  - Install @testing-library dependencies for React testing

  Test coverage: Core (86 tests), React (61 tests, up from 4).

### Patch Changes

- Updated dependencies [371bfdb]
  - @stablecoin.xyz/core@1.4.0

## 0.5.1

### Patch Changes

- e10679a: docs: update for Para embedded wallet integration and pnpm-only installs

  - Add `useSbcPara` hook documentation to API_FULL.md
  - Update root README to include React Para example and dev scripts
  - Switch READMEs to pnpm-only install commands
  - Mention Para integration in React package README and link to example

  Note: Docs-only changes; no runtime behavior modifications.

- a50f3e3: feat(core): simplify Para integration to require Para viem clients

  - Remove fallback EIP-712/typed-data logic in wallet manager
  - Use provided Para viem walletClient/account directly

  chore(build): use esbuild for JS bundles and rollup-plugin-dts for types

  - Faster transpile-only builds (no node_modules type-checking)
  - Generate `dist/index.d.ts` via dts plugin

  docs(examples): clarify react-para README; remove unused context dir

- Updated dependencies [e10679a]
- Updated dependencies [a50f3e3]
  - @stablecoin.xyz/core@1.3.0

## 0.5.0

### Minor Changes

- dfa4bf7: feat: Dynamic wallet integration

  - Add Dynamic wallet support in core `WalletManager` and related types
  - Add `useSbcDynamic` hook and export from `@stablecoin.xyz/react`
  - Improve error parsing utilities for clearer UX during failures

### Patch Changes

- Updated dependencies [dfa4bf7]
- Updated dependencies [7f1aea0]
- Updated dependencies [4560c63]
- Updated dependencies [87ff47e]
  - @stablecoin.xyz/core@1.2.0

## 0.4.0

### Minor Changes

- a45f258: Add `className` and `render` prop support to `WalletButton` for full UI customization.
  Update test environment to jsdom and add comprehensive tests for WalletButton.

## 0.3.0

### Minor Changes

- Enhanced `useSbcApp` hook to gracefully handle "no wallet connected" scenarios
- Improved error states and loading management in React hooks for better user experience
- Updated hooks to work seamlessly with the enhanced wallet manager from core package
- All React tests now passing with proper mock structures and enhanced test coverage
- Improved hook testing for wallet connection scenarios and error handling

### Patch Changes

- Updated @stablecoin.xyz/core@1.1.0

## 0.2.1

### Patch Changes

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

- 97fcf21: Remove manual retry functionality from React hooks to simplify interface and improve usability

  - Removed `reinitialize` method from `SbcContextValue` interface and `useSbcApp` hook
  - Fixed naming consistency: `sbcKit` → `sbcAppKit` throughout React package
  - Simplified React hook interface to focus on core functionality
  - Maintains clean, intuitive API for developers

- Updated dependencies [4a9954e]
- Updated dependencies [97fcf21]
- Updated dependencies [53c996e]
  - @stablecoin.xyz/core@1.0.1

## 0.2.0

### Minor Changes

- 3bad4e7: Add react package with hooks and components
- be46ff3: Enhance account information UI with separate owner and smart account sections

  - Add visually separated sections for Owner (EOA) and Smart Account balances
  - Display both ETH and SBC token balances for each account type
  - Implement parallel balance fetching for improved performance
  - Remove insufficient SBC balance warning for cleaner UX
  - Update transaction controls to use smart account SBC balance
  - Improve loading states and refresh functionality for all balances
  - Add clear visual styling with borders and proper spacing

- 2b29daf: Rename useSbcKit hook to useSbcApp for better naming consistency

  **BREAKING CHANGE**: The `useSbcKit()` hook has been renamed to `useSbcApp()` and the `UseSbcKitReturn` type has been renamed to `UseSbcAppReturn`.

  To migrate:

  - Replace `useSbcKit` imports with `useSbcApp`
  - Replace `UseSbcKitReturn` type references with `UseSbcAppReturn`

  All functionality remains identical - only the names have changed.

### Patch Changes

- Updated dependencies [fe14a91]
- Updated dependencies [3bad4e7]
- Updated dependencies [2b29daf]
  - @stablecoin.xyz/core@1.0.0

## [0.3.1]

### Changed

- Docs-only update: Improved README.md for npmjs.com
