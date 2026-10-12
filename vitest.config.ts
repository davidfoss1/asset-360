import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**', '.agents/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Measure all production code under src/, as the certification gate does.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx',
        // Copied from Cognite's integrate-file-viewer skill (one import path adjusted for react-pdf 9.2).
        // Third-party-style code that needs pdf.js, which cannot run in the test environment.
        'src/cognite-file-viewer/**',
      ],
    },
  },
});
