import { ChainConfig } from './types';
import { base, baseSepolia } from 'viem/chains';
import { radiusTestnet } from './lib/radius-network';

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
  }],
  [radiusTestnet.id, {
    id: 1223953,
    name: 'Radius Testnet',
    idString: 'radiusTestnet',
    rpcUrl: 'https://rpc.testnet.radiustech.xyz',
    aaProxyUrl: 'https://api.aa.stablecoin.xyz',
    blockExplorerUrl: 'https://testnet.radiustech.xyz/testnet/explorer'
  }]
]);

export const SBC_API_KEY_PREFIX = 'sbc-';
