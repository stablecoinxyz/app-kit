import { getChainConfig, buildAaProxyUrl, validateApiKey, formatError, retry, decodeRevertReason, parseUserOperationError } from '../utils';
import { base, baseSepolia } from 'viem/chains';

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
      const unsupportedChain = { id: 999, name: 'Unsupported' } as any;
      expect(() => getChainConfig(unsupportedChain)).toThrow();
    });
  });

  describe('buildAaProxyUrl', () => {
    it('should build URL for base chain', () => {
      const url = buildAaProxyUrl(base, 'sbc-test123');
      expect(url).toBe('https://api.aa.stablecoin.xyz/rpc/v1/base/sbc-test123');
    });

    it('should build URL with staging flag', () => {
      const url = buildAaProxyUrl(baseSepolia, 'sbc-test123', true);
      expect(url).toBe('https://api.aa.stablecoin.xyz/rpc/v1/baseSepolia/sbc-test123?staging=true');
    });

    it('should build URL with custom base URL', () => {
      const url = buildAaProxyUrl(base, 'sbc-test123', false, 'https://custom.api.com');
      expect(url).toBe('https://custom.api.com/rpc/v1/base/sbc-test123');
    });

    it('should throw error for unsupported chain', () => {
      const unsupportedChain = { id: 999, name: 'Unsupported' } as any;
      expect(() => buildAaProxyUrl(unsupportedChain, 'sbc-test123')).toThrow('Unsupported chain');
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

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await retry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failures and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValue('success');
      
      const result = await retry(mockFn, { retries: 3, delay: 10 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw last error after all retries exhausted', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(retry(mockFn, { retries: 2, delay: 10 })).rejects.toThrow('Always fails');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use default retry parameters', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(retry(mockFn)).rejects.toThrow('Always fails');
      expect(mockFn).toHaveBeenCalledTimes(3); // Default retries
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
