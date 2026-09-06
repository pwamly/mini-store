'use strict';

import {
  apiGet,
  apiPost
} from '../apiClient';

// =====================================================
// REMOVE EMPTY VALUES
// =====================================================

const cleanParams = (
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
// GET LOAN PAYMENTS
// =====================================================

export const getLoanPayments = (
  params = {}
) => {

  const cleanData =
    cleanParams(params);

  const query =
    new URLSearchParams(
      cleanData
    ).toString();

  return apiGet(
    query
      ? `/loan-payments?${query}`
      : '/loan-payments'
  );
};


// =====================================================
// RECORD LOAN PAYMENT
// =====================================================

export const createLoanPayment = (
  data
) => {

  return apiPost(
    '/loan-payment',
    data
  );
};


