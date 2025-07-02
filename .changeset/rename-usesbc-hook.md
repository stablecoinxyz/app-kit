---
"@stablecoin.xyz/core": minor
"@stablecoin.xyz/react": minor
---

Rename useSbcKit hook to useSbcApp for better naming consistency

**BREAKING CHANGE**: The `useSbcKit()` hook has been renamed to `useSbcApp()` and the `UseSbcKitReturn` type has been renamed to `UseSbcAppReturn`. 

To migrate:
- Replace `useSbcKit` imports with `useSbcApp`
- Replace `UseSbcKitReturn` type references with `UseSbcAppReturn`

All functionality remains identical - only the names have changed. 