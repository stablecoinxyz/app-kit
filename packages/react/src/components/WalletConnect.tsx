import React from 'react';

export interface WalletConnectProps {
  /** Custom className for styling */
  className?: string;
  /** Callback when wallet connection changes */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * WalletConnect component - placeholder for future wallet integration
 * 
 * This component will be expanded in the future to handle:
 * - Multiple wallet providers (MetaMask, WalletConnect, Coinbase Wallet, etc.)
 * - Wallet switching
 * - Connection state management
 * - Network switching
 */
export function WalletConnect({ className, onConnectionChange }: WalletConnectProps) {
  return (
    <div className={className}>
      <div style={{ 
        padding: '12px 16px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
          🚧 Wallet Connection Coming Soon
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
          This component will support multiple wallet providers and connection management.
        </p>
      </div>
    </div>
  );
} 