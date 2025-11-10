---
"@stablecoin.xyz/core": minor
"@stablecoin.xyz/react": minor
---

Add Radius Testnet support and debug logging

**Core Package:**
- Add Radius Testnet network support with custom EntryPoint
- Implement Radius SimpleAccount integration
- Add new example application for Radius Testnet

**React Package:**
- Add console error logging in debug mode for all React components and hooks
- Add 81 new tests across 4 test suites (useSbcPara, useSbcApp, useUserOperation, SbcProvider)
- Install @testing-library dependencies for React testing

Test coverage: Core (86 tests), React (61 tests, up from 4).