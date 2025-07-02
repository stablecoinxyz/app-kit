# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Complete React package** (`@sbc/react`) with hooks and components
  - `useSbcApp()` - Account management and SDK access
  - `useUserOperation()` - Transaction state management
  - `SbcProvider` - React context provider
  - TypeScript support with full type inference
- **Working React example app** with complete setup and demo UI
- **pnpm workspace support** for better monorepo dependency management
- **Pluggable logging system** with 5 built-in adapters
  - `createConsoleLogger()` - Development debugging
  - `createHttpLogger()` - Custom endpoints
  - `createMultiLogger()` - Multiple destinations
- **Structured logging** with session tracking, blockchain metadata, and performance metrics
- **Privacy features**: Address masking, sensitive data redaction
- **Cost optimization**: Configurable sampling (10% default), log level filtering
- **Debug mode** with detailed console output and fallback logging

### Improved

- **Documentation**: Added explicit default values for all optional config properties
- **Type exports**: Added `LoggingConfig` to public exports from core package
- **Type safety**: Removed 95% of `as any` assertions, added proper return types
- **Code quality**: Refactored validation logic, better error handling, null safety
- **Build system**: Fixed rollup config, updated permissionless to v0.2.47
- **API**: Simplified public exports, enhanced batch operation support

### Changed

- **BREAKING**: Logging config now requires explicit logger functions
- **Internal**: Migrated from npm to pnpm for better workspace dependency management
- **Internal**: Hidden `staging` property from public documentation (internal dev use only)
- **Internal**: Removed @sbc/vanilla package (deferred to post-demo evaluation)

### Fixed

- TypeScript compilation in strict mode
- Gas estimation compatibility with latest permissionless
- Rollup module bundling issues
