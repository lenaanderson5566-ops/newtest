import axios from "axios";
import {
  API_BASE_URL,
  getApiBaseUrl,
  CUSTOM_HEADERS_CONFIG,
} from "@/utils/baseConfig";
import { getAvailableApiUrl } from "@/utils/apiAvailabilityChecker";
import { clearCachedLoginStatus, getAuthData, setUserLoggedInFlag } from "@/utils/authState";

const clearAuthDataAndRedirectToLogin = () => {
  const authKeys = [
    "token",
    "authorization",
    "auth_data",
    "cookie_auth_data",
    "userInfo",
    "left_sidebar_collapsed",
    "is_admin",
    "vuex",
    "user",
    "auth",
  ];

  authKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  const sessionKeys = ["token", "authorization", "auth_data", "vuex", "user", "auth"];
  sessionKeys.forEach((key) => {
    sessionStorage.removeItem(key);
  });

  setUserLoggedInFlag(false);
  clearCachedLoginStatus();
  window.location.href = "/#/login";
};

const normalizeAuthData = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "";
  return trimmed;
};

const toOrigin = (value) => {
  if (!value || typeof value !== "string") return "";
  try {
    return new URL(value, window.location.origin).origin;
  } catch (e) {
    return "";
  }
};

const getStaticApiOrigins = () => {
  const origins = new Set();
  const staticBaseUrl = window?.EZ_CONFIG?.API_CONFIG?.staticBaseUrl;

  if (Array.isArray(staticBaseUrl)) {
    staticBaseUrl.forEach((item) => {
      const origin = toOrigin(item);
      if (origin) origins.add(origin);
    });
  } else {
    const origin = toOrigin(staticBaseUrl);
    if (origin) origins.add(origin);
  }

  return origins;
};

const getAllowedApiOrigins = () => {
  const staticOrigins = getStaticApiOrigins();
  if (staticOrigins.size > 0) {
    return staticOrigins;
  }

  const origins = new Set();
  const currentApiBase = getApiBaseUrl();
  const availableApiUrl = getAvailableApiUrl();

  [currentApiBase, availableApiUrl].forEach((item) => {
    const origin = toOrigin(item);
    if (origin) origins.add(origin);
  });

  return origins;
};

const resolveRequestOrigin = (config) => {
  const base = config.baseURL || getApiBaseUrl() || window.location.origin;
  const targetUrl = config.url || "";
  try {
    return new URL(targetUrl, base).origin;
  } catch (e) {
    return "";
  }
};

/**
 * 统一响应契约说明：
 * - request(...) 成功时固定返回 `response.data`（即后端响应包，以下简称 envelope）
 * - envelope 常见结构：{ data, message, ... }
 * - 业务代码请通过下方辅助函数读取，避免在各处写分叉兼容逻辑
 */
export const getResponseEnvelope = (response) => {
  if (response && typeof response === "object") {
    return response;
  }
  return {};
};

export const getResponseData = (response) => {
  const envelope = getResponseEnvelope(response);
  if (Object.prototype.hasOwnProperty.call(envelope, "data")) {
    return envelope.data;
  }
  return null;
};

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

request.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const availableApiUrl = getAvailableApiUrl();
    if (availableApiUrl) {
      config.baseURL = availableApiUrl;
    }

    if (config.method === "post" && config.data) {
      const formData = new URLSearchParams();
      for (const key in config.data) {
        if (Object.prototype.hasOwnProperty.call(config.data, key)) {
          formData.append(key, config.data[key]);
        }
      }

      config.data = formData;
      config.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    const authDataFromStorage = normalizeAuthData(getAuthData());

    const requestOrigin = resolveRequestOrigin(config);
    const allowedOrigins = getAllowedApiOrigins();
    const canAttachAuth =
      !!authDataFromStorage &&
      allowedOrigins.size > 0 &&
      !!requestOrigin &&
      allowedOrigins.has(requestOrigin);

    if (canAttachAuth) {
      config.headers["Authorization"] = authDataFromStorage;
    } else {
      delete config.headers?.Authorization;
      delete config.headers?.authorization;
    }

    if (
      CUSTOM_HEADERS_CONFIG &&
      CUSTOM_HEADERS_CONFIG.enabled &&
      CUSTOM_HEADERS_CONFIG.headers
    ) {
      const customHeaders = CUSTOM_HEADERS_CONFIG.headers;
      for (const headerName in customHeaders) {
        if (Object.prototype.hasOwnProperty.call(customHeaders, headerName)) {
          const headerValue = customHeaders[headerName];
          config.headers[headerName] = headerValue;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(new Error("Request configuration error"));
  }
);

request.interceptors.response.use(
  (response) => {
    const res = response.data;

    if (res && (res.message === "未登录或登陆已过期" || res.message === "Not logged in or session expired")) {
      clearAuthDataAndRedirectToLogin();
      return Promise.reject(new Error(res.message));
    }

    return res;
  },
  (error) => {

    if (error.response && error.response.data && error.response.data.message) {
      error.response.message = error.response.data.message;
    } else if (error.response) {
      const statusCode = error.response.status;
      switch (statusCode) {
        case 400:
          error.response.message = "Invalid request parameters";
          break;
        case 401:
          error.response.message = "Unauthorized, please log in again";
          break;
        case 403:
          error.response.message = "Access denied";
          break;
        case 404:
          error.response.message = "Requested resource not found";
          break;
        default:
          error.response.message = `Request failed (${statusCode})`;
      }
    } else if (error.message) {
      if (error.message.includes("timeout")) {
        error.message = "Request timeout";
      } else if (error.message.includes("Network Error")) {
        error.message = "Network error, please check your connection";
      }
    }

    return Promise.reject(error);
  }
);

export default request;
