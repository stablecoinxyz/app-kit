# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SBC App Kit is an Account Abstraction SDK for gasless transactions without paymaster setup. It's a pnpm monorepo with two core packages (`@stablecoin.xyz/core` and `@stablecoin.xyz/react`) and multiple examples.

**Philosophy**: "Designed for developers who otherwise couldn't care to set up their own paymasters." Prioritize simplicity over manual configuration. Managed infrastructure approach.

## Repository Structure

- `packages/core/` - Core TypeScript SDK (framework-agnostic)
- `packages/react/` - React hooks and components
- `examples/` - Standalone example applications (not in workspace)

Examples are intentionally **not** in pnpm-workspace.yaml to prevent recursive dependency conflicts. They use published npm packages by default, with `dev:local` scripts for development with workspace packages.

## Build & Development Commands

```bash
# Install dependencies (uses pnpm@10.12.1)
pnpm install

# Build all packages
pnpm build

# Build specific package
pnpm build:core
pnpm build:react

# Watch mode for development
pnpm dev

# Run tests (41 total: 39 core + 2 React)
pnpm test
pnpm test:ci

# Lint
pnpm lint
pnpm lint:fix

# Clean all build artifacts and dependencies
pnpm clean

# Run examples with local workspace packages
pnpm dev:react      # Basic React example
pnpm dev:wallet     # React with wallet integration
pnpm dev:dynamic    # Dynamic SDK integration
pnpm dev:para       # Para embedded wallet
pnpm dev:nextjs     # Next.js backend
pnpm dev:backend    # Backend/Node.js

# Run examples with published npm packages
pnpm start:react
pnpm start:wallet
pnpm start:dynamic
pnpm start:nextjs
pnpm start:backend

# React compatibility testing
pnpm test:compatibility  # Tests React 18 & 19
```

## Architecture

### Core Package (`@stablecoin.xyz/core`)

**Main Classes:**
- `SbcAppKit` (packages/core/src/app-kit.ts) - Main SDK class for smart account operations
- `WalletManager` (packages/core/src/wallet-manager.ts) - Handles wallet detection and connection

**Key Features:**
- Built on permissionless.js v0.2.47 and viem v2.33.0
- Uses Kernel smart accounts with EntryPoint v0.7
- Supports both walletClient (production) and privateKey (backend/testing) modes
- Integrated SBC paymaster for gasless transactions
- Logging system with multiple adapters (Sentry, Datadog, custom)

**Core Methods:**
- `createSmartAccount()` - Creates/initializes smart account
- `getAccount()` - Get account info (address, balance, etc.)
- `sendUserOperation()` - Send gasless transactions
- `estimateUserOperationGas()` - Estimate gas costs
- `call()` - Execute contract calls

### React Package (`@stablecoin.xyz/react`)

**Components:**
- `SbcProvider` - Context provider for SBC state
- `WalletButton` - Connect wallet button with loading states
- `WalletConnect`, `WalletSelector` - Wallet UI components

**Hooks:**
- `useSbcApp()` - Main hook for SBC functionality
- `useSbcDynamic()` - Simplified Dynamic SDK integration
- `useSbcPara()` - Para embedded wallet integration
- `useUserOperation()` - Transaction state management

**React Patterns:**
- React 19 primary, React 18 compatible
- All dependencies must be in useEffect/useCallback dependency arrays
- Use Promise.all() for parallel operations in hooks
- Proper error handling in all async useCallback functions

### Wallet Integration

Supports multiple wallet types via `WalletManager`:
- `'auto'` - Automatic detection (default)
- `'metamask'` - MetaMask extension
- `'coinbase'` - Coinbase Wallet
- `'walletconnect'` - WalletConnect protocol
- `'dynamic'` - Dynamic SDK (via `useSbcDynamic`)
- `'para'` - Para embedded wallet (via `useSbcPara`)

**Production Pattern**: User's connected wallet becomes smart account owner/signer. Each transaction requires user signature.

## Code Style & Patterns

### Configuration Objects
Prefer config objects over multiple parameters:
```typescript
// Good
buildAaProxyUrl(config: AaProxyConfig)

// Bad
buildAaProxyUrl(chain, apiKey, staging)
```

Create descriptive types: `AaProxyConfig`, `SbcAppKitConfig`, `WalletConnectionResult`

### Performance
- Use `Promise.all()` for parallel operations (both core and React)
- Optimize BigInt: `(value * 110n) / 100n` not `(value * (100n + buffer)) / 100n`
- Extract complex calculations to methods
- Use optional chaining: `this.logger?.(level, event, metadata)`
- Arrow function properties for methods: `private readonly logError = (...) => ...`

### Naming
- Action-oriented: `buildAaProxyUrl`, `calculateGasCost`
- Purpose suffixes: `AaProxyConfig`, `UserOperationResult`
- Meaningful names even for temp variables

### Error Handling
- Reuse validation utilities (`getChainConfig()` not duplicate validation)
- Provide helpful error messages with context
- Consistent error patterns across codebase

## Testing

**Requirements:**
- Maintain 100% test pass rate (all 41 tests)
- ES module configuration for packages with `"type": "module"`
- Comprehensive mocks for permissionless library
- Use proper BigInt values in gas estimation mocks
- Remove outdated tests for deprecated functionality

**Test Commands:**
```bash
# In packages/core or packages/react
pnpm test
pnpm test:watch
pnpm test:coverage

# CI mode
pnpm test:ci
```

## Publishing & Changesets

Uses Changesets for version management. Always manually generate changesets:

```bash
pnpm changeset        # Create changeset
pnpm changeset:version # Bump versions
pnpm changeset:publish # Publish to npm
pnpm publish:check    # Dry run
pnpm release          # Full release workflow
```

After major changes, ask user if changes should be committed. Suggest concise commit message and remind about changesets.

## Form Input Validation

- Validate on change, not just submit
- Immediate visual feedback (border colors, error messages)
- Regex for addresses: `/^0x[a-fA-F0-9]{40}$/`
- Disable buttons when validation fails
- Monospace fonts for addresses/hex data
- Clickable transaction hash links to explorer

## Key Dependencies

- **Core**: permissionless@^0.2.47, viem@^2.33.0
- **React**: React 19.x, @tanstack/react-query@>=5.0.0
- **Build**: rollup@^3.0.0 (core), rollup@^4.0.0 (react), rollup-plugin-esbuild
- **Test**: jest@^29.5.0, ts-jest@^29.1.0

## Important Notes

- Examples use published packages by default for user independence
- `dev:local` scripts link to workspace packages for contributors
- No generic development practices in docs - only specific to this codebase
- Keep configuration clean, easy, and intuitive
- Security: user controls all keys, no backend dependencies for wallet mode
- Manual retry functionality removed from React hooks for simplicity
