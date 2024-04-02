import { vitePlugin as remix } from '@remix-run/dev';
import { installGlobals } from '@remix-run/node';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
// import init from 'remix-intl/plugin';

installGlobals();
// init(path.join(__dirname, 'app/i18n.ts'), {
//   plugins: [remix(), tsconfigPaths()],
//   server: {
//     port: +(process.env.PORT || '3000'),
//   },
// })

export default defineConfig({
  plugins: [tsconfigPaths(), remix()],
  server: {
    port: +(process.env.PORT || '3000'),
  },
  resolve: {
    alias: {
      // 'npm:remix-intl/i18n': path.join(__dirname, 'app/i18n.ts'),
      'remix-intl/i18n': path.resolve(__dirname, 'app/i18n.ts'),
    },
  },
});
