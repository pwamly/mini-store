"use strict";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

// =====================================================
// REFRESH TOKEN
// =====================================================

let isRefreshing = false;
let refreshPromise = null;

const refreshAccessToken = async () => {
  // Prevent multiple simultaneous refresh requests.
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/refresh_token`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          // Sends the HttpOnly `jto` cookie.
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "Refresh token expired"
        );
      }

      // Backend returns `AccessToken`
      if (!data?.AccessToken) {
        throw new Error(
          "Refresh response did not contain an access token"
        );
      }

      // Save new access token
      localStorage.setItem(
        "accessToken",
        data.AccessToken
      );

      return data.AccessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// =====================================================
// LOGOUT / AUTH FAILURE
// =====================================================

const handleAuthenticationFailure = () => {
  localStorage.removeItem("accessToken");

  if (
    window.location.pathname !== "/login"
  ) {
    window.location.href = "/login";
  }
};

// =====================================================
// COMMON API REQUEST
// =====================================================

const apiRequest = async (
  endpoint,
  options = {},
  isRetry = false
) => {
  const {
    method = "GET",
    body,
    headers = {}
  } = options;

  // Get latest access token
  const accessToken =
    localStorage.getItem("accessToken");

  const requestHeaders = {
    "Content-Type": "application/json",

    ...(accessToken
      ? {
          Authorization:
            `Bearer ${accessToken}`
        }
      : {}),

    ...headers
  };

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method,
      headers: requestHeaders,
      credentials: "include",

      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined
    }
  );

  // ===================================================
  // ACCESS TOKEN EXPIRED
  // ===================================================

  if (
    response.status === 403 &&
    !isRetry
  ) {
    try {
      // Get a new access token
      await refreshAccessToken();

      // Retry original request once
      return apiRequest(
        endpoint,
        options,
        true
      );
    } catch (error) {
      handleAuthenticationFailure();

      throw error;
    }
  }

  // ===================================================
  // PARSE RESPONSE
  // ===================================================

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
};

// =====================================================
// GET
// =====================================================

export const apiGet = (endpoint) => {
  return apiRequest(endpoint, {
    method: "GET"
  });
};

// =====================================================
// POST
// =====================================================

export const apiPost = (endpoint, body) => {
  return apiRequest(endpoint, {
    method: "POST",
    body
  });
};

// =====================================================
// PUT
// =====================================================

export const apiPut = (endpoint, body) => {
  return apiRequest(endpoint, {
    method: "PUT",
    body
  });
};

// =====================================================
// PATCH
// =====================================================

export const apiPatch = (endpoint, body) => {
  return apiRequest(endpoint, {
    method: "PATCH",
    body
  });
};

// =====================================================
// DELETE
// =====================================================

export const apiDelete = (endpoint) => {
  return apiRequest(endpoint, {
    method: "DELETE"
  });
};

export default apiRequest;

