import { SbcAppKit, type SbcAppKitConfig } from '@stablecoin.xyz/core';
import { base, baseSepolia, type Chain } from 'viem/chains';
import { type Hex } from 'viem';

// Check for required environment variables
const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base as Chain : baseSepolia as Chain;
const rpcUrl = process.env.RPC_URL;
const apiKey = process.env.SBC_API_KEY;
const privateKey = process.env.OWNER_PRIVATE_KEY as Hex;

if (!apiKey) {
  console.warn('Missing SBC_API_KEY environment variable');
  throw new Error('Missing SBC_API_KEY environment variable');
}

if (!privateKey) {
  console.warn('Missing OWNER_PRIVATE_KEY environment variable');
  throw new Error('Missing OWNER_PRIVATE_KEY environment variable');
}

const config = {
  chain,
  apiKey,
  privateKey,
} as SbcAppKitConfig;

if (rpcUrl) {
  config.rpcUrl = rpcUrl;
}

// Singleton instance for server-side operations
let sbcAppKitInstance: SbcAppKit | null = null;

export async function getSbcAppKit(): Promise<SbcAppKit & {
  getPublicClient: () => any,
  getWalletClient: () => any,
  getConfig: () => any,
}> {
  if (!sbcAppKitInstance) {
    sbcAppKitInstance = new SbcAppKit(config);

    // --- Deploy smart account if needed ---
    try {
      const accountInfo = await sbcAppKitInstance.getAccount();
      console.log('accountInfo', accountInfo);
      if (!accountInfo.isDeployed) {
        await sbcAppKitInstance.sendUserOperation({
          to: '0x0000000000000000000000000000000000000000',
          data: '0x',
          value: '0',
        });
      }
    } catch (err) {
      console.error('Failed to check or deploy smart account:', err);
    }
    // --- End deploy logic ---
  }
  // Add public getters for private fields
  return Object.assign(sbcAppKitInstance, {
    getPublicClient: () => (sbcAppKitInstance as any).publicClient,
    getWalletClient: () => (sbcAppKitInstance as any).walletClient,
    getConfig: () => (sbcAppKitInstance as any).config,
  });
}

// Helper functions for common operations
export function getOwnerAddress(): string {
  try {
    // Return the owner address directly from the private key
    // Since getOwnerAddress() from SbcAppKit is synchronous
    const sbcAppKit = new SbcAppKit(config);
    return sbcAppKit.getOwnerAddress();
  } catch (error) {
    console.error('Failed to get owner address:', error);
    // Return a placeholder address if there's an error
    return '0x0000000000000000000000000000000000000000';
  }
}

export async function sendUserOperation(params: any) {
  const sbcAppKit = await getSbcAppKit();
  return sbcAppKit.sendUserOperation(params);
}
