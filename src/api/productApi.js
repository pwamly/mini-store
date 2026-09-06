'use strict';

import {
  apiGet,
  apiPost,
  apiPut
} from '../apiClient';

// =====================================================
// REMOVE EMPTY VALUES
// =====================================================

const cleanPayload = (
  data = {}
) => {

  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) => {

        if (
          value === undefined ||
          value === null ||
          value === ''
        ) {
          return false;
        }

        return true;
      }
    )
  );
};


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

  const cleanParams =
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) =>
          value !== undefined &&
          value !== null &&
          value !== ''
      )
    );

  const query =
    new URLSearchParams(
      cleanParams
    ).toString();

  return apiGet(
    query
      ? `/getProducts?${query}`
      : '/getProducts'
  );
};

// =====================================================
// REGISTER PRODUCT
// =====================================================

export const registerProduct = (
  data
) => {

  return apiPost(
    '/registerProduct',
    data
  );
};


// =====================================================
// UPDATE PRODUCT
// =====================================================

export const updateProduct = (
  productId,
  data
) => {

  const cleanData =
    cleanPayload(data);

  return apiPut(
    `/products/${productId}`,
    cleanData
  );
};