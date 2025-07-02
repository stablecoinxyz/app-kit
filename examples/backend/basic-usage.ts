/**
 * SBC Kit Basic Usage Example
 * 
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Fill in your SBC_API_KEY and other values
 * 3. Run: npm run start
 */

import dotenv from 'dotenv';
import { SbcAppKit, createConsoleLogger } from '../../packages/core/src/index.js';
import { baseSepolia } from 'viem/chains';

// Load environment variables from .env file
dotenv.config();

async function main() {
  const apiKey = process.env.SBC_API_KEY;
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  const debug = process.env.SBC_DEBUG === 'true';
  const environment = process.env.NODE_ENV || 'development';

  if (!apiKey) {
    throw new Error('SBC_API_KEY environment variable is required');
  }

  const logger = createConsoleLogger(true);

  const loggingConfig = {
    enabled: true,
    level: 'info' as const,
    logger,
    context: {
      appName: 'my-dapp-backend',
      environment,
      version: '1.0.0',
      userId: 'unknown',
      sessionId: `session_${Date.now()}`
    },
    includeSensitive: false,
    samplingRate: environment === 'production' ? 0.1 : 1.0
  };

  const sbcApp = new SbcAppKit({
    apiKey,
    chain: baseSepolia as any,
    privateKey,
    debug,
    logging: loggingConfig
  });

  console.log('🚀 SBC Kit initialized with pluggable logging');
  console.log('Chain:', sbcApp.getChain().name);
  console.log('Owner:', sbcApp.getOwnerAddress());

  const account = await sbcApp.getAccount();
  console.log('\n📋 Account:', account.address);
  console.log('Deployed:', account.isDeployed);
  console.log('Nonce:', account.nonce);

  // Simple transaction example
  await sendSimpleTransaction(sbcApp);
  
  console.log('🎉 Done!');
}

async function sendSimpleTransaction(sbcApp: SbcAppKit) {
  const params = {
    to: '0x0000000000000000000000000000000000000000' as const,
    data: '0x' as const,
    value: '0'
  };

  try {
    console.log('\n⛽ Estimating gas...');
    const estimate = await sbcApp.estimateUserOperation(params);
    console.log('Total gas cost:', estimate.totalGasCost, 'wei');

    console.log('\n📤 Sending transaction...');
    const result = await sbcApp.sendUserOperation(params);
    console.log('✅ Success! Tx:', result.transactionHash);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);
