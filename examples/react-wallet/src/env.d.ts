/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_SBC_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Extend Window interface for MetaMask
interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
  };
} 