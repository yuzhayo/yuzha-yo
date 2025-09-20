/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REGISTER_OPERATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
