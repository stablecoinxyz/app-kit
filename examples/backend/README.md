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

## 🚀 Logging Options

### **Option 1: Console Logging (Development)**

```typescript
import { SbcAppKit, createConsoleLogger } from '@sbc/core';

const sbcApp = new SbcAppKit({
  apiKey: 'sbc-your-key',
  chain: baseSepolia,
  logging: {
    enabled: true,
    level: 'info',
    logger: createConsoleLogger(true), // structured JSON logs
    context: { appName: 'my-app' }
  }
});
```

### **Option 2: BetterStack (Recommended for Production)**

```typescript
import { SbcAppKit, createBetterStackLogger } from '@sbc/core';

const sbcApp = new SbcAppKit({
  apiKey: 'sbc-your-key',
  chain: baseSepolia,
  logging: {
    enabled: true,
    level: 'info',
    logger: createBetterStackLogger('bt_your_token_here'),
    context: { appName: 'my-app', environment: 'production' }
  }
});
```

### **Option 3: Multiple Destinations**

```typescript
import { SbcAppKit, createBetterStackLogger, createConsoleLogger, createMultiLogger } from '@sbc/core';

const sbcApp = new SbcAppKit({
  apiKey: 'sbc-your-key',
  chain: baseSepolia,
  logging: {
    enabled: true,
    level: 'info',
    logger: createMultiLogger(
      createBetterStackLogger('bt_token'),
      createConsoleLogger(true)  // Local debugging + remote logging
    ),
    context: { appName: 'my-app' }
  }
});
```

### **Option 4: Custom Integration**

```typescript
import { SbcAppKit } from '@sbc/core';

// Your custom logger
const customLogger = async (level, message, metadata) => {
  // Send to your endpoint
  await fetch('https://your-logging-service.com/logs', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer your-token' },
    body: JSON.stringify({ level, message, metadata })
  });
};

const sbcApp = new SbcAppKit({
  apiKey: 'sbc-your-key',
  chain: baseSepolia,
  logging: {
    enabled: true,
    level: 'info',
    logger: customLogger
  }
});
```

## 🚀 Complete BetterStack Setup Guide

### Step 1: Create BetterStack Account

1. Go to [betterstack.com](https://betterstack.com) → "Start free trial"
2. Verify your email and complete setup
3. Free tier: 1GB/month (perfect for testing)

### Step 2: Create Log Source

1. **Dashboard**: Click "Logs" in the sidebar
2. **Add Source**: Click "Connect source"
3. **Select HTTP**: Choose "HTTP" as source type
4. **Name it**: e.g., "SBC App Kit Production"
5. **Copy Token**: Save the source token

### Step 3: Test Your Connection

```bash
# Set your token
export BETTERSTACK_SOURCE_TOKEN="bt_your_token_here"

# Run the test script
node test-betterstack.js
```

You should see: ✅ Successfully connected to BetterStack!

### Step 4: Configure Your App

```bash
# Required
export SBC_API_KEY="sbc-your-api-key-here"

# Production logging (paste your BetterStack token)
export BETTERSTACK_SOURCE_TOKEN="bt_1234567890abcdef"
export NODE_ENV="production"
export USER_ID="your-user-identifier"

# Optional
export PRIVATE_KEY="0xYourPrivateKeyHere"
export SBC_DEBUG="true"
```

### Step 5: Update Your Code

```typescript
import { SbcAppKit } from '@sbc/core';

const sbcApp = new SbcAppKit({
  apiKey: process.env.SBC_API_KEY!,
  chain: baseSepolia,
  
  // BetterStack logging - SDK handles everything automatically!
  logging: {
    enabled: true,
    level: 'info',
    betterStack: {
      sourceToken: process.env.BETTERSTACK_SOURCE_TOKEN!
    },
    context: {
      appName: 'my-dapp-backend',
      environment: process.env.NODE_ENV || 'development',
      userId: 'user_123'
    },
    samplingRate: 0.1 // Log 10% of operations in production
  }
});

// That's it! All operations are now logged to BetterStack
const account = await sbcApp.getAccount();
```

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

## 🔍 Querying Your Logs in BetterStack

### Find Failed Operations

```
level:error
```

### Track Specific User

```
userId:"user_123"
```

### Monitor High Gas Usage

```
message:gas_estimation_completed AND gasUsed:>200000
```

### Chain-Specific Issues

```
chainName:"Base Sepolia"
```

### Session Flow Tracking

```
sessionId:"sbc_1705312200_abc123"
```

### Recent User Operations

```
message:user_operation_confirmed AND timestamp:>2024-01-15
```

## 💰 Cost Optimization

**Smart Defaults:**

- ✅ 10% sampling in production (configurable)
- ✅ Error logs always captured
- ✅ Essential data only
- ✅ Automatic fallback to console

**Typical Costs:**

- **Development**: Free (under 1GB/month)
- **Small Production**: $10-30/month  
- **Scale**: $50-100/month vs $500+ with enterprise tools

## 🛠️ Troubleshooting

### Logs Not Appearing?

1. **Check token**: Verify `BETTERSTACK_SOURCE_TOKEN` is correct
2. **Test connection**: Run `node test-betterstack.js`
3. **Check sampling**: Set `samplingRate: 1.0` for testing
4. **Enable debug**: Set `SBC_DEBUG=true` to see fallback logs

### Too Many Logs?

1. **Increase sampling**: Set `samplingRate: 0.01` (1%)
2. **Raise log level**: Use `level: 'warn'` or `level: 'error'`
3. **Filter events**: Only log errors in production

### Need Custom Integration?

```typescript
logging: {
  enabled: true,
  customLogger: async (level, message, metadata) => {
    // Send to your custom endpoint
    await yourCustomLogger(level, message, metadata);
  }
}
```

## 📊 Available Logging Adapters

| Adapter | Import | Use Case |
|---------|--------|----------|
| `createConsoleLogger()` | Always available | Development, debugging |
| `createBetterStackLogger()` | Always available | Production (recommended) |
| `createDatadogLogger()` | Always available | Enterprise observability |
| `createHttpLogger()` | Always available | Custom endpoints |
| `createMultiLogger()` | Always available | Multiple destinations |

## 🔍 What Gets Logged

**✅ Automatic Events:**

- `sdk_initialized` - Setup and configuration
- `user_operation_sent` - Gasless transactions initiated
- `user_operation_confirmed` - Transactions completed
- `gas_estimation_completed` - Gas cost calculations
- `account_info_retrieved` - Smart account queries
- All errors with full context

**✅ Rich Metadata:**

- Session tracking
- Chain information  
- Transaction hashes
- Gas costs
- Performance metrics
- User context

## 💰 Cost Comparison

| Solution | Bundle Impact | Monthly Cost | Setup Time |
|----------|---------------|--------------|------------|
| Console Logger | 0 KB | Free | 1 minute |
| BetterStack | ~2 KB | $10-50 | 5 minutes |
| Custom HTTP | ~1 KB | Varies | 10 minutes |
| Enterprise (Datadog) | ~5 KB | $500+ | 1+ hours |

## 🚀 Production Best Practices

### 1. Environment-Based Configuration

```typescript
const getLogger = () => {
  if (process.env.NODE_ENV === 'production') {
    return createBetterStackLogger(process.env.BETTERSTACK_TOKEN!);
  }
  return createConsoleLogger(true);
};

const sbcApp = new SbcAppKit({
  logging: {
    enabled: true,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    logger: getLogger(),
    samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  }
});
```

### 2. Error-Only Logging (Ultra Minimal)

```typescript
const sbcApp = new SbcAppKit({
  logging: {
    enabled: true,
    level: 'error', // Only log failures
    logger: createBetterStackLogger(token),
    samplingRate: 1.0 // Always log errors
  }
});
```

### 3. Development + Production

```typescript
const logger = process.env.BETTERSTACK_TOKEN
  ? createMultiLogger(
      createBetterStackLogger(process.env.BETTERSTACK_TOKEN),
      createConsoleLogger(false) // Simple console for local dev
    )
  : createConsoleLogger(true);
```

This architecture gives you **complete flexibility** while keeping the core SDK lightweight! 🎯
