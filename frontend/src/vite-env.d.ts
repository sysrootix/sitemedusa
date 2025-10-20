/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_TELEGRAM_BOT_ID: string
  readonly VITE_TELEGRAM_BOT_USERNAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
