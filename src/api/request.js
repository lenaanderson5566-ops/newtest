import axios from "axios";
import {
  API_BASE_URL,
  getApiBaseUrl,
  CUSTOM_HEADERS_CONFIG,
} from "@/utils/baseConfig";
import { getAvailableApiUrl } from "@/utils/apiAvailabilityChecker";

const clearAuthDataAndRedirectToLogin = () => {
  const authKeys = [
    "token",
    "auth_data",
    "cookie_auth_data",
    "userInfo",
    "is_admin",
    "vuex",
    "user",
    "auth",
  ];

  authKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  const sessionKeys = ["token", "auth_data", "vuex", "user", "auth"];
  sessionKeys.forEach((key) => {
    sessionStorage.removeItem(key);
  });

  window.isUserLoggedIn = false;
  window.authDataInStorage = null;
  window.authCookieFailure = false;
  window.location.href = "/#/login";
};

const normalizeAuthData = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return "";
  return trimmed;
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
    if (
      window.EZ_CONFIG &&
      window.EZ_CONFIG.API_BASE_URLS &&
      Array.isArray(window.EZ_CONFIG.API_BASE_URLS) &&
      window.EZ_CONFIG.API_BASE_URLS.length > 1
    ) {
      const availableApiUrl = getAvailableApiUrl();
      if (availableApiUrl) {
        config.baseURL = availableApiUrl;
      }
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

    const authDataFromStorage = normalizeAuthData(
      localStorage.getItem("auth_data") || sessionStorage.getItem("auth_data")
    );

    if (authDataFromStorage) {
      config.headers["Authorization"] = authDataFromStorage;
    } else {
      delete config.headers?.Authorization;
      delete config.headers?.authorization;
    }

    try {
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
    } catch (error) {
    }

    return config;
  },
  (error) => {
    return Promise.reject(new Error("Request configuration error"));
  }
);

request.interceptors.response.use(
  (response) => {
    try {
      const res = response.data;

      if (res && (res.message === "未登录或登陆已过期" || res.message === "Not logged in or session expired")) {
        clearAuthDataAndRedirectToLogin();
        return Promise.reject(new Error(res.message));
      }

      return res;
    } catch (err) {
      return Promise.reject(new Error("Failed to process response data"));
    }
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
