"use strict";

import {
  apiPost,
  apiGet,
} from "../apiClient";

// =====================================================
// CONSTANTS
// =====================================================

const ALLOWED_PAYMENT_METHODS = [
  "cash",
  "card",
  "mobile",
  "loan",
];

// =====================================================
// HELPERS
// =====================================================

const isProvided = (value) => {
  return (
    value !== undefined &&
    value !== null &&
    value !== ""
  );
};

const toNumberOrNull = (value) => {
  if (!isProvided(value)) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const toNumberOrZero = (value) => {
  if (!isProvided(value)) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const cleanStringOrNull = (value) => {
  if (!isProvided(value)) {
    return null;
  }

  const cleaned = String(value).trim();

  return cleaned !== ""
    ? cleaned
    : null;
};

// =====================================================
// REGISTER SALE
// =====================================================

export const registerSale = (saleData = {}) => {
  // ---------------------------------------------------
  // Normalize payment method
  // ---------------------------------------------------

  const paymentMethod =
    isProvided(saleData.paymentMethod)
      ? String(saleData.paymentMethod)
          .trim()
          .toLowerCase()
      : "cash";

  // ---------------------------------------------------
  // Validate payment method on frontend
  //
  // Backend also validates this.
  // ---------------------------------------------------

  if (
    !ALLOWED_PAYMENT_METHODS.includes(
      paymentMethod
    )
  ) {
    return Promise.reject(
      new Error(
        "Invalid payment method. Allowed: cash, card, mobile, loan"
      )
    );
  }

  // ---------------------------------------------------
  // Normalize customer information
  // ---------------------------------------------------

  const customerName =
    cleanStringOrNull(
      saleData.customerName
    );

  const customerMobile =
    cleanStringOrNull(
      saleData.customerMobile
    );

  // ---------------------------------------------------
  // Normalize loan payment
  //
  // paidNow:
  // The amount actually paid immediately.
  //
  // Example:
  //
  // total   = 12500
  // paidNow = 5000
  // balance = 7500
  //
  // For:
  // cash/card/mobile:
  // normally paidNow = total
  //
  // For:
  // loan:
  // paidNow can be 0 -> total
  // ---------------------------------------------------

  const paidNow =
    toNumberOrZero(
      saleData.paidNow
    );

  // ---------------------------------------------------
  // Normalize cash information
  //
  // cashGiven and changeAmount are only relevant
  // for cash payments.
  // ---------------------------------------------------

  const cashGiven =
    toNumberOrNull(
      saleData.cashGiven
    );

  const changeAmount =
    toNumberOrZero(
      saleData.changeAmount
    );

  // ---------------------------------------------------
  // Build complete request payload
  //
  // Keep all other fields supplied by the caller.
  // ---------------------------------------------------

  const cleanSaleData = {
    ...saleData,

    // Sale information
    invoiceNumber:
      cleanStringOrNull(
        saleData.invoiceNumber
      ),

    userId:
      cleanStringOrNull(
        saleData.userId
      ),

    status:
      isProvided(saleData.status)
        ? String(saleData.status)
            .trim()
            .toLowerCase()
        : "completed",

    // Customer
    customerName,
    customerMobile,

    // Payment
    paymentMethod,
    paidNow,

    // Amounts
    subtotal:
      toNumberOrZero(
        saleData.subtotal
      ),

    tax:
      toNumberOrZero(
        saleData.tax
      ),

    total:
      toNumberOrZero(
        saleData.total
      ),

    // Cash
    cashGiven:
      paymentMethod === "cash"
        ? cashGiven
        : null,

    changeAmount:
      paymentMethod === "cash"
        ? changeAmount
        : 0,

    // Items
    items:
      Array.isArray(saleData.items)
        ? saleData.items.map(
            (item = {}) => ({
              ...item,

              productId:
                cleanStringOrNull(
                  item.productId
                ),

              sku:
                cleanStringOrNull(
                  item.sku
                ),

              barcode:
                cleanStringOrNull(
                  item.barcode
                ),

              productName:
                cleanStringOrNull(
                  item.productName
                ),

              quantity:
                toNumberOrZero(
                  item.quantity
                ),

              unitPrice:
                toNumberOrZero(
                  item.unitPrice
                ),

              costPrice:
                toNumberOrZero(
                  item.costPrice
                ),

              subtotal:
                toNumberOrZero(
                  item.subtotal
                ),
            })
          )
        : [],
  };

  // ===================================================
  // PAYMENT-SPECIFIC NORMALIZATION
  // ===================================================

  // ---------------------------------------------------
  // CASH
  //
  // Backend calculates the actual change.
  // ---------------------------------------------------

  if (paymentMethod === "cash") {
    cleanSaleData.paidNow =
      cleanSaleData.total;

    cleanSaleData.cashGiven =
      cashGiven;

    cleanSaleData.changeAmount =
      changeAmount;
  }

  // ---------------------------------------------------
  // CARD
  //
  // Card payment is considered paid immediately.
  // ---------------------------------------------------

  else if (
    paymentMethod === "card"
  ) {
    cleanSaleData.paidNow =
      cleanSaleData.total;

    cleanSaleData.cashGiven =
      null;

    cleanSaleData.changeAmount =
      0;
  }

  // ---------------------------------------------------
  // MOBILE
  //
  // Mobile payment is considered paid immediately.
  // ---------------------------------------------------

  else if (
    paymentMethod === "mobile"
  ) {
    cleanSaleData.paidNow =
      cleanSaleData.total;

    cleanSaleData.cashGiven =
      null;

    cleanSaleData.changeAmount =
      0;
  }

  // ---------------------------------------------------
  // LOAN
  //
  // paidNow is NOT overwritten.
  //
  // This allows:
  //
  // total   = 12500
  // paidNow = 5000
  //
  // outstanding balance = 7500
  // ---------------------------------------------------

  else if (
    paymentMethod === "loan"
  ) {
    cleanSaleData.paidNow =
      paidNow;

    cleanSaleData.cashGiven =
      null;

    cleanSaleData.changeAmount =
      0;
  }

  // ===================================================
  // SEND REQUEST
  // ===================================================

  return apiPost(
    "/reg-sales",
    cleanSaleData
  );
};

// =====================================================
// GET SALES
// =====================================================

export const getSales = (params = {}) => {
  const cleanParams = {};

  // ---------------------------------------------------
  // Supported GET parameters include:
  //
  // mode
  // search
  // startDate
  // endDate
  // page
  // limit
  // paymentMethod
  // status
  // customerMobile
  //
  // The API accepts any additional parameters too.
  // ---------------------------------------------------

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        cleanParams[key] = value;
      }
    }
  );

  // ---------------------------------------------------
  // Normalize common GET parameters
  // ---------------------------------------------------

  if (
    cleanParams.mode !== undefined
  ) {
    cleanParams.mode =
      String(cleanParams.mode)
        .trim()
        .toLowerCase();
  }

  if (
    cleanParams.paymentMethod !==
    undefined
  ) {
    cleanParams.paymentMethod =
      String(
        cleanParams.paymentMethod
      )
        .trim()
        .toLowerCase();
  }

  if (
    cleanParams.status !== undefined
  ) {
    cleanParams.status =
      String(cleanParams.status)
        .trim()
        .toLowerCase();
  }

  if (
    cleanParams.search !== undefined
  ) {
    cleanParams.search =
      String(cleanParams.search).trim();
  }

  if (
    cleanParams.customerMobile !==
    undefined
  ) {
    cleanParams.customerMobile =
      String(
        cleanParams.customerMobile
      ).trim();
  }

  // ---------------------------------------------------
  // Pagination
  // ---------------------------------------------------

  if (
    cleanParams.page !== undefined
  ) {
    const page =
      Number(cleanParams.page);

    if (
      Number.isFinite(page) &&
      page > 0
    ) {
      cleanParams.page =
        Math.floor(page);
    }
  }

  if (
    cleanParams.limit !== undefined
  ) {
    const limit =
      Number(cleanParams.limit);

    if (
      Number.isFinite(limit) &&
      limit > 0
    ) {
      cleanParams.limit =
        Math.min(
          Math.floor(limit),
          100
        );
    }
  }

  // ---------------------------------------------------
  // Build query string
  // ---------------------------------------------------

  const query =
    new URLSearchParams(
      cleanParams
    ).toString();

  // ---------------------------------------------------
  // GET request
  // ---------------------------------------------------

  return apiGet(
    query
      ? `/get-sales?${query}`
      : "/get-sales"
  );
};

// =====================================================
// GET LOAN SALES
//
// Convenience helper for the frontend.
//
// Equivalent to:
// getSales({
//   paymentMethod: "loan"
// })
// =====================================================

export const getLoanSales = (
  params = {}
) => {
  return getSales({
    ...params,
    paymentMethod: "loan",
  });
};

// =====================================================
// GET SALES BY CUSTOMER MOBILE
//
// Useful for finding a customer's loan history.
// =====================================================

export const getSalesByCustomerMobile = (
  customerMobile,
  params = {}
) => {
  const cleanMobile =
    cleanStringOrNull(
      customerMobile
    );

  if (!cleanMobile) {
    return Promise.reject(
      new Error(
        "Customer mobile is required"
      )
    );
  }

  return getSales({
    ...params,
    customerMobile:
      cleanMobile,
  });
};
