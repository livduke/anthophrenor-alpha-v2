import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    assetsDir: 'assets',
  },
  assetsInclude: ['**/*.mp3'],
});
