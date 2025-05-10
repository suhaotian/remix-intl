import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'dist/index': 'src/index.tsx',
    i18n: 'src/i18n.ts',
    navigation: 'src/navigation.tsx',
    server: 'src/server.ts',
    utils: 'src/utils/index.ts',
    types: 'src/types.ts',
  },
  outDir: './',
  splitting: true,
  format: ['esm', 'cjs'],
  minify: true,
  target: 'es2015',
  dts: true,
  external: ['@remix-run/react', '@remix-run/node', 'react', 'i18next', 'react-router'],
});
