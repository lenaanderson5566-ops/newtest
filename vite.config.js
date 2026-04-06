import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const generateRandomFileName = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let name = '';
  for (let i = 0; i < length; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${randomNumber}.${name}.js`;
};

const generateRandomToken = (length = 12) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let i = 0; i < length; i++) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return value;
};

const extraConfigPlugin = ({ isProd, enableConfigJS, enableObfuscation, extraScriptFileName }) => ({
  name: 'generate-extra-config-js',
  transformIndexHtml(html) {
    if (!isProd || !enableConfigJS) {
      return html.replace('<!--__INJECT_CUSTOM_SCRIPT__-->', '');
    }
    return html.replace('<!--__INJECT_CUSTOM_SCRIPT__-->', `<script src="./${extraScriptFileName}"></script>`);
  },
  closeBundle() {
    if (!isProd || !enableConfigJS) return;

    const configPath = path.resolve(__dirname, 'src/config/index.js');
    const distPath = path.resolve(__dirname, 'dist', extraScriptFileName);

    try {
      let content = fs.readFileSync(configPath, 'utf-8');
      content = content.replace(/window\.EZ_CONFIG\s*=\s*config\s*;?/g, '');
      content = content.replace(/export\s+const\s+config\s*=/, 'window.EZ_CONFIG =');

      const obfuscated = JavaScriptObfuscator.obfuscate(content, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        numbersToExpressions: true,
        simplify: true,
        stringArray: true,
        stringArrayEncoding: ['rc4'],
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: true
      }).getObfuscatedCode();

      fs.writeFileSync(distPath, enableObfuscation ? obfuscated : content, 'utf-8');
      console.log(`生成混淆独立 JS 文件: ${extraScriptFileName}`);
    } catch (err) {
      console.warn('生成独立 JS 文件失败:', err);
    }
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const enableConfigJS = String(env.VITE_CONFIGJS ?? env.VUE_APP_CONFIGJS ?? 'false') === 'true';
  const enableObfuscation = String(env.VITE_OBFUSCATION ?? env.VUE_APP_OBFUSCATION ?? 'false') === 'true';
  const extraScriptFileName = isProd && enableConfigJS ? generateRandomFileName() : '';

  return {
    base: './',
    publicDir: 'public',
    plugins: [
      vue(),
      extraConfigPlugin({ isProd, enableConfigJS, enableObfuscation, extraScriptFileName })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/base/variables.scss" as *;`
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: () => `static/${generateRandomToken()}.js`,
          chunkFileNames: () => `static/${generateRandomToken()}.js`,
          assetFileNames: (assetInfo) => {
            const ext = path.extname(assetInfo?.name || '');
            return `static/${generateRandomToken()}${ext}`;
          }
        }
      },
      esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
        charset: 'ascii'
      }
    },
    server: {
      hmr: {
        overlay: false
      }
    }
  };
});
