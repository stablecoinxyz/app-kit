import { ChainConfig } from './types';
import { base, baseSepolia } from 'viem/chains';

export const CHAIN_CONFIGS = new Map<number, ChainConfig>([
  [base.id, {
    id: 8453,
    name: 'Base',
    idString: 'base',
    rpcUrl: 'https://mainnet.base.org',
    aaProxyUrl: 'https://api.aa.stablecoin.xyz',
    blockExplorerUrl: 'https://basescan.org'
  }],
  [baseSepolia.id, {
    id: 84532,
    name: 'Base Sepolia',
    idString: 'baseSepolia',
    rpcUrl: 'https://sepolia.base.org',
    aaProxyUrl: 'https://api.aa.stablecoin.xyz',
    blockExplorerUrl: 'https://sepolia.basescan.org'
  }]
]);

export const SBC_API_KEY_PREFIX = 'sbc-';
