import tailwindcss from '@tailwindcss/vite'
import type { TuonoConfig } from 'tuono/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Tuono config for API-only mode (no client-side routing)
const config: TuonoConfig = {
    vite: {
        plugins: [
            tailwindcss(),
            tsconfigPaths(),
        ],
        server: {
            port: 3001, // Different port for API server
            host: 'localhost',
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
    // API-only mode: disable client-side routing
    mode: 'api-only',
}

export default config