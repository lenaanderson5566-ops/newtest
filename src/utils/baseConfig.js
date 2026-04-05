/**
 * 基础配置文件
 */

import { getAvailableApiUrl } from "@/utils/apiAvailabilityChecker";

const getConfig = (key, defaultValue) => {
  if (
    typeof window !== "undefined" &&
    window.EZ_CONFIG &&
    window.EZ_CONFIG[key] !== undefined
  ) {
    return window.EZ_CONFIG[key];
  }
  return defaultValue;
};

const mergeDeep = (target, source) => {
  if (!source) return target;
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
};

const isObject = (item) => {
  return item && typeof item === "object" && !Array.isArray(item);
};

// 获取API基础URL的函数
export const getApiBaseUrl = () => {
  // 完全依赖config.js中的配置
  if (typeof window !== "undefined" && window.EZ_CONFIG) {
    // 检查是否存在API_CONFIG
    if (window.EZ_CONFIG.API_CONFIG) {
      const apiConfig = window.EZ_CONFIG.API_CONFIG;

      // 静态URL模式
      if (apiConfig.urlMode === "static" && apiConfig.staticBaseUrl) {
        // 检查是否有经过API可用性检测的URL
        if (
          Array.isArray(apiConfig.staticBaseUrl) &&
          apiConfig.staticBaseUrl.length > 1
        ) {
          // 使用API可用性检测器获取可用的URL
          const availableUrl = getAvailableApiUrl();
          if (availableUrl) {
            return availableUrl;
          }
          // 如果没有可用URL，返回数组中的第一个URL
          return apiConfig.staticBaseUrl[0];
        }
        // 如果staticBaseUrl是数组但只有一个元素，返回该元素
        else if (
          Array.isArray(apiConfig.staticBaseUrl) &&
          apiConfig.staticBaseUrl.length === 1
        ) {
          return apiConfig.staticBaseUrl[0];
        }
        // 如果staticBaseUrl是字符串，直接返回
        else if (typeof apiConfig.staticBaseUrl === "string") {
          return apiConfig.staticBaseUrl;
        }
        // 如果staticBaseUrl不是字符串也不是数组，返回空字符串
        return "";
      }

      // 自动获取模式
      if (apiConfig.urlMode === "auto" && apiConfig.autoConfig) {
        try {
          const currentUrl = new URL(window.location.href);
          let apiBaseUrl = "";

          // 协议
          const protocol = apiConfig.autoConfig.useSameProtocol
            ? currentUrl.protocol
            : "https:";

          // 域名
          apiBaseUrl = `${protocol}//${currentUrl.host}`;

          // API路径
          if (
            apiConfig.autoConfig.appendApiPath &&
            apiConfig.autoConfig.apiPath
          ) {
            apiBaseUrl += apiConfig.autoConfig.apiPath;
          }

          return apiBaseUrl;
        } catch (error) {
          // 仅在自动模式失败时回退到静态URL
          if (apiConfig.staticBaseUrl) {
            return apiConfig.staticBaseUrl;
          }
        }
      }
    }
  }

  return "";
};

// 直接导出API基础URL
export const API_BASE_URL = getApiBaseUrl();

/**
 * 验证码配置
 * 控制注册和登录页面的验证方式
 */
const DEFAULT_CAPTCHA_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const CAPTCHA_CONFIG = mergeDeep(
  DEFAULT_CAPTCHA_CONFIG,
  getConfig("CAPTCHA_CONFIG")
);

/**
 * 自定义请求标头配置
 * 允许用户自定义添加请求标头到所有API请求
 */
const DEFAULT_CUSTOM_HEADERS_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const CUSTOM_HEADERS_CONFIG = mergeDeep(
  DEFAULT_CUSTOM_HEADERS_CONFIG,
  getConfig("CUSTOM_HEADERS")
);

// 网站名称配置
const DEFAULT_SITE_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const SITE_CONFIG = mergeDeep(
  DEFAULT_SITE_CONFIG,
  getConfig("SITE_CONFIG")
);

// 默认主题配置
const DEFAULT_BASE_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
  // 保留最小兜底，防止未加载外部配置时主题计算报错
  primaryColor: "#355cc2",
  enableLandingPage: true,
};

export const DEFAULT_CONFIG = mergeDeep(
  DEFAULT_BASE_CONFIG,
  getConfig("DEFAULT_CONFIG")
);

/**
 * 支付相关配置
 */
const DEFAULT_PAYMENT_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const PAYMENT_CONFIG = mergeDeep(
  DEFAULT_PAYMENT_CONFIG,
  getConfig("PAYMENT_CONFIG")
);

/**
 * 用户中心页面配置
 * 控制用户中心页面的功能显示
 */
const DEFAULT_PROFILE_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const PROFILE_CONFIG = mergeDeep(
  DEFAULT_PROFILE_CONFIG,
  getConfig("PROFILE_CONFIG")
);

/**
 * 工单配置
 * 控制工单功能的行为
 */
const DEFAULT_TICKET_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const TICKET_CONFIG = mergeDeep(
  DEFAULT_TICKET_CONFIG,
  getConfig("TICKET_CONFIG")
);

/**
 * 客户端下载配置
 * 用于控制仪表板中的客户端下载选项
 */
const DEFAULT_CLIENT_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const CLIENT_CONFIG = mergeDeep(
  DEFAULT_CLIENT_CONFIG,
  getConfig("CLIENT_CONFIG")
);

/**
 * 商店页面配置
 * 控制商店页面的行为和显示
 */
const DEFAULT_SHOP_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const SHOP_CONFIG = mergeDeep(
  DEFAULT_SHOP_CONFIG,
  getConfig("SHOP_CONFIG")
);

// ===========================================================

/**
 * 仪表盘页面配置
 * 控制仪表盘页面的功能与显示
 */
const DEFAULT_DASHBOARD_CONFIG = {
  /**
   * 说明：
   * Dashboard 功能开关以 src/config/index.js 的 DASHBOARD_CONFIG 为主。
   * 这里仅保留空兜底，避免与外部配置重复维护造成分叉。
   */
};

export const DASHBOARD_CONFIG = mergeDeep(
  DEFAULT_DASHBOARD_CONFIG,
  getConfig("DASHBOARD_CONFIG")
);

/**
 * 将16进制颜色转换为RGB数组
 * @param {string} hex - 16进制颜色值
 * @returns {number[]} RGB数组
 */
const hexToRgb = (hex) => {
  // 确保输入值是字符串
  if (typeof hex !== "string") {
    hex = String(hex);
  }

  // 去除空格
  hex = hex.trim();

  // 处理缩写形式的颜色值（例如#FFF -> #FFFFFF）
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  // 正则匹配完整的十六进制颜色值
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }
};

/**
 * 计算主题相关的颜色
 * @param {string} primaryColor - 主题色（16进制）
 * @returns {object} 主题色相关的颜色对象
 */
const calculateThemeColors = (primaryColor) => {
  const rgb = hexToRgb(primaryColor);
  return {
    primaryColor: primaryColor,
    primaryColorRgb: rgb.join(", "),
    // 计算衍生颜色
    primaryColorLight: `rgba(${rgb.join(", ")}, 0.1)`,
    primaryColorDark: primaryColor,
    primaryColorHover: `rgba(${rgb.join(", ")}, 0.9)`,
    primaryColorActive: `rgba(${rgb.join(", ")}, 0.8)`,
    primaryColorFocus: `rgba(${rgb.join(", ")}, 0.25)`,
  };
};

// 默认主题配置
const DEFAULT_THEME_CONFIG = {
  // 主题颜色变量
  light: {
    ...calculateThemeColors(DEFAULT_CONFIG.primaryColor),
    backgroundColor: "var(--theme-light-background-color)",
    backgroundElevated: "var(--theme-light-background-elevated)",
    cardBackground: "var(--theme-light-card-background)",
    textColor: "var(--theme-light-text-color)",
    secondaryTextColor: "var(--theme-light-secondary-text-color)",
    mutedTextColor: "var(--theme-light-muted-text-color)",
    borderColor: "var(--theme-light-border-color)",
    borderColorSoft: "var(--theme-light-border-color-soft)",
    shadowColor: "var(--theme-light-shadow-color)",
    shadowCardSm: "var(--theme-light-shadow-card-sm)",
    shadowCardMd: "var(--theme-light-shadow-card-md)",
    radiusSm: "var(--theme-radius-sm)",
    radiusMd: "var(--theme-radius-md)",
    radiusLg: "var(--theme-radius-lg)",
    surfaceSubtle: "var(--theme-light-surface-subtle)",
    headingColor: "var(--theme-light-heading-color)",
    neutralStrong: "var(--theme-light-neutral-strong)",
    buttonPrimaryStart: DEFAULT_CONFIG.primaryColor,
    buttonPrimarySoftStart: DEFAULT_CONFIG.primaryColor,
    buttonPrimaryEnd: calculateThemeColors(DEFAULT_CONFIG.primaryColor).primaryColorHover,
    buttonDisabledBg: "var(--theme-light-button-disabled-bg)",
  },
};

export const THEME_CONFIG = mergeDeep(
  DEFAULT_THEME_CONFIG,
  getConfig("THEME_CONFIG")
);

// 默认背景装饰球配置
const DEFAULT_BACKGROUND_BALLS_CONFIG = [
  {
    size: "600px",
    background: "var(--theme-color)",
    position: { top: "-10%", left: "-10%" },
    animationDuration: "25s",
  },
  {
    size: "500px",
    background: "#A747FE",
    position: { top: "40%", right: "-5%" },
    animationDuration: "30s",
  },
  {
    size: "450px",
    background: "#37DEC9",
    position: { bottom: "-10%", left: "20%" },
    animationDuration: "35s",
  },
];

export const BACKGROUND_BALLS_CONFIG = getConfig(
  "BACKGROUND_BALLS_CONFIG",
  DEFAULT_BACKGROUND_BALLS_CONFIG
);

/**
 * 浏览器访问限制配置
 * 控制哪些浏览器被禁止访问网站
 */
const DEFAULT_BROWSER_RESTRICT_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const BROWSER_RESTRICT_CONFIG = mergeDeep(
  DEFAULT_BROWSER_RESTRICT_CONFIG,
  getConfig("BROWSER_RESTRICT_CONFIG")
);

/**
 * 检测当前浏览器类型
 * @returns {string} 浏览器类型
 */
export const detectBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();

  // 检测微信浏览器
  if (ua.indexOf("micromessenger") !== -1) {
    return "WeChat";
  }

  // 检测QQ浏览器
  if (
    ua.indexOf("qqbrowser") !== -1 ||
    (ua.indexOf(" qq") !== -1 && ua.indexOf("mqqbrowser") !== -1)
  ) {
    return "QQ";
  }

  // 检测360浏览器 (不同版本有不同标识)
  if (
    ua.indexOf("qihu") !== -1 ||
    ua.indexOf("360ee") !== -1 ||
    ua.indexOf("360se") !== -1 ||
    (ua.indexOf("chrome") !== -1 &&
      navigator.connection?.saveData === undefined &&
      navigator.connection?.rtt === undefined)
  ) {
    return "360";
  }

  // 检测百度浏览器
  if (ua.indexOf("bidubrowser") !== -1 || ua.indexOf("baidubrowser") !== -1) {
    return "Baidu";
  }

  // 检测搜狗浏览器
  if (ua.indexOf("metasr") !== -1 || ua.indexOf("sogou") !== -1) {
    return "Sogou";
  }

  // 检测UC浏览器
  if (ua.indexOf("ucbrowser") !== -1 || ua.indexOf("ucweb") !== -1) {
    return "UC";
  }

  // 检测傲游浏览器
  if (ua.indexOf("maxthon") !== -1) {
    return "Maxthon";
  }

  // 检测Edge浏览器
  if (ua.indexOf("edg") !== -1) {
    return "Edge";
  }

  // 检测Chrome浏览器
  if (ua.indexOf("chrome") !== -1) {
    return "Chrome";
  }

  // 检测Safari浏览器
  if (ua.indexOf("safari") !== -1) {
    return "Safari";
  }

  // 检测Firefox浏览器
  if (ua.indexOf("firefox") !== -1) {
    return "Firefox";
  }

  // 默认返回Unknown
  return "Unknown";
};

/**
 * 检查当前浏览器是否被限制访问
 * @returns {boolean} 是否被限制
 */
export const isBrowserRestricted = () => {
  // 如果功能未启用，所有浏览器都允许访问
  if (!BROWSER_RESTRICT_CONFIG.enabled) {
    return false;
  }

  const browserType = detectBrowser();

  // 检查浏览器是否在限制列表中
  if (BROWSER_RESTRICT_CONFIG.restrictBrowsers[browserType]) {
    return true;
  }

  return false;
};

/**
 * 充值相关配置
 */
const DEFAULT_WALLET_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const WALLET_CONFIG = mergeDeep(
  DEFAULT_WALLET_CONFIG,
  getConfig("WALLET_CONFIG")
);

/**
 * 邀请页面配置
 */
const DEFAULT_INVITE_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const INVITE_CONFIG = mergeDeep(
  DEFAULT_INVITE_CONFIG,
  getConfig("INVITE_CONFIG")
);

/**
 * 节点列表配置
 * 控制节点列表页面的显示内容
 */
const DEFAULT_NODES_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const NODES_CONFIG = mergeDeep(
  DEFAULT_NODES_CONFIG,
  getConfig("NODES_CONFIG")
);

/**
 * 认证页面布局配置
 */
const DEFAULT_AUTH_LAYOUT_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const AUTH_LAYOUT_CONFIG = mergeDeep(
  DEFAULT_AUTH_LAYOUT_CONFIG,
  getConfig("AUTH_LAYOUT_CONFIG")
);

/**
 * 认证页面功能配置
 */
const DEFAULT_AUTH_CONFIG = {
  // 配置以 src/config/index.js 为主，避免重复维护
};

export const AUTH_CONFIG = mergeDeep(
  DEFAULT_AUTH_CONFIG,
  getConfig("AUTH_CONFIG")
);

/**
 * 导航配置（兼容导出）
 * thirdNavItem/fourthNavItem 已废弃：侧边导航改为固定四项。
 */
const DEFAULT_NAVIGATION_CONFIG = {
  // 保留兼容字段，避免历史配置访问报错
  thirdNavItem: null,
  fourthNavItem: null
};

export const NAVIGATION_CONFIG = mergeDeep(
  DEFAULT_NAVIGATION_CONFIG,
  getConfig("NAVIGATION_CONFIG")
);
