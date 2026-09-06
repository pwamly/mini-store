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

  const [sales, setSales] = useState([]);

  const [summary, setSummary] = useState({
    transactions: 0,
    sales: 0,
    profit: 0,
    items: 0,
    loanSales: 0,
    loanOutstanding: 0,
    loanPaid: 0
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  // Default = today's date
  const [startDate, setStartDate] = useState(today);

  const [endDate, setEndDate] = useState(today);

  const [page, setPage] = useState(1);

  // Default = 500 transactions
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
  // NORMALIZE PAYMENT METHOD
  // =========================================================

  const normalizePaymentMethod = (method) => {
    if (!method) {
      return '';
    }

    return String(method)
      .trim()
      .toLowerCase();
  };

  // =========================================================
  // IS LOAN
  // =========================================================

  const isLoanSale = (sale) => {
    return (
      normalizePaymentMethod(
        sale?.paymentMethod
      ) === 'loan'
    );
  };

  // =========================================================
  // GET SALE TOTAL
  // =========================================================

  const getSaleTotal = (sale) => {
    return Number(sale?.total) || 0;
  };

  // =========================================================
  // GET LOAN PAID NOW
  //
  // Supports:
  // paidNow
  // amountPaid
  // paidAmount
  //
  // This makes the page tolerant of different API naming
  // while the backend is being standardized.
  // =========================================================

  const getLoanPaidNow = (sale) => {
    if (!isLoanSale(sale)) {
      return 0;
    }

    if (
      sale?.paidNow !== undefined &&
      sale?.paidNow !== null &&
      sale?.paidNow !== ''
    ) {
      return Number(sale.paidNow) || 0;
    }

    if (
      sale?.amountPaid !== undefined &&
      sale?.amountPaid !== null &&
      sale?.amountPaid !== ''
    ) {
      return Number(sale.amountPaid) || 0;
    }

    if (
      sale?.paidAmount !== undefined &&
      sale?.paidAmount !== null &&
      sale?.paidAmount !== ''
    ) {
      return Number(sale.paidAmount) || 0;
    }

    return 0;
  };

  // =========================================================
  // GET LOAN BALANCE
  //
  // Supports:
  // balanceAmount
  // balance
  // outstandingBalance
  //
  // If the backend does not provide a balance, calculate:
  //
  // Total - Paid Now
  // =========================================================

  const getLoanBalance = (sale) => {
    if (!isLoanSale(sale)) {
      return 0;
    }

    if (
      sale?.balanceAmount !== undefined &&
      sale?.balanceAmount !== null &&
      sale?.balanceAmount !== ''
    ) {
      return Math.max(
        Number(sale.balanceAmount) || 0,
        0
      );
    }

    if (
      sale?.balance !== undefined &&
      sale?.balance !== null &&
      sale?.balance !== ''
    ) {
      return Math.max(
        Number(sale.balance) || 0,
        0
      );
    }

    if (
      sale?.outstandingBalance !== undefined &&
      sale?.outstandingBalance !== null &&
      sale?.outstandingBalance !== ''
    ) {
      return Math.max(
        Number(sale.outstandingBalance) || 0,
        0
      );
    }

    const total = getSaleTotal(sale);
    const paidNow = getLoanPaidNow(sale);

    return Math.max(
      Number(
        (total - paidNow).toFixed(2)
      ),
      0
    );
  };

  // =========================================================
  // GET CUSTOMER MOBILE
  // =========================================================

  const getCustomerMobile = (sale) => {
    if (!sale) {
      return null;
    }

    if (
      sale.customerMobile !== undefined &&
      sale.customerMobile !== null &&
      String(sale.customerMobile).trim() !== ''
    ) {
      return String(
        sale.customerMobile
      ).trim();
    }

    if (
      sale.phone !== undefined &&
      sale.phone !== null &&
      String(sale.phone).trim() !== ''
    ) {
      return String(sale.phone).trim();
    }

    if (
      sale.mobile !== undefined &&
      sale.mobile !== null &&
      String(sale.mobile).trim() !== ''
    ) {
      return String(sale.mobile).trim();
    }

    return null;
  };

  // =========================================================
  // GET LOAN PAYMENT STATUS
  // =========================================================

  const getLoanPaymentStatus = (sale) => {
    if (!isLoanSale(sale)) {
      return null;
    }

    const balance = getLoanBalance(sale);
    const paidNow = getLoanPaidNow(sale);
    const total = getSaleTotal(sale);

    if (balance <= 0) {
      return 'Paid';
    }

    if (paidNow > 0 && paidNow < total) {
      return 'Partially Paid';
    }

    return 'Unpaid';
  };

  // =========================================================
  // LOAD SALES
  // =========================================================

  const loadSales = async (overrides = {}) => {
    setLoading(true);
    setError('');

    try {
      const currentPage =
        overrides.page ?? page;

      const currentLimit =
        overrides.limit ?? limit;

      const currentSearch =
        overrides.search !== undefined
          ? overrides.search
          : search.trim();

      const currentStartDate =
        overrides.startDate !== undefined
          ? overrides.startDate
          : startDate;

      const currentEndDate =
        overrides.endDate !== undefined
          ? overrides.endDate
          : endDate;

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

      if (currentStartDate) {
        params.startDate = currentStartDate;
      }

      if (currentEndDate) {
        params.endDate = currentEndDate;
      }

      console.log(
        'GET SALES PARAMS:',
        params
      );

      const response =
        await getSales(params);

      console.log(
        'GET SALES RESPONSE:',
        response
      );

      if (!response?.successful) {
        throw new Error(
          response?.message ||
            'Unable to load sales.'
        );
      }

      const loadedSales =
        Array.isArray(response.data)
          ? response.data
          : [];

      setSales(loadedSales);

      // =====================================================
      // CALCULATE LOAN SUMMARY
      //
      // We calculate these from the returned records so the
      // UI also works with an older summary response.
      // =====================================================

      const loanSales =
        loadedSales.filter(
          (sale) => isLoanSale(sale)
        );

      const loanPaid =
        loanSales.reduce(
          (total, sale) =>
            total +
            getLoanPaidNow(sale),
          0
        );

      const loanOutstanding =
        loanSales.reduce(
          (total, sale) =>
            total +
            getLoanBalance(sale),
          0
        );

      setSummary({
        transactions: Number(
          response.summary?.transactions || 0
        ),

        sales: Number(
          response.summary?.sales || 0
        ),

        profit: Number(
          response.summary?.profit || 0
        ),

        items: Number(
          response.summary?.items || 0
        ),

        loanSales: loanSales.length,

        loanOutstanding: Number(
          loanOutstanding.toFixed(2)
        ),

        loanPaid: Number(
          loanPaid.toFixed(2)
        )
      });

      setTotalPages(
        Math.max(
          Number(
            response.pagination?.totalPages || 1
          ),
          1
        )
      );
    } catch (err) {
      console.error(
        'Load sales error:',
        err
      );

      setSales([]);

      setSummary({
        transactions: 0,
        sales: 0,
        profit: 0,
        items: 0,
        loanSales: 0,
        loanOutstanding: 0,
        loanPaid: 0
      });

      setTotalPages(1);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load sales.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadSales();
  }, [
    page,
    limit,
    startDate,
    endDate
  ]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = () => {
    const trimmedSearch =
      search.trim();

    if (page !== 1) {
      setPage(1);

      return;
    }

    loadSales({
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
    setStartDate(today);
    setEndDate(today);
    setLimit(500);

    if (page !== 1) {
      setPage(1);

      return;
    }

    loadSales({
      page: 1,
      limit: 500,
      search: '',
      startDate: today,
      endDate: today
    });
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
    switch (
      normalizePaymentMethod(method)
    ) {
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
    switch (
      normalizePaymentMethod(method)
    ) {
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
  // STATUS COLOR
  // =========================================================

  const statusColor = (status) => {
    switch (
      String(status || '')
        .trim()
        .toLowerCase()
    ) {
      case 'completed':
        return 'success';

      case 'cancelled':
      case 'canceled':
        return 'error';

      case 'pending':
        return 'warning';

      case 'paid':
        return 'success';

      case 'partially paid':
        return 'warning';

      case 'unpaid':
        return 'error';

      default:
        return 'default';
    }
  };

  // =========================================================
  // SAFE ITEM TOTAL
  // =========================================================

  const getItemQuantity = (sale) => {
    if (
      sale?.totalQuantity !== undefined &&
      sale?.totalQuantity !== null
    ) {
      return (
        Number(
          sale.totalQuantity
        ) || 0
      );
    }

    if (
      !Array.isArray(
        sale?.items
      )
    ) {
      return 0;
    }

    return sale.items.reduce(
      (total, item) =>
        total +
        (Number(
          item.quantity
        ) || 0),
      0
    );
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

          <Typography
            variant="h4"
            fontWeight={700}
          >
            Sales
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            View and manage sales
            transactions.
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
            Showing sales from{' '}
            {startDate === endDate
              ? startDate
              : `${startDate} to ${endDate}`}
            {' '}• {limit.toLocaleString()}{' '}
            per page
          </Typography>

        </Box>

        <Button
          variant="outlined"
          onClick={() =>
            loadSales()
          }
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
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() =>
            setError('')
          }
        >
          {error}
        </Alert>
      )}

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >

        {/* TRANSACTIONS */}

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <Card>
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Transactions
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {summary.transactions.toLocaleString()}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        {/* TOTAL SALES */}

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <Card>
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Sales
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="primary"
                sx={{ mt: 1 }}
              >
                {formatTZS(
                  summary.sales
                )}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        {/* PROFIT */}

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <Card>
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Profit
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="success.main"
                sx={{ mt: 1 }}
              >
                {formatTZS(
                  summary.profit
                )}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        {/* ITEMS */}

        <Grid
          item
          xs={12}
          sm={6}
          md={3}
        >
          <Card>
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Items Sold
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {summary.items.toLocaleString()}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* =====================================================
          LOAN SUMMARY
      ===================================================== */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >

        {/* LOAN TRANSACTIONS */}

        <Grid
          item
          xs={12}
          sm={4}
        >
          <Card
            sx={{
              borderLeft: '4px solid',
              borderColor: 'error.main'
            }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Loan Transactions
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                color="error.main"
                sx={{ mt: 1 }}
              >
                {summary.loanSales.toLocaleString()}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        {/* LOAN PAID */}

        <Grid
          item
          xs={12}
          sm={4}
        >
          <Card
            sx={{
              borderLeft: '4px solid',
              borderColor: 'warning.main'
            }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Loan Paid at Sale
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                color="warning.main"
                sx={{ mt: 1 }}
              >
                {formatTZS(
                  summary.loanPaid
                )}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        {/* OUTSTANDING */}

        <Grid
          item
          xs={12}
          sm={4}
        >
          <Card
            sx={{
              borderLeft: '4px solid',
              borderColor: 'error.main'
            }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Outstanding Loan
              </Typography>

              <Typography
                variant="h5"
                fontWeight={700}
                color="error.main"
                sx={{ mt: 1 }}
              >
                {formatTZS(
                  summary.loanOutstanding
                )}
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

          <Grid
            container
            spacing={2}
            alignItems="center"
          >

            {/* SEARCH */}

            <Grid
              item
              xs={12}
              md={5}
            >

              <TextField
                fullWidth
                label="Search Sales"
                placeholder="Invoice, customer, mobile, SKU or barcode"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleSearchKeyDown
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        component="span"
                        sx={{
                          fontSize: '1.4rem',
                          lineHeight: 1,
                          color:
                            'text.secondary'
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

            <Grid
              item
              xs={12}
              sm={6}
              md={2}
            >

              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(
                    event.target.value
                  );

                  setPage(1);
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />

            </Grid>

            {/* END DATE */}

            <Grid
              item
              xs={12}
              sm={6}
              md={2}
            >

              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(
                    event.target.value
                  );

                  setPage(1);
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />

            </Grid>

            {/* LIMIT */}

            <Grid
              item
              xs={12}
              sm={6}
              md={1.5}
            >

              <Select
                fullWidth
                value={limit}
                onChange={(event) => {
                  setLimit(
                    Number(
                      event.target.value
                    )
                  );

                  setPage(1);
                }}
              >

                <MenuItem value={500}>
                  500
                </MenuItem>

                <MenuItem value={1000}>
                  1,000
                </MenuItem>

                <MenuItem value={2000}>
                  2,000
                </MenuItem>

              </Select>

            </Grid>

            {/* ACTIONS */}

            <Grid
              item
              xs={12}
              sm={6}
              md={1.5}
            >

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  width: '100%'
                }}
              >

                <Button
                  variant="contained"
                  fullWidth
                  onClick={
                    handleSearch
                  }
                  disabled={loading}
                >
                  Search
                </Button>

                <Button
                  variant="outlined"
                  onClick={
                    clearFilters
                  }
                  disabled={loading}
                >
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

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >

            <Box>

              <Typography
                variant="h6"
                fontWeight={600}
              >
                Sales Transactions
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {sales.length.toLocaleString()}{' '}
                transaction
                {sales.length === 1
                  ? ''
                  : 's'} shown
              </Typography>

            </Box>

            {loading && (
              <CircularProgress
                size={24}
              />
            )}

          </Stack>

        </Box>

        {/* LOADING */}

        {loading &&
        sales.length === 0 ? (

          <Box
            sx={{
              py: 8,
              textAlign: 'center'
            }}
          >

            <CircularProgress />

            <Typography
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              Loading sales...
            </Typography>

          </Box>

        ) : sales.length === 0 ? (

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
              🧾
            </Box>

            <Typography
              variant="h6"
              sx={{ mt: 2 }}
            >
              No sales found
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Try changing your search
              or date filters.
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

                  <TableCell>
                    Invoice
                  </TableCell>

                  <TableCell>
                    Date
                  </TableCell>

                  <TableCell>
                    Customer
                  </TableCell>

                  <TableCell>
                    Items
                  </TableCell>

                  <TableCell>
                    Payment
                  </TableCell>

                  <TableCell>
                    Status
                  </TableCell>

                  <TableCell align="right">
                    Total
                  </TableCell>

                  <TableCell align="right">
                    Balance
                  </TableCell>

                  <TableCell align="right">
                    Profit
                  </TableCell>

                  <TableCell align="center">
                    Action
                  </TableCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {sales.map((sale) => {

                  const loan =
                    isLoanSale(
                      sale
                    );

                  const loanBalance =
                    getLoanBalance(
                      sale
                    );

                  return (
                    <TableRow
                      key={
                        sale.id ||
                        sale.invoiceNumber
                      }
                      hover
                    >

                      {/* INVOICE */}

                      <TableCell>

                        <Typography
                          fontWeight={700}
                          sx={{
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          {sale.invoiceNumber ||
                            '-'}
                        </Typography>

                      </TableCell>

                      {/* DATE */}

                      <TableCell>

                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          {formatDateTime(
                            sale.createdAt
                          )}
                        </Typography>

                      </TableCell>

                      {/* CUSTOMER */}

                      <TableCell>

                        <Typography
                          fontWeight={
                            sale.customerName
                              ? 600
                              : 400
                          }
                        >
                          {sale.customerName ||
                            'Walk-in Customer'}
                        </Typography>

                        {getCustomerMobile(
                          sale
                        ) && (

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {getCustomerMobile(
                              sale
                            )}
                          </Typography>

                        )}

                      </TableCell>

                      {/* ITEMS */}

                      <TableCell>

                        <Typography
                          fontWeight={700}
                        >
                          {getItemQuantity(
                            sale
                          )}
                        </Typography>

                      </TableCell>

                      {/* PAYMENT */}

                      <TableCell>

                        <Stack
                          spacing={0.5}
                          alignItems="flex-start"
                        >

                          <Chip
                            size="small"
                            label={paymentLabel(
                              sale.paymentMethod
                            )}
                            color={paymentColor(
                              sale.paymentMethod
                            )}
                          />

                          {loan && (
                            <Typography
                              variant="caption"
                              color="error.main"
                              fontWeight={600}
                            >
                              Balance:{' '}
                              {formatTZS(
                                loanBalance
                              )}
                            </Typography>
                          )}

                        </Stack>

                      </TableCell>

                      {/* STATUS */}

                      <TableCell>

                        {loan ? (

                          <Stack
                            spacing={0.5}
                            alignItems="flex-start"
                          >

                            <Chip
                              size="small"
                              label={
                                getLoanPaymentStatus(
                                  sale
                                )
                              }
                              color={
                                statusColor(
                                  getLoanPaymentStatus(
                                    sale
                                  )
                                )
                              }
                            />

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Sale:{' '}
                              {sale.status ||
                                'completed'}
                            </Typography>

                          </Stack>

                        ) : (

                          <Chip
                            size="small"
                            label={
                              sale.status ||
                              'unknown'
                            }
                            color={statusColor(
                              sale.status
                            )}
                          />

                        )}

                      </TableCell>

                      {/* TOTAL */}

                      <TableCell align="right">

                        <Typography
                          fontWeight={700}
                        >
                          {formatTZS(
                            sale.total
                          )}
                        </Typography>

                        {loan && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Paid:{' '}
                            {formatTZS(
                              getLoanPaidNow(
                                sale
                              )
                            )}
                          </Typography>
                        )}

                      </TableCell>

                      {/* BALANCE */}

                      <TableCell align="right">

                        {loan ? (

                          <Typography
                            fontWeight={700}
                            color={
                              loanBalance > 0
                                ? 'error.main'
                                : 'success.main'
                            }
                          >
                            {formatTZS(
                              loanBalance
                            )}
                          </Typography>

                        ) : (

                          <Typography
                            color="text.secondary"
                          >
                            -
                          </Typography>

                        )}

                      </TableCell>

                      {/* PROFIT */}

                      <TableCell align="right">

                        <Typography
                          fontWeight={700}
                          color="success.main"
                        >
                          {formatTZS(
                            sale.totalProfit
                          )}
                        </Typography>

                      </TableCell>

                      {/* ACTION */}

                      <TableCell align="center">

                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleViewSale(
                              sale
                            )
                          }
                          title="View sale"
                        >

                          <Box
                            component="span"
                            sx={{
                              fontSize:
                                '1.25rem',
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
              onChange={(_, value) =>
                setPage(value)
              }
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

      <Dialog
        open={detailsOpen}
        onClose={
          handleCloseDetails
        }
        fullWidth
        maxWidth="md"
      >

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

              <Typography
                variant="h6"
                fontWeight={700}
              >
                Sale Details
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {selectedSale?.invoiceNumber ||
                  '-'}
              </Typography>

            </Box>

            {selectedSale && (

              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
              >

                <Chip
                  label={paymentLabel(
                    selectedSale.paymentMethod
                  )}
                  color={paymentColor(
                    selectedSale.paymentMethod
                  )}
                />

                <Chip
                  label={
                    selectedSale.status ||
                    'unknown'
                  }
                  color={statusColor(
                    selectedSale.status
                  )}
                />

              </Stack>

            )}

          </Stack>

        </DialogTitle>

        {/* DIALOG CONTENT */}

        {selectedSale && (

          <>

            <DialogContent dividers>

              {/* =============================================
                  SALE INFORMATION
              ============================================= */}

              <Grid
                container
                spacing={2}
              >

                {/* INVOICE */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Invoice Number
                  </Typography>

                  <Typography fontWeight={700}>
                    {selectedSale.invoiceNumber ||
                      '-'}
                  </Typography>

                </Grid>

                {/* DATE */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Sale Date
                  </Typography>

                  <Typography fontWeight={700}>
                    {formatDateTime(
                      selectedSale.createdAt
                    )}
                  </Typography>

                </Grid>

                {/* CUSTOMER */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Customer
                  </Typography>

                  <Typography fontWeight={700}>
                    {selectedSale.customerName ||
                      'Walk-in Customer'}
                  </Typography>

                  {getCustomerMobile(
                    selectedSale
                  ) && (

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.25 }}
                    >
                      Mobile:{' '}
                      {
                        getCustomerMobile(
                          selectedSale
                        )
                      }
                    </Typography>

                  )}

                </Grid>

                {/* USER */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    User
                  </Typography>

                  <Typography fontWeight={700}>
                    {selectedSale.userId ||
                      '-'}
                  </Typography>

                </Grid>

                {/* PAYMENT */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Payment Method
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>

                    <Chip
                      size="small"
                      label={paymentLabel(
                        selectedSale.paymentMethod
                      )}
                      color={paymentColor(
                        selectedSale.paymentMethod
                      )}
                    />

                  </Box>

                </Grid>

                {/* STATUS */}

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Sale Status
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>

                    <Chip
                      size="small"
                      label={
                        selectedSale.status ||
                        'unknown'
                      }
                      color={statusColor(
                        selectedSale.status
                      )}
                    />

                  </Box>

                </Grid>

              </Grid>

              {/* =============================================
                  LOAN INFORMATION
              ============================================= */}

              {isLoanSale(
                selectedSale
              ) && (

                <>

                  <Divider
                    sx={{ my: 3 }}
                  />

                  <Typography
                    variant="h6"
                    gutterBottom
                    fontWeight={700}
                  >
                    Loan Information
                  </Typography>

                  <Grid
                    container
                    spacing={2}
                  >

                    {/* LOAN STATUS */}

                    <Grid
                      item
                      xs={12}
                      sm={4}
                    >

                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          borderColor:
                            'error.main'
                        }}
                      >

                        <CardContent>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Loan Status
                          </Typography>

                          <Box
                            sx={{
                              mt: 1
                            }}
                          >

                            <Chip
                              label={getLoanPaymentStatus(
                                selectedSale
                              )}
                              color={statusColor(
                                getLoanPaymentStatus(
                                  selectedSale
                                )
                              )}
                            />

                          </Box>

                        </CardContent>

                      </Card>

                    </Grid>

                    {/* TOTAL */}

                    <Grid
                      item
                      xs={12}
                      sm={4}
                    >

                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%'
                        }}
                      >

                        <CardContent>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Loan Total
                          </Typography>

                          <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{ mt: 1 }}
                          >
                            {formatTZS(
                              getSaleTotal(
                                selectedSale
                              )
                            )}
                          </Typography>

                        </CardContent>

                      </Card>

                    </Grid>

                    {/* PAID NOW */}

                    <Grid
                      item
                      xs={12}
                      sm={4}
                    >

                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          borderColor:
                            'success.main'
                        }}
                      >

                        <CardContent>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Paid Now
                          </Typography>

                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color="success.main"
                            sx={{ mt: 1 }}
                          >
                            {formatTZS(
                              getLoanPaidNow(
                                selectedSale
                              )
                            )}
                          </Typography>

                        </CardContent>

                      </Card>

                    </Grid>

                    {/* OUTSTANDING */}

                    <Grid
                      item
                      xs={12}
                    >

                      <Card
                        variant="outlined"
                        sx={{
                          borderColor:
                            'error.main',
                          backgroundColor:
                            'rgba(211, 47, 47, 0.04)'
                        }}
                      >

                        <CardContent>

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

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Outstanding
                                Balance
                              </Typography>

                              <Typography
                                variant="h5"
                                fontWeight={700}
                                color={
                                  getLoanBalance(
                                    selectedSale
                                  ) > 0
                                    ? 'error.main'
                                    : 'success.main'
                                }
                                sx={{
                                  mt: 0.5
                                }}
                              >
                                {formatTZS(
                                  getLoanBalance(
                                    selectedSale
                                  )
                                )}
                              </Typography>

                            </Box>

                            <Chip
                              label={
                                getLoanBalance(
                                  selectedSale
                                ) > 0
                                  ? 'Amount Due'
                                  : 'Fully Paid'
                              }
                              color={
                                getLoanBalance(
                                  selectedSale
                                ) > 0
                                  ? 'error'
                                  : 'success'
                              }
                            />

                          </Stack>

                        </CardContent>

                      </Card>

                    </Grid>

                  </Grid>

                </>

              )}

              <Divider sx={{ my: 3 }} />

              {/* =============================================
                  ITEMS
              ============================================= */}

              <Typography
                variant="h6"
                gutterBottom
                fontWeight={700}
              >
                Items
              </Typography>

              <TableContainer
                sx={{
                  border: '1px solid',
                  borderColor:
                    'divider',
                  borderRadius: 2,
                  overflowX: 'auto'
                }}
              >

                <Table
                  size="small"
                  sx={{
                    minWidth: 700
                  }}
                >

                  <TableHead>

                    <TableRow>

                      <TableCell>
                        Product
                      </TableCell>

                      <TableCell>
                        SKU
                      </TableCell>

                      <TableCell align="center">
                        Qty
                      </TableCell>

                      <TableCell align="right">
                        Unit Price
                      </TableCell>

                      <TableCell align="right">
                        Subtotal
                      </TableCell>

                      <TableCell align="right">
                        Profit
                      </TableCell>

                    </TableRow>

                  </TableHead>

                  <TableBody>

                    {(selectedSale.items ||
                      []).length === 0 ? (

                      <TableRow>

                        <TableCell
                          colSpan={6}
                          align="center"
                        >

                          <Typography
                            color="text.secondary"
                            sx={{
                              py: 2
                            }}
                          >
                            No item details
                            available.
                          </Typography>

                        </TableCell>

                      </TableRow>

                    ) : (

                      selectedSale.items.map(
                        (
                          item,
                          index
                        ) => (

                          <TableRow
                            key={
                              item.id ||
                              item.productId ||
                              `${item.sku}-${index}`
                            }
                          >

                            {/* PRODUCT */}

                            <TableCell>

                              <Typography
                                fontWeight={700}
                              >
                                {item.productName ||
                                  'Unnamed Product'}
                              </Typography>

                              {item.barcode && (

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Barcode:{' '}
                                  {
                                    item.barcode
                                  }
                                </Typography>

                              )}

                            </TableCell>

                            {/* SKU */}

                            <TableCell>
                              {item.sku ||
                                '-'}
                            </TableCell>

                            {/* QUANTITY */}

                            <TableCell align="center">
                              {Number(
                                item.quantity
                              ) || 0}
                            </TableCell>

                            {/* UNIT PRICE */}

                            <TableCell align="right">
                              {formatTZS(
                                item.unitPrice
                              )}
                            </TableCell>

                            {/* SUBTOTAL */}

                            <TableCell align="right">

                              <Typography
                                fontWeight={700}
                              >
                                {formatTZS(
                                  item.subtotal
                                )}
                              </Typography>

                            </TableCell>

                            {/* PROFIT */}

                            <TableCell align="right">

                              <Typography
                                color="success.main"
                                fontWeight={700}
                              >
                                {formatTZS(
                                  item.profit
                                )}
                              </Typography>

                            </TableCell>

                          </TableRow>

                        )
                      )

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
                  maxWidth: 400
                }}
              >

                <Stack spacing={1.5}>

                  {/* ITEMS */}

                  <Box
                    display="flex"
                    justifyContent="space-between"
                  >

                    <Typography>
                      Items
                    </Typography>

                    <Typography fontWeight={700}>
                      {getItemQuantity(
                        selectedSale
                      )}
                    </Typography>

                  </Box>

                  {/* SUBTOTAL */}

                  <Box
                    display="flex"
                    justifyContent="space-between"
                  >

                    <Typography>
                      Subtotal
                    </Typography>

                    <Typography>
                      {formatTZS(
                        selectedSale.subtotal
                      )}
                    </Typography>

                  </Box>

                  {/* TAX */}

                  <Box
                    display="flex"
                    justifyContent="space-between"
                  >

                    <Typography>
                      Tax
                    </Typography>

                    <Typography>
                      {formatTZS(
                        selectedSale.tax
                      )}
                    </Typography>

                  </Box>

                  <Divider />

                  {/* TOTAL */}

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >

                    <Typography variant="h6">
                      Total
                    </Typography>

                    <Typography
                      variant="h6"
                      color="primary"
                      fontWeight={700}
                    >
                      {formatTZS(
                        selectedSale.total
                      )}
                    </Typography>

                  </Box>

                  {/* CASH */}

                  {normalizePaymentMethod(
                    selectedSale.paymentMethod
                  ) === 'cash' && (

                    <>

                      <Divider />

                      <Box
                        display="flex"
                        justifyContent="space-between"
                      >

                        <Typography>
                          Cash Given
                        </Typography>

                        <Typography>
                          {formatTZS(
                            selectedSale.cashGiven
                          )}
                        </Typography>

                      </Box>

                      <Box
                        display="flex"
                        justifyContent="space-between"
                      >

                        <Typography fontWeight={700}>
                          Change
                        </Typography>

                        <Typography
                          fontWeight={700}
                          color="success.main"
                        >
                          {formatTZS(
                            selectedSale.changeAmount
                          )}
                        </Typography>

                      </Box>

                    </>

                  )}

                  {/* LOAN PAYMENT */}

                  {isLoanSale(
                    selectedSale
                  ) && (

                    <>

                      <Divider />

                      <Box
                        display="flex"
                        justifyContent="space-between"
                      >

                        <Typography>
                          Paid Now
                        </Typography>

                        <Typography
                          fontWeight={700}
                          color="success.main"
                        >
                          {formatTZS(
                            getLoanPaidNow(
                              selectedSale
                            )
                          )}
                        </Typography>

                      </Box>

                      <Box
                        display="flex"
                        justifyContent="space-between"
                      >

                        <Typography fontWeight={700}>
                          Outstanding Balance
                        </Typography>

                        <Typography
                          fontWeight={700}
                          color={
                            getLoanBalance(
                              selectedSale
                            ) > 0
                              ? 'error.main'
                              : 'success.main'
                          }
                        >
                          {formatTZS(
                            getLoanBalance(
                              selectedSale
                            )
                          )}
                        </Typography>

                      </Box>

                    </>

                  )}

                  <Divider />

                  {/* PROFIT */}

                  <Box
                    display="flex"
                    justifyContent="space-between"
                  >

                    <Typography>
                      Profit
                    </Typography>

                    <Typography
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatTZS(
                        selectedSale.totalProfit
                      )}
                    </Typography>

                  </Box>

                </Stack>

              </Box>

            </DialogContent>

            {/* DIALOG ACTIONS */}

            <DialogActions
              sx={{ p: 2 }}
            >

              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={
                  handleCloseDetails
                }
              >
                Close
              </Button>

            </DialogActions>

          </>

        )}

      </Dialog>

    </Box>
  );
}
