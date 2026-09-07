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

import { getSales } from 'api/salesApi';

export default function Sales() {
  // =========================================================
  // HELPERS
  // =========================================================

  /**
   * Returns today's date in YYYY-MM-DD format.
   *
   * This is used for the default sales date filter.
   */
  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // STATE
  // =========================================================

  const [sales, setSales] = useState([]);

  const [summary, setSummary] = useState({
    transactions: 0,
    sales: 0,
    paidNow: 0,
    outstanding: 0,
    profit: 0,
    items: 0,
    loans: {
      transactions: 0,
      total: 0,
      paidNow: 0,
      outstanding: 0,
      unpaid: 0,
      partial: 0,
      paid: 0
    }
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  // Default to today's sales
  const [startDate, setStartDate] = useState(getToday());

  const [endDate, setEndDate] = useState(getToday());

  const [page, setPage] = useState(1);

  // Default to 500 transactions
  const [limit, setLimit] = useState(500);

  const [totalPages, setTotalPages] = useState(1);

  const [selectedSale, setSelectedSale] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

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
  // LOAD SALES
  // =========================================================

  const loadSales = async (overrides = {}) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: overrides.page ?? page,

        limit: overrides.limit ?? limit,

        search: overrides.search !== undefined ? overrides.search : search.trim() || undefined,

        startDate: overrides.startDate !== undefined ? overrides.startDate : startDate || undefined,

        endDate: overrides.endDate !== undefined ? overrides.endDate : endDate || undefined
      };

      console.log('GET SALES PARAMS:', params);

      const response = await getSales(params);

      console.log('GET SALES RESPONSE:', response);

      if (!response?.successful) {
        throw new Error(response?.message || 'Unable to load sales.');
      }

      setSales(Array.isArray(response.data) ? response.data : []);

      setSummary({
        transactions: Number(response.summary?.transactions || 0),

        sales: Number(response.summary?.sales || 0),

        paidNow: Number(response.summary?.paidNow || 0),

        outstanding: Number(response.summary?.outstanding || 0),

        profit: Number(response.summary?.profit || 0),

        items: Number(response.summary?.items || 0),

        loans: {
          transactions: Number(response.summary?.loans?.transactions || 0),

          total: Number(response.summary?.loans?.total || 0),

          paidNow: Number(response.summary?.loans?.paidNow || 0),

          outstanding: Number(response.summary?.loans?.outstanding || 0),

          unpaid: Number(response.summary?.loans?.unpaid || 0),

          partial: Number(response.summary?.loans?.partial || 0),

          paid: Number(response.summary?.loans?.paid || 0)
        }
      });

      setTotalPages(Math.max(Number(response.pagination?.totalPages || 1), 1));
    } catch (err) {
      console.error('Load sales error:', err);

      setSales([]);

      setSummary({
        transactions: 0,
        sales: 0,
        paidNow: 0,
        outstanding: 0,
        profit: 0,
        items: 0,
        loans: {
          transactions: 0,
          total: 0,
          paidNow: 0,
          outstanding: 0,
          unpaid: 0,
          partial: 0,
          paid: 0
        }
      });

      setTotalPages(1);

      setError(err?.response?.data?.message || err?.message || 'Failed to load sales.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD + PAGE/LIMIT/DATE CHANGES
  // =========================================================

  useEffect(() => {
    loadSales();
  }, [page, limit, startDate, endDate]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = () => {
    const trimmedSearch = search.trim();

    if (page !== 1) {
      setPage(1);

      return;
    }

    loadSales({
      page: 1,
      search: trimmedSearch || undefined
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
    const today = getToday();

    setSearch('');
    setStartDate(today);
    setEndDate(today);
    setPage(1);

    /**
     * When already on page 1, the useEffect will not run because
     * the page value does not change. Therefore explicitly reload.
     */
    if (page === 1) {
      loadSales({
        page: 1,
        search: undefined,
        startDate: today,
        endDate: today
      });
    }
  };

  // =========================================================
  // VIEW SALE
  // =========================================================

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSale(null);
  };

  // =========================================================
  // PAYMENT LABEL
  // =========================================================

  const paymentLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'Cash';

      case 'card':
        return 'Card';

      case 'mobile':
      case 'mobile_money':
        return 'Mobile Money';

      case 'bank':
        return 'Bank';

      case 'loan':
        return 'Loan';

      default:
        return method || '-';
    }
  };

  // =========================================================
  // PAYMENT COLOR
  // =========================================================

  const paymentColor = (method) => {
    switch (method) {
      case 'cash':
        return 'success';

      case 'card':
        return 'primary';

      case 'mobile':
      case 'mobile_money':
        return 'warning';

      case 'bank':
        return 'info';

      case 'loan':
        return 'error';

      default:
        return 'default';
    }
  };

  // =========================================================
  // LOAN STATUS LABEL
  // =========================================================

  const loanStatusLabel = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid';

      case 'partial':
        return 'Partial';

      case 'unpaid':
        return 'Unpaid';

      default:
        return status || '-';
    }
  };

  // =========================================================
  // LOAN STATUS COLOR
  // =========================================================

  const loanStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';

      case 'partial':
        return 'warning';

      case 'unpaid':
        return 'error';

      default:
        return 'default';
    }
  };

  // =========================================================
  // STATUS COLOR
  // =========================================================

  const statusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';

      case 'cancelled':
      case 'canceled':
        return 'error';

      case 'pending':
        return 'warning';

      default:
        return 'default';
    }
  };

  // =========================================================
  // SAFE ITEM TOTAL
  // =========================================================

  const getItemQuantity = (sale) => {
    if (sale?.totalQuantity !== undefined && sale?.totalQuantity !== null) {
      return Number(sale.totalQuantity) || 0;
    }

    if (!Array.isArray(sale?.items)) {
      return 0;
    }

    return sale.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  };

  // =========================================================
  // IS LOAN
  // =========================================================

  const isLoanSale = (sale) => {
    return sale?.paymentMethod === 'loan';
  };

  // =========================================================
  // SAFE PAID AMOUNT
  // =========================================================

  const getPaidNow = (sale) => {
    if (sale?.paidNow !== undefined && sale?.paidNow !== null) {
      return Number(sale.paidNow) || 0;
    }

    return Number(sale?.total) || 0;
  };

  // =========================================================
  // SAFE OUTSTANDING
  // =========================================================

  const getOutstanding = (sale) => {
    if (sale?.remainingBalance !== undefined && sale?.remainingBalance !== null) {
      return Number(sale.remainingBalance) || 0;
    }

    return 0;
  };

  // =========================================================
  // RENDER
  // =========================================================

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
            Sales
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View and manage completed sales transactions and customer loans.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => loadSales()}
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

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Transactions
              </Typography>

              <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                {summary.transactions.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* TOTAL SALES */}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Sales
              </Typography>

              <Typography variant="h4" fontWeight={700} color="primary" sx={{ mt: 1 }}>
                {formatTZS(summary.sales)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* PAID NOW */}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Paid Now
              </Typography>

              <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                {formatTZS(summary.paidNow)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Amount collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* OUTSTANDING */}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Outstanding
              </Typography>

              <Typography variant="h4" fontWeight={700} color={summary.outstanding > 0 ? 'error.main' : 'success.main'} sx={{ mt: 1 }}>
                {formatTZS(summary.outstanding)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Customer balances
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* PROFIT */}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Profit
              </Typography>

              <Typography variant="h5" fontWeight={700} color="success.main" sx={{ mt: 1 }}>
                {formatTZS(summary.profit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* ITEMS */}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Items Sold
              </Typography>

              <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                {summary.items.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* LOAN SALES */}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Loan Sales
              </Typography>

              <Typography variant="h5" fontWeight={700} color="error.main" sx={{ mt: 1 }}>
                {formatTZS(summary.loans.total)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {summary.loans.transactions} loan transaction
                {summary.loans.transactions === 1 ? '' : 's'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* LOAN OUTSTANDING */}

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Loan Outstanding
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                color={summary.loans.outstanding > 0 ? 'error.main' : 'success.main'}
                sx={{ mt: 1 }}
              >
                {formatTZS(summary.loans.outstanding)}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {summary.loans.partial} partial · {summary.loans.paid} paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =====================================================
          LOAN SUMMARY
      ===================================================== */}

      {summary.loans.transactions > 0 && (
        <Card
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'error.light'
          }}
        >
          <CardContent>
            <Stack
              direction={{
                xs: 'column',
                md: 'row'
              }}
              spacing={3}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Loan Summary
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Overview of customer credit sales.
                </Typography>
              </Box>

              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row'
                }}
                spacing={2}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Loan Sales
                  </Typography>

                  <Typography fontWeight={700}>{formatTZS(summary.loans.total)}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Paid
                  </Typography>

                  <Typography fontWeight={700} color="success.main">
                    {formatTZS(summary.loans.paidNow)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Outstanding
                  </Typography>

                  <Typography fontWeight={700} color="error.main">
                    {formatTZS(summary.loans.outstanding)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>

                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                    <Chip size="small" color="warning" label={`${summary.loans.partial} Partial`} />

                    <Chip size="small" color="success" label={`${summary.loans.paid} Paid`} />

                    {summary.loans.unpaid > 0 && <Chip size="small" color="error" label={`${summary.loans.unpaid} Unpaid`} />}
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* SEARCH */}

            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Search Sales"
                placeholder="Invoice, customer, SKU or barcode"
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

            <Grid item xs={12} sm={6} md={1.5}>
              <Select
                fullWidth
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
              >
                <MenuItem value={10}>10</MenuItem>

                <MenuItem value={20}>20</MenuItem>

                <MenuItem value={50}>50</MenuItem>

                <MenuItem value={100}>100</MenuItem>

                <MenuItem value={500}>500</MenuItem>

                <MenuItem value={1000}>1,000</MenuItem>

                <MenuItem value={2000}>2,000</MenuItem>
              </Select>
            </Grid>

            {/* ACTIONS */}

            <Grid item xs={12} sm={6} md={1.5}>
              <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                <Button variant="contained" fullWidth onClick={handleSearch} disabled={loading}>
                  Search
                </Button>

                <Button variant="outlined" onClick={clearFilters} disabled={loading}>
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* =====================================================
          SALES TABLE
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
                Sales Transactions
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {sales.length} transaction
                {sales.length === 1 ? '' : 's'} shown
              </Typography>
            </Box>

            {loading && <CircularProgress size={24} />}
          </Stack>
        </Box>

        {/* LOADING */}

        {loading && sales.length === 0 ? (
          <Box
            sx={{
              py: 8,
              textAlign: 'center'
            }}
          >
            <CircularProgress />

            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Loading sales...
            </Typography>
          </Box>
        ) : sales.length === 0 ? (
          /* =================================================
             EMPTY STATE
          ================================================= */

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
              🧾
            </Box>

            <Typography variant="h6" sx={{ mt: 2 }}>
              No sales found
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Try changing your search or date filters.
            </Typography>
          </Box>
        ) : (
          /* =================================================
             TABLE
          ================================================= */

          <TableContainer
            sx={{
              overflowX: 'auto'
            }}
          >
            <Table
              sx={{
                minWidth: 1250
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>

                  <TableCell>Date</TableCell>

                  <TableCell>Customer</TableCell>

                  <TableCell>Items</TableCell>

                  <TableCell>Payment</TableCell>

                  <TableCell>Loan Status</TableCell>

                  <TableCell align="right">Total</TableCell>

                  <TableCell align="right">Paid</TableCell>

                  <TableCell align="right">Outstanding</TableCell>

                  <TableCell align="right">Profit</TableCell>

                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sales.map((sale) => {
                  const loan = isLoanSale(sale);

                  const paidNow = getPaidNow(sale);

                  const outstanding = getOutstanding(sale);

                  return (
                    <TableRow key={sale.id || sale.invoiceNumber} hover>
                      {/* INVOICE */}

                      <TableCell>
                        <Typography
                          fontWeight={700}
                          sx={{
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {sale.invoiceNumber || '-'}
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
                          {formatDateTime(sale.createdAt)}
                        </Typography>
                      </TableCell>

                      {/* CUSTOMER */}

                      <TableCell>
                        <Typography fontWeight={sale.customerName ? 500 : 400}>{sale.customerName || 'Walk-in Customer'}</Typography>

                        {sale.customerMobile && (
                          <Typography variant="caption" color="text.secondary">
                            {sale.customerMobile}
                          </Typography>
                        )}
                      </TableCell>

                      {/* ITEMS */}

                      <TableCell>
                        <Typography fontWeight={700}>{getItemQuantity(sale)}</Typography>
                      </TableCell>

                      {/* PAYMENT */}

                      <TableCell>
                        <Chip size="small" label={paymentLabel(sale.paymentMethod)} color={paymentColor(sale.paymentMethod)} />
                      </TableCell>

                      {/* LOAN STATUS */}

                      <TableCell>
                        {loan ? (
                          <Chip size="small" label={loanStatusLabel(sale.loanStatus)} color={loanStatusColor(sale.loanStatus)} />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* TOTAL */}

                      <TableCell align="right">
                        <Typography fontWeight={700}>{formatTZS(sale.total)}</Typography>
                      </TableCell>

                      {/* PAID */}

                      <TableCell align="right">
                        <Typography fontWeight={700} color={loan ? 'success.main' : 'text.primary'}>
                          {formatTZS(paidNow)}
                        </Typography>
                      </TableCell>

                      {/* OUTSTANDING */}

                      <TableCell align="right">
                        {outstanding > 0 ? (
                          <Typography fontWeight={700} color="error.main">
                            {formatTZS(outstanding)}
                          </Typography>
                        ) : (
                          <Typography fontWeight={500} color="text.secondary">
                            {formatTZS(0)}
                          </Typography>
                        )}
                      </TableCell>

                      {/* PROFIT */}

                      <TableCell align="right">
                        <Typography fontWeight={700} color="success.main">
                          {formatTZS(sale.totalProfit)}
                        </Typography>
                      </TableCell>

                      {/* ACTION */}

                      <TableCell align="center">
                        <IconButton color="primary" onClick={() => handleViewSale(sale)} title="View sale">
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
          SALE DETAILS DIALOG
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
                Sale Details
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {selectedSale?.invoiceNumber || '-'}
              </Typography>
            </Box>

            {selectedSale && <Chip label={selectedSale.status || 'unknown'} color={statusColor(selectedSale.status)} />}
          </Stack>
        </DialogTitle>

        {/* DIALOG CONTENT */}

        {selectedSale && (
          <>
            <DialogContent dividers>
              {/* =============================================
                  SALE INFORMATION
              ============================================= */}

              <Typography variant="h6" fontWeight={700} gutterBottom>
                Sale Information
              </Typography>

              <Grid container spacing={2}>
                {/* INVOICE */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Invoice Number
                  </Typography>

                  <Typography fontWeight={700}>{selectedSale.invoiceNumber || '-'}</Typography>
                </Grid>

                {/* DATE */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sale Date
                  </Typography>

                  <Typography fontWeight={700}>{formatDateTime(selectedSale.createdAt)}</Typography>
                </Grid>

                {/* CUSTOMER */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Customer
                  </Typography>

                  <Typography fontWeight={700}>{selectedSale.customerName || 'Walk-in Customer'}</Typography>
                </Grid>

                {/* MOBILE */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Customer Mobile
                  </Typography>

                  <Typography fontWeight={700}>{selectedSale.customerMobile || '-'}</Typography>
                </Grid>

                {/* PAYMENT */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Method
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>
                    <Chip size="small" label={paymentLabel(selectedSale.paymentMethod)} color={paymentColor(selectedSale.paymentMethod)} />
                  </Box>
                </Grid>

                {/* STATUS */}

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sale Status
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>
                    <Chip size="small" label={selectedSale.status || 'unknown'} color={statusColor(selectedSale.status)} />
                  </Box>
                </Grid>
              </Grid>

              {/* =============================================
                  LOAN INFORMATION
              ============================================= */}

              {isLoanSale(selectedSale) && (
                <>
                  <Divider sx={{ my: 3 }} />

                  <Card
                    variant="outlined"
                    sx={{
                      borderColor: 'error.light',
                      backgroundColor: 'error.50'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                        Loan Details
                      </Typography>

                      <Grid container spacing={2}>
                        {/* LOAN STATUS */}

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Loan Status
                          </Typography>

                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={loanStatusLabel(selectedSale.loanStatus)}
                              color={loanStatusColor(selectedSale.loanStatus)}
                            />
                          </Box>
                        </Grid>

                        {/* TOTAL */}

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Loan Amount
                          </Typography>

                          <Typography fontWeight={700}>{formatTZS(selectedSale.total)}</Typography>
                        </Grid>

                        {/* PAID NOW */}

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Paid Now
                          </Typography>

                          <Typography fontWeight={700} color="success.main">
                            {formatTZS(selectedSale.paidNow)}
                          </Typography>
                        </Grid>

                        {/* OUTSTANDING */}

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Outstanding Balance
                          </Typography>

                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color={getOutstanding(selectedSale) > 0 ? 'error.main' : 'success.main'}
                          >
                            {formatTZS(selectedSale.remainingBalance)}
                          </Typography>
                        </Grid>

                        {/* CUSTOMER */}

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Debtor
                          </Typography>

                          <Typography fontWeight={700}>{selectedSale.customerName || 'Walk-in Customer'}</Typography>
                        </Grid>

                        {/* PHONE */}

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            Customer Mobile
                          </Typography>

                          <Typography fontWeight={700}>{selectedSale.customerMobile || '-'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              {/* =============================================
                  ITEMS
              ============================================= */}

              <Typography variant="h6" gutterBottom fontWeight={700}>
                Items
              </Typography>

              <TableContainer
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflowX: 'auto'
                }}
              >
                <Table size="small" sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>

                      <TableCell>SKU</TableCell>

                      <TableCell align="center">Qty</TableCell>

                      <TableCell align="right">Unit Price</TableCell>

                      <TableCell align="right">Subtotal</TableCell>

                      <TableCell align="right">Profit</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {(selectedSale.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" sx={{ py: 2 }}>
                            No item details available.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedSale.items.map((item, index) => (
                        <TableRow key={item.id || item.productId || `${item.sku}-${index}`}>
                          {/* PRODUCT */}

                          <TableCell>
                            <Typography fontWeight={700}>{item.productName || 'Unnamed Product'}</Typography>

                            {item.barcode && (
                              <Typography variant="caption" color="text.secondary">
                                Barcode: {item.barcode}
                              </Typography>
                            )}
                          </TableCell>

                          {/* SKU */}

                          <TableCell>{item.sku || '-'}</TableCell>

                          {/* QUANTITY */}

                          <TableCell align="center">{Number(item.quantity) || 0}</TableCell>

                          {/* UNIT PRICE */}

                          <TableCell align="right">{formatTZS(item.unitPrice)}</TableCell>

                          {/* SUBTOTAL */}

                          <TableCell align="right">
                            <Typography fontWeight={700}>{formatTZS(item.subtotal)}</Typography>
                          </TableCell>

                          {/* PROFIT */}

                          <TableCell align="right">
                            <Typography color="success.main" fontWeight={700}>
                              {formatTZS(item.profit)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* =============================================
                  PAYMENT SUMMARY
              ============================================= */}

              <Box
                sx={{
                  mt: 3,
                  ml: 'auto',
                  maxWidth: 450
                }}
              >
                <Stack spacing={1.5}>
                  {/* ITEMS */}

                  <Box display="flex" justifyContent="space-between">
                    <Typography>Items</Typography>

                    <Typography fontWeight={700}>{getItemQuantity(selectedSale)}</Typography>
                  </Box>

                  {/* SUBTOTAL */}

                  <Box display="flex" justifyContent="space-between">
                    <Typography>Subtotal</Typography>

                    <Typography>{formatTZS(selectedSale.subtotal)}</Typography>
                  </Box>

                  {/* TAX */}

                  <Box display="flex" justifyContent="space-between">
                    <Typography>Tax</Typography>

                    <Typography>{formatTZS(selectedSale.tax)}</Typography>
                  </Box>

                  <Divider />

                  {/* TOTAL */}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Total</Typography>

                    <Typography variant="h6" color="primary" fontWeight={700}>
                      {formatTZS(selectedSale.total)}
                    </Typography>
                  </Box>

                  {/* =========================================
                      LOAN PAYMENT
                  ========================================= */}

                  {isLoanSale(selectedSale) && (
                    <>
                      <Divider />

                      <Box display="flex" justifyContent="space-between">
                        <Typography>Paid Now</Typography>

                        <Typography fontWeight={700} color="success.main">
                          {formatTZS(selectedSale.paidNow)}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight={700}>Outstanding</Typography>

                        <Typography fontWeight={700} color={getOutstanding(selectedSale) > 0 ? 'error.main' : 'success.main'}>
                          {formatTZS(selectedSale.remainingBalance)}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography>Loan Status</Typography>

                        <Chip
                          size="small"
                          label={loanStatusLabel(selectedSale.loanStatus)}
                          color={loanStatusColor(selectedSale.loanStatus)}
                        />
                      </Box>
                    </>
                  )}

                  {/* =========================================
                      CASH PAYMENT
                  ========================================= */}

                  {selectedSale.paymentMethod === 'cash' && (
                    <>
                      <Divider />

                      <Box display="flex" justifyContent="space-between">
                        <Typography>Cash Given</Typography>

                        <Typography>{formatTZS(selectedSale.cashGiven)}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight={700}>Change</Typography>

                        <Typography fontWeight={700} color="success.main">
                          {formatTZS(selectedSale.changeAmount)}
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Divider />

                  {/* PROFIT */}

                  <Box display="flex" justifyContent="space-between">
                    <Typography>Profit</Typography>

                    <Typography fontWeight={700} color="success.main">
                      {formatTZS(selectedSale.totalProfit)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
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
    </Box>
  );
}
