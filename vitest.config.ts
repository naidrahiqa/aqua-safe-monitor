import { defineConfig } from 'vitest/config';
import baseConfig from './vite.config';

export default defineConfig({
    ...baseConfig,
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            reporter: ['text', 'html'],
            exclude: ['node_modules/', 'src/test/'],
        },
    },
});
