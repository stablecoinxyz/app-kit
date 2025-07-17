import { SbcAppKit } from '@stablecoin.xyz/core';
import { baseSepolia } from 'viem/chains';
import { type Hex } from 'viem';

// Check for required environment variables
const apiKey = process.env.SBC_API_KEY;
const privateKey = process.env.OWNER_PRIVATE_KEY as Hex;

if (!apiKey) {
  console.warn('Missing SBC_API_KEY environment variable - using placeholder');
}

if (!privateKey || privateKey === '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef') {
  console.warn('Missing or placeholder OWNER_PRIVATE_KEY environment variable');
}

const config = {
  apiKey: apiKey || 'placeholder_api_key',
  chain: baseSepolia,
  privateKey,
};

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

// Export config for client-side (without private key)
export const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_SBC_API_KEY || 'your_api_key_here',
  chain: baseSepolia,
  debug: true,
}; 