import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
