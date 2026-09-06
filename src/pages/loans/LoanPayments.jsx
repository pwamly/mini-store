'use strict';

import { useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import { getLoanPayments } from 'api/loanPaymentsApi';

export default function LoanPayments() {
  // =========================================================
  // TODAY
  // =========================================================

  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const today = getToday();

  // =========================================================
  // STATE
  // =========================================================

  const [payments, setPayments] = useState([]);

  const [summary, setSummary] = useState({
    transactions: 0,
    amount: 0
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('');

  const [startDate, setStartDate] = useState(today);

  const [endDate, setEndDate] = useState(today);

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(20);

  const [totalPages, setTotalPages] = useState(1);

  const [selectedPayment, setSelectedPayment] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const formatTZS = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  };

  // =========================================================
  // FORMAT DATE/TIME
  // =========================================================

  const formatDateTime = (value) => {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('en-TZ', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // =========================================================
  // NORMALIZE PAYMENT METHOD
  // =========================================================

  const normalizePaymentMethod = (method) => {
    if (!method) {
      return '';
    }

    return String(method).trim().toLowerCase();
  };

  // =========================================================
  // PAYMENT LABEL
  // =========================================================

  const paymentLabel = (method) => {
    switch (normalizePaymentMethod(method)) {
      case 'cash':
        return 'Cash';

      case 'card':
        return 'Card';

      case 'mobile':
        return 'Mobile Money';

      case 'mobile_money':
        return 'Mobile Money';

      case 'bank':
        return 'Bank';

      default:
        return method || '-';
    }
  };

  // =========================================================
  // PAYMENT COLOR
  // =========================================================

  const paymentColor = (method) => {
    switch (normalizePaymentMethod(method)) {
      case 'cash':
        return 'success';

      case 'card':
        return 'primary';

      case 'mobile':
      case 'mobile_money':
        return 'warning';

      case 'bank':
        return 'info';

      default:
        return 'default';
    }
  };

  // =========================================================
  // GET CUSTOMER NAME
  // =========================================================

  const getCustomerName = (payment) => {
    return payment?.sale?.customerName || 'Walk-in Customer';
  };

  // =========================================================
  // GET CUSTOMER MOBILE
  // =========================================================

  const getCustomerMobile = (payment) => {
    if (
      payment?.sale?.customerMobile !== undefined &&
      payment?.sale?.customerMobile !== null &&
      String(payment.sale.customerMobile).trim() !== ''
    ) {
      return String(payment.sale.customerMobile).trim();
    }

    if (payment?.sale?.phone !== undefined && payment?.sale?.phone !== null && String(payment.sale.phone).trim() !== '') {
      return String(payment.sale.phone).trim();
    }

    if (payment?.sale?.mobile !== undefined && payment?.sale?.mobile !== null && String(payment.sale.mobile).trim() !== '') {
      return String(payment.sale.mobile).trim();
    }

    return null;
  };

  // =========================================================
  // GET INVOICE NUMBER
  // =========================================================

  const getInvoiceNumber = (payment) => {
    return payment?.sale?.invoiceNumber || '-';
  };

  // =========================================================
  // GET LOAN TOTAL
  // =========================================================

  const getLoanTotal = (payment) => {
    return Number(payment?.sale?.total) || 0;
  };

  // =========================================================
  // GET SALE PAID NOW
  // =========================================================

  const getSalePaidNow = (payment) => {
    return Number(payment?.sale?.paidNow) || 0;
  };

  // =========================================================
  // GET SALE BALANCE
  //
  // Your response currently contains:
  //
  // total: 4500
  // paidNow: 4500
  // remainingBalance: 0
  //
  // Prefer remainingBalance when available.
  // =========================================================

  const getLoanBalance = (payment) => {
    if (
      payment?.sale?.remainingBalance !== undefined &&
      payment?.sale?.remainingBalance !== null &&
      payment?.sale?.remainingBalance !== ''
    ) {
      return Math.max(Number(payment.sale.remainingBalance) || 0, 0);
    }

    const total = getLoanTotal(payment);

    const paidNow = getSalePaidNow(payment);

    return Math.max(total - paidNow, 0);
  };

  // =========================================================
  // GET USER NAME
  // =========================================================

  const getUserName = (payment) => {
    const user = payment?.user;

    if (!user) {
      return '-';
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

    return fullName || user.username || '-';
  };

  // =========================================================
  // GET REPAYMENT STATUS
  // =========================================================

  const getRepaymentStatus = (payment) => {
    const balance = getLoanBalance(payment);

    if (balance <= 0) {
      return 'Paid';
    }

    return 'Outstanding';
  };

  // =========================================================
  // STATUS COLOR
  // =========================================================

  const statusColor = (status) => {
    switch (
      String(status || '')
        .trim()
        .toLowerCase()
    ) {
      case 'paid':
        return 'success';

      case 'outstanding':
        return 'warning';

      case 'completed':
        return 'success';

      case 'pending':
        return 'warning';

      case 'cancelled':
      case 'canceled':
        return 'error';

      default:
        return 'default';
    }
  };

  // =========================================================
  // LOAD LOAN PAYMENTS
  // =========================================================

  const loadLoanPayments = async (overrides = {}) => {
    setLoading(true);
    setError('');

    try {
      const currentPage = overrides.page ?? page;

      const currentLimit = overrides.limit ?? limit;

      const currentSearch = overrides.search !== undefined ? overrides.search : search.trim();

      const currentPaymentMethod = overrides.paymentMethod !== undefined ? overrides.paymentMethod : paymentMethod;

      const currentStartDate = overrides.startDate !== undefined ? overrides.startDate : startDate;

      const currentEndDate = overrides.endDate !== undefined ? overrides.endDate : endDate;

      // =====================================================
      // BUILD PARAMS
      // =====================================================

      const params = {
        page: currentPage,
        limit: currentLimit
      };

      if (currentSearch) {
        params.search = currentSearch;
      }

      if (currentPaymentMethod) {
        params.paymentMethod = currentPaymentMethod;
      }

      if (currentStartDate) {
        params.startDate = currentStartDate;
      }

      if (currentEndDate) {
        params.endDate = currentEndDate;
      }

      console.log('GET LOAN PAYMENTS PARAMS:', params);

      const response = await getLoanPayments(params);

      console.log('GET LOAN PAYMENTS RESPONSE:', response);

      if (!response?.successful) {
        throw new Error(response?.message || 'Unable to load loan payments.');
      }

      const loadedPayments = Array.isArray(response.data) ? response.data : [];

      setPayments(loadedPayments);

      // =====================================================
      // SUMMARY
      // =====================================================

      setSummary({
        transactions: Number(response.summary?.transactions || 0),

        amount: Number(response.summary?.amount || 0)
      });

      // =====================================================
      // PAGINATION
      // =====================================================

      setTotalPages(Math.max(Number(response.pagination?.totalPages || 1), 1));
    } catch (err) {
      console.error('Load loan payments error:', err);

      setPayments([]);

      setSummary({
        transactions: 0,
        amount: 0
      });

      setTotalPages(1);

      setError(err?.response?.data?.message || err?.message || 'Failed to load loan payments.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadLoanPayments();
  }, [page, limit, startDate, endDate, paymentMethod]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = () => {
    const trimmedSearch = search.trim();

    if (page !== 1) {
      setPage(1);

      return;
    }

    loadLoanPayments({
      page: 1,
      search: trimmedSearch
    });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch('');
    setPaymentMethod('');
    setStartDate(today);
    setEndDate(today);
    setLimit(20);

    if (page !== 1) {
      setPage(1);

      return;
    }

    loadLoanPayments({
      page: 1,
      limit: 20,
      search: '',
      paymentMethod: '',
      startDate: today,
      endDate: today
    });
  };

  // =========================================================
  // VIEW PAYMENT
  // =========================================================

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setDetailsOpen(true);
  };

  // =========================================================
  // CLOSE DETAILS
  // =========================================================

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedPayment(null);
  };

  // =========================================================
  // RENDER
  // =========================================================

  // =========================================================
  // OPEN NEXT LOAN PAYMENT DIALOG
  // =========================================================

  const handleOpenPaymentDialog = () => {
    if (!selectedPayment) {
      return;
    }

    const balance = getLoanBalance(selectedPayment);

    if (balance <= 0) {
      return;
    }

    setPaymentAmount('');
    setPaymentMethodInput('cash');
    setPaymentNote('');
    setPaymentDialogOpen(true);
  };

  // =========================================================
  // CLOSE NEXT LOAN PAYMENT DIALOG
  // =========================================================

  const handleClosePaymentDialog = () => {
    if (paymentSubmitting) {
      return;
    }

    setPaymentDialogOpen(false);
    setPaymentAmount('');
    setPaymentMethodInput('cash');
    setPaymentNote('');
  };

  // =========================================================
  // RECORD NEXT LOAN PAYMENT
  // =========================================================
  const handleRecordPayment = async () => {
    if (!selectedPayment) {
      return;
    }

    const balance = getLoanBalance(selectedPayment);

    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      setPaymentError('Please enter a valid repayment amount.');

      return;
    }

    if (amount > balance) {
      setPaymentError(`Payment cannot be greater than the outstanding balance of ${formatTZS(balance)}.`);

      return;
    }

    try {
      setPaymentSubmitting(true);
      setPaymentError('');
      setError('');

      const response = await createLoanPayment({
        saleId: selectedPayment.saleId,
        amount,
        paymentMethod: paymentMethodInput,
        note: paymentNote
      });

      if (!response?.successful) {
        throw new Error(response?.message || 'Failed to record loan repayment.');
      }

      setPaymentDialogOpen(false);

      setPaymentAmount('');
      setPaymentMethodInput('cash');
      setPaymentNote('');

      await loadLoanPayments();

      setDetailsOpen(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error('Record loan payment error:', err);

      setPaymentError(err?.response?.data?.message || err?.message || 'Failed to record loan repayment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Stack
        direction={{
          xs: 'column',
          sm: 'row'
        }}
        justifyContent="space-between"
        alignItems={{
          xs: 'stretch',
          sm: 'center'
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Loan Repayments
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track customer loan repayments and payment history.
          </Typography>

          <Typography
            variant="caption"
            color="primary"
            sx={{
              display: 'block',
              mt: 1,
              fontWeight: 600
            }}
          >
            Showing repayments from {startDate === endDate ? startDate : `${startDate} to ${endDate}`} • {limit.toLocaleString()} per page
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => loadLoanPayments()}
          disabled={loading}
          startIcon={
            <Box
              component="span"
              sx={{
                fontSize: '1.2rem',
                lineHeight: 1
              }}
            >
              ↻
            </Box>
          }
        >
          Refresh
        </Button>
      </Stack>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* TRANSACTIONS */}

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              borderLeft: '4px solid',
              borderColor: 'primary.main'
            }}
          >
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Repayment Transactions
              </Typography>

              <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mt: 1 }}>
                {summary.transactions.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* TOTAL REPAYMENTS */}

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              borderLeft: '4px solid',
              borderColor: 'success.main'
            }}
          >
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Repaid
              </Typography>

              <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                {formatTZS(summary.amount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* AVERAGE PAYMENT */}

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              borderLeft: '4px solid',
              borderColor: 'warning.main'
            }}
          >
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Average Repayment
              </Typography>

              <Typography variant="h4" fontWeight={700} color="warning.main" sx={{ mt: 1 }}>
                {formatTZS(summary.transactions > 0 ? summary.amount / summary.transactions : 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* SEARCH */}

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Repayments"
                placeholder="Invoice, customer or mobile"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        component="span"
                        sx={{
                          fontSize: '1.4rem',
                          lineHeight: 1,
                          color: 'text.secondary'
                        }}
                      >
                        ⌕
                      </Box>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* PAYMENT METHOD */}

            <Grid item xs={12} sm={6} md={2}>
              <Select
                fullWidth
                displayEmpty
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value);

                  setPage(1);
                }}
              >
                <MenuItem value="">All Payment Methods</MenuItem>

                <MenuItem value="cash">Cash</MenuItem>

                <MenuItem value="mobile">Mobile Money</MenuItem>

                <MenuItem value="card">Card</MenuItem>

                <MenuItem value="bank">Bank</MenuItem>
              </Select>
            </Grid>

            {/* START DATE */}

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);

                  setPage(1);
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            {/* END DATE */}

            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);

                  setPage(1);
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            {/* LIMIT */}

            <Grid item xs={12} sm={6} md={1}>
              <Select
                fullWidth
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));

                  setPage(1);
                }}
              >
                <MenuItem value={20}>20</MenuItem>

                <MenuItem value={50}>50</MenuItem>

                <MenuItem value={100}>100</MenuItem>
              </Select>
            </Grid>

            {/* ACTIONS */}

            <Grid item xs={12} md={1}>
              <Stack
                direction={{
                  xs: 'row',
                  md: 'column'
                }}
                spacing={1}
              >
                <Button variant="contained" fullWidth onClick={handleSearch} disabled={loading}>
                  Search
                </Button>

                <Button variant="outlined" fullWidth onClick={clearFilters} disabled={loading}>
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* =====================================================
          PAYMENT TABLE
      ===================================================== */}

      <Card>
        {/* TABLE HEADER */}

        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Repayment History
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {payments.length.toLocaleString()} repayment
                {payments.length === 1 ? '' : 's'} shown
              </Typography>
            </Box>

            {loading && <CircularProgress size={24} />}
          </Stack>
        </Box>

        {/* LOADING */}

        {loading && payments.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: 'center'
            }}
          >
            <CircularProgress />

            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Loading loan repayments...
            </Typography>
          </Box>
        ) : payments.length === 0 ? (
          /* EMPTY STATE */

          <Box
            sx={{
              py: 8,
              px: 2,
              textAlign: 'center'
            }}
          >
            <Box
              component="div"
              sx={{
                fontSize: 48,
                lineHeight: 1,
                color: 'text.secondary'
              }}
            >
              💰
            </Box>

            <Typography variant="h6" sx={{ mt: 2 }}>
              No loan repayments found
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Try changing your search or date filters.
            </Typography>
          </Box>
        ) : (
          /* TABLE */

          <TableContainer
            sx={{
              overflowX: 'auto'
            }}
          >
            <Table
              sx={{
                minWidth: 1150
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>

                  <TableCell>Date</TableCell>

                  <TableCell>Customer</TableCell>

                  <TableCell>Payment Method</TableCell>

                  <TableCell align="right">Repayment</TableCell>

                  <TableCell align="right">Loan Total</TableCell>

                  <TableCell align="right">Balance</TableCell>

                  <TableCell>Status</TableCell>

                  <TableCell>Recorded By</TableCell>

                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {payments.map((payment) => {
                  const balance = getLoanBalance(payment);

                  const status = getRepaymentStatus(payment);

                  return (
                    <TableRow key={payment.id} hover>
                      {/* INVOICE */}

                      <TableCell>
                        <Typography
                          fontWeight={700}
                          sx={{
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {getInvoiceNumber(payment)}
                        </Typography>
                      </TableCell>

                      {/* DATE */}

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatDateTime(payment.paidAt || payment.createdAt)}
                        </Typography>
                      </TableCell>

                      {/* CUSTOMER */}

                      <TableCell>
                        <Typography fontWeight={getCustomerName(payment) ? 600 : 400}>{getCustomerName(payment)}</Typography>

                        {getCustomerMobile(payment) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {getCustomerMobile(payment)}
                          </Typography>
                        )}
                      </TableCell>

                      {/* PAYMENT METHOD */}

                      <TableCell>
                        <Chip size="small" label={paymentLabel(payment.paymentMethod)} color={paymentColor(payment.paymentMethod)} />
                      </TableCell>

                      {/* REPAYMENT */}

                      <TableCell align="right">
                        <Typography fontWeight={700} color="success.main">
                          +{formatTZS(payment.amount)}
                        </Typography>
                      </TableCell>

                      {/* LOAN TOTAL */}

                      <TableCell align="right">
                        <Typography fontWeight={600}>{formatTZS(getLoanTotal(payment))}</Typography>
                      </TableCell>

                      {/* BALANCE */}

                      <TableCell align="right">
                        <Typography fontWeight={700} color={balance > 0 ? 'error.main' : 'success.main'}>
                          {formatTZS(balance)}
                        </Typography>
                      </TableCell>

                      {/* STATUS */}

                      <TableCell>
                        <Chip size="small" label={status} color={statusColor(status)} />
                      </TableCell>

                      {/* USER */}

                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {getUserName(payment)}
                        </Typography>

                        {payment?.user?.username && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            @{payment.user.username}
                          </Typography>
                        )}
                      </TableCell>

                      {/* ACTION */}

                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleViewPayment(payment)} title="View repayment">
                          <Box
                            component="span"
                            sx={{
                              fontSize: '1.25rem',
                              lineHeight: 1
                            }}
                          >
                            👁
                          </Box>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* =================================================
            PAGINATION
        ================================================= */}

        {totalPages > 1 && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              disabled={loading}
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>

      {/* =====================================================
          REPAYMENT DETAILS DIALOG
      ===================================================== */}

      <Dialog open={detailsOpen} onClose={handleCloseDetails} fullWidth maxWidth="md">
        {/* DIALOG TITLE */}

        <DialogTitle>
          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            justifyContent="space-between"
            alignItems={{
              xs: 'flex-start',
              sm: 'center'
            }}
            spacing={1}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Loan Repayment Details
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {getInvoiceNumber(selectedPayment)}
              </Typography>
            </Box>

            {selectedPayment && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={paymentLabel(selectedPayment.paymentMethod)} color={paymentColor(selectedPayment.paymentMethod)} />

                <Chip label={getRepaymentStatus(selectedPayment)} color={statusColor(getRepaymentStatus(selectedPayment))} />
              </Stack>
            )}
          </Stack>
        </DialogTitle>

        {/* DIALOG CONTENT */}

        {selectedPayment && (
          <>
            <DialogContent dividers>
              {/* =============================================
                  PAYMENT INFORMATION
              ============================================= */}

              <Typography variant="h6" gutterBottom fontWeight={700}>
                Repayment Information
              </Typography>

              <Grid container spacing={2}>
                {/* PAYMENT ID */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Payment ID
                  </Typography>

                  <Typography
                    fontWeight={700}
                    sx={{
                      wordBreak: 'break-all'
                    }}
                  >
                    {selectedPayment.id || '-'}
                  </Typography>
                </Grid>

                {/* DATE */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Paid At
                  </Typography>

                  <Typography fontWeight={700}>{formatDateTime(selectedPayment.paidAt)}</Typography>
                </Grid>

                {/* AMOUNT */}

                <Grid item xs={12} sm={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderColor: 'success.main'
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Amount Repaid
                      </Typography>

                      <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                        {formatTZS(selectedPayment.amount)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* PAYMENT METHOD */}

                <Grid item xs={12} sm={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Payment Method
                      </Typography>

                      <Box sx={{ mt: 1 }}>
                        <Chip label={paymentLabel(selectedPayment.paymentMethod)} color={paymentColor(selectedPayment.paymentMethod)} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* STATUS */}

                <Grid item xs={12} sm={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>

                      <Box sx={{ mt: 1 }}>
                        <Chip label={getRepaymentStatus(selectedPayment)} color={statusColor(getRepaymentStatus(selectedPayment))} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* =============================================
                  CUSTOMER INFORMATION
              ============================================= */}

              <Typography variant="h6" gutterBottom fontWeight={700}>
                Customer Information
              </Typography>

              <Grid container spacing={2}>
                {/* CUSTOMER */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Customer
                  </Typography>

                  <Typography fontWeight={700}>{getCustomerName(selectedPayment)}</Typography>
                </Grid>

                {/* MOBILE */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Mobile
                  </Typography>

                  <Typography fontWeight={700}>{getCustomerMobile(selectedPayment) || '-'}</Typography>
                </Grid>

                {/* INVOICE */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice Number
                  </Typography>

                  <Typography fontWeight={700}>{getInvoiceNumber(selectedPayment)}</Typography>
                </Grid>

                {/* SALE ID */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sale ID
                  </Typography>

                  <Typography
                    fontWeight={700}
                    sx={{
                      wordBreak: 'break-all'
                    }}
                  >
                    {selectedPayment.saleId || '-'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* =============================================
                  LOAN STATUS
              ============================================= */}

              <Typography variant="h6" gutterBottom fontWeight={700}>
                Loan Summary
              </Typography>

              <Grid container spacing={2}>
                {/* LOAN TOTAL */}

                <Grid item xs={12} sm={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Loan Total
                      </Typography>

                      <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                        {formatTZS(getLoanTotal(selectedPayment))}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* SALE PAID */}

                <Grid item xs={12} sm={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderColor: 'success.main'
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Paid at Sale
                      </Typography>

                      <Typography variant="h6" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                        {formatTZS(getSalePaidNow(selectedPayment))}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* CURRENT BALANCE */}

                <Grid item xs={12} sm={4}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      borderColor: getLoanBalance(selectedPayment) > 0 ? 'error.main' : 'success.main'
                    }}
                  >
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Current Balance
                      </Typography>

                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={getLoanBalance(selectedPayment) > 0 ? 'error.main' : 'success.main'}
                        sx={{ mt: 1 }}
                      >
                        {formatTZS(getLoanBalance(selectedPayment))}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* =============================================
                  REPAYMENT BREAKDOWN
              ============================================= */}

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(46, 125, 50, 0.04)',
                  border: '1px solid',
                  borderColor: 'success.main'
                }}
              >
                <Stack
                  direction={{
                    xs: 'column',
                    sm: 'row'
                  }}
                  justifyContent="space-between"
                  alignItems={{
                    xs: 'flex-start',
                    sm: 'center'
                  }}
                  spacing={1}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      This Repayment
                    </Typography>

                    <Typography variant="h5" fontWeight={700} color="success.main">
                      {formatTZS(selectedPayment.amount)}
                    </Typography>
                  </Box>

                  <Chip
                    label={getLoanBalance(selectedPayment) > 0 ? 'Balance Remaining' : 'Loan Fully Paid'}
                    color={getLoanBalance(selectedPayment) > 0 ? 'warning' : 'success'}
                  />
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* =============================================
                  NOTE
              ============================================= */}

              <Typography variant="h6" gutterBottom fontWeight={700}>
                Note
              </Typography>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography color={selectedPayment.note ? 'text.primary' : 'text.secondary'}>
                  {selectedPayment.note || 'No note was provided for this repayment.'}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* =============================================
                  RECORDED BY
              ============================================= */}

              <Typography variant="h6" gutterBottom fontWeight={700}>
                Recorded By
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Name
                  </Typography>

                  <Typography fontWeight={700}>{getUserName(selectedPayment)}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Username
                  </Typography>

                  <Typography fontWeight={700}>{selectedPayment?.user?.username || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    User ID
                  </Typography>

                  <Typography
                    fontWeight={700}
                    sx={{
                      wordBreak: 'break-all'
                    }}
                  >
                    {selectedPayment?.userId || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>

            {/* DIALOG ACTIONS */}

            <DialogActions sx={{ p: 2 }}>
              <Button variant="outlined" fullWidth size="large" onClick={handleCloseDetails}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
     <Dialog
  open={paymentDialogOpen}
  onClose={handleClosePaymentDialog}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    Receive Loan Repayment
  </DialogTitle>

  {selectedPayment && (
    <>
      <DialogContent dividers>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Customer
          </Typography>

          <Typography fontWeight={700}>
            {getCustomerName(selectedPayment)}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Invoice
          </Typography>

          <Typography fontWeight={700}>
            {getInvoiceNumber(selectedPayment)}
          </Typography>
        </Box>

        <Card
          variant="outlined"
          sx={{
            mb: 3,
            borderColor: 'error.main',
            backgroundColor:
              'rgba(211, 47, 47, 0.04)'
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Outstanding Balance
            </Typography>

            <Typography
              variant="h5"
              fontWeight={700}
              color="error.main"
              sx={{ mt: 0.5 }}
            >
              {formatTZS(
                getLoanBalance(selectedPayment)
              )}
            </Typography>
          </CardContent>
        </Card>

        {paymentError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {paymentError}
          </Alert>
        )}

        <TextField
          fullWidth
          autoFocus
          label="Amount Received"
          type="number"
          value={paymentAmount}
          onChange={(event) => {
            setPaymentAmount(event.target.value);
            setPaymentError('');
          }}
          inputProps={{
            min: 1,
            max: getLoanBalance(selectedPayment),
            step: 1
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                TZS
              </InputAdornment>
            )
          }}
          helperText={`Maximum payment: ${formatTZS(
            getLoanBalance(selectedPayment)
          )}`}
          sx={{ mb: 2 }}
        />

        <Button
          fullWidth
          variant="outlined"
          color="success"
          onClick={() =>
            setPaymentAmount(
              String(
                getLoanBalance(selectedPayment)
              )
            )
          }
          sx={{ mb: 2 }}
        >
          Pay Full Balance —{' '}
          {formatTZS(
            getLoanBalance(selectedPayment)
          )}
        </Button>

        <TextField
          fullWidth
          select
          label="Payment Method"
          value={paymentMethodInput}
          onChange={(event) =>
            setPaymentMethodInput(
              event.target.value
            )
          }
          sx={{ mb: 2 }}
        >
          <MenuItem value="cash">
            Cash
          </MenuItem>

          <MenuItem value="mobile">
            Mobile Money
          </MenuItem>

          <MenuItem value="card">
            Card
          </MenuItem>

          <MenuItem value="bank">
            Bank
          </MenuItem>
        </TextField>

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Note"
          placeholder="Optional repayment note"
          value={paymentNote}
          onChange={(event) =>
            setPaymentNote(event.target.value)
          }
        />

        {Number(paymentAmount) > 0 && (
          <Card
            variant="outlined"
            sx={{
              mt: 2,
              borderColor:
                Number(paymentAmount) >=
                getLoanBalance(selectedPayment)
                  ? 'success.main'
                  : 'warning.main'
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Balance After Payment
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                color={
                  Number(paymentAmount) >=
                  getLoanBalance(selectedPayment)
                    ? 'success.main'
                    : 'warning.main'
                }
                sx={{ mt: 1 }}
              >
                {formatTZS(
                  Math.max(
                    getLoanBalance(
                      selectedPayment
                    ) -
                      Number(paymentAmount),
                    0
                  )
                )}
              </Typography>

              {Number(paymentAmount) >=
                getLoanBalance(selectedPayment) && (
                <Chip
                  label="Loan will be fully paid"
                  color="success"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        )}

      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={handleClosePaymentDialog}
          disabled={paymentSubmitting}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={handleRecordPayment}
          disabled={
            paymentSubmitting ||
            !paymentAmount ||
            Number(paymentAmount) <= 0 ||
            Number(paymentAmount) >
              getLoanBalance(selectedPayment)
          }
          startIcon={
            paymentSubmitting ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : null
          }
        >
          {paymentSubmitting
            ? 'Recording...'
            : 'Receive Payment'}
        </Button>
      </DialogActions>
    </>
  )}
</Dialog>

    </Box>
  );
}
