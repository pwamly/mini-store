"use strict";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

// =====================================================
// AUTH TOKEN
// =====================================================
//
// Temporary development token.
// Replace this with your real auth storage later.
// =====================================================

const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImEwNWE5YWFmLTI0NTQtNGNkYS05Y2JjLTY1Y2VhNjhmZGNjMyIsImZpcnN0X25hbWUiOiJTdGVwaGFubyIsImxhc3RfbmFtZSI6IlB3YW1seSIsInVzZXJuYW1lIjoic3RlcGhhbm8iLCJlbWFpbCI6InN0ZXBoYW5vQGV4YW1wbGUuY29tIiwidXNlclJvbGUiOiJ1c2VyIiwicGhvbmUiOiIrMjU1NzEyMzQ1Njc4IiwiaWF0IjoxNzg3ODUyMzY3LCJleHAiOjE3ODc4NTQxNjd9.PF36R5Veqdw1dCzGlObPIxpk1yHUXjh7T3r1ebDdPvA";

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
