import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      // Polling para Windows: los eventos de inotify no se propagan
      // desde el filesystem de Windows al contenedor Linux
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      port: 5173,
    },
  },
});
