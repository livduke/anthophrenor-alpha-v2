import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mindspace: resolve(__dirname, 'pages/mindspace.html'),
        interface: resolve(__dirname, 'pages/interface.html'),
        MS1: resolve(__dirname, 'pages/MS1.html'),
        MS2: resolve(__dirname, 'pages/MS2.html'),
        MS3: resolve(__dirname, 'pages/MS3.html'),
        MS4: resolve(__dirname, 'pages/MS4.html'),
        MS5: resolve(__dirname, 'pages/MS5.html'),
        MS6: resolve(__dirname, 'pages/MS6.html'),
        MSending: resolve(__dirname, 'pages/MSending.html'),
        SE1: resolve(__dirname, 'pages/SE1.html'),
        SE2: resolve(__dirname, 'pages/SE2.html'),
        SE3: resolve(__dirname, 'pages/SE3.html'),
        SE4: resolve(__dirname, 'pages/SE4.html'),
        SE5: resolve(__dirname, 'pages/SE5.html'),
        SEending: resolve(__dirname, 'pages/SEending.html'),
      }
    },
    assetsDir: 'assets',
    // Ensure large assets aren't inlined
    assetsInlineLimit: 0
  },
  // Add asset handling
  assetsInclude: ['**/*.mp3', '**/*.glb', '**/*.gltf', '**/*.obj']
});