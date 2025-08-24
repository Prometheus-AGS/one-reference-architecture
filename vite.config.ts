import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// Detect if we're building for Tauri
const isTauri = process.env.TAURI_PLATFORM !== undefined || process.argv.includes('--tauri')

// Unified Vite config for both web and Tauri platforms
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // PGLite needs special handling
      '@electric-sql/pglite': path.resolve(__dirname, './node_modules/@electric-sql/pglite/dist/index.js'),
    },
  },
  build: {
    // Platform-specific output directories
    outDir: isTauri ? 'build-tauri' : 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        // Platform-specific entry points
        main: isTauri ? './src/tauri.html' : './index.html'
      },
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    commonjsOptions: {
      include: [/node_modules/]
    },
    chunkSizeWarningLimit: 10000,
    target: 'esnext',
  },
  server: {
    // Platform-specific ports
    port: isTauri ? 3001 : 3000,
    host: 'localhost',
    hmr: {
      overlay: false,
    },
    // Web-only proxy configuration
    ...((!isTauri) && {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/v1': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    }),
  },
  logLevel: 'warn',
  // SSR configuration (disabled for client-side only)
  ssr: {
    noExternal: [],
    external: [
      '@electric-sql/pglite',
    ],
  },
optimizeDeps: {
  include: [
    'react',
    'react-dom',
    'react-dom/client',
    'react-router-dom',
    'lucide-react',
    'clsx',
    'tailwind-merge',
  ],
  exclude: [
    '@electric-sql/pglite',
  ],
  force: true
},
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'global': 'globalThis',
    // Platform-specific environment variables
    '__TAURI__': isTauri,
  },
  assetsInclude: ['**/*.wasm', '**/*.data'],
  publicDir: 'public',
  css: {
    postcss: './postcss.config.js'
  },
  // Tauri-specific configuration
  ...(isTauri ? {
    base: './',
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
  } : {}),
})