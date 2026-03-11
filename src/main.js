import disableDevtool from 'disable-devtool';

const env = import.meta.env;
const isProd = env.PROD;
const enableConfigJS = String(env.VITE_CONFIGJS ?? env.VUE_APP_CONFIGJS ?? 'false') === 'true';
const enableAntiDebugging = String(env.VITE_DEBUGGING ?? env.VUE_APP_DEBUGGING ?? 'false') === 'true';

(async () => {
  try {
    if (!isProd || !enableConfigJS || typeof window.EZ_CONFIG === 'undefined') {
      const res = await import('./config/index.js');
      if (typeof window !== 'undefined') {
        window.EZ_CONFIG = res.config || res.default || res;
      }
    }

    if (isProd && enableAntiDebugging) {
      disableDevtool();
    }

    await import('./appInit.js');
  } catch (error) {
    console.error(error);
  }
})();
