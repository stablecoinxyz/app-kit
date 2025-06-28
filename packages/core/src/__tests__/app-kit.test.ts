import { SbcAppKit } from '../app-kit';
import { SbcAppKitConfig } from '../types';
import { base, baseSepolia } from 'viem/chains';
import { Chain } from 'viem';

// Mock external dependencies
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    getBlockNumber: jest.fn().mockResolvedValue(123456n),
    getBytecode: jest.fn().mockResolvedValue('0x1234'),
    readContract: jest.fn(),
    getGasPrice: jest.fn().mockResolvedValue(1000000000n),
    getBlock: jest.fn().mockResolvedValue({
      baseFeePerGas: 500000000n,
      number: 123456n
    }),
  })),
  createWalletClient: jest.fn(() => ({
    account: {
      address: '0x1234567890123456789012345678901234567890'
    }
  })),
  http: jest.fn(),
  custom: jest.fn(),
  parseEther: jest.fn((val) => BigInt(val) * BigInt(10**18)),
}));

jest.mock('viem/accounts', () => ({
  generatePrivateKey: jest.fn(() => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
  privateKeyToAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890'
  }))
}));

jest.mock('viem/account-abstraction', () => ({
  entryPoint07Address: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  createPaymasterClient: jest.fn(() => ({
    getPaymasterStubData: jest.fn(),
    getPaymasterData: jest.fn(),
  })),
  createBundlerClient: jest.fn(() => ({
    getUserOperationGasPrice: jest.fn(),
    estimateUserOperationGas: jest.fn(),
  })),
}));

jest.mock('permissionless/accounts', () => ({
  toKernelSmartAccount: jest.fn(() => Promise.resolve({
    address: '0x9876543210987654321098765432109876543210',
    getNonce: jest.fn().mockResolvedValue(5),
  }))
}));

jest.mock('permissionless', () => ({
  createSmartAccountClient: jest.fn(() => ({
    account: {
      address: '0x9876543210987654321098765432109876543210',
      getNonce: jest.fn().mockResolvedValue(5),
    },
    sendUserOperation: jest.fn().mockResolvedValue('0xuser-op-hash'),
    waitForUserOperationReceipt: jest.fn().mockResolvedValue({
      receipt: {
        transactionHash: '0xtx-hash',
        blockNumber: 123456n,
        gasUsed: 250000n,
      }
    }),
    prepareUserOperation: jest.fn().mockResolvedValue({
      preVerificationGas: 50000n,
      verificationGasLimit: 100000n,
      callGasLimit: 150000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 2000000000n,
      paymasterVerificationGasLimit: 25000n,
      paymasterPostOpGasLimit: 25000n
    }),
    estimateUserOperationGas: jest.fn().mockResolvedValue({
      preVerificationGas: '50000',
      verificationGasLimit: '100000',
      callGasLimit: '150000',
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '2000000000',
    }),
  }))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Create a proper unsupported chain type for testing
const createUnsupportedChain = (id: number, name: string): Chain => ({
  id,
  name,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] }
  }
});

describe('SbcAppKit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration and Initialization', () => {
    it('should initialize with valid configuration', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
      expect(kit.getChain()).toBe(baseSepolia);
    });

    it('should initialize with custom private key', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base,
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
    });

    it('should throw error for invalid API key', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'invalid-key',
        chain: base
      };

      expect(() => new SbcAppKit(config)).toThrow('Invalid API key. API key must start with "sbc-"');
    });

    it('should throw error for unsupported chain', () => {
      const unsupportedChain = createUnsupportedChain(999, 'Unsupported Chain');
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: unsupportedChain
      };

      expect(() => new SbcAppKit(config)).toThrow('Unsupported chain');
    });

    it('should accept custom RPC URL', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base,
        rpcUrl: 'https://custom.rpc.url'
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
    });
  });

  describe('Account Operations', () => {
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

    it('should get account information', async () => {
      const account = await kit.getAccount();
      
      expect(account.address).toBe('0x9876543210987654321098765432109876543210');
      expect(account.isDeployed).toBe(true);
      expect(account.nonce).toBe(5);
    });

    it('should handle undeployed account', async () => {
      // Mock bytecode as empty for undeployed account
      const { createPublicClient } = require('viem');
      createPublicClient.mockReturnValueOnce({
        getBlockNumber: jest.fn().mockResolvedValue(123456n),
        getBytecode: jest.fn().mockResolvedValue('0x'),
        readContract: jest.fn(),
        getGasPrice: jest.fn().mockResolvedValue(1000000000n),
        getBlock: jest.fn().mockResolvedValue({
          baseFeePerGas: 500000000n,
          number: 123456n
        }),
      });

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      
      const testKit = new SbcAppKit(config);
      const account = await testKit.getAccount();
      
      expect(account.isDeployed).toBe(false);
      expect(account.nonce).toBe(0);
    });

    it('should throw error when wallet has no account', () => {
      // Mock wallet client with no account
      const { createWalletClient } = require('viem');
      const originalMock = createWalletClient.getMockImplementation();
      
      createWalletClient.mockImplementationOnce(() => ({
        account: null
      }));

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };

      expect(() => new SbcAppKit(config)).toThrow('No account attached to wallet client');
      
      // Restore original mock
      createWalletClient.mockImplementation(originalMock);
    });
  });

  describe('User Operations', () => {
    let kit: SbcAppKit;

    beforeEach(() => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      kit = new SbcAppKit(config);
    });

    it('should estimate user operation gas', async () => {
      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0x' as const,
        value: '0'
      };

      const estimate = await kit.estimateUserOperation(params);
      
      expect(estimate).toEqual({
        preVerificationGas: '50000',
        verificationGasLimit: '100000',
        callGasLimit: '150000',
        maxFeePerGas: '1000000000',
        maxPriorityFeePerGas: '2000000000',
        totalGasUsed: '300000', // 50000 + 100000 + 150000
        totalGasCost: '330000000000000', // 300000 * 1000000000 * 1.1
        paymasterVerificationGasLimit: undefined,
        paymasterPostOpGasLimit: undefined
      });
    });

    it('should send user operation', async () => {
      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0xa9059cbb000000000000000000000000742d35cc6641c4532b4d4c7b4c0d1c3d4e5f678900000000000000000000000000000000000000000000000000000000000f4240' as const,
        value: '0'
      };

      const result = await kit.sendUserOperation(params);
      
      expect(result).toEqual({
        userOperationHash: '0xuser-op-hash',
        transactionHash: '0xtx-hash',
        blockNumber: '123456',
        gasUsed: '250000'
      });
    });

    it('should handle user operation with value', async () => {
      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0x' as const,
        value: '1' // 1 ETH in string format
      };

      const result = await kit.sendUserOperation(params);
      
      expect(result).toEqual({
        userOperationHash: '0xuser-op-hash',
        transactionHash: '0xtx-hash',
        blockNumber: '123456',
        gasUsed: '250000'
      });
    });

    it('should handle calls array format', async () => {
      const params = {
        calls: [
          {
            to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
            data: '0x' as const,
            value: 1000000000000000000n // 1 ETH as bigint
          }
        ]
      };

      const result = await kit.sendUserOperation(params);
      
      expect(result).toEqual({
        userOperationHash: '0xuser-op-hash',
        transactionHash: '0xtx-hash',
        blockNumber: '123456',
        gasUsed: '250000'
      });
    });

    it('should validate empty calls array', async () => {
      const params = {
        calls: [] // Empty array should throw
      };

      await expect(kit.sendUserOperation(params)).rejects.toThrow('Operations array cannot be empty');
    });

    it('should handle permissionless client errors', async () => {
      const { createSmartAccountClient } = require('permissionless');
      createSmartAccountClient.mockReturnValueOnce({
        account: {
          address: '0x9876543210987654321098765432109876543210',
          getNonce: jest.fn().mockResolvedValue(5),
        },
        sendUserOperation: jest.fn().mockRejectedValue(new Error('Network error')),
        waitForUserOperationReceipt: jest.fn(),
        prepareUserOperation: jest.fn(),
        estimateUserOperationGas: jest.fn(),
      });

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      const testKit = new SbcAppKit(config);

      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0x' as const,
        value: '0'
      };

      await expect(testKit.sendUserOperation(params)).rejects.toThrow('Failed to send user operation: Network error');
    });
  });

  describe('Error Handling', () => {
    it('should handle smart account initialization errors', async () => {
      const { toKernelSmartAccount } = require('permissionless/accounts');
      toKernelSmartAccount.mockRejectedValueOnce(new Error('Kernel initialization failed'));

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      const kit = new SbcAppKit(config);

      await expect(kit.getAccount()).rejects.toThrow('Kernel initialization failed');
    });

    it('should handle gas estimation errors', async () => {
      const { createSmartAccountClient } = require('permissionless');
      createSmartAccountClient.mockReturnValueOnce({
        account: {
          address: '0x9876543210987654321098765432109876543210',
          getNonce: jest.fn().mockResolvedValue(5),
        },
        sendUserOperation: jest.fn(),
        waitForUserOperationReceipt: jest.fn(),
        prepareUserOperation: jest.fn().mockRejectedValue(new Error('Gas estimation failed')),
        estimateUserOperationGas: jest.fn(),
      });

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      const kit = new SbcAppKit(config);

      const params = {
        to: '0x742d35Cc6641C4532B4d4c7B4C0D1C3d4e5f6789' as const,
        data: '0x' as const,
        value: '0'
      };

      await expect(kit.estimateUserOperation(params)).rejects.toThrow('Failed to estimate user operation: Gas estimation failed');
    });
  });

  describe('Chain Support', () => {
    it('should support Base Mainnet', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };

      const kit = new SbcAppKit(config);
      expect(kit.getChain()).toBe(base);
    });

    it('should support Base Sepolia Testnet', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };

      const kit = new SbcAppKit(config);
      expect(kit.getChain()).toBe(baseSepolia);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle staging environment', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia,
        staging: true
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
    });
  });
}); 