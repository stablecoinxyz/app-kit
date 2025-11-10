import { useState } from 'react';
import { useSbcApp } from '../hooks/useSbcApp';
import type { SupportedWalletType, WalletConnectionResult } from '@stablecoin.xyz/core';

export interface WalletButtonProps {
  /** Wallet type to connect to ('auto' for automatic detection) */
  walletType?: SupportedWalletType;
  /** Custom className for styling */
  className?: string;
  /** Callback when wallet connection succeeds */
  onConnect?: (result: WalletConnectionResult) => void;
  /** Callback when wallet connection fails */
  onError?: (error: Error) => void;
  /** Custom button text */
  children?: React.ReactNode;
  /** Show loading state */
  showLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom render prop for full control */
  render?: (props: {
    onClick: () => void;
    isConnecting: boolean;
    disabled: boolean;
    children: React.ReactNode;
    className: string;
  }) => React.ReactNode;
}

/**
 * WalletButton - Simple button component for connecting to wallets
 * 
 * Automatically detects available wallets and connects with one click
 */
export function WalletButton({
  walletType = 'auto',
  className = '',
  onConnect,
  onError,
  children,
  showLoading = true,
  disabled = false,
  render,
}: WalletButtonProps) {
  const { sbcAppKit, refreshAccount } = useSbcApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!sbcAppKit || isConnecting || disabled) return;

    try {
      setIsConnecting(true);
      setError(null);

      const result = await sbcAppKit.connectWallet(walletType);
      // Refresh app state after connection
      await refreshAccount();
      onConnect?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect wallet');

      // Log to console if debug mode is enabled
      if ((sbcAppKit as any).debug) {
        console.error('[SBC App Kit] Wallet connection failed:', error);
        console.error('[SBC App Kit] Wallet type:', walletType);
      }

      setError(error.message);
      onError?.(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const getButtonText = () => {
    if (children) return children;
    if (isConnecting) return 'Connecting...';
    if (walletType === 'metamask') return 'Connect MetaMask';
    if (walletType === 'coinbase') return 'Connect Coinbase Wallet';
    if (walletType === 'walletconnect') return 'Connect WalletConnect';
    return 'Connect Wallet';
  };

  const baseStyles = `
    px-4 py-2 rounded-md font-medium transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const stateStyles = isConnecting || disabled
    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800';

  const finalClassName = `${baseStyles} ${stateStyles} ${className}`.trim();

  // If render prop is provided, use it for rendering
  if (render) {
    return (
      <div className="space-y-2">
        {render({
          onClick: handleConnect,
          isConnecting,
          disabled: isConnecting || disabled || !sbcAppKit,
          children: getButtonText(),
          className: finalClassName,
        })}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={finalClassName}
        onClick={handleConnect}
        disabled={isConnecting || disabled || !sbcAppKit}
      >
        {showLoading && isConnecting && (
          <span className="inline-block w-4 h-4 mr-2 animate-spin rounded-full border-2 border-transparent border-t-current" />
        )}
        {getButtonText()}
      </button>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
} 