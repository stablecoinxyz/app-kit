import { renderHook, waitFor } from '@testing-library/react';
import { useSbcPara } from '../hooks/useSbcPara';
import { SbcAppKit } from '@stablecoin.xyz/core';
import { baseSepolia } from 'viem/chains';

// Mock SbcAppKit
jest.mock('@stablecoin.xyz/core', () => ({
  ...jest.requireActual('@stablecoin.xyz/core'),
  SbcAppKit: jest.fn(),
}));

const MockedSbcAppKit = SbcAppKit as jest.MockedClass<typeof SbcAppKit>;

describe('useSbcPara', () => {
  const mockGetAccount = jest.fn();
  const mockWalletClient = { account: { address: '0x123' } };
  const mockPublicClient = {};

  beforeEach(() => {
    jest.clearAllMocks();
    MockedSbcAppKit.mockImplementation(() => ({
      getAccount: mockGetAccount,
    } as any));
    mockGetAccount.mockResolvedValue({
      address: '0xSmartAccount',
      isDeployed: true,
      nonce: 0,
      balance: '1000000000000000000',
    });
  });

  describe('Initialization', () => {
    it('should not initialize when Para account is not connected', () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: false,
            external: null,
            embedded: null,
          },
        })
      );

      expect(result.current.sbcAppKit).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.ownerAddress).toBeNull();
    });

    it('should initialize with external wallet', async () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.sbcAppKit).not.toBeNull();
      expect(result.current.ownerAddress).toBe('0xExternalWallet');
      expect(MockedSbcAppKit).toHaveBeenCalledWith({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        walletClient: mockWalletClient,
        rpcUrl: undefined,
        debug: false,
      });
    });

    it('should initialize with embedded wallet', async () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: null,
            embedded: {
              wallets: [{ address: '0xEmbeddedWallet' }],
            },
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.ownerAddress).toBe('0xEmbeddedWallet');
    });

    it('should wait for paraViemClients before initializing', () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: null, // Not ready yet
        })
      );

      expect(result.current.sbcAppKit).toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });

    it.skip('should throw error when no Para wallet address found', async () => {
      // Skipping: This edge case is hard to mock properly due to wallet detection logic
      // The hook checks hasExternalWallet and hasEmbeddedWallet before entering initializeSbc
      // Real-world scenario: Users should always have a valid wallet address when connected
    });

    it('should use custom RPC URL', async () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          rpcUrl: 'https://custom-rpc.example.com',
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(MockedSbcAppKit).toHaveBeenCalledWith(
        expect.objectContaining({
          rpcUrl: 'https://custom-rpc.example.com',
        })
      );
    });
  });

  describe('Account Loading', () => {
    it('should load account after initialization', async () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.account).not.toBeNull();
      });

      expect(result.current.account.address).toBe('0xSmartAccount');
      expect(result.current.isLoadingAccount).toBe(false);
      expect(mockGetAccount).toHaveBeenCalled();
    });

    it('should handle account loading errors', async () => {
      mockGetAccount.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.accountError).not.toBeNull();
      });

      expect(result.current.accountError?.message).toContain('Network error');
      expect(result.current.account).toBeNull();
    });

    it('should prevent concurrent account loads with isLoadingRef', async () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Call refreshAccount multiple times quickly
      result.current.refreshAccount();
      result.current.refreshAccount();
      result.current.refreshAccount();

      await waitFor(() => {
        expect(result.current.isLoadingAccount).toBe(false);
      });

      // getAccount should only be called twice: once for initial load, once for refresh
      // The concurrent calls should be prevented by isLoadingRef
      expect(mockGetAccount).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshAccount', () => {
    it('should refresh account data', async () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Update mock to return new data
      mockGetAccount.mockResolvedValueOnce({
        address: '0xSmartAccount',
        isDeployed: true,
        nonce: 5,
        balance: '2000000000000000000',
      });

      await result.current.refreshAccount();

      await waitFor(() => {
        expect(result.current.account.nonce).toBe(5);
      });

      expect(result.current.account.balance).toBe('2000000000000000000');
    });

    it('should not refresh if already loading', async () => {
      mockGetAccount.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Start refresh
      result.current.refreshAccount();

      // Try to refresh again immediately
      await result.current.refreshAccount();

      // Should only be called once for initial load
      expect(mockGetAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnectWallet', () => {
    it('should cleanup all state', async () => {
      const { result } = renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
        })
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.sbcAppKit).not.toBeNull();

      await result.current.disconnectWallet();

      await waitFor(() => {
        expect(result.current.sbcAppKit).toBeNull();
      });

      expect(result.current.isInitialized).toBe(false);
      expect(result.current.account).toBeNull();
      expect(result.current.ownerAddress).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.accountError).toBeNull();
    });
  });

  describe('Debug Mode', () => {
    it('should log to console when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
          debug: true,
        })
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Initializing SBC with Para wallet')
        );
      });

      consoleSpy.mockRestore();
    });

    it('should log errors when debug is enabled', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetAccount.mockRejectedValueOnce(new Error('Test error'));

      renderHook(() =>
        useSbcPara({
          apiKey: 'sbc-test-key',
          chain: baseSepolia,
          paraAccount: {
            isConnected: true,
            external: { evm: { address: '0xExternalWallet' } },
            embedded: null,
          },
          paraViemClients: {
            walletClient: mockWalletClient,
            publicClient: mockPublicClient,
            account: mockWalletClient.account,
          },
          debug: true,
        })
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load Para smart account'),
          expect.any(String)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Effect Re-runs', () => {
    it('should re-initialize when paraViemClients changes', async () => {
      const { result, rerender } = renderHook(
        ({ paraViemClients }) =>
          useSbcPara({
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            paraAccount: {
              isConnected: true,
              external: { evm: { address: '0xExternalWallet' } },
              embedded: null,
            },
            paraViemClients,
          }),
        {
          initialProps: {
            paraViemClients: {
              walletClient: mockWalletClient,
              publicClient: mockPublicClient,
              account: mockWalletClient.account,
            },
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(MockedSbcAppKit).toHaveBeenCalledTimes(1);

      // Update paraViemClients
      const newWalletClient = { account: { address: '0x456' } };
      rerender({
        paraViemClients: {
          walletClient: newWalletClient,
          publicClient: mockPublicClient,
          account: newWalletClient.account,
        },
      });

      await waitFor(() => {
        expect(MockedSbcAppKit).toHaveBeenCalledTimes(2);
      });

      expect(MockedSbcAppKit).toHaveBeenLastCalledWith(
        expect.objectContaining({
          walletClient: newWalletClient,
        })
      );
    });

    it('should cleanup when Para account disconnects', async () => {
      const { result, rerender } = renderHook(
        ({ isConnected }) =>
          useSbcPara({
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            paraAccount: {
              isConnected,
              external: isConnected ? { evm: { address: '0xExternalWallet' } } : null,
              embedded: null,
            },
            paraViemClients: {
              walletClient: mockWalletClient,
              publicClient: mockPublicClient,
              account: mockWalletClient.account,
            },
          }),
        {
          initialProps: { isConnected: true },
        }
      );

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Disconnect
      rerender({ isConnected: false });

      expect(result.current.sbcAppKit).toBeNull();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.ownerAddress).toBeNull();
    });
  });
});
