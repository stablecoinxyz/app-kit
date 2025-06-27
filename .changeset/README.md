# Changesets Guide for SBC App Kit

Quick reference for managing versions and releases in this monorepo.

## 🚀 Basic Workflow

```bash
# 1. Make changes to packages
# 2. Create changeset
pnpm changeset

# 3. When ready to release
pnpm changeset version  # Updates package.json versions
pnpm run release        # Builds and publishes
```

## 📝 Creating Changesets

### Bug Fix (patch: 0.1.0 → 0.1.1)

```bash
pnpm changeset
# Select: @sbc/core
# Type: patch
# Summary: "Fix gas estimation error"
```

### New Feature (minor: 0.1.0 → 0.2.0)

```bash
pnpm changeset  
# Select: @sbc/react
# Type: minor
# Summary: "Add useWallet hook for wallet connection"
```

### Breaking Change (major: 0.1.0 → 1.0.0)

```bash
pnpm changeset
# Select: @sbc/core
# Type: major  
# Summary: "Remove deprecated sendTransaction method"
```

### Multiple Packages

```bash
pnpm changeset
# Select: @sbc/core, @sbc/react (spacebar to select multiple)
# @sbc/core: patch (bug fix)
# @sbc/react: minor (new feature using core fix)
# Summary: "Add batch transactions with improved error handling"
```

## 📋 Common Examples

### Documentation Only (no version bump needed)

```bash
# Don't create changeset for:
# - README updates
# - Comment changes  
# - Internal refactoring that doesn't change API
```

### New Package Release

```bash
pnpm changeset
# Select: @sbc/react
# Type: minor (new package)
# Summary: "Add React hooks and components for gasless transactions"
```

### Dependency Updates

```bash
pnpm changeset
# Select: @sbc/core
# Type: patch
# Summary: "Update viem to v2.31.4 for better type safety"
```

## 🎯 Changeset File Example

```markdown
---
"@sbc/react": minor
"@sbc/core": patch
---

Add React hooks for gasless transactions

- Add useSbcKit() hook for account management
- Add useUserOperation() hook with loading states  
- Fix TypeScript exports in core package
- Update documentation with usage examples

Breaking: Remove deprecated useGasless() hook
```

## 🔄 Release Process

### Regular Release

```bash
# After accumulating several changesets:
pnpm changeset version  # Consumes changesets, updates versions
git add . && git commit -m "Version packages"
pnpm run release       # Builds and publishes to npm
```

### Pre-release (alpha/beta)

```bash
pnpm changeset pre enter alpha
pnpm changeset         # Create changesets normally
pnpm changeset version # Results in: 0.2.0-alpha.0
pnpm run release
pnpm changeset pre exit # When ready for stable release
```

## ⚡ Quick Tips

- **One changeset per logical change** (feature, fix, etc.)
- **Select all affected packages** when creating changesets
- **Write clear summaries** - they become your changelog
- **Use conventional commit style** in summaries
- **Review generated CHANGELOG.md** before publishing
- **Test locally** with `pnpm run build` before releasing

## 📦 Package Selection Guide

- **@sbc/core**: Backend SDK changes, type updates, utilities
- **@sbc/react**: React hooks, components, provider changes  
- **Multiple packages**: When changes span across packages

## 🚨 Before Publishing Checklist

- [ ] All tests pass: `pnpm run test`
- [ ] All packages build: `pnpm run build`  
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Version bumps make sense (patch/minor/major)
- [ ] Changelog entries are clear
