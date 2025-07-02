# SBC App Kit Backend Examples

## Quick Start

### Option 1: Using .env file (Recommended)

```bash
npm install

# Create .env file
cat > .env << EOF
SBC_API_KEY=sbc-your-api-key-here
PRIVATE_KEY=0xYourPrivateKeyHere
SBC_DEBUG=true
NODE_ENV=development
USER_ID=your-user-id
EOF

npm run start
```

### Option 2: Using environment variables

```bash
npm install
export SBC_API_KEY="sbc-your-api-key-here"
npm run start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SBC_API_KEY` | ✅ | Your SBC API key from the dashboard |
| `PRIVATE_KEY` | ❌ | Custom private key (auto-generated if not provided) |
| `SBC_DEBUG` | ❌ | Enable debug logging (`true`/`false`) |
| `NODE_ENV` | ❌ | Environment identifier for logging |
| `USER_ID` | ❌ | User identifier for logging context |

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
