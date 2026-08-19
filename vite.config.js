import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssTarget: ['chrome61', 'edge79', 'firefox70', 'safari12', 'ios12']
  }
});
