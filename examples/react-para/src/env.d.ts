/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SBC_API_KEY: string
  readonly VITE_PARA_API_KEY: string
  readonly VITE_CHAIN?: string
  readonly VITE_RPC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 