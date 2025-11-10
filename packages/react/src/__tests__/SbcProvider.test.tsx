import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SbcProvider, useSbcContext } from '../components/SbcProvider';
import { SbcAppKit } from '@stablecoin.xyz/core';
import { baseSepolia } from 'viem/chains';

// Mock SbcAppKit
jest.mock('@stablecoin.xyz/core', () => ({
  ...jest.requireActual('@stablecoin.xyz/core'),
  SbcAppKit: jest.fn(),
}));

const MockedSbcAppKit = SbcAppKit as jest.MockedClass<typeof SbcAppKit>;

describe('SbcProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockedSbcAppKit.mockImplementation(() => ({
      getAccount: jest.fn(),
      sendUserOperation: jest.fn(),
    } as any));
  });

  describe('Initialization', () => {
    it('should initialize SbcAppKit with config', async () => {
      const TestComponent = () => {
        const { isInitialized } = useSbcContext();
        return <div>{isInitialized ? 'Initialized' : 'Not Initialized'}</div>;
      };

      const { getByText } = render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(getByText('Initialized')).toBeDefined();
      });

      expect(MockedSbcAppKit).toHaveBeenCalledWith({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });
    });

    it('should provide SbcAppKit instance to children', async () => {
      const TestComponent = () => {
        const { sbcAppKit } = useSbcContext();
        return <div>{sbcAppKit ? 'Has SDK' : 'No SDK'}</div>;
      };

      const { getByText } = render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(getByText('Has SDK')).toBeDefined();
      });
    });

    it('should handle initialization errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      MockedSbcAppKit.mockImplementationOnce(() => {
        throw new Error('Invalid API key');
      });

      const TestComponent = () => {
        const { error } = useSbcContext();
        return <div>{error ? error.message : 'No Error'}</div>;
      };

      const { getByText } = render(
        <SbcProvider
          config={{
            apiKey: 'invalid-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(getByText(/Invalid API key/)).toBeDefined();
      });

      consoleError.mockRestore();
    });

    it('should call onError callback on initialization failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();

      MockedSbcAppKit.mockImplementationOnce(() => {
        throw new Error('Init failed');
      });

      const TestComponent = () => {
        const { isInitialized } = useSbcContext();
        return <div>{isInitialized ? 'Yes' : 'No'}</div>;
      };

      render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
          }}
          onError={onError}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });

      expect(onError.mock.calls[0][0].message).toContain('Init failed');

      consoleError.mockRestore();
    });

    it('should log to console in debug mode on error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      MockedSbcAppKit.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const TestComponent = () => <div>Test</div>;

      render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
            debug: true,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '[SBC App Kit] Initialization failed:',
          expect.any(Error)
        );
      });

      expect(consoleError).toHaveBeenCalledWith(
        '[SBC App Kit] Config:',
        expect.objectContaining({
          hasApiKey: true,
          apiKeyValid: true,
        })
      );

      consoleError.mockRestore();
    });

    it('should show invalid API key in debug logs', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      MockedSbcAppKit.mockImplementationOnce(() => {
        throw new Error('Invalid API key');
      });

      const TestComponent = () => <div>Test</div>;

      render(
        <SbcProvider
          config={{
            apiKey: 'invalid-key-no-prefix',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
            debug: true,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '[SBC App Kit] Config:',
          expect.objectContaining({
            apiKeyValid: false,
          })
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Config Changes', () => {
    it('should re-initialize when config changes', async () => {
      const TestComponent = () => {
        const { isInitialized } = useSbcContext();
        return <div>{isInitialized ? 'Initialized' : 'Not Initialized'}</div>;
      };

      const { rerender } = render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(MockedSbcAppKit).toHaveBeenCalledTimes(1);
      });

      // Update config
      rerender(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key-2',
            chain: baseSepolia,
            privateKey: '0x' + '2'.repeat(64) as `0x${string}`,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(MockedSbcAppKit).toHaveBeenCalledTimes(2);
      });

      expect(MockedSbcAppKit).toHaveBeenLastCalledWith({
        apiKey: 'sbc-test-key-2',
        chain: baseSepolia,
        privateKey: '0x' + '2'.repeat(64) as `0x${string}`,
      });
    });
  });

  describe('Context', () => {
    it('should throw error when useSbcContext is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const TestComponent = () => {
        useSbcContext();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSbcContext must be used within a SbcProvider');

      consoleError.mockRestore();
    });

    it('should provide error state to consumers', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      MockedSbcAppKit.mockImplementationOnce(() => {
        throw new Error('Config error');
      });

      const TestComponent = () => {
        const { sbcAppKit, isInitialized, error } = useSbcContext();
        return (
          <div>
            <div data-testid="sdk">{sbcAppKit ? 'Has SDK' : 'No SDK'}</div>
            <div data-testid="init">{isInitialized ? 'Init' : 'Not Init'}</div>
            <div data-testid="error">{error ? error.message : 'No Error'}</div>
          </div>
        );
      };

      const { getByTestId } = render(
        <SbcProvider
          config={{
            apiKey: 'invalid',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(getByTestId('error').textContent).toContain('Config error');
      });

      expect(getByTestId('sdk').textContent).toBe('No SDK');
      expect(getByTestId('init').textContent).toBe('Not Init');

      consoleError.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const TestComponent = () => {
        const { isInitialized } = useSbcContext();
        return <div>{isInitialized ? 'Initialized' : 'Not Initialized'}</div>;
      };

      const { unmount } = render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(MockedSbcAppKit).toHaveBeenCalled();
      });

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Different Wallet Configs', () => {
    it('should initialize with auto wallet detection', async () => {
      const TestComponent = () => {
        const { isInitialized } = useSbcContext();
        return <div>{isInitialized ? 'Yes' : 'No'}</div>;
      };

      render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            wallet: 'auto',
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(MockedSbcAppKit).toHaveBeenCalledWith(
          expect.objectContaining({
            wallet: 'auto',
          })
        );
      });
    });

    it('should initialize with custom RPC URL', async () => {
      const TestComponent = () => {
        const { isInitialized } = useSbcContext();
        return <div>{isInitialized ? 'Yes' : 'No'}</div>;
      };

      render(
        <SbcProvider
          config={{
            apiKey: 'sbc-test-key',
            chain: baseSepolia,
            privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
            rpcUrl: 'https://custom-rpc.example.com',
          }}
        >
          <TestComponent />
        </SbcProvider>
      );

      await waitFor(() => {
        expect(MockedSbcAppKit).toHaveBeenCalledWith(
          expect.objectContaining({
            rpcUrl: 'https://custom-rpc.example.com',
          })
        );
      });
    });
  });
});
