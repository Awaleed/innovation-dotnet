import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

const hotFilePath = path.resolve(__dirname, '../wwwroot/hot');

/**
 * Writes a 'hot' file to wwwroot so the .NET app knows the Vite dev server URL.
 * Replaces laravel-vite-plugin's only essential behavior for this project.
 */
function hotFilePlugin() {
    return {
        name: 'dotnet-hot-file',
        configureServer(server) {
            const port = server.config.server.port ?? 5173;
            server.httpServer?.once('listening', () => {
                fs.writeFileSync(hotFilePath, `http://localhost:${port}`);
            });
        },
        buildEnd() {
            // Clean up hot file after build (production doesn't need it)
            if (fs.existsSync(hotFilePath)) {
                fs.unlinkSync(hotFilePath);
            }
        },
    };
}

export default defineConfig({
    plugins: [
        hotFilePlugin(),
        tailwindcss(),
        react(),
    ],
    build: {
        outDir: path.resolve(__dirname, '../wwwroot/build'),
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: path.resolve(__dirname, 'src/App.tsx'),
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        port: 5173,
        strictPort: true,
        cors: true,
        hmr: {
            host: 'localhost',
        },
    },
});
