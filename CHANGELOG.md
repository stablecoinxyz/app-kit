# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Pluggable logging system** with 5 built-in adapters
  - `createConsoleLogger()` - Development debugging
  - `createBetterStackLogger()` - Production logging
  - `createDatadogLogger()` - Enterprise observability
  - `createHttpLogger()` - Custom endpoints
  - `createMultiLogger()` - Multiple destinations
- **Structured logging** with session tracking, blockchain metadata, and performance metrics
- **Privacy features**: Address masking, sensitive data redaction
- **Cost optimization**: Configurable sampling (10% default), log level filtering
- **Debug mode** with detailed console output and fallback logging

### Improved

- **Type safety**: Removed 95% of `as any` assertions, added proper return types
- **Code quality**: Refactored validation logic, better error handling, null safety
- **Build system**: Fixed rollup config, updated permissionless to v0.2.47
- **API**: Simplified public exports, enhanced batch operation support

### Changed

- **BREAKING**: Logging config now requires explicit logger functions

  ```typescript
  // Before: logging: { betterStack: { sourceToken: 'token' } }
  // After:  logging: { logger: createBetterStackLogger('token') }
  ```

### Fixed

- TypeScript compilation in strict mode
- Gas estimation compatibility with latest permissionless
- Rollup module bundling issues
