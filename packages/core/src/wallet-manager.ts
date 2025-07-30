import { createWalletClient, custom } from 'viem';
import { toAccount } from 'viem/accounts';
import type {
  SupportedWalletType,
  DetectedWallet,
  WalletConnectionResult,
  WalletManagerConfig,
} from './types';

/**
 * WalletManager handles wallet detection, connection, and client creation
 * Provides a unified interface for multiple wallet types
 */
export class WalletManager {
  private config: WalletManagerConfig;

  constructor(config: WalletManagerConfig) {
    this.config = config;
  }

  /**
   * Detect all available wallets in the current environment
   */
  async detectAvailableWallets(): Promise<DetectedWallet[]> {
    const wallets: DetectedWallet[] = [];

    // Check for MetaMask
    if (typeof window !== 'undefined' && window.ethereum) {
      const isMetaMask = window.ethereum.isMetaMask || window.ethereum._metamask;
      wallets.push({
        type: 'metamask',
        name: 'MetaMask',
        available: !!isMetaMask,
        icon: 'https://images.ctfassets.net/clixtyxoaeas/4rnpEzy1ATWRKVBOLxZ1Fm/a74dc1eed36d23d7ea6030383a4d5163/MetaMask-icon-fox.svg',
        provider: isMetaMask ? window.ethereum : undefined,
      });

      // Check for Coinbase Wallet (may share window.ethereum)
      const isCoinbase = window.ethereum.isCoinbaseWallet || window.ethereum.selectedProvider?.isCoinbaseWallet;
      if (isCoinbase) {
        wallets.push({
          type: 'coinbase',
          name: 'Coinbase Wallet',
          available: true,
          icon: 'https://gist.githubusercontent.com/taycaldwell/2291907115c0bb5589bc346661435007/raw/280eafdc84cb80ed0c60e36b4d0c563f6dca6b3e/cbw.svg',
          provider: window.ethereum,
        });
      }
    }

    // Check for Coinbase Wallet extension specifically
    if (typeof window !== 'undefined' && window.coinbaseWalletExtension) {
      wallets.push({
        type: 'coinbase',
        name: 'Coinbase Wallet',
        available: true,
        icon: 'https://gist.githubusercontent.com/taycaldwell/2291907115c0bb5589bc346661435007/raw/280eafdc84cb80ed0c60e36b4d0c563f6dca6b3e/cbw.svg',
        provider: window.coinbaseWalletExtension,
      });
    }

    // WalletConnect is always "available" as it doesn't require browser extension
    wallets.push({
      type: 'walletconnect',
      name: 'WalletConnect',
      available: true,
      icon: 'https://registry.walletconnect.com/logo/black/128/image/png',
      provider: null, // WalletConnect uses different connection pattern
    });

    return wallets;
  }

  /**
   * Get the best available wallet based on preferences
   */
  async getBestAvailableWallet(): Promise<DetectedWallet | null> {
    const availableWallets = await this.detectAvailableWallets();
    const available = availableWallets.filter(w => w.available);

    if (available.length === 0) return null;

    // Use preference order if specified
    const preferred = this.config.options?.preferredWallets || ['metamask', 'coinbase', 'walletconnect'];
    
    for (const preferredType of preferred) {
      const wallet = available.find(w => w.type === preferredType);
      if (wallet) return wallet;
    }

    // Return first available wallet if no preferences match
    return available[0];
  }

  /**
   * Connect to a specific wallet type
   */
  async connectWallet(walletType: SupportedWalletType = 'auto'): Promise<WalletConnectionResult> {
    // Handle Dynamic integration
    if (walletType === 'dynamic') {
      return this.connectDynamic();
    }
    
    // Auto-detect if requested
    if (walletType === 'auto') {
      const bestWallet = await this.getBestAvailableWallet();
      if (!bestWallet) {
        throw new Error('No compatible wallets found. Please install MetaMask, Coinbase Wallet, or use WalletConnect.');
      }
      walletType = bestWallet.type;
    }

    switch (walletType) {
      case 'metamask':
        return await this.connectMetaMask();
      case 'coinbase':
        return await this.connectCoinbaseWallet();
      case 'walletconnect':
        return await this.connectWalletConnect();
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }

  /**
   * Connect to MetaMask wallet
   */
  private async connectMetaMask(): Promise<WalletConnectionResult> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.');
      }

      const address = accounts[0];

      // Create a standard viem wallet client with proper account
      const walletClient = createWalletClient({
        account: toAccount({
          address: address as `0x${string}`,
          async signMessage({ message }) {
            // Delegate to provider for signing
            return await window.ethereum.request({
              method: 'personal_sign',
              params: [typeof message === 'string' ? message : message.raw, address],
            });
          },
          async signTransaction(transaction) {
            // MetaMask handles transaction signing through sendTransaction
            throw new Error('Transaction signing handled by MetaMask provider');
          },
          async signTypedData(typedData) {
            // Delegate to provider for typed data signing
            return await window.ethereum.request({
              method: 'eth_signTypedData_v4',
              params: [address, JSON.stringify(typedData)],
            });
          },
        }),
        chain: this.config.chain,
        transport: custom(window.ethereum)
      });

      return {
        walletClient,
        wallet: {
          type: 'metamask',
          name: 'MetaMask',
          available: true,
          provider: window.ethereum,
        },
        address: address as `0x${string}`,
      };
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to Coinbase Wallet
   */
  private async connectCoinbaseWallet(): Promise<WalletConnectionResult> {
    // Try Coinbase Wallet extension first
    const provider = window.coinbaseWalletExtension || window.ethereum;
    
    if (!provider) {
      throw new Error('Coinbase Wallet not found. Please install Coinbase Wallet extension.');
    }

    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your Coinbase Wallet.');
      }

      const address = accounts[0];
      
      // Create a standard viem wallet client for Coinbase Wallet with proper account
      const walletClient = createWalletClient({
        account: toAccount({
          address: address as `0x${string}`,
          async signMessage({ message }) {
            // Delegate to provider for signing
            return await provider.request({
              method: 'personal_sign',
              params: [typeof message === 'string' ? message : message.raw, address],
            });
          },
          async signTransaction(transaction) {
            // Coinbase Wallet handles transaction signing through sendTransaction
            throw new Error('Transaction signing handled by Coinbase Wallet provider');
          },
          async signTypedData(typedData) {
            // Delegate to provider for typed data signing
            return await provider.request({
              method: 'eth_signTypedData_v4',
              params: [address, JSON.stringify(typedData)],
            });
          },
        }),
        chain: this.config.chain,
        transport: custom(provider)
      });

      return {
        walletClient,
        wallet: {
          type: 'coinbase',
          name: 'Coinbase Wallet',
          available: true,
          provider,
        },
        address: address as `0x${string}`,
      };
    } catch (error) {
      throw new Error(`Failed to connect to Coinbase Wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to WalletConnect
   */
  private async connectWalletConnect(): Promise<WalletConnectionResult> {
    throw new Error('WalletConnect integration coming soon. Please use MetaMask or Coinbase Wallet for now.');
  }

  /**
   * Connect to Dynamic SDK
   */
  private async connectDynamic(): Promise<WalletConnectionResult> {
    const dynamicContext = this.config.options?.dynamicContext;
    
    if (!dynamicContext?.primaryWallet) {
      throw new Error('Dynamic primaryWallet not found. Make sure Dynamic SDK is initialized and wallet is connected.');
    }

    const primaryWallet = dynamicContext.primaryWallet;
    
    if (!primaryWallet.address) {
      throw new Error('Dynamic wallet not connected. Please connect a wallet through Dynamic SDK first.');
    }

    try {
      // Get the wallet client from Dynamic
      const dynamicWalletClient = await primaryWallet.connector.getWalletClient();
      
      // Create a compatible wallet client for SBC
      const compatibleWalletClient = createWalletClient({
        account: toAccount({
          address: primaryWallet.address as `0x${string}`,
          async signMessage({ message }) {
            return await dynamicWalletClient.signMessage({ 
              message, 
              account: primaryWallet.address as `0x${string}` 
            });
          },
          async signTransaction(transaction) {
            return await dynamicWalletClient.signTransaction({ 
              ...transaction, 
              account: primaryWallet.address as `0x${string}` 
            });
          },
          async signTypedData(typedData) {
            return await dynamicWalletClient.signTypedData({ 
              ...typedData, 
              account: primaryWallet.address as `0x${string}` 
            });
          },
        }),
        chain: this.config.chain,
        transport: custom(dynamicWalletClient.transport)
      });

      return {
        walletClient: compatibleWalletClient,
        wallet: {
          type: 'dynamic',
          name: `Dynamic (${primaryWallet.connector.name})`,
          available: true,
          provider: dynamicWalletClient,
        },
        address: primaryWallet.address as `0x${string}`,
      };
    } catch (error) {
      throw new Error(`Failed to connect Dynamic wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Extend window type to support injected providers
declare global {
  interface Window {
    ethereum?: any;
    coinbaseWalletExtension?: any;
  }
} 