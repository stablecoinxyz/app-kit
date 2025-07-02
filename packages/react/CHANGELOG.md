# @stablecoin.xyz/react

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
