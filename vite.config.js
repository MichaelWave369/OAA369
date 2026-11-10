import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/OAA369/' : '/',
  build: { outDir: 'dist', sourcemap: false },
  server: { host: '0.0.0.0' },
});