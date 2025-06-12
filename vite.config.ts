import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    target: 'esnext',  // 최신 문법 허용
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
    include: [
      'three',
      'three/addons/capabilities/WebGPU.js',
      'three/webgpu',
    ],
  },
});
