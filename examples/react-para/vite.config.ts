import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Custom plugin to handle @base-org/account import assertions
const handleImportAssertions = () => {
  return {
    name: 'handle-import-assertions',
    transform(code: string, id: string) {
      if (id.includes('@base-org/account') && code.includes('with { type: \'json\' }')) {
        // Replace the import assertion with a regular import
        return code.replace(/import pkg from '\.\.\/\.\.\/package\.json' with \{ type: 'json' \};/, 
          "import pkg from '../../package.json';");
      }
      return code;
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), handleImportAssertions()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: 'util'
    }
  },
  optimizeDeps: {
    exclude: ['@base-org/account'],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'import-assertions': true
      }
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [],
    }
  },
  server: {
    port: 3000,
    fs: {
      allow: [
        '..',
        '../../node_modules'
      ]
    }
  }
}) 