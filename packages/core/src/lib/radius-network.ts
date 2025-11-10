import { Chain, defineChain } from 'viem'

export const radiusTestnet = defineChain({
  id: 1223953,
  name: 'Radius Testnet',
  nativeCurrency: {
    name: 'USD',
    symbol: 'USD',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.radiustech.xyz']
    },
  },
  blockExplorers: {
    default: {
      name: 'Radius Explorer',
      url: 'https://testnet.radiustech.xyz/testnet/explorer'
    },
  },
  testnet: true,
}) as unknown as Chain;

// TestSBC with EIP-2612 support
export const TestSBC_CONTRACT_ADDRESS = "0xbc14568925d9359a203b5c5c6de838c8baeebf5a";

// Account Abstraction Addresses
export const RADIUS_TESTNET_ENTRY_POINT = "0x9b443e4bd122444852B52331f851a000164Cc83F";
export const RADIUS_TESTNET_SIMPLE_ACCOUNT_FACTORY = "0x4DEbDe0Be05E51432D9afAf61D84F7F0fEA63495";