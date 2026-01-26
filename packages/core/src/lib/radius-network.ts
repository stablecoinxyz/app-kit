import { Chain, defineChain } from 'viem'

export const radiusTestnet = defineChain({
  id: 72344,
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
export const TestSBC_CONTRACT_ADDRESS = "0x4ace1a89b13bbe0101f73eb47bb83ac711cb2fad";

// Account Abstraction Addresses
export const RADIUS_TESTNET_ENTRY_POINT = "0xfA15FF1e8e3a66737fb161e4f9Fa8935daD7B04F";
export const RADIUS_TESTNET_SIMPLE_ACCOUNT_FACTORY = "0x7d8fB3E53d345601a02C3214e314f28668510b03";