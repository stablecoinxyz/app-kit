import { SbcAppKit } from '../app-kit';
import { SbcAppKitConfig } from '../types';
import { base, baseSepolia } from 'viem/chains';
import { radiusTestnet } from '../lib/radius-network';
import { Chain } from 'viem';

// Mock external dependencies
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => ({
    getBlockNumber: jest.fn().mockResolvedValue(123456n),
    getBytecode: jest.fn().mockResolvedValue('0x1234'),
    getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')), // 1 ETH
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
  defineChain: jest.fn((chain) => chain),
}));

jest.mock('viem/accounts', () => ({
  generatePrivateKey: jest.fn(() => '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
  privateKeyToAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890'
  })),
  toAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    type: 'json-rpc',
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
    signTypedData: jest.fn(),
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

jest.mock('../lib/radius-simple-account', () => ({
  toRadiusSimpleSmartAccount: jest.fn(() => Promise.resolve({
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    getNonce: jest.fn().mockResolvedValue(3),
    entryPoint: {
      address: '0x9b443e4bd122444852B52331f851a000164Cc83F',
      version: '0.7'
    }
  })),
  RADIUS_ENTRY_POINT_ADDRESS: '0x9b443e4bd122444852B52331f851a000164Cc83F',
  RADIUS_SIMPLE_ACCOUNT_FACTORY_ADDRESS: '0x4DEbDe0Be05E51432D9afAf61D84F7F0fEA63495'
}));

jest.mock('permissionless', () => ({
  createSmartAccountClient: jest.fn((config: any) => ({
    account: config.account, // Use the account that was passed in
    sendUserOperation: jest.fn().mockResolvedValue('0xuser-op-hash'),
    waitForUserOperationReceipt: jest.fn().mockResolvedValue({
      receipt: {
        transactionHash: '0xtx-hash',
        blockNumber: 123456n,
        gasUsed: 250000n,
      }
    }),
    prepareUserOperation: jest.fn().mockResolvedValue({
      sender: config.account.address,
      nonce: 5n,
      callData: '0x1234',
      callGasLimit: 150000n,
      verificationGasLimit: 100000n,
      preVerificationGas: 50000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 2000000000n,
      paymasterAndData: '0x',
      signature: '0x',
    }),
    estimateUserOperationGas: jest.fn().mockResolvedValue({
      preVerificationGas: 50000n,
      verificationGasLimit: 100000n,
      callGasLimit: 150000n,
      maxFeePerGas: 1000000000n,
      maxPriorityFeePerGas: 2000000000n,
      paymasterVerificationGasLimit: 25000n,
      paymasterPostOpGasLimit: 25000n,
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

    it('should initialize with wallet client', () => {
      const mockWalletClient = {
        account: {
          address: '0x1234567890123456789012345678901234567890'
        },
        chain: { id: 8453 } // Base mainnet
      } as any;

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base,
        walletClient: mockWalletClient
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
      expect(kit.getOwnerAddress()).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should throw error when wallet client has no account', () => {
      const mockWalletClient = {
        account: null,
        chain: { id: 8453 }
      } as any;

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base,
        walletClient: mockWalletClient
      };

      expect(() => new SbcAppKit(config)).toThrow('Provided wallet client must have an account attached');
    });

    it('should throw error when wallet client chain does not match config chain', () => {
      const mockWalletClient = {
        account: {
          address: '0x1234567890123456789012345678901234567890'
        },
        chain: { id: 1 } // Ethereum mainnet
      } as any;

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base, // Base mainnet (id: 8453)
        walletClient: mockWalletClient
      };

      expect(() => new SbcAppKit(config)).toThrow('Wallet client chain (1) does not match config chain (8453)');
    });

    it('should throw error when both wallet client and private key are provided', () => {
      const mockWalletClient = {
        account: {
          address: '0x1234567890123456789012345678901234567890'
        },
        chain: { id: 8453 }
      } as any;

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base,
        walletClient: mockWalletClient,
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      };

      expect(() => new SbcAppKit(config)).toThrow('Cannot specify both walletClient and privateKey');
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

    it('should initialize with wallet integration config', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia,
        wallet: 'metamask',
        walletOptions: {
          autoConnect: false,
          preferredWallets: ['metamask', 'coinbase']
        }
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
    });

    it('should default to auto wallet detection', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };

      const kit = new SbcAppKit(config);
      expect(kit).toBeInstanceOf(SbcAppKit);
      // Should create temporary wallet for initialization
    });
  });

  describe('Wallet Integration', () => {
    let kit: SbcAppKit;

    beforeEach(() => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      kit = new SbcAppKit(config);
    });

    it('should get available wallets', async () => {
      // Mock browser environment
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn()
        }
      };

      const wallets = await kit.getAvailableWallets();
      
      expect(Array.isArray(wallets)).toBe(true);
      expect(wallets.length).toBeGreaterThan(0);
      
      // Should include MetaMask when window.ethereum is available
      const metamaskWallet = wallets.find(w => w.type === 'metamask');
      expect(metamaskWallet).toBeDefined();
      expect(metamaskWallet?.name).toBe('MetaMask');
      expect(metamaskWallet?.available).toBe(true);
    });

    it('should connect to MetaMask wallet', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      
      // Mock MetaMask
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const connectionResult = await kit.connectWallet('metamask');
      
      expect(connectionResult).toBeDefined();
      expect(connectionResult.wallet.type).toBe('metamask');
      expect(connectionResult.wallet.name).toBe('MetaMask');
      expect(connectionResult.address).toBe(mockAccounts[0]);
      expect(connectionResult.walletClient).toBeDefined();
    });

    it('should auto-detect and connect to best available wallet', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      
      // Mock MetaMask
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const connectionResult = await kit.connectWallet('auto');
      
      expect(connectionResult).toBeDefined();
      expect(connectionResult.wallet.type).toBe('metamask'); // Should choose MetaMask as best available
      expect(connectionResult.address).toBe(mockAccounts[0]);
    });

    it('should handle wallet connection failure', async () => {
      // Mock failed wallet connection
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockRejectedValue(new Error('User rejected request'))
        }
      };

      await expect(kit.connectWallet('metamask')).rejects.toThrow('Failed to connect wallet');
    });

    it('should handle missing wallet', async () => {
      // No wallet available
      (global as any).window = {};

      await expect(kit.connectWallet('metamask')).rejects.toThrow('MetaMask not found');
    });

    it('should handle auto-connect with no available wallets', async () => {
      // No wallets available
      (global as any).window = {};

      await expect(kit.connectWallet('auto')).rejects.toThrow('WalletConnect integration coming soon. Please use MetaMask or Coinbase Wallet for now.');
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

    it('should return owner address when wallet is connected', async () => {
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      // Connect wallet first
      await kit.connectWallet('metamask');
      const address = kit.getOwnerAddress();
      expect(address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should throw error when getting owner address without wallet', () => {
      expect(() => kit.getOwnerAddress()).toThrow('No wallet connected. Call connectWallet() to connect a wallet first.');
    });

    it('should get account information when wallet is connected', async () => {
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      // Connect wallet first
      await kit.connectWallet('metamask');
      const account = await kit.getAccount();
      
      expect(account.address).toBe('0x9876543210987654321098765432109876543210');
      expect(account.isDeployed).toBe(true);
      expect(account.nonce).toBe(5);
    });

    it('should throw error when getting account without wallet', async () => {
      await expect(kit.getAccount()).rejects.toThrow('No wallet connected. Call connectWallet() to connect a wallet first.');
    });

    it('should handle undeployed account when wallet is connected', async () => {
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      // Mock bytecode as empty for undeployed account
      const { createPublicClient } = require('viem');
      createPublicClient.mockReturnValueOnce({
        getBlockNumber: jest.fn().mockResolvedValue(123456n),
        getBytecode: jest.fn().mockResolvedValue('0x'),
        getBalance: jest.fn().mockResolvedValue(BigInt('500000000000000000')), // 0.5 ETH
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
      // Connect wallet first
      await testKit.connectWallet('metamask');
      const account = await testKit.getAccount();
      
      expect(account.isDeployed).toBe(false);
      expect(account.nonce).toBe(0);
    });

    it('should throw error when wallet has no account', () => {
      // Create a wallet client with no account
      const mockWalletClient = {
        account: null,
        chain: { id: 8453 }
      };

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base,
        walletClient: mockWalletClient as any
      };

      expect(() => new SbcAppKit(config)).toThrow('Provided wallet client must have an account attached');
    });
  });

  describe('User Operations', () => {
    it('should estimate user operation gas', async () => {
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      const kit = new SbcAppKit(config);
      
      // Connect wallet first
      await kit.connectWallet('metamask');
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
        totalGasUsed: '350000', // 50000 + 100000 + 150000 + 25000 + 25000
        totalGasCost: '385000000000000', // 350000 * 1000000000 * 1.1
        paymasterVerificationGasLimit: '25000',
        paymasterPostOpGasLimit: '25000'
      });
    });

    it('should send user operation', async () => {
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      const kit = new SbcAppKit(config);
      
      // Connect wallet first
      await kit.connectWallet('metamask');

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
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      const kit = new SbcAppKit(config);
      
      // Connect wallet first
      await kit.connectWallet('metamask');

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
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      const kit = new SbcAppKit(config);
      
      // Connect wallet first
      await kit.connectWallet('metamask');

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
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: baseSepolia
      };
      const kit = new SbcAppKit(config);
      
      // Connect wallet first
      await kit.connectWallet('metamask');

      const params = {
        calls: [] // Empty array should throw
      };

      await expect(kit.sendUserOperation(params)).rejects.toThrow('Operations array cannot be empty');
    });

    it('should handle permissionless client errors', async () => {
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

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
      
      // Connect wallet first
      await testKit.connectWallet('metamask');

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
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const { toKernelSmartAccount } = require('permissionless/accounts');
      toKernelSmartAccount.mockRejectedValueOnce(new Error('Kernel initialization failed'));

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      const kit = new SbcAppKit(config);
      
      // The error should be thrown during wallet connection
      await expect(kit.connectWallet('metamask')).rejects.toThrow('Failed to initialize smart account: Kernel initialization failed');
    });

    it('should handle gas estimation errors', async () => {
      // Mock MetaMask
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const { createSmartAccountClient } = require('permissionless');
      createSmartAccountClient.mockReturnValueOnce({
        account: {
          address: '0x9876543210987654321098765432109876543210',
          getNonce: jest.fn().mockResolvedValue(5),
        },
        sendUserOperation: jest.fn(),
        waitForUserOperationReceipt: jest.fn(),
        prepareUserOperation: jest.fn().mockRejectedValue(new Error('Gas estimation failed')),
        estimateUserOperationGas: jest.fn().mockResolvedValue({
          preVerificationGas: 50000n,
          verificationGasLimit: 100000n,
          callGasLimit: 150000n,
          paymasterVerificationGasLimit: 25000n,
          paymasterPostOpGasLimit: 25000n,
        }),
      });

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };
      const kit = new SbcAppKit(config);
      // Connect wallet first
      await kit.connectWallet('metamask');

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

    it('should support Radius Testnet', () => {
      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: radiusTestnet
      };

      const kit = new SbcAppKit(config);
      expect(kit.getChain()).toBe(radiusTestnet);
      expect(kit.getChainConfig().id).toBe(1223953);
    });

    it('should initialize Radius Testnet with custom EntryPoint', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: radiusTestnet
      };

      const kit = new SbcAppKit(config);
      await kit.connectWallet('metamask');

      const account = await kit.getAccount();
      // Should use Radius-specific address
      expect(account.address).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });

    it('should use Radius SimpleAccount for Radius Testnet', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const { toRadiusSimpleSmartAccount } = require('../lib/radius-simple-account');
      const { toKernelSmartAccount } = require('permissionless/accounts');

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: radiusTestnet
      };

      const kit = new SbcAppKit(config);
      await kit.connectWallet('metamask');

      // Should call toRadiusSimpleSmartAccount for Radius, not toKernelSmartAccount
      expect(toRadiusSimpleSmartAccount).toHaveBeenCalled();
      expect(toKernelSmartAccount).not.toHaveBeenCalled();
    });

    it('should use Kernel account for Base chains, not Radius account', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const { toRadiusSimpleSmartAccount } = require('../lib/radius-simple-account');
      const { toKernelSmartAccount } = require('permissionless/accounts');

      // Clear previous calls
      toRadiusSimpleSmartAccount.mockClear();
      toKernelSmartAccount.mockClear();

      const config: SbcAppKitConfig = {
        apiKey: 'sbc-test123456',
        chain: base
      };

      const kit = new SbcAppKit(config);
      await kit.connectWallet('metamask');

      // Should call toKernelSmartAccount for Base, not toRadiusSimpleSmartAccount
      expect(toKernelSmartAccount).toHaveBeenCalled();
      expect(toRadiusSimpleSmartAccount).not.toHaveBeenCalled();
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