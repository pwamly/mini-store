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



import { getProducts,
  updateProduct,
  registerProduct } from 'api/productApi';


export default function GetProducts() {
  // =========================================================
  // STATE
  // =========================================================

  const [products, setProducts] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    lowStock: 0
  });

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');

  const [status, setStatus] = useState('');

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(20);

  const [totalPages, setTotalPages] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  // =========================================================
  // EDIT FORM
  // =========================================================

  const [editForm, setEditForm] = useState({
    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    minimumSellingPrice: ''
  });

  // =========================================================
  // CREATE FORM
  // =========================================================

  const initialCreateForm = {
    sku: '',
    itemName: '',
    productName: '',
    description: '',
    productType: '',

    brandId: '',
    categoryId: '',
    unitId: '',
    taxGroupId: '',

    flavor: '',
    size: '',
    netWeight: '',
    weightUnit: '',
    packagingType: '',
    servings: '',
    servingSize: '',

    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    minimumSellingPrice: '',

    barcode: '',
    barcodeType: 'EAN-13',

    manufacturer: '',
    countryOfOrigin: '',
    licenseNumber: '',
    mfgDate: '',
    shelfLifeMonths: '',
    allergens: '',
    storageInstructions: ''
  };

  const [createForm, setCreateForm] = useState(initialCreateForm);

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
  // FORMAT DATE
  // =========================================================

  const formatDate = (value) => {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('en-TZ', {
      dateStyle: 'medium'
    }).format(date);
  };

  // =========================================================
  // LOAD PRODUCTS
  // =========================================================

  const loadProducts = async (overrides = {}) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,

        search:
          overrides.search !== undefined
            ? overrides.search
            : search.trim() || undefined,

        status:
          overrides.status !== undefined
            ? overrides.status
            : status || undefined
      };

      console.log('GET PRODUCTS PARAMS:', params);

      const response = await getProducts(params);

      console.log('GET PRODUCTS RESPONSE:', response);

      if (!response?.successful) {
        throw new Error(
          response?.message || 'Unable to load products.'
        );
      }

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setProducts(data);

      setSummary({
        total: Number(
          response.summary?.total ??
            response.pagination?.total ??
            data.length
        ),

        active: Number(
          response.summary?.active || 0
        ),

        inactive: Number(
          response.summary?.inactive || 0
        ),

        lowStock: Number(
          response.summary?.lowStock || 0
        )
      });

      setTotalPages(
        Math.max(
          Number(response.pagination?.totalPages || 1),
          1
        )
      );
    } catch (err) {
      console.error('Load products error:', err);

      setProducts([]);

      setSummary({
        total: 0,
        active: 0,
        inactive: 0,
        lowStock: 0
      });

      setTotalPages(1);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load products.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadProducts();
  }, [page, limit, status]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = () => {
    const trimmedSearch = search.trim();

    if (page !== 1) {
      setPage(1);

      return;
    }

    loadProducts({
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
    setSearch('');
    setStatus('');

    if (page !== 1) {
      setPage(1);

      return;
    }

    loadProducts({
      page: 1,
      search: undefined,
      status: undefined
    });
  };

  // =========================================================
  // VIEW PRODUCT
  // =========================================================

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedProduct(null);
  };

  // =========================================================
  // EDIT PRODUCT
  // =========================================================

  const handleEditProduct = (product) => {
    setSelectedProduct(product);

    setEditForm({
      costPrice:
        product?.costPrice ??
        product?.details?.costPrice ??
        '',

      sellingPrice:
        product?.sellingPrice ??
        product?.details?.sellingPrice ??
        '',

      wholesalePrice:
        product?.wholesalePrice ??
        product?.details?.wholesalePrice ??
        '',

      minimumSellingPrice:
        product?.minimumSellingPrice ??
        product?.details?.minimumSellingPrice ??
        ''
    });

    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    if (saving) {
      return;
    }

    setEditOpen(false);
    setSelectedProduct(null);
  };

  const handleEditChange = (field) => (event) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: event.target.value
    }));
  };

  // =========================================================
  // SAVE PRICE EDIT
  // =========================================================

  const handleSavePrices = async () => {
    if (!selectedProduct?.id) {
      setError('Product ID is missing.');
      return;
    }

    if (
      editForm.sellingPrice === '' ||
      editForm.sellingPrice === null ||
      editForm.sellingPrice === undefined
    ) {
      setError('Selling price is required.');
      return;
    }

    if (Number.isNaN(Number(editForm.sellingPrice))) {
      setError('Selling price must be a valid number.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        costPrice:
          editForm.costPrice === ''
            ? null
            : Number(editForm.costPrice),

        sellingPrice:
          Number(editForm.sellingPrice),

        wholesalePrice:
          editForm.wholesalePrice === ''
            ? null
            : Number(editForm.wholesalePrice),

        minimumSellingPrice:
          editForm.minimumSellingPrice === ''
            ? null
            : Number(editForm.minimumSellingPrice)
      };

      console.log('UPDATE PRODUCT PRICES:', {
        productId: selectedProduct.id,
        payload
      });

      const response = await updateProduct(
        selectedProduct.id,
        payload
      );

      console.log(
        'UPDATE PRODUCT RESPONSE:',
        response
      );

      if (!response?.successful) {
        throw new Error(
          response?.message ||
            'Failed to update product prices.'
        );
      }

      setSuccess(
        'Product prices updated successfully.'
      );

      setEditOpen(false);
      setSelectedProduct(null);

      await loadProducts();
    } catch (err) {
      console.error(
        'Update product prices error:',
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update product prices.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CREATE PRODUCT
  // =========================================================

  const handleCreateChange = (field) => (event) => {
    setCreateForm((previous) => ({
      ...previous,
      [field]: event.target.value
    }));
  };

  const handleCloseCreate = () => {
    if (saving) {
      return;
    }

    setCreateOpen(false);
    setCreateForm(initialCreateForm);
  };

  const handleCreateProduct = async () => {
    if (!createForm.sku.trim()) {
      setError('SKU is required.');
      return;
    }

    if (!createForm.itemName.trim()) {
      setError('Product name is required.');
      return;
    }

    if (
      createForm.sellingPrice === '' ||
      createForm.sellingPrice === null
    ) {
      setError('Selling price is required.');
      return;
    }

    if (Number.isNaN(Number(createForm.sellingPrice))) {
      setError(
        'Selling price must be a valid number.'
      );
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...createForm,

        sku: createForm.sku.trim(),

        itemName:
          createForm.itemName.trim(),

        productName:
          createForm.productName.trim() ||
          createForm.itemName.trim(),

        description:
          createForm.description || null,

        productType:
          createForm.productType || null,

        brandId:
          createForm.brandId || null,

        categoryId:
          createForm.categoryId || null,

        unitId:
          createForm.unitId || null,

        taxGroupId:
          createForm.taxGroupId || null,

        flavor:
          createForm.flavor || null,

        size:
          createForm.size || null,

        netWeight:
          createForm.netWeight === ''
            ? null
            : Number(createForm.netWeight),

        weightUnit:
          createForm.weightUnit || null,

        packagingType:
          createForm.packagingType || null,

        servings:
          createForm.servings === ''
            ? null
            : Number(createForm.servings),

        servingSize:
          createForm.servingSize || null,

        costPrice:
          createForm.costPrice === ''
            ? 0
            : Number(createForm.costPrice),

        sellingPrice:
          Number(createForm.sellingPrice),

        wholesalePrice:
          createForm.wholesalePrice === ''
            ? null
            : Number(createForm.wholesalePrice),

        minimumSellingPrice:
          createForm.minimumSellingPrice === ''
            ? null
            : Number(
                createForm.minimumSellingPrice
              ),

        barcode:
          createForm.barcode.trim() ||
          null,

        barcodeType:
          createForm.barcodeType ||
          'EAN-13',

        manufacturer:
          createForm.manufacturer || null,

        countryOfOrigin:
          createForm.countryOfOrigin || null,

        licenseNumber:
          createForm.licenseNumber || null,

        mfgDate:
          createForm.mfgDate || null,

        shelfLifeMonths:
          createForm.shelfLifeMonths === ''
            ? null
            : Number(
                createForm.shelfLifeMonths
              ),

        allergens:
          createForm.allergens || null,

        storageInstructions:
          createForm.storageInstructions ||
          null
      };

      console.log(
        'REGISTER PRODUCT PAYLOAD:',
        payload
      );

      const response =
        await registerProduct(payload);

      console.log(
        'REGISTER PRODUCT RESPONSE:',
        response
      );

      if (!response?.successful) {
        throw new Error(
          response?.message ||
            'Failed to register product.'
        );
      }

      setSuccess(
        'Product registered successfully.'
      );

      setCreateOpen(false);
      setCreateForm(initialCreateForm);

      await loadProducts({
        page: 1
      });

      setPage(1);
    } catch (err) {
      console.error(
        'Register product error:',
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to register product.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // STATUS COLOR
  // =========================================================

  const statusColor = (value) => {
    switch (String(value || '').toLowerCase()) {
      case 'active':
        return 'success';

      case 'inactive':
        return 'default';

      case 'discontinued':
        return 'error';

      case 'pending':
        return 'warning';

      default:
        return 'default';
    }
  };

  // =========================================================
  // SAFE PRODUCT VALUES
  // =========================================================

  const getDetails = (product) => {
    return product?.details ||
      product?.productdetails ||
      {};
  };

  const getBarcode = (product) => {
    if (product?.barcode) {
      return product.barcode;
    }

    if (
      Array.isArray(product?.barcodes) &&
      product.barcodes.length
    ) {
      const primary =
        product.barcodes.find(
          (item) => item.isPrimary
        );

      return (
        primary?.barcode ||
        product.barcodes[0]?.barcode ||
        '-'
      );
    }

    return '-';
  };

  const getPrice = (product, field) => {
    const details = getDetails(product);

    return (
      product?.[field] ??
      details?.[field] ??
      0
    );
  };

  const getProductName = (product) => {
    return (
      product?.productName ||
      product?.itemName ||
      'Unnamed Product'
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
            Products
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            View and manage your products, prices and product information.
          </Typography>

        </Box>

        <Stack
          direction="row"
          spacing={1}
        >

          <Button
            variant="outlined"
            onClick={() => loadProducts()}
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

          <Button
            variant="contained"
            onClick={() => setCreateOpen(true)}
            disabled={saving}
          >
            Add Product
          </Button>

        </Stack>

      </Stack>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess('')}
        >
          {success}
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
                Total Products
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {summary.total.toLocaleString()}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

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
                Active Products
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="success.main"
                sx={{ mt: 1 }}
              >
                {summary.active.toLocaleString()}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

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
                Inactive Products
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {summary.inactive.toLocaleString()}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

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
                Low Stock
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="warning.main"
                sx={{ mt: 1 }}
              >
                {summary.lowStock.toLocaleString()}
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
              md={7}
            >

              <TextField
                fullWidth
                label="Search Products"
                placeholder="SKU, product name, barcode"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
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

            {/* STATUS */}

            <Grid
              item
              xs={12}
              sm={6}
              md={2}
            >

              <Select
                fullWidth
                displayEmpty
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >

                <MenuItem value="">
                  All Statuses
                </MenuItem>

                <MenuItem value="active">
                  Active
                </MenuItem>

                <MenuItem value="inactive">
                  Inactive
                </MenuItem>

                <MenuItem value="discontinued">
                  Discontinued
                </MenuItem>

              </Select>

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
                    Number(event.target.value)
                  );

                  setPage(1);
                }}
              >

                <MenuItem value={10}>
                  10
                </MenuItem>

                <MenuItem value={20}>
                  20
                </MenuItem>

                <MenuItem value={50}>
                  50
                </MenuItem>

                <MenuItem value={100}>
                  100
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
              >

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </Button>

                <Button
                  variant="outlined"
                  onClick={clearFilters}
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
          PRODUCT TABLE
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
                Products
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {products.length} product
                {products.length === 1
                  ? ''
                  : 's'} shown
              </Typography>

            </Box>

            {loading && (
              <CircularProgress size={24} />
            )}

          </Stack>

        </Box>

        {/* LOADING */}

        {loading && products.length === 0 ? (

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
              Loading products...
            </Typography>

          </Box>

        ) : products.length === 0 ? (

          /* EMPTY */

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
              📦
            </Box>

            <Typography
              variant="h6"
              sx={{ mt: 2 }}
            >
              No products found
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Try changing your search or filters.
            </Typography>

          </Box>

        ) : (

          /* TABLE */

          <TableContainer
            sx={{ overflowX: 'auto' }}
          >

            <Table
              sx={{ minWidth: 1200 }}
            >

              <TableHead>

                <TableRow>

                  <TableCell>
                    SKU
                  </TableCell>

                  <TableCell>
                    Product
                  </TableCell>

                  <TableCell>
                    Barcode
                  </TableCell>

                  <TableCell>
                    Type
                  </TableCell>

                  <TableCell>
                    Brand
                  </TableCell>

                  <TableCell>
                    Category
                  </TableCell>

                  <TableCell align="right">
                    Cost Price
                  </TableCell>

                  <TableCell align="right">
                    Selling Price
                  </TableCell>

                  <TableCell align="right">
                    Wholesale
                  </TableCell>

                  <TableCell>
                    Status
                  </TableCell>

                  <TableCell align="center">
                    Action
                  </TableCell>

                </TableRow>

              </TableHead>

              <TableBody>

                {products.map((product) => {

                  const details =
                    getDetails(product);

                  return (
                    <TableRow
                      key={product.id}
                      hover
                    >

                      {/* SKU */}

                      <TableCell>

                        <Typography
                          fontWeight={700}
                          sx={{
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {product.sku || '-'}
                        </Typography>

                      </TableCell>

                      {/* PRODUCT */}

                      <TableCell>

                        <Typography
                          fontWeight={700}
                        >
                          {getProductName(product)}
                        </Typography>

                        {product.itemName &&
                          product.productName &&
                          product.itemName !==
                            product.productName && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {product.itemName}
                            </Typography>
                          )}

                      </TableCell>

                      {/* BARCODE */}

                      <TableCell>
                        {getBarcode(product)}
                      </TableCell>

                      {/* TYPE */}

                      <TableCell>
                        {product.productType ||
                          '-'}
                      </TableCell>

                      {/* BRAND */}

                      <TableCell>
                        {product.brandName ||
                          product.brand?.name ||
                          '-'}
                      </TableCell>

                      {/* CATEGORY */}

                      <TableCell>
                        {product.categoryName ||
                          product.category?.name ||
                          '-'}
                      </TableCell>

                      {/* COST */}

                      <TableCell align="right">
                        {formatTZS(
                          getPrice(
                            product,
                            'costPrice'
                          )
                        )}
                      </TableCell>

                      {/* SELLING */}

                      <TableCell align="right">

                        <Typography
                          fontWeight={700}
                          color="primary"
                        >
                          {formatTZS(
                            getPrice(
                              product,
                              'sellingPrice'
                            )
                          )}
                        </Typography>

                      </TableCell>

                      {/* WHOLESALE */}

                      <TableCell align="right">
                        {formatTZS(
                          getPrice(
                            product,
                            'wholesalePrice'
                          )
                        )}
                      </TableCell>

                      {/* STATUS */}

                      <TableCell>

                        <Chip
                          size="small"
                          label={
                            product.status ||
                            'unknown'
                          }
                          color={statusColor(
                            product.status
                          )}
                        />

                      </TableCell>

                      {/* ACTION */}

                      <TableCell align="center">

                        <Stack
                          direction="row"
                          justifyContent="center"
                          spacing={0.5}
                        >

                          <IconButton
                            color="primary"
                            onClick={() =>
                              handleViewProduct(
                                product
                              )
                            }
                            title="View product"
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

                          <IconButton
                            color="primary"
                            onClick={() =>
                              handleEditProduct(
                                product
                              )
                            }
                            title="Edit prices"
                          >
                            <Box
                              component="span"
                              sx={{
                                fontSize:
                                  '1.25rem',
                                lineHeight: 1
                              }}
                            >
                              ✎
                            </Box>
                          </IconButton>

                        </Stack>

                      </TableCell>

                    </TableRow>
                  );
                })}

              </TableBody>

            </Table>

          </TableContainer>

        )}

        {/* PAGINATION */}

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
          PRODUCT DETAILS
      ===================================================== */}

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        fullWidth
        maxWidth="md"
      >

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
                Product Details
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {selectedProduct?.sku || '-'}
              </Typography>

            </Box>

            {selectedProduct && (
              <Chip
                label={
                  selectedProduct.status ||
                  'unknown'
                }
                color={statusColor(
                  selectedProduct.status
                )}
              />
            )}

          </Stack>

        </DialogTitle>

        {selectedProduct && (

          <>

            <DialogContent dividers>

              {/* BASIC INFORMATION */}

              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                Basic Information
              </Typography>

              <Grid
                container
                spacing={2}
              >

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    SKU
                  </Typography>

                  <Typography fontWeight={700}>
                    {selectedProduct.sku ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Item Name
                  </Typography>

                  <Typography fontWeight={700}>
                    {selectedProduct.itemName ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Product Name
                  </Typography>

                  <Typography fontWeight={700}>
                    {selectedProduct.productName ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Product Type
                  </Typography>

                  <Typography fontWeight={700}>
                    {selectedProduct.productType ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Description
                  </Typography>

                  <Typography>
                    {selectedProduct.description ||
                      '-'}
                  </Typography>

                </Grid>

              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* PRICES */}

              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                Pricing
              </Typography>

              <Grid
                container
                spacing={2}
              >

                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Cost Price
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    {formatTZS(
                      getPrice(
                        selectedProduct,
                        'costPrice'
                      )
                    )}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Selling Price
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="primary"
                  >
                    {formatTZS(
                      getPrice(
                        selectedProduct,
                        'sellingPrice'
                      )
                    )}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Wholesale Price
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    {formatTZS(
                      getPrice(
                        selectedProduct,
                        'wholesalePrice'
                      )
                    )}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={3}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Minimum Selling
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    {formatTZS(
                      getPrice(
                        selectedProduct,
                        'minimumSellingPrice'
                      )
                    )}
                  </Typography>

                </Grid>

              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* PRODUCT DETAILS */}

              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                Product Details
              </Typography>

              <Grid
                container
                spacing={2}
              >

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Barcode
                  </Typography>

                  <Typography fontWeight={700}>
                    {getBarcode(
                      selectedProduct
                    )}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Flavor
                  </Typography>

                  <Typography>
                    {getDetails(
                      selectedProduct
                    ).flavor || '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Size
                  </Typography>

                  <Typography>
                    {getDetails(
                      selectedProduct
                    ).size || '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Net Weight
                  </Typography>

                  <Typography>
                    {getDetails(
                      selectedProduct
                    ).netWeight || '-'}{' '}
                    {getDetails(
                      selectedProduct
                    ).weightUnit || ''}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Packaging
                  </Typography>

                  <Typography>
                    {getDetails(
                      selectedProduct
                    ).packagingType || '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Servings
                  </Typography>

                  <Typography>
                    {getDetails(
                      selectedProduct
                    ).servings || '-'}
                  </Typography>

                </Grid>

              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* REGULATORY */}

              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                Regulatory Information
              </Typography>

              <Grid
                container
                spacing={2}
              >

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Manufacturer
                  </Typography>

                  <Typography>
                    {selectedProduct.manufacturer ||
                      selectedProduct.regulatory
                        ?.manufacturer ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Country of Origin
                  </Typography>

                  <Typography>
                    {selectedProduct.countryOfOrigin ||
                      selectedProduct.regulatory
                        ?.countryOfOrigin ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    License Number
                  </Typography>

                  <Typography>
                    {selectedProduct.licenseNumber ||
                      selectedProduct.regulatory
                        ?.licenseNumber ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Manufacturing Date
                  </Typography>

                  <Typography>
                    {formatDate(
                      selectedProduct.mfgDate ||
                        selectedProduct
                          .regulatory?.mfgDate
                    )}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={6}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Shelf Life
                  </Typography>

                  <Typography>
                    {selectedProduct.shelfLifeMonths ||
                      selectedProduct.regulatory
                        ?.shelfLifeMonths ||
                      '-'}{' '}
                    months
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Allergens
                  </Typography>

                  <Typography>
                    {selectedProduct.allergens ||
                      selectedProduct.regulatory
                        ?.allergens ||
                      '-'}
                  </Typography>

                </Grid>

                <Grid
                  item
                  xs={12}
                >

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Storage Instructions
                  </Typography>

                  <Typography>
                    {selectedProduct.storageInstructions ||
                      selectedProduct.regulatory
                        ?.storageInstructions ||
                      '-'}
                  </Typography>

                </Grid>

              </Grid>

            </DialogContent>

            <DialogActions sx={{ p: 2 }}>

              <Button
                variant="outlined"
                onClick={handleCloseDetails}
              >
                Close
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  handleCloseDetails();
                  handleEditProduct(
                    selectedProduct
                  );
                }}
              >
                Edit Prices
              </Button>

            </DialogActions>

          </>

        )}

      </Dialog>

      {/* =====================================================
          EDIT PRICES DIALOG
      ===================================================== */}

      <Dialog
        open={editOpen}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle>

          <Typography
            variant="h6"
            fontWeight={700}
          >
            Edit Product Prices
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            {selectedProduct?.sku || '-'} —{' '}
            {getProductName(
              selectedProduct
            )}
          </Typography>

        </DialogTitle>

        <DialogContent dividers>

          <Stack spacing={2.5} sx={{ pt: 1 }}>

            <TextField
              fullWidth
              label="Cost Price"
              type="number"
              value={editForm.costPrice}
              onChange={handleEditChange(
                'costPrice'
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    TZS
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              required
              label="Selling Price"
              type="number"
              value={editForm.sellingPrice}
              onChange={handleEditChange(
                'sellingPrice'
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    TZS
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Wholesale Price"
              type="number"
              value={editForm.wholesalePrice}
              onChange={handleEditChange(
                'wholesalePrice'
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    TZS
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Minimum Selling Price"
              type="number"
              value={
                editForm.minimumSellingPrice
              }
              onChange={handleEditChange(
                'minimumSellingPrice'
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    TZS
                  </InputAdornment>
                )
              }}
            />

          </Stack>

        </DialogContent>

        <DialogActions sx={{ p: 2 }}>

          <Button
            variant="outlined"
            onClick={handleCloseEdit}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSavePrices}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress
                  size={20}
                  sx={{ mr: 1 }}
                />
                Saving...
              </>
            ) : (
              'Save Prices'
            )}
          </Button>

        </DialogActions>

      </Dialog>

      {/* =====================================================
          CREATE PRODUCT DIALOG
      ===================================================== */}

      <Dialog
        open={createOpen}
        onClose={handleCloseCreate}
        fullWidth
        maxWidth="md"
      >

        <DialogTitle>

          <Typography
            variant="h6"
            fontWeight={700}
          >
            Register Product
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Enter the product information below.
          </Typography>

        </DialogTitle>

        <DialogContent dividers>

          {/* BASIC */}

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Basic Information
          </Typography>

          <Grid
            container
            spacing={2}
          >

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                required
                label="SKU"
                value={createForm.sku}
                onChange={handleCreateChange(
                  'sku'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                required
                label="Item Name"
                value={createForm.itemName}
                onChange={handleCreateChange(
                  'itemName'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Product Name"
                value={createForm.productName}
                onChange={handleCreateChange(
                  'productName'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Product Type"
                value={createForm.productType}
                onChange={handleCreateChange(
                  'productType'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
            >

              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={createForm.description}
                onChange={handleCreateChange(
                  'description'
                )}
              />

            </Grid>

          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* PRICING */}

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Pricing
          </Typography>

          <Grid
            container
            spacing={2}
          >

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Cost Price"
                type="number"
                value={createForm.costPrice}
                onChange={handleCreateChange(
                  'costPrice'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                required
                label="Selling Price"
                type="number"
                value={createForm.sellingPrice}
                onChange={handleCreateChange(
                  'sellingPrice'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Wholesale Price"
                type="number"
                value={
                  createForm.wholesalePrice
                }
                onChange={handleCreateChange(
                  'wholesalePrice'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Minimum Selling Price"
                type="number"
                value={
                  createForm.minimumSellingPrice
                }
                onChange={handleCreateChange(
                  'minimumSellingPrice'
                )}
              />

            </Grid>

          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* PRODUCT DETAILS */}

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Product Details
          </Typography>

          <Grid
            container
            spacing={2}
          >

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Flavor"
                value={createForm.flavor}
                onChange={handleCreateChange(
                  'flavor'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Size"
                value={createForm.size}
                onChange={handleCreateChange(
                  'size'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Net Weight"
                type="number"
                value={createForm.netWeight}
                onChange={handleCreateChange(
                  'netWeight'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Weight Unit"
                placeholder="kg, g, ml, L"
                value={
                  createForm.weightUnit
                }
                onChange={handleCreateChange(
                  'weightUnit'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Packaging Type"
                value={
                  createForm.packagingType
                }
                onChange={handleCreateChange(
                  'packagingType'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Servings"
                type="number"
                value={createForm.servings}
                onChange={handleCreateChange(
                  'servings'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
            >

              <TextField
                fullWidth
                label="Serving Size"
                value={
                  createForm.servingSize
                }
                onChange={handleCreateChange(
                  'servingSize'
                )}
              />

            </Grid>

          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* BARCODE */}

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Barcode
          </Typography>

          <Grid
            container
            spacing={2}
          >

            <Grid
              item
              xs={12}
              sm={8}
            >

              <TextField
                fullWidth
                label="Barcode"
                value={createForm.barcode}
                onChange={handleCreateChange(
                  'barcode'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={4}
            >

              <Select
                fullWidth
                value={
                  createForm.barcodeType
                }
                onChange={handleCreateChange(
                  'barcodeType'
                )}
              >

                <MenuItem value="EAN-13">
                  EAN-13
                </MenuItem>

                <MenuItem value="EAN-8">
                  EAN-8
                </MenuItem>

                <MenuItem value="UPC-A">
                  UPC-A
                </MenuItem>

                <MenuItem value="CODE-128">
                  CODE-128
                </MenuItem>

                <MenuItem value="OTHER">
                  Other
                </MenuItem>

              </Select>

            </Grid>

          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* REGULATORY */}

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Regulatory Information
          </Typography>

          <Grid
            container
            spacing={2}
          >

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Manufacturer"
                value={
                  createForm.manufacturer
                }
                onChange={handleCreateChange(
                  'manufacturer'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Country of Origin"
                value={
                  createForm.countryOfOrigin
                }
                onChange={handleCreateChange(
                  'countryOfOrigin'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="License Number"
                value={
                  createForm.licenseNumber
                }
                onChange={handleCreateChange(
                  'licenseNumber'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                type="date"
                label="Manufacturing Date"
                value={createForm.mfgDate}
                onChange={handleCreateChange(
                  'mfgDate'
                )}
                InputLabelProps={{
                  shrink: true
                }}
              />

            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                type="number"
                label="Shelf Life (Months)"
                value={
                  createForm.shelfLifeMonths
                }
                onChange={handleCreateChange(
                  'shelfLifeMonths'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
            >

              <TextField
                fullWidth
                label="Allergens"
                value={
                  createForm.allergens
                }
                onChange={handleCreateChange(
                  'allergens'
                )}
              />

            </Grid>

            <Grid
              item
              xs={12}
            >

              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Storage Instructions"
                value={
                  createForm.storageInstructions
                }
                onChange={handleCreateChange(
                  'storageInstructions'
                )}
              />

            </Grid>

          </Grid>

        </DialogContent>

        <DialogActions sx={{ p: 2 }}>

          <Button
            variant="outlined"
            onClick={handleCloseCreate}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateProduct}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress
                  size={20}
                  sx={{ mr: 1 }}
                />
                Saving...
              </>
            ) : (
              'Register Product'
            )}
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}
