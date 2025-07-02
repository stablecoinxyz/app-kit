# SBC App Kit Backend Examples

## Quick Start

```bash
npm install
export SBC_API_KEY="sbc-your-api-key-here"
npm run examples:backend
```

## 🔌 Pluggable Logging Architecture

The SDK uses a **plugin-based logging system** - choose only what you need!

### **✅ Benefits:**

- **Lightweight**: Core SDK stays minimal
- **Flexible**: Switch between logging platforms easily
- **No Vendor Lock-in**: Use any logging service
- **Custom Solutions**: Build your own adapters


## 📊 What Gets Logged Automatically

**✅ All Operations:**

- Smart account initialization
- User operations (gasless transactions)
- Gas estimations
- Account info retrieval
- Errors and failures

**✅ Rich Metadata:**

- Chain ID and name
- Session tracking  
- Transaction hashes
- Gas costs and performance
- User context
- Error details

**✅ Privacy & Security:**

- Addresses masked: `0x1234...abcd`
- Private keys never logged
- Sensitive data redacted
- Configurable sampling
