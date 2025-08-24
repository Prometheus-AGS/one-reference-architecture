import tailwindcss from '@tailwindcss/vite'
import type { TuonoConfig } from 'tuono/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Tuono config for full-stack mode with static file serving
const config: TuonoConfig = {
    vite: {
        plugins: [
            tailwindcss(),
            tsconfigPaths(),
        ],
        server: {
            port: 31334, // Use port 31334 for both dev and build
            host: '0.0.0.0', // Bind to all interfaces for external access
            hmr: {
                overlay: false,
            },
        },
        logLevel: 'warn',
        ssr: {
            // Exclude PGLite and related WASM modules from SSR compilation
            noExternal: [],
            external: [
                '@electric-sql/pglite',
            ],
        },
        optimizeDeps: {
            exclude: [
                '@electric-sql/pglite',
            ],
        },
    },
    // Server config for runtime
    server: {
        port: 31334,
        host: '0.0.0.0', // Bind to all interfaces
    },
    // Remove api-only mode to enable static file serving
}

export default config
