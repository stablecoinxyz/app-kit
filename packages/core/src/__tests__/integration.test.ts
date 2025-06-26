import { SbcAppKit } from '../index';
import { encodeFunctionData } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Mock external services
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    getBlockNumber: jest.fn().mockResolvedValue(123456n),
    getBytecode: jest.fn().mockResolvedValue('0x1234'),
    readContract: jest.fn()
  })),
  createWalletClient: jest.fn(() => ({
    account: {
      address: '0x1234567890123456789012345678901234567890'
    }
  })),
  http: jest.fn(),
  custom: jest.fn(),
  encodeFunctionData: jest.fn()
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

describe('SBC App Kit Integration Tests', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
  });

  describe('Full SDK Workflow', () => {
    it('should complete a full gasless transaction workflow', async () => {
      // Initialize SDK
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      });

      // Mock account info response
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

      // Get account info
      const account = await kit.getAccount();
      expect(account.isDeployed).toBe(true);

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

      // Estimate gas for ERC-20 transfer
      const transferParams = {
        to: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const, // USDC on Base Sepolia
        data: '0xa9059cbb000000000000000000000000742d35cc6641c4532b4d4c7b4c0d1c3d4e5f678900000000000000000000000000000000000000000000000000000000000f4240' as const,
        value: '0'
      };

      const estimate = await kit.estimateUserOperation(transferParams);
      expect(estimate.callGasLimit).toBe('150000');

      // Mock successful transaction
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            userOperationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            blockNumber: 1234567,
            gasUsed: 250000
          }
        })
      } as Response);

      // Send the transaction
      const result = await kit.sendUserOperation(transferParams);
      expect(result.userOperationHash).toBeDefined();
      expect(result.transactionHash).toBeDefined();
      expect(result.blockNumber).toBe(1234567);
    });

    it('should handle ERC-20 token operations', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: base
      });

      // Mock the viem encodeFunctionData
      const mockEncodeFunctionData = require('viem').encodeFunctionData;
      mockEncodeFunctionData.mockReturnValue('0xa9059cbb000000000000000000000000742d35cc6641c4532b4d4c7b4c0d1c3d4e5f678900000000000000000000000000000000000000000000000000000000000f4240');

      // Create transfer data
      const transferData = mockEncodeFunctionData({
        abi: [
          {
            name: 'transfer',
            type: 'function',
            inputs: [
              { name: 'to', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ]
          }
        ],
        functionName: 'transfer',
        args: [
          '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789',
          BigInt('1000000') // 1 USDC
        ]
      });

      const params = {
        to: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const, // USDC
        data: transferData,
        value: '0'
      };

      // Mock gas estimation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            preVerificationGas: '50000',
            verificationGasLimit: '120000',
            callGasLimit: '80000',
            paymasterAndData: '0x1234...',
            gasPrice: '1000000000'
          }
        })
      } as Response);

      const estimate = await kit.estimateUserOperation(params);
      expect(estimate).toBeDefined();
      expect(estimate.callGasLimit).toBe('80000');
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle API rate limiting gracefully', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: base
      });

      // Mock rate limit response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded'
      } as Response);

      await expect(kit.getAccount()).rejects.toThrow('AA Proxy request failed: 429 - Rate limit exceeded');
    });

    it('should handle invalid API key responses', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: base
      });

      // Mock unauthorized response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key'
      } as Response);

      await expect(kit.getAccount()).rejects.toThrow('AA Proxy request failed: 401 - Invalid API key');
    });

    it('should handle network timeouts', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: base
      });

      // Mock network timeout
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(kit.getAccount()).rejects.toThrow('Network timeout');
    });

    it('should validate transaction parameters', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: base
      });

      // Mock validation error from API
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid transaction parameters: insufficient balance'
      } as Response);

      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0x' as const,
        value: '1000000000000000000000' // 1000 ETH - unrealistic amount
      };

      await expect(kit.sendUserOperation(params)).rejects.toThrow('AA Proxy request failed: 400 - Invalid transaction parameters: insufficient balance');
    });
  });

  describe('Cross-Chain Compatibility', () => {
    it('should work with Base Mainnet', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-production-key123',
        chain: base
      });

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
      expect(account.address).toBeDefined();
      
      // Verify the correct API endpoint is called for mainnet
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/rpc/v1/base/'),
        expect.any(Object)
      );
    });

    it('should work with Base Sepolia Testnet', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            address: '0x9876543210987654321098765432109876543210',
            isDeployed: false,
            nonce: 0
          }
        })
      } as Response);

      const account = await kit.getAccount();
      expect(account.isDeployed).toBe(false);
      
      // Verify the correct API endpoint is called for testnet
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/rpc/v1/baseSepolia/'),
        expect.any(Object)
      );
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple concurrent operations', async () => {
      const kit = new SbcAppKit({
        apiKey: 'sbc-test123456',
        chain: base
      });

      // Mock multiple successful responses
      const mockResponse = {
        ok: true,
        json: async () => ({
          result: {
            address: '0x9876543210987654321098765432109876543210',
            isDeployed: true,
            nonce: 0
          }
        })
      } as Response;

      mockFetch
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      // Execute multiple concurrent requests
      const promises = [
        kit.getAccount(),
        kit.getAccount(),
        kit.getAccount()
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.address).toBeDefined();
      });
    });
  });
}); 