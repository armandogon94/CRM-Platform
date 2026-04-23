import { defineConfig } from 'vitest/config';

export default defineConfig({
  // vitest uses its bundled esbuild to transform `.tsx`; `jsx: 'automatic'`
  // picks up the react/jsx-runtime import path so we don't need vite +
  // @vitejs/plugin-react installed just to run component tests.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    globals: true,
    // `node` is the default so pure-logic tests (status, theme) stay fast;
    // component tests opt into jsdom via `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
});
