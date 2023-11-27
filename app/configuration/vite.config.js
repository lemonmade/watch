import {defineConfig} from 'vite';
import {quiltApp} from '@quilted/vite/app';

export default defineConfig({
  // I can't figure out how to make Caddy proxy wss correctly
  // Is this still needed?
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
  plugins: [quiltApp()],
});
