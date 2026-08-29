import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // React will be served from:
  // https://necbot.store/mini-store/
  const API_URL = env.VITE_APP_BASE_NAME || '/';

  const BASE_PATH = API_URL.endsWith('/')
    ? API_URL
    : `${API_URL}/`;

  const PORT = 3000;

  return {
    // ==========================================
    // PRODUCTION BASE PATH
    // ==========================================

    base: BASE_PATH,

    // ==========================================
    // DEVELOPMENT SERVER
    // ==========================================

    server: {
      open: true,

      port: PORT,

      host: true,

      // HTTPS is useful during development,
      // especially for camera/device APIs.
      https: true
    },

    // ==========================================
    // PREVIEW
    // ==========================================

    preview: {
      open: true,

      host: true,

      port: PORT,

      fs: {
        allow: ['..']
      }
    },

    // ==========================================
    // GLOBAL
    // ==========================================

    define: {
      global: 'window'
    },

    // ==========================================
    // ALIASES
    // ==========================================

    resolve: {
      alias: {
        '@ant-design/icons': path.resolve(
          __dirname,
          'node_modules/@ant-design/icons'
        )
      }
    },

    // ==========================================
    // PLUGINS
    // ==========================================

    plugins: [
      react(),

      jsconfigPaths(),

      // Development HTTPS certificate
      basicSsl()
    ],

    // ==========================================
    // BUILD
    // ==========================================

    build: {
      chunkSizeWarningLimit: 1000,

      sourcemap: true,

      cssCodeSplit: true,

      rollupOptions: {
        output: {
          chunkFileNames: 'js/[name]-[hash].js',

          entryFileNames: 'js/[name]-[hash].js',

          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';

            const ext = name.split('.').pop();

            if (/\.css$/.test(name)) {
              return `css/[name]-[hash].${ext}`;
            }

            if (
              /\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)
            ) {
              return `images/[name]-[hash].${ext}`;
            }

            if (
              /\.(woff2?|eot|ttf|otf)$/.test(name)
            ) {
              return `fonts/[name]-[hash].${ext}`;
            }

            return `assets/[name]-[hash].${ext}`;
          }
        }
      },

      // Production only
      ...(mode === 'production' && {
        esbuild: {
          drop: [
            'console',
            'debugger'
          ],

          pure: [
            'console.log',
            'console.info',
            'console.debug',
            'console.warn'
          ]
        }
      })
    },

    // ==========================================
    // OPTIMIZE DEPENDENCIES
    // ==========================================

    optimizeDeps: {
      include: [
        '@mui/material/Tooltip',
        'react',
        'react-dom',
        'react-router-dom',
        'html5-qrcode'
      ]
    }
  };
});

