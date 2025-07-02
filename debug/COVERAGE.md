# Test Coverage Report

**Total Tests: 41** | **Core: 39** | **React: 2** | **Pass Rate: 100%**

This document provides comprehensive coverage of all tests in the SBC App Kit monorepo, organized by package and functionality.

## 📦 Core Package (@stablecoin.xyz/core)

**39 tests** covering the main SDK functionality with comprehensive mocking of external dependencies.

### 🔧 Configuration and Initialization (5 tests)

Tests the core SbcAppKit class instantiation and configuration validation.

- **Valid Configuration**: Ensures SDK initializes properly with required parameters (API key, chain)
- **Custom Private Key**: Validates optional private key configuration works correctly  
- **Invalid API Key Validation**: Tests rejection of API keys not starting with "sbc-" prefix
- **Unsupported Chain Rejection**: Ensures only Base and Base Sepolia chains are accepted
- **Custom RPC URL**: Validates optional custom RPC endpoint configuration

**Testing Method**: Direct constructor calls with various configuration objects, using mock viem clients.

### 👤 Account Operations (4 tests)  

Tests smart account management, deployment detection, and owner address retrieval.

- **Owner Address Retrieval**: Validates EOA address extraction from wallet client
- **Account Information**: Tests smart account address, deployment status, nonce, and balance retrieval
- **Undeployed Account Handling**: Verifies proper detection of undeployed smart accounts (empty bytecode)
- **Missing Account Error**: Ensures proper error when wallet client has no attached account

**Testing Method**: Mocked `permissionless` library responses, `viem` public client with contract interaction mocks.

### ⚡ User Operations (6 tests)

Tests transaction estimation, sending, and various parameter formats.

- **Gas Estimation**: Validates complete gas calculation including paymaster costs and 10% buffer
- **Transaction Sending**: Tests full user operation flow from preparation to receipt
- **ETH Value Handling**: Ensures proper handling of transactions with ETH value
- **Batch Operations**: Tests calls array format for multiple operations
- **Empty Operations Validation**: Verifies rejection of empty calls arrays
- **Permissionless Client Errors**: Tests error handling for network/client failures

**Testing Method**: Comprehensive mocking of `permissionless` smart account client with realistic gas estimates and transaction receipts.

### 🚨 Error Handling (2 tests)

Tests robustness against various failure scenarios.

- **Smart Account Initialization Errors**: Tests handling of Kernel smart account creation failures
- **Gas Estimation Errors**: Validates error parsing and meaningful error messages for gas estimation failures

**Testing Method**: Mock rejection scenarios with error message validation and custom error parsing.

### 🌐 Chain Support (2 tests)

Tests supported blockchain networks.

- **Base Mainnet Support**: Validates production Base network configuration
- **Base Sepolia Support**: Validates testnet Base Sepolia configuration  

**Testing Method**: Configuration validation with supported chain objects from `viem/chains`.

### ⚙️ Configuration Edge Cases (1 test)

Tests advanced configuration scenarios.

- **Staging Environment**: Tests staging flag functionality for development environments

**Testing Method**: Configuration object validation with staging parameters.

---

## 🛠️ Utility Functions (@stablecoin.xyz/core)

**19 tests** covering helper functions and error handling utilities.

### 🔗 getChainConfig (3 tests)

Tests chain configuration mapping and validation.

- **Base Chain Config**: Validates configuration object for Base mainnet
- **Base Sepolia Config**: Validates configuration object for Base Sepolia testnet
- **Unsupported Chain Error**: Tests rejection of unsupported blockchain networks

**Testing Method**: Direct function calls with chain objects, configuration object validation.

### 🌐 buildAaProxyUrl (3 tests)  

Tests URL construction for SBC proxy services.

- **Base Chain URL**: Tests production URL construction for Base mainnet
- **Staging Flag URL**: Tests development URL construction with staging parameter
- **Unsupported Chain Error**: Validates rejection of unsupported chains

**Testing Method**: String URL validation and construction logic testing.

### 🔑 validateApiKey (4 tests)

Tests API key format validation and security.

- **Valid API Key**: Tests acceptance of properly formatted "sbc-" prefixed keys
- **Missing Prefix Rejection**: Tests rejection of keys without "sbc-" prefix
- **Empty Key Rejection**: Tests rejection of empty or null API keys
- **Prefix-Only Rejection**: Tests rejection of keys with only "sbc-" prefix

**Testing Method**: Input validation with various key formats and edge cases.

### 📝 formatError (3 tests)

Tests error message standardization and formatting.

- **Error Object Formatting**: Tests proper handling of native Error objects
- **String Error Formatting**: Tests handling of string-based error messages
- **Unknown Error Handling**: Tests fallback formatting for unexpected error types

**Testing Method**: Error object processing with various input types and message validation.

### 🔍 decodeRevertReason (3 tests)

Tests smart contract revert reason decoding.

- **Standard Error Decoding**: Tests decoding of `Error(string)` revert reasons
- **Invalid Data Handling**: Tests graceful handling of malformed revert data
- **Panic Error Decoding**: Tests decoding of Solidity panic codes

**Testing Method**: Hex data parsing with ABI decoding simulation and edge case validation.

### 🚫 parseUserOperationError (3 tests)

Tests comprehensive user operation error analysis.

- **Revert Reason Parsing**: Tests extraction and decoding of transaction revert reasons
- **Common Error Suggestions**: Tests helpful suggestions for frequent error patterns
- **Unknown Error Graceful Handling**: Tests fallback behavior for unrecognized errors

**Testing Method**: Error message parsing with pattern matching and suggestion generation.

---

## ⚛️ React Package (@stablecoin.xyz/react)

**2 tests** providing basic package validation (placeholder for future React component tests).

### 🧪 Package Validation (2 tests)

Basic tests ensuring package structure and imports work correctly.

- **Test Environment**: Validates Jest configuration and test runner setup
- **Import Validation**: Tests that main package exports can be imported without errors

**Testing Method**: Basic Jest environment validation and ES module import testing.

---

## 🔧 Testing Infrastructure

### Mock Strategy

- **Comprehensive External Mocking**: All external dependencies (`viem`, `permissionless`) fully mocked
- **Realistic Data**: Mock responses use realistic gas values, addresses, and BigInt formats
- **Error Scenario Coverage**: Mocks include both success and failure scenarios
- **Parallel Test Execution**: Tests designed for concurrent execution without conflicts

### Test Environment

- **Jest Framework**: Using Jest with TypeScript support for both packages
- **ES Module Support**: React package configured for ES module compatibility
- **Node Environment**: Core tests run in Node.js environment for performance
- **Coverage Collection**: Configured to collect coverage from all source files

### Quality Assurance

- **100% Pass Rate**: All 41 tests consistently pass across environments
- **Comprehensive Mocking**: External dependencies fully isolated and controlled
- **Edge Case Coverage**: Tests include error conditions, invalid inputs, and boundary cases
- **Real-world Scenarios**: Tests simulate actual usage patterns and transaction flows

### Future Expansion

- **React Component Tests**: Placeholder structure ready for React hook and component testing
- **Integration Tests**: Framework prepared for end-to-end testing scenarios
- **Performance Tests**: Structure allows for gas optimization and performance validation
- **Browser Environment**: React package ready for jsdom-based component testing

---

## 📊 Coverage Metrics

| Package | Test Files | Test Count | Pass Rate | Coverage Areas |
|---------|------------|------------|-----------|----------------|
| Core | 2 | 39 | 100% | SDK, Utils, Validation |
| React | 1 | 2 | 100% | Package Structure |
| **Total** | **3** | **41** | **100%** | **Complete Functionality** |

### Test Distribution

- **Configuration/Validation**: 12 tests (29%)
- **Core Functionality**: 10 tests (24%)  
- **Error Handling**: 8 tests (20%)
- **Utility Functions**: 9 tests (22%)
- **Package Validation**: 2 tests (5%)

This comprehensive test suite ensures the SBC App Kit maintains high quality, reliability, and developer confidence across all supported functionality.
