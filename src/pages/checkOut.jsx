'use strict';

import { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  List,
  ListItem,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import MainCard from 'components/MainCard';

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats
} from 'html5-qrcode';

import {
  getProducts,
  searchProducts
} from 'api/productApi';

export default function CheckOut() {
  // =========================================================
  // STATE
  // =========================================================

  const [cartItems, setCartItems] = useState([]);

  const [products, setProducts] = useState([]);

  const [productSearch, setProductSearch] = useState('');

  const [productsLoading, setProductsLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [cashGiven, setCashGiven] = useState('');

  const [scannerOpen, setScannerOpen] = useState(false);

  const [scannerLoading, setScannerLoading] = useState(false);

  const [loadingProduct, setLoadingProduct] = useState(false);

  const [error, setError] = useState('');

  const [scannerError, setScannerError] = useState('');

  // =========================================================
  // REFS
  // =========================================================

  const productSearchRef = useRef(null);

  const scannerRef = useRef(null);

  const scanProcessingRef = useRef(false);

  const scannerStartingRef = useRef(false);

  // Search debounce timer
  const searchTimerRef = useRef(null);

  // Prevent old API responses from replacing newer results
  const searchRequestRef = useRef(0);

  // =========================================================
  // TZS
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
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadProducts();

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }

      stopScanner();
    };
  }, []);

  // =========================================================
  // AUTO FOCUS
  // =========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      productSearchRef.current?.focus();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // =========================================================
  // LOAD INITIAL PRODUCTS
  // =========================================================

  const loadProducts = async () => {
    setProductsLoading(true);

    try {
      const response = await getProducts();

      console.log(
        'GET PRODUCTS RESPONSE:',
        response
      );

      if (
        response?.successful &&
        Array.isArray(response.data)
      ) {
        setProducts(response.data);
        setError('');
      } else {
        setProducts([]);

        setError(
          response?.message ||
            'Unable to load products.'
        );
      }
    } catch (err) {
      console.error(
        'Load products error:',
        err
      );

      setProducts([]);

      setError(
        err?.message ||
          'Failed to load products.'
      );
    } finally {
      setProductsLoading(false);
    }
  };

  // =========================================================
  // SEARCH PRODUCTS FROM API
  // =========================================================

  const searchProductsFromApi = async (searchValue) => {
    const search = String(
      searchValue || ''
    ).trim();

    // -------------------------------------------------------
    // EMPTY SEARCH
    // -------------------------------------------------------

    if (!search) {
      const requestId =
        ++searchRequestRef.current;

      setProductsLoading(true);
      setError('');

      try {
        const response =
          await getProducts();

        // Ignore old response
        if (
          requestId !==
          searchRequestRef.current
        ) {
          return;
        }

        if (
          response?.successful &&
          Array.isArray(response.data)
        ) {
          setProducts(
            response.data
          );
        } else {
          setProducts([]);

          setError(
            response?.message ||
              'Unable to load products.'
          );
        }
      } catch (err) {
        if (
          requestId !==
          searchRequestRef.current
        ) {
          return;
        }

        console.error(
          'Load products error:',
          err
        );

        setProducts([]);

        setError(
          err?.message ||
            'Failed to load products.'
        );
      } finally {
        if (
          requestId ===
          searchRequestRef.current
        ) {
          setProductsLoading(
            false
          );
        }
      }

      return;
    }

    // -------------------------------------------------------
    // NEW SEARCH REQUEST
    // -------------------------------------------------------

    const requestId =
      ++searchRequestRef.current;

    setProductsLoading(true);

    setError('');

    try {
      console.log(
        'SEARCHING PRODUCTS:',
        search
      );

      const response =
        await searchProducts(search);

      console.log(
        'SEARCH PRODUCTS RESPONSE:',
        response
      );

      // -----------------------------------------------------
      // IGNORE OLD RESPONSE
      // -----------------------------------------------------

      if (
        requestId !==
        searchRequestRef.current
      ) {
        return;
      }

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      if (
        response?.successful &&
        Array.isArray(response.data)
      ) {
        setProducts(
          response.data
        );
      } else {
        setProducts([]);

        setError(
          response?.message ||
            'Unable to search products.'
        );
      }
    } catch (err) {
      // -----------------------------------------------------
      // IGNORE OLD RESPONSE
      // -----------------------------------------------------

      if (
        requestId !==
        searchRequestRef.current
      ) {
        return;
      }

      console.error(
        'Search products error:',
        err
      );

      setProducts([]);

      setError(
        err?.message ||
          'Failed to search products.'
      );
    } finally {
      if (
        requestId ===
        searchRequestRef.current
      ) {
        setProductsLoading(false);
      }
    }
  };

  // =========================================================
  // SEARCH INPUT CHANGE
  // =========================================================
  //
  // IMPORTANT:
  //
  // setProductSearch() happens immediately.
  //
  // The API call happens separately after 400ms.
  //
  // This prevents the API from blocking normal typing.
  // =========================================================

  const handleProductSearchChange = (
    event
  ) => {
    const value =
      event.target.value;

    // -------------------------------------------------------
    // UPDATE INPUT IMMEDIATELY
    // -------------------------------------------------------

    setProductSearch(value);

    // -------------------------------------------------------
    // CANCEL PREVIOUS SEARCH TIMER
    // -------------------------------------------------------

    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current
      );
    }

    // Clear old errors while typing
    setError('');

    // -------------------------------------------------------
    // EMPTY SEARCH
    // -------------------------------------------------------

    if (!value.trim()) {
      // Invalidate any running search
      searchRequestRef.current += 1;

      searchTimerRef.current =
        setTimeout(() => {
          searchProductsFromApi(
            ''
          );
        }, 150);

      return;
    }

    // -------------------------------------------------------
    // DEBOUNCED SEARCH
    // -------------------------------------------------------

    searchTimerRef.current =
      setTimeout(() => {
        searchProductsFromApi(
          value
        );
      }, 400);
  };

  // =========================================================
  // CREATE CART PRODUCT
  // =========================================================

  const createCartProduct = (
    product
  ) => {
    const primaryBarcode =
      product.barcodes?.find(
        (item) =>
          item.isPrimary === true
      ) ||
      product.barcodes?.[0];

    return {
      id: product.id,

      sku: product.sku,

      name:
        product.itemName ||
        product.productName ||
        'Unnamed Product',

      productName:
        product.productName || '',

      description:
        product.description || '',

      productType:
        product.productType || '',

      brand:
        product.brand?.name || '',

      brandId:
        product.brandId,

      variant:
        product.details?.flavor || '',

      category:
        product.category?.name || '',

      categoryId:
        product.categoryId,

      weight:
        product.details?.netWeight
          ? `${product.details.netWeight}${
              product.details.weightUnit ||
              ''
            }`
          : '',

      unit:
        product.unit?.name || '',

      unitId:
        product.unitId,

      price: Number(
        product.details
          ?.sellingPrice || 0
      ),

      costPrice: Number(
        product.details
          ?.costPrice || 0
      ),

      wholesalePrice: Number(
        product.details
          ?.wholesalePrice || 0
      ),

      minimumSellingPrice: Number(
        product.details
          ?.minimumSellingPrice || 0
      ),

      barcode:
        primaryBarcode?.barcode || '',

      barcodeType:
        primaryBarcode?.barcodeType ||
        '',

      taxGroupId:
        product.taxGroupId,

      taxGroup:
        product.taxGroup?.name || '',

      status:
        product.status,

      details:
        product.details,

      originalProduct:
        product,

      qty: 1
    };
  };

  // =========================================================
  // SELECT PRODUCT
  // =========================================================

  const handleProductSelect = (
    product
  ) => {
    setError('');

    const cartProduct =
      createCartProduct(product);

    if (
      cartProduct.price <= 0
    ) {
      setError(
        `${cartProduct.name} does not have a valid selling price.`
      );

      return;
    }

    addToCart(cartProduct);

    // Clear search
    setProductSearch('');

    // Cancel pending search
    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current
      );
    }

    // Invalidate previous API requests
    searchRequestRef.current += 1;

    // Load normal products again
    searchProductsFromApi('');

    setTimeout(() => {
      productSearchRef.current?.focus();
    }, 100);
  };

  // =========================================================
  // BARCODE SCANNER SEARCH
  // =========================================================

  const scanProduct = async (
    code
  ) => {
    const cleanCode =
      String(code).trim();

    if (!cleanCode) {
      return;
    }

    setError('');

    setLoadingProduct(true);

    try {
      const response =
        await searchProducts(
          cleanCode
        );

      console.log(
        'PRODUCT SEARCH RESPONSE:',
        response
      );

      if (
        !response?.successful ||
        !Array.isArray(
          response.data
        ) ||
        response.data.length === 0
      ) {
        setError(
          `No product found for "${cleanCode}".`
        );

        return;
      }

      const product =
        response.data[0];

      const cartProduct =
        createCartProduct(
          product
        );

      if (
        cartProduct.price <= 0
      ) {
        setError(
          `${cartProduct.name} does not have a valid selling price.`
        );

        return;
      }

      addToCart(cartProduct);
    } catch (lookupError) {
      console.error(
        'Product lookup error:',
        lookupError
      );

      setError(
        lookupError?.message ||
          'Failed to fetch product.'
      );
    } finally {
      setLoadingProduct(false);

      setTimeout(() => {
        productSearchRef.current?.focus();
      }, 100);
    }
  };

  // =========================================================
  // ADD TO CART
  // =========================================================

  const addToCart = (
    product
  ) => {
    setCartItems(
      (currentItems) => {
        const existing =
          currentItems.find(
            (item) =>
              String(item.id) ===
              String(product.id)
          );

        if (existing) {
          return currentItems.map(
            (item) => {
              if (
                String(item.id) !==
                String(product.id)
              ) {
                return item;
              }

              return {
                ...item,

                qty:
                  Number(item.qty) +
                  1
              };
            }
          );
        }

        return [
          ...currentItems,

          {
            ...product,
            qty: 1
          }
        ];
      }
    );
  };

  // =========================================================
  // QUANTITY
  // =========================================================

  const increaseQuantity = (
    id
  ) => {
    setCartItems(
      (items) =>
        items.map((item) =>
          String(item.id) ===
          String(id)
            ? {
                ...item,

                qty:
                  Number(item.qty) +
                  1
              }
            : item
        )
    );
  };

  const decreaseQuantity = (
    id
  ) => {
    setCartItems(
      (items) =>
        items
          .map((item) =>
            String(item.id) ===
            String(id)
              ? {
                  ...item,

                  qty:
                    Number(item.qty) -
                    1
                }
              : item
          )
          .filter(
            (item) =>
              Number(item.qty) > 0
          )
    );
  };

  const removeItem = (
    id
  ) => {
    setCartItems(
      (items) =>
        items.filter(
          (item) =>
            String(item.id) !==
            String(id)
        )
    );
  };

  // =========================================================
  // CLEAR CART
  // =========================================================

  const clearCart = () => {
    setCartItems([]);

    setProductSearch('');

    setCustomerName('');

    setPaymentMethod('cash');

    setCashGiven('');

    setError('');

    // Cancel pending search
    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current
      );
    }

    // Invalidate running search
    searchRequestRef.current += 1;

    // Reload normal products
    searchProductsFromApi('');

    setTimeout(() => {
      productSearchRef.current?.focus();
    }, 200);
  };

  // =========================================================
  // TOTALS
  // =========================================================

  const subtotal =
    cartItems.reduce(
      (sum, item) =>
        sum +
        Number(item.qty) *
          Number(item.price),
      0
    );

  const tax = 0;

  const total =
    subtotal + tax;

  // =========================================================
  // CASH
  // =========================================================

  const cashAmount =
    Number(cashGiven) || 0;

  const insufficientCash =
    paymentMethod === 'cash' &&
    cashGiven !== '' &&
    cashAmount < total;

  const change =
    paymentMethod === 'cash'
      ? Math.max(
          cashAmount - total,
          0
        )
      : 0;

  // =========================================================
  // OPEN SCANNER
  // =========================================================

  const handleOpenScanner = () => {
    setScannerError('');

    scanProcessingRef.current =
      false;

    setScannerOpen(true);
  };

  // =========================================================
  // START SCANNER EFFECT
  // =========================================================

  useEffect(() => {
    if (!scannerOpen) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      await new Promise(
        (resolve) => {
          requestAnimationFrame(
            () => {
              requestAnimationFrame(
                resolve
              );
            }
          );
        }
      );

      if (cancelled) {
        return;
      }

      await startScanner();
    };

    start();

    return () => {
      cancelled = true;
    };
  }, [scannerOpen]);

  // =========================================================
  // START SCANNER
  // =========================================================

  const startScanner = async () => {
    if (
      scannerStartingRef.current
    ) {
      return;
    }

    scannerStartingRef.current =
      true;

    try {
      setScannerLoading(true);

      setScannerError('');

      if (!window.isSecureContext) {
        throw new Error(
          'Camera requires HTTPS. Open this POS using HTTPS, not HTTP.'
        );
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        throw new Error(
          'This browser does not support camera access.'
        );
      }

      const reader =
        document.getElementById(
          'barcode-reader'
        );

      if (!reader) {
        throw new Error(
          'Barcode scanner element was not found.'
        );
      }

      if (scannerRef.current) {
        try {
          if (
            scannerRef.current
              .isScanning
          ) {
            await scannerRef.current.stop();
          }
        } catch (stopError) {
          console.log(
            'Previous scanner stop:',
            stopError
          );
        }

        try {
          await scannerRef.current.clear();
        } catch (clearError) {
          console.log(
            'Previous scanner clear:',
            clearError
          );
        }

        scannerRef.current =
          null;
      }

      const scanner =
        new Html5Qrcode(
          'barcode-reader'
        );

      scannerRef.current =
        scanner;

      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,

        Html5QrcodeSupportedFormats.EAN_8,

        Html5QrcodeSupportedFormats.UPC_A,

        Html5QrcodeSupportedFormats.UPC_E,

        Html5QrcodeSupportedFormats.CODE_128,

        Html5QrcodeSupportedFormats.CODE_39,

        Html5QrcodeSupportedFormats.CODE_93,

        Html5QrcodeSupportedFormats.ITF
      ];

      const config = {
        fps: 10,

        qrbox: {
          width: 280,
          height: 140
        },

        disableFlip: false,

        formatsToSupport:
          formats
      };

      const onScanSuccess = async (
        decodedText,
        decodedResult
      ) => {
        if (
          scanProcessingRef.current
        ) {
          return;
        }

        scanProcessingRef.current =
          true;

        console.log(
          'BARCODE DETECTED:',
          decodedText
        );

        console.log(
          'FORMAT:',
          decodedResult?.result?.format
            ?.formatName
        );

        try {
          await stopScanner();

          setScannerOpen(false);

          await scanProduct(
            decodedText
          );
        } catch (scanError) {
          console.error(
            'Barcode processing error:',
            scanError
          );

          setScannerError(
            scanError?.message ||
              'Failed to process barcode.'
          );
        } finally {
          scanProcessingRef.current =
            false;
        }
      };

      const onScanFailure = () => {
        // Normal scanner behaviour.
      };

      await scanner.start(
        {
          facingMode:
            'environment'
        },

        config,

        onScanSuccess,

        onScanFailure
      );

      const video =
        document.querySelector(
          '#barcode-reader video'
        );

      if (video) {
        video.setAttribute(
          'playsinline',
          'true'
        );

        video.setAttribute(
          'webkit-playsinline',
          'true'
        );

        video.muted = true;

        console.log(
          'iPhone camera video:',
          video.videoWidth,
          'x',
          video.videoHeight
        );
      }

      setScannerLoading(false);
    } catch (cameraError) {
      console.error(
        'FULL CAMERA ERROR:',
        cameraError
      );

      setScannerLoading(false);

      let message =
        'Unable to start camera.';

      if (
        cameraError?.name ===
        'NotAllowedError'
      ) {
        message =
          'Camera permission was denied. On iPhone, go to Settings → Safari → Camera and allow this website.';
      } else if (
        cameraError?.name ===
        'NotFoundError'
      ) {
        message =
          'No camera was found on this device.';
      } else if (
        cameraError?.name ===
        'NotReadableError'
      ) {
        message =
          'The camera could not be opened. Close other apps using the camera and try again.';
      } else if (
        cameraError?.name ===
        'OverconstrainedError'
      ) {
        message =
          'The requested camera is not available. Trying the iPhone camera again may fix this.';
      } else if (
        cameraError?.name ===
        'SecurityError'
      ) {
        message =
          'Safari blocked camera access. Make sure this page is loaded using HTTPS.';
      } else if (
        cameraError?.message
      ) {
        message =
          cameraError.message;
      }

      setScannerError(message);

      try {
        if (
          scannerRef.current
            ?.isScanning
        ) {
          await scannerRef.current.stop();
        }
      } catch (stopError) {
        console.log(
          'Failed scanner stop:',
          stopError
        );
      }

      try {
        if (scannerRef.current) {
          await scannerRef.current.clear();
        }
      } catch (clearError) {
        console.log(
          'Failed scanner clear:',
          clearError
        );
      }

      scannerRef.current =
        null;
    } finally {
      scannerStartingRef.current =
        false;
    }
  };

  // =========================================================
  // STOP SCANNER
  // =========================================================

  const stopScanner = async () => {
    const scanner =
      scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch (stopError) {
      console.error(
        'Scanner stop error:',
        stopError
      );
    }

    try {
      await scanner.clear();
    } catch (clearError) {
      console.error(
        'Scanner clear error:',
        clearError
      );
    }

    scannerRef.current =
      null;

    scannerStartingRef.current =
      false;
  };

  // =========================================================
  // CLOSE SCANNER
  // =========================================================

  const handleCloseScanner =
    async () => {
      await stopScanner();

      setScannerOpen(false);

      setScannerLoading(false);

      setScannerError('');

      scanProcessingRef.current =
        false;

      setTimeout(() => {
        productSearchRef.current?.focus();
      }, 300);
    };

  // =========================================================
  // COMPLETE SALE
  // =========================================================

  const completeSale =
    async () => {
      setError('');

      if (
        cartItems.length === 0
      ) {
        setError(
          'Please add at least one product.'
        );

        return;
      }

      if (
        paymentMethod === 'cash'
      ) {
        if (
          cashGiven === ''
        ) {
          setError(
            'Please enter the total cash given by the customer.'
          );

          return;
        }

        if (
          cashAmount < total
        ) {
          setError(
            `Insufficient cash. Customer still needs ${formatTZS(
              total - cashAmount
            )}.`
          );

          return;
        }
      }

      const sale = {
        customerName,

        paymentMethod,

        items: cartItems.map(
          (item) => ({
            productId: item.id,

            sku: item.sku,

            barcode: item.barcode,

            quantity:
              Number(item.qty),

            unitPrice:
              Number(item.price),

            total:
              Number(item.qty) *
              Number(item.price)
          })
        ),

        subtotal,

        tax,

        total,

        cashGiven:
          paymentMethod ===
          'cash'
            ? cashAmount
            : null,

        change:
          paymentMethod ===
          'cash'
            ? change
            : 0,

        createdAt:
          new Date().toISOString()
      };

      console.log(
        'SALE:',
        sale
      );

      let message = '';

      if (
        paymentMethod ===
        'cash'
      ) {
        message =
          `SALE COMPLETED\n\n` +
          `Total: ${formatTZS(
            total
          )}\n` +
          `Cash Given: ${formatTZS(
            cashAmount
          )}\n` +
          `Change: ${formatTZS(
            change
          )}`;
      } else {
        message =
          `SALE COMPLETED\n\n` +
          `Total: ${formatTZS(
            total
          )}`;
      }

      alert(message);

      clearCart();
    };

  // =========================================================
  // PRINT
  // =========================================================

  const printReceipt = () => {
    window.print();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <MainCard title="POS Checkout">
      <Grid container spacing={3}>
        {/* ===================================================
            PRODUCT SEARCH
        =================================================== */}

        <Grid item xs={12}>
          <Box
            sx={{
              p: {
                xs: 2,
                sm: 3
              },

              border: '1px solid',

              borderColor:
                'divider',

              borderRadius: 2
            }}
          >
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
              spacing={1}
              sx={{
                mb: 2
              }}
            >
              <Box>
                <Typography variant="h6">
                  Add Product
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Search and select a
                  product or scan a
                  barcode.
                </Typography>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {products.length}{' '}
                product
                {products.length ===
                1
                  ? ''
                  : 's'}
              </Typography>
            </Stack>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2
                }}
                onClose={() =>
                  setError('')
                }
              >
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              {/* SEARCH */}

              <TextField
                inputRef={
                  productSearchRef
                }
                label="Search Products"
                placeholder="Search by product name, SKU or barcode"
                value={
                  productSearch
                }
                onChange={
                  handleProductSearchChange
                }
                fullWidth
                autoFocus
                disabled={
                  loadingProduct
                }
                slotProps={{
                  htmlInput: {
                    inputMode:
                      'search',

                    enterKeyHint:
                      'search',

                    autoCapitalize:
                      'none',

                    autoCorrect:
                      'off',

                    spellCheck:
                      false
                  }
                }}
              />

              {/* PRODUCT LIST */}

              <Box
                sx={{
                  border:
                    '1px solid',

                  borderColor:
                    'divider',

                  borderRadius: 2,

                  overflow:
                    'hidden'
                }}
              >
                <Box
                  sx={{
                    maxHeight: {
                      xs: 420,
                      sm: 500
                    },

                    overflowY:
                      'auto'
                  }}
                >
                  {productsLoading ? (
                    <Box
                      sx={{
                        py: 6,
                        px: 2,
                        textAlign:
                          'center'
                      }}
                    >
                      <Typography color="text.secondary">
                        {productSearch.trim()
                          ? 'Searching products...'
                          : 'Loading products...'}
                      </Typography>
                    </Box>
                  ) : products.length ===
                    0 ? (
                    <Box
                      sx={{
                        py: 6,
                        px: 2,
                        textAlign:
                          'center'
                      }}
                    >
                      <Typography color="text.secondary">
                        {productSearch.trim()
                          ? 'No matching products found.'
                          : 'No products available.'}
                      </Typography>

                      {productSearch.trim() && (
                        <Button
                          size="small"
                          sx={{
                            mt: 1
                          }}
                          onClick={() =>
                            handleProductSearchChange(
                              {
                                target: {
                                  value:
                                    ''
                                }
                              }
                            )
                          }
                        >
                          Show All Products
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <List disablePadding>
                      {products.map(
                        (
                          product
                        ) => {
                          const primaryBarcode =
                            product.barcodes?.find(
                              (
                                item
                              ) =>
                                item.isPrimary ===
                                true
                            ) ||
                            product.barcodes?.[0];

                          const price =
                            Number(
                              product
                                .details
                                ?.sellingPrice ||
                                0
                            );

                          const brand =
                            product
                              .brand
                              ?.name ||
                            '';

                          const category =
                            product
                              .category
                              ?.name ||
                            '';

                          return (
                            <ListItem
                              key={
                                product.id
                              }
                              divider
                              disableGutters
                              onClick={() =>
                                handleProductSelect(
                                  product
                                )
                              }
                              sx={{
                                px: 2,
                                py: 1.5,

                                cursor:
                                  price >
                                  0
                                    ? 'pointer'
                                    : 'not-allowed',

                                opacity:
                                  price >
                                  0
                                    ? 1
                                    : 0.6,

                                transition:
                                  'background-color 0.15s',

                                '&:hover':
                                  price >
                                  0
                                    ? {
                                        backgroundColor:
                                          'action.hover'
                                      }
                                    : {}
                              }}
                            >
                              <Box
                                sx={{
                                  flex: 1,
                                  minWidth: 0
                                }}
                              >
                                <Typography
                                  fontWeight="bold"
                                  sx={{
                                    wordBreak:
                                      'break-word'
                                  }}
                                >
                                  {product.itemName ||
                                    product.productName ||
                                    'Unnamed Product'}
                                </Typography>

                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                  sx={{
                                    mt: 0.25
                                  }}
                                >
                                  {brand && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {
                                        brand
                                      }
                                    </Typography>
                                  )}

                                  {category && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      •{' '}
                                      {
                                        category
                                      }
                                    </Typography>
                                  )}
                                </Stack>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{
                                    mt: 0.5,
                                    wordBreak:
                                      'break-all'
                                  }}
                                >
                                  SKU:{' '}
                                  {product.sku ||
                                    '-'}
                                </Typography>

                                {primaryBarcode?.barcode && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    Barcode:{' '}
                                    {
                                      primaryBarcode.barcode
                                    }
                                  </Typography>
                                )}
                              </Box>

                              <Box
                                sx={{
                                  ml: 2,
                                  textAlign:
                                    'right',
                                  flexShrink: 0
                                }}
                              >
                                <Typography
                                  fontWeight="bold"
                                  color={
                                    price >
                                    0
                                      ? 'primary'
                                      : 'error'
                                  }
                                >
                                  {formatTZS(
                                    price
                                  )}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {price >
                                  0
                                    ? 'Tap to add'
                                    : 'No price'}
                                </Typography>
                              </Box>
                            </ListItem>
                          );
                        }
                      )}
                    </List>
                  )}
                </Box>
              </Box>

              {/* SCANNER */}

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={
                  handleOpenScanner
                }
                disabled={
                  productsLoading ||
                  loadingProduct
                }
                sx={{
                  minHeight: 52
                }}
              >
                Scan Barcode
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
              >
                Search by product
                name, SKU or barcode,
                or use the camera
                scanner.
              </Typography>
            </Stack>
          </Box>
        </Grid>

        {/* ===================================================
            CART
        =================================================== */}

        <Grid item xs={12} md={7}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
            sx={{
              mb: 1
            }}
          >
            <Typography variant="h6">
              Order Items
            </Typography>

            {cartItems.length >
              0 && (
              <Button
                color="error"
                size="small"
                onClick={
                  clearCart
                }
              >
                Clear Cart
              </Button>
            )}
          </Stack>

          {cartItems.length ===
          0 ? (
            <Box
              sx={{
                py: 6,
                px: 2,
                textAlign:
                  'center',
                border:
                  '1px dashed',
                borderColor:
                  'divider',
                borderRadius: 2
              }}
            >
              <Typography color="text.secondary">
                Cart is empty
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1
                }}
              >
                Select a product
                from the list or
                scan a barcode.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {cartItems.map(
                (item) => (
                  <ListItem
                    key={item.id}
                    divider
                    disableGutters
                    sx={{
                      py: 2,
                      display: 'flex',
                      flexWrap:
                        'wrap',
                      gap: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        flex:
                          '1 1 180px',
                        minWidth: 0
                      }}
                    >
                      <Typography
                        fontWeight="bold"
                        sx={{
                          wordBreak:
                            'break-word'
                        }}
                      >
                        {item.name}
                      </Typography>

                      {item.brand && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {item.brand}
                        </Typography>
                      )}

                      {item.variant && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {
                            item.variant
                          }
                        </Typography>
                      )}

                      {item.weight && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {
                            item.weight
                          }
                          {item.unit
                            ? ` / ${item.unit}`
                            : ''}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{
                          wordBreak:
                            'break-all'
                        }}
                      >
                        SKU:{' '}
                        {item.sku}
                      </Typography>

                      {item.barcode ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Barcode:{' '}
                          {
                            item.barcode
                          }
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          display="block"
                        >
                          No barcode
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Price
                      </Typography>

                      <Typography fontWeight="bold">
                        {formatTZS(
                          item.price
                        )}
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <Button
                        variant="outlined"
                        onClick={() =>
                          decreaseQuantity(
                            item.id
                          )
                        }
                        sx={{
                          minWidth: 40,
                          width: 40,
                          height: 40,
                          p: 0
                        }}
                      >
                        −
                      </Button>

                      <Typography
                        fontWeight="bold"
                        sx={{
                          minWidth: 24,
                          textAlign:
                            'center'
                        }}
                      >
                        {item.qty}
                      </Typography>

                      <Button
                        variant="outlined"
                        onClick={() =>
                          increaseQuantity(
                            item.id
                          )
                        }
                        sx={{
                          minWidth: 40,
                          width: 40,
                          height: 40,
                          p: 0
                        }}
                      >
                        +
                      </Button>
                    </Stack>

                    <Box
                      sx={{
                        minWidth: 100,
                        textAlign:
                          'right'
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Total
                      </Typography>

                      <Typography
                        fontWeight="bold"
                        color="primary"
                      >
                        {formatTZS(
                          Number(
                            item.qty
                          ) *
                            Number(
                              item.price
                            )
                        )}
                      </Typography>
                    </Box>

                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                      sx={{
                        width: {
                          xs: '100%',
                          sm: 'auto'
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </ListItem>
                )
              )}
            </List>
          )}
        </Grid>

        {/* ===================================================
            PAYMENT
        =================================================== */}

        <Grid item xs={12} md={5}>
          <Box
            sx={{
              p: {
                xs: 2,
                sm: 3
              },

              border:
                '1px solid',

              borderColor:
                'divider',

              borderRadius: 2
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
            >
              Payment Summary
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Customer Name"
                value={
                  customerName
                }
                onChange={(
                  event
                ) =>
                  setCustomerName(
                    event.target
                      .value
                  )
                }
                fullWidth
              />

              <Select
                value={
                  paymentMethod
                }
                onChange={(
                  event
                ) => {
                  const method =
                    event.target
                      .value;

                  setPaymentMethod(
                    method
                  );

                  setError('');

                  if (
                    method !==
                    'cash'
                  ) {
                    setCashGiven(
                      ''
                    );
                  }
                }}
                fullWidth
              >
                <MenuItem value="cash">
                  Cash
                </MenuItem>

                <MenuItem value="card">
                  Card
                </MenuItem>

                <MenuItem value="mobile">
                  Mobile Money
                </MenuItem>
              </Select>

              {paymentMethod ===
                'cash' && (
                <>
                  <TextField
                    label="Cash Given"
                    type="number"
                    value={
                      cashGiven
                    }
                    onChange={(
                      event
                    ) => {
                      setCashGiven(
                        event.target
                          .value
                      );

                      setError(
                        ''
                      );
                    }}
                    fullWidth
                    required
                    inputProps={{
                      min: 0,
                      step: 500
                    }}
                    placeholder="Enter cash received"
                    error={
                      insufficientCash
                    }
                    helperText={
                      insufficientCash
                        ? `Need ${formatTZS(
                            total -
                              cashAmount
                          )} more`
                        : 'Required before completing a cash sale'
                    }
                  />

                  {cashGiven !==
                    '' && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor:
                          insufficientCash
                            ? 'error.lighter'
                            : 'success.lighter',
                        border:
                          '1px solid',
                        borderColor:
                          insufficientCash
                            ? 'error.main'
                            : 'success.main'
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        gap={2}
                      >
                        <Typography>
                          Cash Given
                        </Typography>

                        <Typography fontWeight="bold">
                          {formatTZS(
                            cashAmount
                          )}
                        </Typography>
                      </Box>

                      <Box
                        display="flex"
                        justifyContent="space-between"
                        gap={2}
                        sx={{
                          mt: 1
                        }}
                      >
                        <Typography fontWeight="bold">
                          {insufficientCash
                            ? 'Remaining'
                            : 'Change'}
                        </Typography>

                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color={
                            insufficientCash
                              ? 'error'
                              : 'success.main'
                          }
                        >
                          {formatTZS(
                            insufficientCash
                              ? total -
                                  cashAmount
                              : change
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}

              <Divider />

              <Box
                display="flex"
                justifyContent="space-between"
                gap={2}
              >
                <Typography>
                  Subtotal
                </Typography>

                <Typography>
                  {formatTZS(
                    subtotal
                  )}
                </Typography>
              </Box>

              <Box
                display="flex"
                justifyContent="space-between"
                gap={2}
              >
                <Typography>
                  Tax
                </Typography>

                <Typography>
                  {formatTZS(tax)}
                </Typography>
              </Box>

              <Divider />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
              >
                <Typography variant="h6">
                  Total
                </Typography>

                <Typography
                  variant="h6"
                  color="primary"
                >
                  {formatTZS(
                    total
                  )}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={
                  completeSale
                }
                disabled={
                  cartItems.length ===
                    0 ||
                  (paymentMethod ===
                    'cash' &&
                    (cashGiven ===
                      '' ||
                      cashAmount <
                        total))
                }
                sx={{
                  minHeight: 52
                }}
              >
                Complete Sale
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={
                  printReceipt
                }
                disabled={
                  cartItems.length ===
                  0
                }
                sx={{
                  minHeight: 52
                }}
              >
                Print Receipt
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* =====================================================
          SCANNER DIALOG
      ===================================================== */}

      <Dialog
        open={scannerOpen}
        onClose={
          handleCloseScanner
        }
        fullWidth
        maxWidth="sm"
        fullScreen
      >
        <DialogTitle>
          Scan Product Barcode
        </DialogTitle>

        <DialogContent
          sx={{
            px: {
              xs: 1,
              sm: 3
            }
          }}
        >
          {scannerError && (
            <Alert
              severity="error"
              sx={{
                mb: 2
              }}
            >
              {scannerError}
            </Alert>
          )}

          <Box
            sx={{
              width: '100%',

              height: {
                xs: '55vh',
                sm: 400
              },

              minHeight: 300,

              backgroundColor:
                '#000',

              borderRadius: 2,

              overflow: 'hidden',

              position:
                'relative',

              '& video': {
                width:
                  '100% !important',

                height:
                  '100% !important',

                objectFit: 'cover',

                display: 'block'
              },

              '& canvas': {
                display: 'none'
              },

              '& #qr-shaded-region': {
                border:
                  '3px solid #fff !important'
              }
            }}
          >
            <div
              id="barcode-reader"
              style={{
                width: '100%',
                height: '100%'
              }}
            />

            {scannerLoading && (
              <Box
                sx={{
                  position:
                    'absolute',

                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,

                  display:
                    'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  backgroundColor:
                    'rgba(0,0,0,0.35)',

                  zIndex: 10
                }}
              >
                <Typography
                  color="white"
                  fontWeight="bold"
                >
                  Starting camera...
                </Typography>
              </Box>
            )}
          </Box>

          <Typography
            align="center"
            color="text.secondary"
            sx={{
              mt: 2
            }}
          >
            Point the rear camera at
            the barcode.
          </Typography>

          <Typography
            align="center"
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1
            }}
          >
            Keep the barcode inside
            the white scanning area.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2
          }}
        >
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="large"
            onClick={
              handleCloseScanner
            }
            sx={{
              minHeight: 52
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
