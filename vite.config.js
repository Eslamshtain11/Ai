import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './',
    server: {
      port: Number(env.VITE_PORT ?? 5173),
      host: '0.0.0.0'
    },
    preview: {
      port: Number(env.VITE_PREVIEW_PORT ?? 4173),
      host: '0.0.0.0'
    },
    build: {
      target: 'es2019',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 1024,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom']
          }
        }
      }
    }
  };
});
