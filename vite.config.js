import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const isProd = process.env.NODE_ENV === 'production';
const enableConfigJS = String(process.env.VITE_CONFIGJS ?? process.env.VUE_APP_CONFIGJS ?? 'false') === 'true';
const enableObfuscation = String(process.env.VITE_OBFUSCATION ?? process.env.VUE_APP_OBFUSCATION ?? 'false') === 'true';
const useTerser = String(process.env.VITE_MINIFY ?? '').toLowerCase() === 'terser';

const generateRandomFileName = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let name = '';
  for (let i = 0; i < length; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const randowNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${randowNumber}.${name}.js`;
};

const extraScriptFileName = isProd && enableConfigJS ? generateRandomFileName() : '';

const extraConfigPlugin = () => ({
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

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [vue(), extraConfigPlugin()],
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
    assetsDir: 'static',
    sourcemap: false,
    minify: useTerser ? 'terser' : 'esbuild',
    terserOptions: useTerser
      ? {
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          format: {
            comments: false,
            ascii_only: true
          }
        }
      : undefined
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
