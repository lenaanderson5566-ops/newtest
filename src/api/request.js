import axios from "axios";
import {
  API_BASE_URL,
  getApiBaseUrl,
  isXiaoV2board,
  CUSTOM_HEADERS_CONFIG,
} from "@/utils/baseConfig";
import { getAvailableApiUrl } from "@/utils/apiAvailabilityChecker";

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

    if (isXiaoV2board() && config.method === "post" && config.data) {
      const formData = new URLSearchParams();
      for (const key in config.data) {
        if (Object.prototype.hasOwnProperty.call(config.data, key)) {
          formData.append(key, config.data[key]);
        }
      }

      config.data = formData;
      config.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    let authData = localStorage.getItem("auth_data");

    if (!authData) {
      try {
        const { getCookie } = require("./auth");
        authData = getCookie("auth_data");
      } catch (err) {
        const cookieAuthData = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_data="));

        if (cookieAuthData) {
          try {
            const encodedValue = cookieAuthData.split("=")[1];
            const decodedValue = decodeURIComponent(encodedValue);
            const parsedValue = JSON.parse(decodedValue);

            const { SITE_CONFIG } = require("../utils/baseConfig");
            if (parsedValue && parsedValue.site === SITE_CONFIG.siteName) {
              authData = parsedValue.value;
            }
          } catch (e) {
            authData = cookieAuthData.split("=")[1];
          }
        }
      }
    }

    if (!authData && window.authDataInStorage) {
      authData = window.authDataInStorage;
    }

    if (!authData) {
      const backupData = localStorage.getItem("cookie_auth_data");
      if (backupData) {
        try {
          const parsedValue = JSON.parse(backupData);

          const { SITE_CONFIG } = require("../utils/baseConfig");
          if (parsedValue && parsedValue.site === SITE_CONFIG.siteName) {
            authData = parsedValue.value;
          } else {
            authData = backupData;
          }
        } catch (e) {
          authData = backupData;
        }
      }
    }

    if (authData) {
      config.headers["Authorization"] = authData;
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
      console.error("Failed to apply custom headers:", error);
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(new Error("Request configuration error"));
  }
);

request.interceptors.response.use(
  (response) => {
    try {
      const res = response.data;

      if (res && (res.message === "未登录或登陆已过期" || res.message === "Not logged in or session expired")) {
        const { forceLogout } = require("./auth");
        forceLogout();
        window.location.href = "/#/login";
        return Promise.reject(new Error(res.message));
      }

      return res;
    } catch (err) {
      console.error("Failed to process response data:", err);
      return Promise.reject(new Error("Failed to process response data"));
    }
  },
  (error) => {
    console.error("Request error:", error);

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
