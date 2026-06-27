import { defineConfig } from 'vite';

export default defineConfig({
  base: '/MySite/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
