# SBC App Kit - TODO & Future Plans

## 🚀 Initial Release Scope (v0.1.0)

**Target**: Demo for talk with Base and Base Sepolia support

### ✅ Current Packages

- **@stablecoin.xyz/core** - Backend TypeScript SDK
- **@stablecoin.xyz/react** - React hooks and components

### 🎯 Demo Goals

- Show gasless transactions on Base Mainnet and Base Sepolia
- Demonstrate React integration with live UI
- Showcase account abstraction benefits during presentation

## 📋 Future Considerations

### @stablecoin.xyz/vanilla - Vanilla JavaScript Package

**Removed for initial release** - Will reconsider post-demo based on:

#### 🎯 **Potential Value**

- **Broader ecosystem support**: Vue.js, Angular, Svelte, plain HTML/JS
- **Lower barrier to entry**: No React knowledge required
- **Lighter bundle size**: ~50KB vs ~200KB+ with React dependencies
- **CDN distribution**: Simple `<script>` tag integration
- **Legacy compatibility**: WordPress plugins, browser extensions, existing codebases

#### 📊 **Market Opportunity**

- Vue.js: 4M+ weekly npm downloads
- Angular: 3M+ weekly npm downloads  
- Plain JavaScript: Still powers millions of websites
- WordPress: 40% of all websites need vanilla JS integrations

#### 🏗️ **Technical Approach (If Implemented)**

```javascript
// Simple, framework-agnostic API
import { SbcKit } from '@stablecoin.xyz/vanilla';

const sbc = new SbcKit({
  apiKey: 'your-key',
  chain: 'base'
});

// Promise-based API (no React hooks)
const account = await sbc.getAccount();
const result = await sbc.sendUserOperation({ to: '0x...', data: '0x...' });

// Event-based updates (instead of React state)
sbc.on('accountChanged', (account) => {
  updateUI(account);
});
```

#### 🎨 **Architecture Strategy**

```text
@stablecoin.xyz/core     → Node.js/backend logic (✅ Exists)
@stablecoin.xyz/vanilla  → Browser-compatible wrapper of core (🤔 Future)
@stablecoin.xyz/react    → React hooks around vanilla (✅ Exists, could refactor)
@stablecoin.xyz/vue      → Vue composables around vanilla (🔮 Far future)
```

#### 📈 **Decision Criteria**

- **Post-demo feedback**: Do developers ask for non-React support?
- **Integration requests**: WordPress, Shopify, browser extension needs?
- **Competition analysis**: What do other Web3 SDKs provide?
- **Resource availability**: Engineering bandwidth for maintenance
- **Market traction**: Is React package sufficient for growth?

## 🔄 **Review Timeline**

- **Phase 1** (Current): Focus on React package and demo success
- **Phase 2** (Post-demo): Evaluate vanilla package need based on:
  - Developer feedback
  - Integration partnership opportunities  
  - Competitive landscape
  - Resource allocation

## 💡 **Other Future Enhancements**

### Additional Networks

- Polygon, Arbitrum, Optimism support
- Multi-chain transaction batching

### Advanced Features  

- Social login integration
- Hardware wallet support
- Mobile SDK (React Native)
- Advanced transaction analytics

### Developer Experience

- CLI tools for scaffolding
- Browser extension for testing
- Comprehensive documentation site
- Video tutorials and examples

---

**Note**: This TODO reflects current priorities. The vanilla package decision should be revisited after the initial demo and based on real developer feedback and market demand.
