/// <reference types="vite/client" />

interface ImportMetaEnv {
  // SBC Configuration
  readonly VITE_SBC_API_KEY: string;
  readonly VITE_RPC_URL?: string;
  readonly VITE_CHAIN?: string;

  // Turnkey Configuration (Frontend only - public)
  readonly VITE_TURNKEY_API_BASE_URL: string;
  readonly VITE_TURNKEY_RPID: string;
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
