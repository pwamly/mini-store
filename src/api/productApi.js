"use strict";

import {
  apiGet
} from "../apiClient";

// =====================================================
// SEARCH PRODUCTS
// =====================================================

export const searchProducts = (
  search
) => {

  return apiGet(
    `/getProducts?q=${encodeURIComponent(
      search
    )}`
  );
};

// =====================================================
// GET ALL PRODUCTS
// =====================================================

export const getProducts = (
  params = {}
) => {

  const query =
    new URLSearchParams(
      params
    ).toString();

  return apiGet(
    query
      ? `/getProducts?${query}`
      : "/getProducts"
  );
};
