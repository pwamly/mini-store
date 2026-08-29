"use strict";

// =====================================================
// API BASE URL
// =====================================================
//
// Production:
// https://necbot.store/api
//
// Using a relative URL means the browser talks to the
// same domain as the React application. Nginx then
// forwards /api requests to the Node backend on :5000.
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

// =====================================================
// AUTH TOKEN
// =====================================================
//
// Temporary development token.
// IMPORTANT:
// Do not use a permanent/private token in frontend
// production code. Anything bundled by Vite is visible
// to the browser.
// =====================================================

const AUTH_TOKEN = "";

// =====================================================
// COMMON API REQUEST
// =====================================================

const apiRequest = async (
  endpoint,
  options = {}
) => {
  const {
    method = "GET",
    body,
    headers = {}
  } = options;

  const requestHeaders = {
    "Content-Type": "application/json",

    ...(AUTH_TOKEN
      ? {
          Authorization:
            `Bearer ${AUTH_TOKEN}`
        }
      : {}),

    ...headers
  };

  const response =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        method,

        headers:
          requestHeaders,

        credentials:
          "include",

        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined
      }
    );

  let data = null;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

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

export const apiGet = (
  endpoint
) => {
  return apiRequest(
    endpoint,
    {
      method: "GET"
    }
  );
};

// =====================================================
// POST
// =====================================================

export const apiPost = (
  endpoint,
  body
) => {
  return apiRequest(
    endpoint,
    {
      method: "POST",
      body
    }
  );
};

// =====================================================
// PUT
// =====================================================

export const apiPut = (
  endpoint,
  body
) => {
  return apiRequest(
    endpoint,
    {
      method: "PUT",
      body
    }
  );
};

// =====================================================
// PATCH
// =====================================================

export const apiPatch = (
  endpoint,
  body
) => {
  return apiRequest(
    endpoint,
    {
      method: "PATCH",
      body
    }
  );
};

// =====================================================
// DELETE
// =====================================================

export const apiDelete = (
  endpoint
) => {
  return apiRequest(
    endpoint,
    {
      method: "DELETE"
    }
  );
};

export default apiRequest;

