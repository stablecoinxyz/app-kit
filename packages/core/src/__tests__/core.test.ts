import { SbcAppKit } from '../app-kit';
import { SbcAppKitConfig } from '../types';
import { base, baseSepolia } from 'viem/chains';

// Simple mocks that work reliably
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    getBytecode: jest.fn().mockResolvedValue('0x1234'),
    getBlockNumber: jest.fn().mockResolvedValue(123456n),
  })),
  createWalletClient: jest.fn(() => ({
    account: {
      address: '0x1234567890123456789012345678901234567890'
    }
  })),
  http: jest.fn(),
  custom: jest.fn()
}));

jest.mock('viem/accounts', () => ({
  generatePrivateKey: jest.fn(() => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
  privateKeyToAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890'
  }))
}));

jest.mock('permissionless', () => ({
  createSmartAccountClient: jest.fn(() => ({
    account: {
      address: '0x9876543210987654321098765432109876543210'
    }
  }))
}));

global.fetch = jest.fn();

describe('SBC App Kit Core Tests', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
      expect(kit.getChain()).toBe(baseSepolia);
    });

    it('should work with both supported chains', () => {
      const baseConfig: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };

      const baseSepoliaConfig: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };

      const baseKit = new SbcAppKit(baseConfig);
      const baseSepoliaKit = new SbcAppKit(baseSepoliaConfig);

      expect(baseKit.getChain()).toBe(base);
      expect(baseSepoliaKit.getChain()).toBe(baseSepolia);
    });

    it('should reject invalid API keys', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'invalid-key',
        chain: base
      };

      expect(() => new SbcAppKit(config)).toThrow('Invalid API key');
    });
  });

  describe('Account Management', () => {
    let kit: SbcAppKit;

    beforeEach(() => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      kit = new SbcAppKit(config);
    });

    it('should return owner address', () => {
      const address = kit.getOwnerAddress();
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should get account info successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            address: '0x9876543210987654321098765432109876543210',
            isDeployed: true,
            nonce: 5
          }
        })
      } as Response);

      const account = await kit.getAccount();
      
      expect(account.address).toBe('0x9876543210987654321098765432109876543210');
      expect(account.isDeployed).toBe(true);
      expect(account.nonce).toBe(5);
    });

    it('should handle account API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      } as Response);

      await expect(kit.getAccount()).rejects.toThrow('AA Proxy request failed: 401 - Unauthorized');
    });
  });

  describe('User Operations', () => {
    let kit: SbcAppKit;

    beforeEach(() => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      kit = new SbcAppKit(config);
    });

    it('should estimate gas successfully', async () => {
      // Mock account info call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            address: '0x9876543210987654321098765432109876543210',
            isDeployed: true,
            nonce: 0
          }
        })
      } as Response);

      // Mock gas estimation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            preVerificationGas: '50000',
            verificationGasLimit: '100000',
            callGasLimit: '150000',
            paymasterAndData: '0x1234...',
            gasPrice: '1000000000'
          }
        })
      } as Response);

      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0x' as const,
        value: '0'
      };

      const estimate = await kit.estimateUserOperation(params);
      
      expect(estimate.callGasLimit).toBe('150000');
      expect(estimate.preVerificationGas).toBe('50000');
      expect(estimate.totalGasUsed).toBeDefined();
      expect(estimate.totalGasCost).toBeDefined();
    });

    it('should handle estimate errors', async () => {
      // Mock account info call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            address: '0x9876543210987654321098765432109876543210',
            isDeployed: true,
            nonce: 0
          }
        })
      } as Response);

      // Mock estimate error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid parameters'
      } as Response);

      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0x' as const,
        value: '0'
      };

      await expect(kit.estimateUserOperation(params)).rejects.toThrow('AA Proxy request failed: 400 - Invalid parameters');
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid API key formats', () => {
      const validKeys = [
        'sbc-1234567890',
        'sbc-abcdef123456',
        'sbc-test123',
        'sbc-prod456789'
      ];

      validKeys.forEach(apiKey => {
        const config: SbcAppKitConfig = { apiKey, chain: base };
        expect(() => new SbcAppKit(config)).not.toThrow();
      });
    });

    it('should reject invalid API key formats', () => {
      const invalidKeys = [
        'invalid-key',
        'abc-123',
        'sbc-',
        '',
        'sbc'
      ];

      invalidKeys.forEach(apiKey => {
        const config: SbcAppKitConfig = { apiKey, chain: base };
        expect(() => new SbcAppKit(config)).toThrow('Invalid API key');
      });
    });

    it('should work with custom configuration options', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base,
        rpcUrl: 'https://custom.rpc.url',
        staging: true
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
    });
  });

  describe('Error Handling', () => {
    let kit: SbcAppKit;

    beforeEach(() => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      kit = new SbcAppKit(config);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(kit.getAccount()).rejects.toThrow('Network error');
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      } as any);

      await expect(kit.getAccount()).rejects.toThrow('Invalid JSON');
    });

    it('should handle HTTP error status codes', async () => {
      const errorCodes = [400, 401, 403, 429, 500];

      for (const code of errorCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: code,
          text: async () => `HTTP ${code} Error`
        } as Response);

        await expect(kit.getAccount()).rejects.toThrow(`AA Proxy request failed: ${code} - HTTP ${code} Error`);
      }
    });
  });
}); 