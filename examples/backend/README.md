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
