import axios from "axios";

// =========================================================
// AXIOS INSTANCE
// =========================================================

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  withCredentials: true,
});

// =========================================================
// CSRF TOKEN
// =========================================================

let csrfToken = null;
let csrfTokenPromise = null;

// =========================================================
// GET CSRF TOKEN
// =========================================================

const getCsrfToken = async () => {
  // Already cached
  if (csrfToken) {
    return csrfToken;
  }

  // Prevent multiple simultaneous CSRF requests
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = api
    .get("/csrf-token")
    .then((response) => {
      const token = response.data?.csrfToken;

      if (!token) {
        throw new Error(
          "CSRF token was not returned by server",
        );
      }

      csrfToken = token;

      return token;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
};

// =========================================================
// CLEAR CSRF TOKEN
// =========================================================

export const clearCsrfToken = () => {
  csrfToken = null;
};

// =========================================================
// CSRF REQUEST INTERCEPTOR
// =========================================================

api.interceptors.request.use(
  async (config) => {
    const method = config.method?.toUpperCase();

    const safeMethods = ["GET", "HEAD", "OPTIONS"];

    // CSRF only for unsafe methods
    if (!safeMethods.includes(method)) {
      const token = await getCsrfToken();

      config.headers = config.headers || {};

      config.headers["X-CSRF-Token"] = token;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

// =========================================================
// ACCESS TOKEN REFRESH
// =========================================================

let isRefreshing = false;

// Requests waiting for token refresh
let refreshSubscribers = [];

// =========================================================
// SUBSCRIBE REQUEST TO REFRESH QUEUE
// =========================================================

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// =========================================================
// REFRESH SUCCESS
// =========================================================

const onRefreshed = () => {
  refreshSubscribers.forEach((callback) => {
    callback(null);
  });

  refreshSubscribers = [];
};

// =========================================================
// REFRESH FAILURE
// =========================================================

const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((callback) => {
    callback(error);
  });

  refreshSubscribers = [];
};

// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================

api.interceptors.response.use(
  // =======================================================
  // SUCCESS
  // =======================================================

  (response) => {
    return response;
  },

  // =======================================================
  // ERROR
  // =======================================================

  async (error) => {
    const originalRequest = error.config;

    console.log(
      "🔥 API ERROR:",
      error.response?.status,
      originalRequest?.url,
    );

    // =====================================================
    // NO REQUEST CONFIG
    // =====================================================

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // =====================================================
    // CSRF TOKEN RECOVERY
    // =====================================================

    const csrfMessage = error.response?.data?.message;

    const isCsrfError =
      error.response?.status === 403 &&
      (
        csrfMessage === "Invalid CSRF token" ||
        csrfMessage === "CSRF token required"
      );

    if (
      isCsrfError &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;

      // Clear old cached token
      clearCsrfToken();

      try {
        console.log(
          "🔐 CSRF token missing/invalid. Fetching new token...",
        );

        const token = await getCsrfToken();

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers["X-CSRF-Token"] = token;

        console.log(
          "✅ New CSRF token received",
        );

        return api(originalRequest);
      } catch (csrfError) {
        console.error(
          "❌ CSRF token refresh failed:",
          csrfError.response?.data ||
            csrfError.message,
        );

        return Promise.reject(csrfError);
      }
    }

    // =====================================================
    // ONLY HANDLE 401
    // =====================================================

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // =====================================================
    // NEVER REFRESH /auth/refresh ITSELF
    // =====================================================

    if (
      originalRequest.url?.includes(
        "/auth/refresh",
      )
    ) {
      return Promise.reject(error);
    }

    // =====================================================
    // DON'T REFRESH LOGIN / REGISTER / GOOGLE LOGIN
    // =====================================================

    const isAuthRequest =
      originalRequest.url?.includes(
        "/auth/login",
      ) ||
      originalRequest.url?.includes(
        "/auth/register",
      ) ||
      originalRequest.url?.includes(
        "/auth/google-login",
      );

    if (isAuthRequest) {
      return Promise.reject(error);
    }

    // =====================================================
    // PREVENT INFINITE RETRY LOOP
    // =====================================================

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // =====================================================
    // ANOTHER REQUEST IS ALREADY REFRESHING
    // =====================================================

    if (isRefreshing) {
      return new Promise(
        (resolve, reject) => {
          subscribeTokenRefresh(
            async (refreshError) => {
              // Refresh failed
              if (refreshError) {
                reject(refreshError);
                return;
              }

              // Refresh succeeded
              try {
                const response =
                  await api(originalRequest);

                resolve(response);
              } catch (retryError) {
                reject(retryError);
              }
            },
          );
        },
      );
    }

    // =====================================================
    // START TOKEN REFRESH
    // =====================================================

    isRefreshing = true;

    try {
      console.log(
        "🔄 Access token expired. Refreshing...",
      );

      await api.post("/auth/refresh");

      console.log(
        "✅ Token refreshed successfully",
      );

      // Refresh finished
      isRefreshing = false;

      // Retry queued requests
      onRefreshed();

      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      console.error(
        "❌ Refresh token failed:",
        refreshError.response?.data ||
          refreshError.message,
      );

      // Refresh finished
      isRefreshing = false;

      // Reject all queued requests
      onRefreshFailed(refreshError);

      // Clear CSRF cache
      clearCsrfToken();

      // ===================================================
      // SESSION EXPIRED
      // ===================================================

      window.dispatchEvent(
        new Event(
          "auth:session-expired",
        ),
      );

      return Promise.reject(
        refreshError,
      );
    }
  },
);

// =========================================================
// EXPORT
// =========================================================

export default api;