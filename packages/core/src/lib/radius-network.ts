import { Chain, defineChain } from 'viem'

export const radiusTestnet = defineChain({
  id: 72344,
  name: 'Radius Testnet',
  nativeCurrency: {
    name: 'RUSD',
    symbol: 'RUSD',
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
      url: 'https://testnet.radiustech.xyz'
    },
  },
  testnet: true,
}) as unknown as Chain;

export const radius = defineChain({
  id: 723487,
  name: 'Radius',
  nativeCurrency: {
    name: 'RUSD',
    symbol: 'RUSD',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.radiustech.xyz']
    },
  },
  blockExplorers: {
    default: {
      name: 'Radius Explorer',
      url: 'https://network.radiustech.xyz'
    },
  },
}) as unknown as Chain;

// SBC Token on Radius (same address on both testnet and mainnet)
export const SBC_CONTRACT_ADDRESS_RADIUS = "0x33ad9e4BD16B69B5BFdED37D8B5D9fF9aba014Fb";

// Legacy alias — TestSBC is now the real SBC token
export const TestSBC_CONTRACT_ADDRESS = SBC_CONTRACT_ADDRESS_RADIUS;

// Account Abstraction Addresses (deterministically deployed, same on both networks)
export const RADIUS_ENTRY_POINT = "0xfA15FF1e8e3a66737fb161e4f9Fa8935daD7B04F";
export const RADIUS_SIMPLE_ACCOUNT_FACTORY = "0x7d8fB3E53d345601a02C3214e314f28668510b03";

// Legacy aliases for backwards compatibility
export const RADIUS_TESTNET_ENTRY_POINT = RADIUS_ENTRY_POINT;
export const RADIUS_TESTNET_SIMPLE_ACCOUNT_FACTORY = RADIUS_SIMPLE_ACCOUNT_FACTORY;