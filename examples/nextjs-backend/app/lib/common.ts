import { baseSepolia, base } from "viem/chains";
import { Chain } from "viem";

export const CHAIN = (process.env.NEXT_PUBLIC_CHAIN as string === 'base') ? base : baseSepolia;

export const SBC_TOKEN_ADDRESS = (chain: Chain) => {
  if (chain.id === baseSepolia.id) {
    return '0xf9FB20B8E097904f0aB7d12e9DbeE88f2dcd0F16';
  } else if (chain.id === base.id) {
    return '0xfdcC3dd6671eaB0709A4C0f3F53De9a333d80798';
  }
  throw new Error('Unsupported chain');
};
  
export const SBC_DECIMALS = (chain: Chain) => {
  if (chain.id === baseSepolia.id) {
    return 6;
  } else if (chain.id === base.id) {
    return 18;
  }
  throw new Error('Unsupported chain');
};

export const chainExplorer = (chain: Chain) => {
  if (chain.id === baseSepolia.id) {
    return 'https://sepolia.basescan.org';
  } else if (chain.id === base.id) {
    return 'https://basescan.org';
  }
  throw new Error('Unsupported chain');
};