/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCLAW_TOKEN?: string
  readonly VITE_OPENCLAW_GATEWAY_URL?: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
