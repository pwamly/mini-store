"use strict";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://95.111.255.86:5000/api";

// =====================================================
// AUTH TOKEN
// =====================================================
//
// Temporary development token.
// Replace this with your real auth storage later.
// =====================================================

const AUTH_TOKEN ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdhNDFmMzk4LWIyNzQtNDkwOC04OWI0LTQwZWY4YmNmMWE2NiIsImZpcnN0X25hbWUiOiJTdGVwaGFubyIsImxhc3RfbmFtZSI6IkpvaG4iLCJ1c2VybmFtZSI6InN0ZXBoYW5vIiwiZW1haWwiOiJzdGVwaGFub0BleGFtcGxlLmNvbSIsInVzZXJSb2xlIjoiYWRtaW4iLCJwaG9uZSI6IisyNTU3MTIzNDU2NzgiLCJpYXQiOjE3ODc4MTg3MDIsImV4cCI6MTc4Nzg3MjcwMn0.iuuzk49sDpuVJ7QKlk1pJ9IKqGSlqzbpj0G7hfMTDv0"
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
