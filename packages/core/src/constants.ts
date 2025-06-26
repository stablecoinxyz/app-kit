import { ChainConfig } from './types';
import { base, baseSepolia } from 'viem/chains';

export const CHAIN_CONFIGS = new Map<number, ChainConfig>([
  [base.id, {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    bundlerUrl: 'https://api.pimlico.io/v2/base/rpc',
    aaProxyUrl: 'https://api.aa.stablecoin.xyz'
  }],
  [baseSepolia.id, {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    bundlerUrl: 'https://api.pimlico.io/v2/base-sepolia/rpc',
    aaProxyUrl: 'https://api.aa.stablecoin.xyz'
  }]
]);

export const ENTRYPOINT_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';



export const SBC_API_KEY_PREFIX = 'sbc-';
