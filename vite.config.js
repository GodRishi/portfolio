import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2015',
    cssTarget: 'safari12',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        404: resolve(__dirname, '404.html'),
        500: resolve(__dirname, '500.html'),
        privacy: resolve(__dirname, 'privacy-policy.html'),
        terms: resolve(__dirname, 'terms-of-service.html'),
        cookie: resolve(__dirname, 'cookie-policy.html')
      }
    }
  }
});
