/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SBC_API_KEY: string
  readonly VITE_MY_PRIVATE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 