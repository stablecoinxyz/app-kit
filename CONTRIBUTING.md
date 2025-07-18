# Contributing to SBC App Kit

Thank you for your interest in contributing! We welcome improvements, bug fixes, and new features.

## Project Philosophy

- **Simplicity first:** Prioritize easy, intuitive usage for developers.
- **Managed infrastructure:** Users shouldn't have to set up their own paymasters.
- **Type safety and test coverage:** All code should be type-safe and well-tested.
- **Consistent code style:** Follow the repo's conventions and style guide.

## Repository Structure

- `packages/core` – Core SDK (TypeScript, no React)
- `packages/react` – React bindings (hooks, components)
- `examples/` – Example apps (React, Next.js, backend, etc.)
- `testing/` – (Not in repo) Used for independent npm package testing

## Development Workflow

1. **Clone and install:**

   ```bash
   git clone https://github.com/stablecoinxyz/app-kit.git
   cd app-kit
   pnpm install
   ```

2. **Build all packages:**

   ```bash
   pnpm build
   ```

3. **Run tests:**

   ```bash
   pnpm test
   ```

4. **Run examples:**

   ```bash
   cd examples/react-basic
   pnpm install && pnpm dev:local
   ```

## Making Changes

- Create a new branch for your work.
- Make your changes in the appropriate package (core, react, etc.).
- Follow the code style and naming conventions (see [STYLE_GUIDE.md](./STYLE_GUIDE.md)).
- Add or update tests as needed.
- Run `pnpm test` and ensure all tests pass.

## Code Style

- TypeScript, ES modules, and strict typing.
- Use descriptive names and config objects.
- Keep code DRY and readable.

## Changelogs

- Use [Changesets](https://github.com/changesets/changesets):

  ```bash
  pnpm changeset
  # Follow the prompts to describe your change
  ```

- Changelogs are maintained per package (`core`, `react`).
- For docs-only or trivial changes, use a patch bump and note in the changelog.

## Pull Requests

- Open a PR against the `main` branch.
- Fill out the PR template and describe your changes.
- Ensure all tests and builds pass.
- Be responsive to code review feedback.

## Publishing (Maintainers Only)

- Bump version and update changelog with Changesets.
- Build the package(s):

  ```bash
  pnpm build
  ```

- Publish from the package directory:

  ```bash
  cd packages/core && npm publish --access public
  cd ../react && npm publish --access public
  ```

## Support & Questions

- For help, open an issue or reach out via [Telegram](https://t.me/stablecoin_xyz).

Thank you for helping make SBC App Kit better!
