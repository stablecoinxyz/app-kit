# SBC App Kit – Style Guide

This style guide ensures consistency, readability, and maintainability across all code in the SBC App Kit project. All contributors should follow these guidelines.

## General Principles

- Prioritize clarity and simplicity.
- Prefer configuration objects over multiple parameters.
- Reuse existing utilities and validation logic.
- Maintain 100% type safety and test coverage.
- Keep code DRY (Don’t Repeat Yourself).

## TypeScript/JavaScript

- Use TypeScript for all code (no plain JS files).
- Use ES modules (`import`/`export`).
- Always type function parameters and return values.
- Prefer explicit types over `any`.
- Use `readonly` for immutable properties.
- Use `const` and `let` (never `var`).
- Use object destructuring and spread syntax for merging objects.
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safety.

## Naming Conventions

- Use descriptive names with purpose suffixes: `AaProxyConfig`, `SbcAppKitConfig`, `Result`, `Estimate`, `Info`.
- Use action-oriented method names: `buildAaProxyUrl`, `calculateGasCost`.
- Prefix private methods: `validateConfig`, `initializeSmartAccountClient`.
- Use camelCase for variables and functions, PascalCase for types/classes/components.
- Use meaningful names even for temporary variables.

## File & Directory Structure

- Group related code by feature/module.
- Place types in a `types/` directory or `types.ts` file.
- Place React components in a `components/` directory.
- Place hooks in a `hooks/` directory.
- Place tests in `__tests__/` directories.

## Formatting

- Use 2 spaces for indentation.
- Use Prettier for code formatting (if available).
- Use single quotes for strings, except in JSON.
- Place a space after `//` in comments.
- Keep lines under 100 characters when possible.

## React

- Always fix React hooks dependency warnings.
- Use `useCallback` for functions in `useEffect` deps.
- Include all dependencies in hook dependency arrays.
- Memoize functions with `useCallback`, expensive calculations with `useMemo`.
- Use Promise.all for parallel async operations in hooks.
- Provide fallback values for failed async operations.
- Use try/catch in async `useCallback` functions.
- Set loading states appropriately during async operations.
- Do not wrap sync operations in `Promise.resolve()`.
- Use monospace fonts for addresses and hex data display.

## Error Handling

- Provide helpful error messages with context.
- Use consistent error patterns across codebase.
- Use try/catch for async operations and surface errors to the UI when relevant.

## Performance

- Use `Promise.all()` for parallel operations.
- Extract complex calculations into separate methods.
- Optimize BigInt operations: `(value * 110n) / 100n` not `(value * (100n + buffer)) / 100n`.

## Tests

- Maintain 100% test pass rate.
- Add/modify tests for all new features and bug fixes.
- Use proper mocks for external dependencies.
- Remove outdated or deprecated test files.

## Documentation

- Keep documentation concise and to the point.
- Update README and API docs for all user-facing changes.
- Add or update JSDoc comments for public methods and types.

---

By following this style guide, you help keep the SBC App Kit codebase clean, consistent, and easy to maintain for everyone.
