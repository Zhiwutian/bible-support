/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { FC } from 'react';
  const Component: FC;
  export default Component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
