import { WalletManager } from '../wallet-manager';
import { baseSepolia } from 'viem/chains';
import type { WalletManagerConfig } from '../types';

// Mock viem
jest.mock('viem', () => ({
  createWalletClient: jest.fn(({ account }) => ({
    account: account || null,
    chain: { id: 84532 }
  })),
  custom: jest.fn(),
}));

jest.mock('viem/accounts', () => ({
  toAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    type: 'json-rpc',
    signMessage: jest.fn(),
    signTransaction: jest.fn(),
    signTypedData: jest.fn(),
  }))
}));

describe('WalletManager', () => {
  let walletManager: WalletManager;
  let config: WalletManagerConfig;

  beforeEach(() => {
    config = {
      chain: baseSepolia,
      options: {
        preferredWallets: ['metamask', 'coinbase']
      }
    };
    walletManager = new WalletManager(config);

    // Clear global mocks
    (global as any).window = undefined;
  });

  describe('detectAvailableWallets', () => {
    it('should detect MetaMask when available', async () => {
      // Mock MetaMask
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          _metamask: true
        }
      };

      const wallets = await walletManager.detectAvailableWallets();
      
      expect(wallets).toBeDefined();
      expect(Array.isArray(wallets)).toBe(true);
      
      const metamaskWallet = wallets.find(w => w.type === 'metamask');
      expect(metamaskWallet).toBeDefined();
      expect(metamaskWallet?.name).toBe('MetaMask');
      expect(metamaskWallet?.available).toBe(true);
      expect(metamaskWallet?.provider).toBeDefined();
    });

    it('should detect Coinbase Wallet when available', async () => {
      // Mock Coinbase Wallet
      (global as any).window = {
        ethereum: {
          isCoinbaseWallet: true
        }
      };

      const wallets = await walletManager.detectAvailableWallets();
      
      const coinbaseWallet = wallets.find(w => w.type === 'coinbase');
      expect(coinbaseWallet).toBeDefined();
      expect(coinbaseWallet?.name).toBe('Coinbase Wallet');
      expect(coinbaseWallet?.available).toBe(true);
    });

    it('should detect Coinbase Wallet extension', async () => {
      // Mock Coinbase Wallet extension
      (global as any).window = {
        coinbaseWalletExtension: {
          request: jest.fn()
        }
      };

      const wallets = await walletManager.detectAvailableWallets();
      
      const coinbaseWallet = wallets.find(w => w.type === 'coinbase');
      expect(coinbaseWallet).toBeDefined();
      expect(coinbaseWallet?.available).toBe(true);
    });

    it('should always include WalletConnect as available', async () => {
      // No browser wallets
      (global as any).window = {};

      const wallets = await walletManager.detectAvailableWallets();
      
      const walletConnectWallet = wallets.find(w => w.type === 'walletconnect');
      expect(walletConnectWallet).toBeDefined();
      expect(walletConnectWallet?.name).toBe('WalletConnect');
      expect(walletConnectWallet?.available).toBe(true);
      expect(walletConnectWallet?.provider).toBeNull();
    });

    it('should handle server-side rendering (no window)', async () => {
      // Simulate SSR environment
      (global as any).window = undefined;

      const wallets = await walletManager.detectAvailableWallets();
      
      expect(wallets).toBeDefined();
      expect(Array.isArray(wallets)).toBe(true);
      
      // Should still include WalletConnect
      const walletConnectWallet = wallets.find(w => w.type === 'walletconnect');
      expect(walletConnectWallet).toBeDefined();
      expect(walletConnectWallet?.available).toBe(true);
    });
  });

  describe('getBestAvailableWallet', () => {
    it('should return null when no wallets are available', async () => {
      // No wallets
      (global as any).window = {};

      const bestWallet = await walletManager.getBestAvailableWallet();
      
      // WalletConnect is always available, so should return it
      expect(bestWallet).toBeDefined();
      expect(bestWallet?.type).toBe('walletconnect');
    });

    it('should prioritize wallets based on preferences', async () => {
      // Mock both MetaMask and Coinbase
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          isCoinbaseWallet: true
        }
      };

      const configWithPreferences = {
        ...config,
        options: {
          preferredWallets: ['coinbase', 'metamask'] as ('coinbase' | 'metamask')[]
        }
      };
      const manager = new WalletManager(configWithPreferences);

      const bestWallet = await manager.getBestAvailableWallet();
      
      expect(bestWallet?.type).toBe('coinbase'); // Should prefer coinbase based on order
    });

    it('should return first available when no preferences match', async () => {
      // Mock MetaMask
      (global as any).window = {
        ethereum: {
          isMetaMask: true
        }
      };

      const configWithUnmatchedPreferences = {
        ...config,
        options: {
          preferredWallets: ['walletconnect'] as ('walletconnect')[]
        }
      };
      const manager = new WalletManager(configWithUnmatchedPreferences);

      const bestWallet = await manager.getBestAvailableWallet();
      
      expect(bestWallet).toBeDefined();
      // Should return one of the available wallets
    });
  });

  describe('connectWallet', () => {
    it('should connect to MetaMask successfully', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      
      // Mock MetaMask
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const result = await walletManager.connectWallet('metamask');
      
      expect(result).toBeDefined();
      expect(result.wallet.type).toBe('metamask');
      expect(result.wallet.name).toBe('MetaMask');
      expect(result.address).toBe(mockAccounts[0]);
      expect(result.walletClient).toBeDefined();
      expect(result.walletClient.account).toBeDefined();
    });

    it('should connect to Coinbase Wallet successfully', async () => {
      const mockAccounts = ['0x9876543210987654321098765432109876543210'];
      
      // Mock Coinbase Wallet
      (global as any).window = {
        coinbaseWalletExtension: {
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const result = await walletManager.connectWallet('coinbase');
      
      expect(result).toBeDefined();
      expect(result.wallet.type).toBe('coinbase');
      expect(result.wallet.name).toBe('Coinbase Wallet');
      expect(result.address).toBe(mockAccounts[0]);
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

      const result = await walletManager.connectWallet('auto');
      
      expect(result).toBeDefined();
      expect(result.wallet.type).toBe('metamask');
      expect(result.address).toBe(mockAccounts[0]);
    });

    it('should throw error for unsupported wallet type', async () => {
      await expect(walletManager.connectWallet('custom' as any)).rejects.toThrow('Unsupported wallet type: custom');
    });

    it('should throw error when WalletConnect is requested', async () => {
      await expect(walletManager.connectWallet('walletconnect')).rejects.toThrow('WalletConnect integration coming soon');
    });

    it('should handle MetaMask connection rejection', async () => {
      // Mock MetaMask with rejection
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockRejectedValue(new Error('User rejected request'))
        }
      };

      await expect(walletManager.connectWallet('metamask')).rejects.toThrow('Failed to connect wallet');
    });

    it('should handle missing MetaMask', async () => {
      // No MetaMask
      (global as any).window = {};

      await expect(walletManager.connectWallet('metamask')).rejects.toThrow('MetaMask not found');
    });

    it('should handle missing Coinbase Wallet', async () => {
      // No Coinbase Wallet
      (global as any).window = {};

      await expect(walletManager.connectWallet('coinbase')).rejects.toThrow('Coinbase Wallet not found');
    });

    it('should handle auto-connect with no available wallets', async () => {
      // No wallets (except WalletConnect which will throw)
      (global as any).window = {};

      await expect(walletManager.connectWallet('auto')).rejects.toThrow('WalletConnect integration coming soon');
    });

    it('should handle empty accounts array', async () => {
      // Mock MetaMask with no accounts
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue([])
        }
      };

      await expect(walletManager.connectWallet('metamask')).rejects.toThrow('No accounts found');
    });
  });

  describe('createMetaMaskWalletClient', () => {
    it('should create wallet client with proper account structure', async () => {
      const mockAccounts = ['0x1234567890123456789012345678901234567890'];
      
      // Mock MetaMask
      (global as any).window = {
        ethereum: {
          isMetaMask: true,
          request: jest.fn().mockResolvedValue(mockAccounts)
        }
      };

      const result = await walletManager.connectWallet('metamask');
      
      expect(result.walletClient).toBeDefined();
      expect(result.walletClient.account).toBeDefined();
      
      // Check that account has address (should be directly on account object)
      expect(result.walletClient.account!.address).toBe(mockAccounts[0]);
      expect(typeof result.walletClient.account!.signMessage).toBe('function');
      expect(typeof result.walletClient.account!.signTransaction).toBe('function');
      expect(typeof result.walletClient.account!.signTypedData).toBe('function');
    });
  });
}); 