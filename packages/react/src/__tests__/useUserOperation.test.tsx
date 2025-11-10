import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserOperation } from '../hooks/useUserOperation';
import { SbcProvider } from '../components/SbcProvider';
import { SbcAppKit } from '@stablecoin.xyz/core';
import { baseSepolia } from 'viem/chains';

// Mock SbcAppKit
jest.mock('@stablecoin.xyz/core', () => ({
  ...jest.requireActual('@stablecoin.xyz/core'),
  SbcAppKit: jest.fn(),
}));

// Mock useSbcApp
const mockRefreshAccount = jest.fn();
jest.mock('../hooks/useSbcApp', () => ({
  useSbcApp: () => ({
    sbcAppKit: null,
    refreshAccount: mockRefreshAccount,
  }),
}));

const MockedSbcAppKit = SbcAppKit as jest.MockedClass<typeof SbcAppKit>;

describe('useUserOperation', () => {
  const mockSendUserOperation = jest.fn();
  const mockEstimateUserOperation = jest.fn();

  const createWrapper = (config: any) => {
    return ({ children }: { children: React.ReactNode }) => (
      <SbcProvider config={config}>{children}</SbcProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    MockedSbcAppKit.mockImplementation(() => ({
      sendUserOperation: mockSendUserOperation,
      estimateUserOperation: mockEstimateUserOperation,
      debug: false,
    } as any));

    mockSendUserOperation.mockResolvedValue({
      userOperationHash: '0xUserOpHash',
      transactionHash: '0xTxHash',
      success: true,
    });

    mockEstimateUserOperation.mockResolvedValue({
      callGasLimit: 100000n,
      verificationGasLimit: 200000n,
      preVerificationGas: 50000n,
      maxFeePerGas: 30000000000n,
      maxPriorityFeePerGas: 2000000000n,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });
  });

  describe('sendUserOperation', () => {
    it('should send user operation successfully', async () => {
      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      const callParams = {
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      };

      let resultData: any;
      await waitFor(async () => {
        resultData = await result.current.sendUserOperation(callParams);
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data?.transactionHash).toBe('0xTxHash');
      expect(resultData?.transactionHash).toBe('0xTxHash');
      expect(mockSendUserOperation).toHaveBeenCalledWith(callParams);
    });

    it('should handle send errors', async () => {
      mockSendUserOperation.mockRejectedValueOnce(new Error('Transaction failed'));

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      await result.current.sendUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Transaction failed');
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.data).toBeNull();
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = jest.fn();

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation({ onSuccess }), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      await result.current.sendUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          userOperationHash: '0xUserOpHash',
          transactionHash: '0xTxHash',
          success: true,
        });
      });
    });

    it('should call onError callback', async () => {
      const onError = jest.fn();
      mockSendUserOperation.mockRejectedValueOnce(new Error('TX Error'));

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation({ onError }), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      await result.current.sendUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });

      expect(onError.mock.calls[0][0].message).toContain('TX Error');
    });

    it('should refresh account after successful send', async () => {
      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      await result.current.sendUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(mockRefreshAccount).toHaveBeenCalled();
      });
    });

    it('should skip refresh account when refreshAccount option is false', async () => {
      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation({ refreshAccount: false }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      await result.current.sendUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockRefreshAccount).not.toHaveBeenCalled();
    });

    it.skip('should handle SDK not initialized', async () => {
      // Skipping: Provider initialization complexities with invalid API key
      // SDK initialization errors are tested in SbcProvider tests
    });

    it('should log errors in debug mode', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockSendUserOperation.mockRejectedValueOnce(new Error('Debug error'));

      MockedSbcAppKit.mockImplementationOnce(() => ({
        sendUserOperation: mockSendUserOperation,
        estimateUserOperation: mockEstimateUserOperation,
        debug: true,
      } as any));

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
        debug: true,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      await result.current.sendUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '[SBC App Kit] User operation failed:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('estimateUserOperation', () => {
    it('should estimate gas successfully', async () => {
      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.estimateUserOperation).toBeDefined();
      });

      const estimate = await result.current.estimateUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      expect(estimate?.callGasLimit).toBe(100000n);
      expect(estimate?.verificationGasLimit).toBe(200000n);
      expect(mockEstimateUserOperation).toHaveBeenCalled();
    });

    it('should handle estimation errors', async () => {
      mockEstimateUserOperation.mockRejectedValueOnce(new Error('Estimation failed'));

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.estimateUserOperation).toBeDefined();
      });

      const estimate = await result.current.estimateUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      expect(estimate).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Estimation failed');
    });

    it('should call onError for estimation failures', async () => {
      const onError = jest.fn();
      mockEstimateUserOperation.mockRejectedValueOnce(new Error('Estimate error'));

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64) as `0x${string}`,
      });

      const { result } = renderHook(() => useUserOperation({ onError }), { wrapper });

      await waitFor(() => {
        expect(result.current.estimateUserOperation).toBeDefined();
      });

      await result.current.estimateUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should log estimation errors in debug mode', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockEstimateUserOperation.mockRejectedValueOnce(new Error('Gas estimation failed'));

      MockedSbcAppKit.mockImplementationOnce(() => ({
        sendUserOperation: mockSendUserOperation,
        estimateUserOperation: mockEstimateUserOperation,
        debug: true,
      } as any));

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64),
        debug: true,
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.estimateUserOperation).toBeDefined();
      });

      await result.current.estimateUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          '[SBC App Kit] Gas estimation failed:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64),
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      // Send operation
      await waitFor(async () => {
        await result.current.sendUserOperation({
          calls: [
            {
              to: '0xRecipient' as `0x${string}`,
              data: '0x' as `0x${string}`,
            },
          ],
        });
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).not.toBeNull();

      // Reset
      await waitFor(() => {
        result.current.reset();
        expect(result.current.isSuccess).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('should set loading state during operation', async () => {
      let resolveSend: any;
      mockSendUserOperation.mockImplementationOnce(
        () => new Promise((resolve) => (resolveSend = resolve))
      );

      const wrapper = createWrapper({
        apiKey: 'sbc-test-key',
        chain: baseSepolia,
        privateKey: '0x' + '1'.repeat(64),
      });

      const { result } = renderHook(() => useUserOperation(), { wrapper });

      await waitFor(() => {
        expect(result.current.sendUserOperation).toBeDefined();
      });

      // Start operation
      result.current.sendUserOperation({
        calls: [
          {
            to: '0xRecipient' as `0x${string}`,
            data: '0x' as `0x${string}`,
          },
        ],
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // Resolve
      resolveSend({
        userOperationHash: '0xHash',
        transactionHash: '0xTx',
        success: true,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});
