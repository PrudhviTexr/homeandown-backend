import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ],
  server: {
    host: "::",
    port: 8082,
    allowedHosts: [
      'localhost',
      '1d9ea91b-2580-49f0-8c64-135bddc1e2a1.preview.emergentagent.com',
      '.emergentagent.com',
      '.preview.emergentagent.com'
    ],
    // Only use proxy in development mode
    ...(mode === 'development' && {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Don't rewrite the path - keep /api prefix
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/admin/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/admin\/api/, '/admin'),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('admin proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Admin Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Admin Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/properties': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('properties proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Properties Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Properties Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        }
      }
    })
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          icons: ["lucide-react"],
          charts: ["recharts"],
          utils: ["react-virtualized"]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: false,
      },
      mangle: {
        keep_fnames: true, // Keep function names for better error tracking
      }
    }
  }
}))