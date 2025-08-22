/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SBC_API_KEY: string
    readonly VITE_DYNAMIC_ENVIRONMENT_ID: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  } 