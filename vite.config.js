import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Genera dist/index.html autocontenido (JS inline) para abrirlo sin servidor.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 100_000 },
});
