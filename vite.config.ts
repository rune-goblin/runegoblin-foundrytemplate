import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const moduleJSON = JSON.parse(readFileSync(new URL('./module.json', import.meta.url), 'utf8'));

export default defineConfig({
  root: 'src/',
  base: `/modules/${moduleJSON.id}/dist/`,
  plugins: [svelte()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'es2022',
    lib: {
      entry: './index.ts',
      formats: ['es'],
      fileName: () => `${moduleJSON.id}.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          const name = asset.name ?? asset.names?.[0] ?? '';
          return name.endsWith('.css') ? `${moduleJSON.id}.css` : '[name][extname]';
        },
      },
    },
  },
});
