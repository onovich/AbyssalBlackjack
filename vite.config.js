import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = 'AbyssalBlackjack';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repositoryName}/` : '/',
  plugins: [react()],
});