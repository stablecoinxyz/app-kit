/**
 * SBC Kit Basic Usage Example
 * 
 * Before running this example, set the following environment variables:
 * 
 * Required:
 * - SBC_API_KEY: Your SBC API key (starts with 'sbc-')
 * 
 * Optional:
 * - PRIVATE_KEY: Your wallet private key (starts with '0x')
 *   If not provided, a random key will be generated
 * 
 * Usage:
 * ```bash
 * export SBC_API_KEY="sbc-your-api-key-here"
 * export PRIVATE_KEY="0xYourPrivateKeyHere"  # Optional
 * npm run examples
 * ```
 */

import { SbcAppKit } from '../../packages/core/src/index.js';
import { encodeFunctionData } from 'viem';
import { baseSepolia } from 'viem/chains';

async function main() {
  // Read configuration from environment variables
  const apiKey = process.env.SBC_API_KEY;
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;

  if (!apiKey) {
    throw new Error('SBC_API_KEY environment variable is required');
  }

  // Initialize the SDK
  const sbcApp = new SbcAppKit({
    apiKey,
    chain: baseSepolia as any, // Type cast to avoid viem version compatibility issues
    privateKey, // Optional: will auto-generate if not provided
  });

  console.log('🚀 SBC Kit initialized!');
  console.log('Chain:', sbcApp.getChain().name);
  console.log('Owner address:', sbcApp.getOwnerAddress());
  console.log('Private key source:', privateKey ? 'Environment variable' : 'Auto-generated');

  // Get account information
  const account = await sbcApp.getAccount();
  console.log('\n📋 Account Info:');
  console.log('Account address:', account.address);
  console.log('Is deployed:', account.isDeployed);
  console.log('Nonce:', account.nonce);

  // Example: Send a simple transaction - send 0 ETH to the zero address
  const exampleParams = {
    to: '0x0000000000000000000000000000000000000000' as const,
    data: '0x' as const,
    value: '0'
  };

  try {
    // Estimate gas first
    console.log('\n⛽ Estimating gas costs...');
    const estimate = await sbcApp.estimateUserOperation(exampleParams);
    console.log('Gas estimate:', estimate);

    // Uncomment to send actual transaction
    console.log('\n📤 Sending gasless transaction...');
    const result = await sbcApp.sendUserOperation(exampleParams);
    console.log('✅ Transaction successful!');
    console.log('User Operation Hash:', result.userOperationHash);
    console.log('Transaction Hash:', result.transactionHash);
    console.log('Block Number:', result.blockNumber);
    console.log('Gas Used:', result.gasUsed);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ERC-20 Transfer Example - send 1 SBC to the SBC contract
async function erc20TransferExample() {
  const apiKey = process.env.SBC_API_KEY;
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;

  if (!apiKey) {
    throw new Error('SBC_API_KEY environment variable is required');
  }

  const sbcApp = new SbcAppKit({
    apiKey,
    chain: baseSepolia as any, // Type cast to avoid viem version compatibility issues
    privateKey,
  });

  console.log('\n💰 ERC-20 Transfer Example');

  // Encode transfer function call
  const transferData = encodeFunctionData({
    abi: [
      {
        name: 'transfer',
        type: 'function',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ]
      }
    ],
    functionName: 'transfer',
    args: [
      '0x4a9f2769438FEAA328C28404Dd29d1917589FC45', // recipient
      BigInt('1000000') // 1 SBC (6 decimals)
    ]
  });

  const params = {
    to: '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16' as const, // SBC on Base Sepolia
    data: transferData,
    value: '0'
  };

  try {
    console.log('Estimating ERC-20 transfer...');
    const estimate = await sbcApp.estimateUserOperation(params);
    console.log('Gas estimate for transfer:', estimate);

    // Uncomment to send
    // const result = await sbcApp.sendUserOperation(params);
    // console.log('✅ ERC-20 transfer successful!', result);

  } catch (error) {
    console.error('❌ Transfer failed:', error);
  }
}

// Run examples
main()
  .then(() => erc20TransferExample())
  .catch(console.error);
