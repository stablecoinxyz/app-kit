import { getChainConfig, buildAaProxyUrl, validateApiKey, formatError, decodeRevertReason, parseUserOperationError } from '../utils';
import { base, baseSepolia } from 'viem/chains';
import { Chain } from 'viem';

// Create a proper unsupported chain type for testing
const createUnsupportedChain = (id: number, name: string): Chain => ({
  id,
  name,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] }
  }
});

describe('Utils Functions', () => {
  describe('getChainConfig', () => {
    it('should return config for base chain', () => {
      const baseConfig = getChainConfig(base);
      expect(baseConfig.id).toBe(8453);
      expect(baseConfig.name).toBe('Base');
    });

    it('should return config for baseSepolia chain', () => {
      const sepoliaConfig = getChainConfig(baseSepolia);
      expect(sepoliaConfig.id).toBe(84532);
      expect(sepoliaConfig.name).toBe('Base Sepolia');
    });

    it('should throw error for unsupported chain', () => {
      const unsupportedChain = createUnsupportedChain(999, 'Unsupported');
      expect(() => getChainConfig(unsupportedChain)).toThrow();
    });
  });

  describe('buildAaProxyUrl', () => {
    it('should build URL for base chain', () => {
      const url = buildAaProxyUrl({ chain: base, apiKey: 'sbc-test123' });
      expect(url).toBe('https://api.aa.stablecoin.xyz/rpc/v1/base/sbc-test123');
    });

    it('should build URL with staging flag', () => {
      const url = buildAaProxyUrl({ chain: baseSepolia, apiKey: 'sbc-test123', staging: true });
      expect(url).toBe('https://api.aa.stablecoin.xyz/rpc/v1/baseSepolia/sbc-test123?staging=true');
    });

    it('should throw error for unsupported chain', () => {
      const unsupportedChain = createUnsupportedChain(999, 'Unsupported');
      expect(() => buildAaProxyUrl({ chain: unsupportedChain, apiKey: 'sbc-test123' })).toThrow('Unsupported chain');
    });
  });

  describe('validateApiKey', () => {
    it('should validate correct API key', () => {
      expect(validateApiKey('sbc-test123456')).toBe(true);
    });

    it('should reject API key without sbc prefix', () => {
      expect(validateApiKey('invalid-key')).toBe(false);
    });

    it('should reject empty API key', () => {
      expect(validateApiKey('')).toBe(false);
    });

    it('should reject API key with only prefix', () => {
      expect(validateApiKey('sbc-')).toBe(false);
    });
  });

  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      expect(formatError(error)).toBe('Test error');
    });

    it('should format string errors', () => {
      expect(formatError('String error')).toBe('String error');
    });

    it('should format unknown errors', () => {
      expect(formatError(123)).toBe('Unknown error occurred');
      expect(formatError(null)).toBe('Unknown error occurred');
      expect(formatError(undefined)).toBe('Unknown error occurred');
    });
  });

  describe('decodeRevertReason', () => {
    it('should decode standard Error(string) revert', () => {
      const errorData = '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002645524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e63650000000000000000000000000000000000000000000000000000';
      const decoded = decodeRevertReason(errorData);
      expect(decoded).toBe('ERC20: transfer amount exceeds balance');
    });

    it('should return null for invalid error data', () => {
      expect(decodeRevertReason('invalid')).toBeNull();
      expect(decodeRevertReason('0xinvalid')).toBeNull();
      expect(decodeRevertReason('')).toBeNull();
    });

    it('should decode Panic errors', () => {
      // Panic(0x11) - arithmetic overflow
      const panicData = '0x4e487b710000000000000000000000000000000000000000000000000000000000000011';
      const decoded = decodeRevertReason(panicData);
      expect(decoded).toBe('Arithmetic overflow/underflow');
    });
  });

  describe('parseUserOperationError', () => {
    it('should parse and decode revert reasons', () => {
      const errorMessage = 'UserOperation reverted during simulation with reason: 0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002645524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e63650000000000000000000000000000000000000000000000000000';
      const error = new Error(errorMessage);
      const parsed = parseUserOperationError(error);
      
      expect(parsed).toContain('UserOperation reverted during simulation');
      expect(parsed).toContain('Decoded reason: ERC20: transfer amount exceeds balance');
    });

    it('should provide suggestions for common errors', () => {
      const insufficientFunds = new Error('insufficient funds');
      expect(parseUserOperationError(insufficientFunds)).toContain('Ensure your account has enough ETH/tokens');

      const nonceTooLow = new Error('nonce too low');
      expect(parseUserOperationError(nonceTooLow)).toContain('Try refreshing and sending the transaction again');

      const gasError = new Error('gas limit exceeded');
      expect(parseUserOperationError(gasError)).toContain('Try increasing gas limits');
    });

    it('should handle unknown errors gracefully', () => {
      const unknownError = new Error('Unknown blockchain error');
      const parsed = parseUserOperationError(unknownError);
      expect(parsed).toBe('Unknown blockchain error');
    });
  });
});
