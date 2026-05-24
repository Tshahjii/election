import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx'],
            refresh: true,
        }),
        react({
            fastRefresh: false,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
            'assets': path.resolve(__dirname, 'resources/js/src/assets'),
            'api': path.resolve(__dirname, 'resources/js/src/api'),
            'components': path.resolve(__dirname, 'resources/js/src/components'),
            'config': path.resolve(__dirname, 'resources/js/src/config.ts'),
            'contexts': path.resolve(__dirname, 'resources/js/src/contexts'),
            'enum': path.resolve(__dirname, 'resources/js/src/enum.ts'),
            'layouts': path.resolve(__dirname, 'resources/js/src/layouts'),
            'menu-items': path.resolve(__dirname, 'resources/js/src/menu-items'),
            'routes': path.resolve(__dirname, 'resources/js/src/routes'),
            'sections': path.resolve(__dirname, 'resources/js/src/sections'),
            'states': path.resolve(__dirname, 'resources/js/src/states'),
            'store': path.resolve(__dirname, 'resources/js/src/store'),
            'themes': path.resolve(__dirname, 'resources/js/src/themes'),
            'utils': path.resolve(__dirname, 'resources/js/src/utils'),
            'views': path.resolve(__dirname, 'resources/js/src/views'),
        },
    },
})
