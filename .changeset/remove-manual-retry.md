---
"@stablecoin.xyz/react": patch
---

Remove manual retry functionality from React hooks to simplify interface and improve usability

- Removed `reinitialize` method from `SbcContextValue` interface and `useSbcApp` hook
- Fixed naming consistency: `sbcKit` → `sbcAppKit` throughout React package
- Simplified React hook interface to focus on core functionality
- Maintains clean, intuitive API for developers 