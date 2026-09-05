"use strict";

import {
  apiPost,
  apiGet
} from "../apiClient";

// =====================================================
// REGISTER SALE
// =====================================================

export const registerSale = (saleData) => {
  return apiPost(
    "/reg-sales",
    saleData
  );
};

// =====================================================
// GET SALES
// =====================================================

export const getSales = (params = {}) => {
  const cleanParams = {};

  Object.entries(params).forEach(([key, value]) => {
    // Don't send undefined, null, or empty strings
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      cleanParams[key] = value;
    }
  });

  const query = new URLSearchParams(cleanParams).toString();

  return apiGet(
    query
      ? `/get-sales?${query}`
      : "/get-sales"
  );
};
