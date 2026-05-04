import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@genui/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@genui/react': path.resolve(__dirname, '../react/src/index.ts'),
    },
  },
  // Dev proxy so the frontend can reach /.netlify/functions/* without netlify dev
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
});
