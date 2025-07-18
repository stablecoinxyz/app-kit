import { useState, useEffect } from 'react';
import { useSbcContext } from './SbcProvider';
import type { SupportedWalletType, WalletConnectionResult, DetectedWallet } from '@stablecoin.xyz/core';



export interface WalletSelectorProps {
  /** Custom className for styling */
  className?: string;
  /** Callback when wallet connection succeeds */
  onConnect?: (result: WalletConnectionResult) => void;
  /** Callback when wallet connection fails */
  onError?: (error: Error) => void;
  /** Show only available wallets */
  showOnlyAvailable?: boolean;
  /** Custom wallet list (overrides auto-detection) */
  wallets?: DetectedWallet[];
}

/**
 * WalletSelector - Component that displays available wallets and allows selection
 * 
 * Automatically detects installed wallets and shows connection options
 */
export function WalletSelector({
  className = '',
  onConnect,
  onError,
  showOnlyAvailable = true,
  wallets: customWallets,
}: WalletSelectorProps) {
  const { sbcAppKit } = useSbcContext();
  const [availableWallets, setAvailableWallets] = useState<DetectedWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingWallet, setConnectingWallet] = useState<SupportedWalletType | null>(null);

  // Load available wallets on mount
  useEffect(() => {
    const loadWallets = async () => {
      if (!sbcAppKit) return;

      try {
        setIsLoading(true);
        
        // TODO: Replace with sbcAppKit.getAvailableWallets() once new version is published
        if ((sbcAppKit as any).getAvailableWallets) {
          const wallets = await (sbcAppKit as any).getAvailableWallets();
          setAvailableWallets(wallets);
        } else {
          // Fallback: Use hardcoded wallet list
          const fallbackWallets: DetectedWallet[] = [
            {
              type: 'metamask',
              name: 'MetaMask',
              available: typeof window !== 'undefined' && !!window.ethereum,
              icon: 'https://docs.metamask.io/img/metamask-fox.svg',
            },
            {
              type: 'coinbase',
              name: 'Coinbase Wallet',
              available: typeof window !== 'undefined' && !!(window.ethereum || (window as any).coinbaseWalletExtension),
              icon: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
            },
            {
              type: 'walletconnect',
              name: 'WalletConnect',
              available: true,
              icon: 'https://registry.walletconnect.com/api/v1/logo/sm/walletconnect.png',
            },
          ];
          setAvailableWallets(fallbackWallets);
        }
      } catch (error) {
        console.error('Failed to load available wallets:', error);
        setAvailableWallets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWallets();
  }, [sbcAppKit]);

  const handleWalletConnect = async (walletType: SupportedWalletType) => {
    if (!sbcAppKit || connectingWallet) return;

    try {
      setConnectingWallet(walletType);

      // TODO: Replace with sbcAppKit.connectWallet() once new version is published
      if ((sbcAppKit as any).connectWallet) {
        const result = await (sbcAppKit as any).connectWallet(walletType);
        onConnect?.(result);
      } else {
        throw new Error('Wallet integration coming soon! Use the dev:local script to test with the latest SDK features.');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect wallet');
      onError?.(error);
    } finally {
      setConnectingWallet(null);
    }
  };

  // Use custom wallets if provided, otherwise use detected wallets
  const walletsToShow = customWallets || availableWallets;
  const filteredWallets = showOnlyAvailable 
    ? walletsToShow.filter(w => w.available)
    : walletsToShow;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center text-gray-600">
          <div className="inline-block w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          <p className="mt-2">Detecting available wallets...</p>
        </div>
      </div>
    );
  }

  if (filteredWallets.length === 0) {
    return (
      <div className={`text-center p-6 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <p className="text-gray-600 mb-4">No compatible wallets found.</p>
        <p className="text-sm text-gray-500">
          Please install MetaMask, Coinbase Wallet, or use WalletConnect to continue.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Connect Wallet</h3>
      
      {filteredWallets.map((wallet) => (
        <button
          key={wallet.type}
          type="button"
          className={`
            w-full flex items-center justify-between p-4 border rounded-lg transition-colors
            ${wallet.available 
              ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
              : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
            }
            ${connectingWallet === wallet.type ? 'border-blue-500 bg-blue-50' : ''}
          `}
          onClick={() => handleWalletConnect(wallet.type)}
          disabled={!wallet.available || connectingWallet !== null}
        >
          <div className="flex items-center space-x-3">
            {wallet.icon && (
              <img 
                src={wallet.icon} 
                alt={`${wallet.name} icon`}
                className="w-8 h-8 rounded"
                onError={(e) => {
                  // Hide broken images
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="text-left">
              <p className="font-medium text-gray-900">{wallet.name}</p>
              <p className="text-sm text-gray-500">
                {wallet.available ? 'Ready to connect' : 'Not installed'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {connectingWallet === wallet.type ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            ) : wallet.available ? (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// Declare global window types for wallet detection
declare global {
  interface Window {
    ethereum?: any;
    coinbaseWalletExtension?: any;
  }
} 