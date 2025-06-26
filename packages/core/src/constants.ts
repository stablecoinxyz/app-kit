import { ChainConfig } from './types';
import { base, baseSepolia } from 'viem/chains';

export const CHAIN_CONFIGS = new Map<number, ChainConfig>([
  [base.id, {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    aaProxyUrl: 'https://api.aa.stablecoin.xyz'
  }],
  [baseSepolia.id, {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    aaProxyUrl: 'https://api.aa.stablecoin.xyz'
  }]
]);

export const SBC_API_KEY_PREFIX = 'sbc-';
