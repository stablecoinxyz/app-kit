# 📦 Publishing Guide

Complete guide for publishing SBC App Kit packages to npm with automated workflows.

## 🚀 Quick Publishing (Recommended)

### **One-Command Release:**
```bash
npm run release
```

This automatically:
- ✅ Runs linting, tests, and builds
- ✅ Applies changesets (updates versions)
- ✅ Converts `workspace:*` → real versions
- ✅ Publishes all packages with `--access public`
- ✅ Updates CHANGELOGs

## 📋 Step-by-Step Publishing

### **1. Create Changesets (During Development)**
```bash
# Add a changeset for your changes
npm run changeset

# Check what will be released
npm run changeset:status
```

**Changeset Types:**
- `patch` - Bug fixes (1.0.0 → 1.0.1)
- `minor` - New features (1.0.0 → 1.1.0)  
- `major` - Breaking changes (1.0.0 → 2.0.0)

### **2. Pre-Publish Checks**
```bash
# Dry run - see what would be published
npm run publish:check

# Manual pre-publish steps (automatic in 'release')
npm run pre-publish
```

### **3. Version & Publish**
```bash
# Option A: Full automated release
npm run release

# Option B: Manual steps
npm run changeset:version  # Updates versions + CHANGELOGs
npm run changeset:publish  # Publishes packages
```

## 🔧 Package Configuration

### **Development Dependencies:**
```json
// packages/react/package.json
{
  "dependencies": {
    "@stablecoin.xyz/core": "workspace:*"  // ← Keep this for dev
  }
}
```

### **Auto-Converted for Publishing:**
```json
// Changesets automatically converts to:
{
  "dependencies": {
    "@stablecoin.xyz/core": "^1.0.0"  // ← Real version for npm
  }
}
```

## 🛡️ Safety Features

### **Automatic Checks:**
- ✅ **Linting** - Code quality validation
- ✅ **Tests** - All tests must pass
- ✅ **Build** - Packages must compile
- ✅ **Git Clean** - No uncommitted changes
- ✅ **Access Public** - Prevents private package errors

### **Manual Verification:**
```bash
# Check package contents before publishing
npm run publish:check

# View published package info
npm view @stablecoin.xyz/core
npm view @stablecoin.xyz/react
```

## 👥 Team Workflow

### **Feature Development:**
1. Make changes to packages
2. Add changeset: `npm run changeset`
3. Commit changeset with your PR
4. Merge to main

### **Release Process:**
1. Review pending changesets: `npm run changeset:status`
2. Run full release: `npm run release`
3. Push changes: `git push origin main --follow-tags`
4. Create GitHub release (optional)

## 📜 Available Scripts

```bash
# Development
npm run build                    # Build all packages
npm run test                     # Run all tests
npm run lint                     # Lint all packages

# Changesets
npm run changeset                # Create new changeset
npm run changeset:status         # See pending releases
npm run changeset:version        # Apply changesets (bump versions)
npm run changeset:publish        # Publish to npm

# Publishing
npm run pre-publish              # Run lint + test + build
npm run publish:check            # Dry run publishing
npm run publish:packages         # Full publish workflow
npm run release                  # Complete release (recommended)
```

## 🚨 Troubleshooting

### **Common Issues:**

#### `402 Payment Required`
**Fix:** Packages have `publishConfig.access: "public"` ✅

#### `Workspace dependency not found`
**Fix:** Use `workspace:*` in development, changesets handles conversion ✅

#### `Git unclean working tree`
**Fix:** Commit all changes before publishing
```bash
git add -A && git commit -m "chore: prepare for release"
```

#### `Package already exists`
**Fix:** Bump version or check if already published
```bash
npm view @stablecoin.xyz/core version
```

### **Emergency Unpublish:**
```bash
# Only within 72 hours of publish
npm unpublish @stablecoin.xyz/core@1.0.0

# Better: Publish a patch version instead
npm run changeset  # Select 'patch'
npm run release
```

## 🎯 Best Practices

### **Changesets:**
- ✅ **One changeset per logical change**
- ✅ **Clear, descriptive summaries**
- ✅ **Include migration notes for breaking changes**
- ✅ **Link related packages in same changeset**

### **Versioning:**
- ✅ **Follow semantic versioning strictly**
- ✅ **Use `patch` for bug fixes**
- ✅ **Use `minor` for new features**
- ✅ **Use `major` for breaking changes**

### **Testing:**
- ✅ **Test packages in isolation**
- ✅ **Verify examples still work**
- ✅ **Test in external project before major releases**

### **Documentation:**
- ✅ **Update README for new features**
- ✅ **Add migration guides for breaking changes**
- ✅ **Keep CHANGELOG accurate (auto-generated)**

## 🔗 Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v7/commands/npm-publish)
- [Package.json Fields](https://docs.npmjs.com/cli/v7/configuring-npm/package-json)

---

**Need help?** Run `npm run changeset:status` to see what's queued for release! 