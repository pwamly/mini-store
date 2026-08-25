import { useRef, useState } from 'react';

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
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import MainCard from 'components/MainCard';

import { Html5Qrcode } from 'html5-qrcode';

export default function CheckOut() {
  // =====================================================
  // STATE
  // =====================================================

  const [cartItems, setCartItems] = useState([]);

  const [barcode, setBarcode] = useState('');

  const [customerName, setCustomerName] =
    useState('');

  const [paymentMethod, setPaymentMethod] =
    useState('cash');

  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [scannerLoading, setScannerLoading] =
    useState(false);

  const [loadingProduct, setLoadingProduct] =
    useState(false);

  const [error, setError] = useState('');

  const [scannerError, setScannerError] =
    useState('');

  const barcodeInputRef = useRef(null);

  const scannerRef = useRef(null);

  const scanProcessingRef = useRef(false);

  // =====================================================
  // OPEN CAMERA SCANNER
  // =====================================================

  const handleOpenScanner = () => {
    setError('');

    setScannerError('');

    setScannerOpen(true);

    setTimeout(() => {
      startScanner();
    }, 500);
  };

  // =====================================================
  // START CAMERA
  // =====================================================

  const startScanner = async () => {
    try {
      setScannerLoading(true);

      setScannerError('');

      /*
       * Check browser camera support.
       */

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Camera API is not available. Use HTTPS or localhost.'
        );
      }

      /*
       * Check whether the scanner element exists.
       */

      const readerElement =
        document.getElementById(
          'barcode-reader'
        );

      if (!readerElement) {
        throw new Error(
          'Scanner element was not found.'
        );
      }

      /*
       * Prevent multiple scanner instances.
       */

      if (scannerRef.current) {
        await stopScanner();
      }

      /*
       * Create scanner.
       */

      const scanner = new Html5Qrcode(
        'barcode-reader'
      );

      scannerRef.current = scanner;

      /*
       * Start camera.
       *
       * facingMode environment =
       * back camera on phones.
       */

      await scanner.start(
        {
          facingMode: 'environment'
        },
        {
          fps: 10,

          qrbox: {
            width: 300,
            height: 150
          },

          aspectRatio: 1.777778,

          disableFlip: false
        },

        /*
         * ==========================================
         * BARCODE DETECTED
         * ==========================================
         */

        async (decodedText) => {
          /*
           * Prevent multiple detections of
           * the same barcode while processing.
           */

          if (scanProcessingRef.current) {
            return;
          }

          scanProcessingRef.current = true;

          console.log(
            'Barcode detected:',
            decodedText
          );

          try {
            await stopScanner();

            setScannerOpen(false);

            setBarcode(decodedText);

            await scanProduct(decodedText);
          } catch (err) {
            console.error(
              'Barcode processing error:',
              err
            );
          } finally {
            scanProcessingRef.current = false;
          }
        },

        /*
         * ==========================================
         * SCANNING CALLBACK
         * ==========================================
         *
         * This is called continuously while
         * looking for a barcode.
         */

        () => {
          // Don't display scanning errors.
        }
      );

      setScannerLoading(false);

      console.log(
        'Camera scanner started successfully'
      );
    } catch (err) {
      console.error(
        'Camera scanner error:',
        err
      );

      setScannerLoading(false);

      let message =
        'Unable to start the camera.';

      /*
       * ==========================================
       * SECURE CONTEXT
       * ==========================================
       */

      if (!window.isSecureContext) {
        message =
          'Camera access requires HTTPS or localhost. If you are opening the POS from your phone using http://192.168.x.x, enable HTTPS for your Vite server.';
      }

      /*
       * ==========================================
       * PERMISSION
       * ==========================================
       */

      else if (
        err?.name ===
        'NotAllowedError'
      ) {
        message =
          'Camera permission was denied. Please allow camera access in your browser settings and try again.';
      }

      /*
       * ==========================================
       * CAMERA NOT FOUND
       * ==========================================
       */

      else if (
        err?.name === 'NotFoundError'
      ) {
        message =
          'No camera was found on this device.';
      }

      /*
       * ==========================================
       * CAMERA BUSY
       * ==========================================
       */

      else if (
        err?.name ===
        'NotReadableError'
      ) {
        message =
          'The camera is already being used by another application. Close other camera applications and try again.';
      }

      /*
       * ==========================================
       * SECURITY
       * ==========================================
       */

      else if (
        err?.name ===
        'SecurityError'
      ) {
        message =
          'The browser blocked camera access for security reasons. Use HTTPS or localhost.';
      }

      /*
       * ==========================================
       * UNKNOWN ERROR
       * ==========================================
       */

      else if (err?.message) {
        message =
          `Camera error: ${err.message}`;
      }

      setScannerError(message);
    }
  };

  // =====================================================
  // STOP CAMERA
  // =====================================================

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }

      await scanner.clear();
    } catch (err) {
      console.error(
        'Error stopping scanner:',
        err
      );
    }

    scannerRef.current = null;
  };

  // =====================================================
  // CLOSE CAMERA DIALOG
  // =====================================================

  const handleCloseScanner = async () => {
    await stopScanner();

    setScannerOpen(false);

    setScannerLoading(false);

    setScannerError('');

    scanProcessingRef.current = false;

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
  };

  // =====================================================
  // MANUAL BARCODE INPUT
  // =====================================================

  const handleBarcodeChange = (
    event
  ) => {
    setBarcode(event.target.value);
  };

  // =====================================================
  // BARCODE ENTER
  // =====================================================

  const handleBarcodeKeyDown = async (
    event
  ) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    const code = barcode.trim();

    if (!code) {
      return;
    }

    await scanProduct(code);
  };

  // =====================================================
  // FIND PRODUCT BY BARCODE
  // =====================================================

  const scanProduct = async (
    code
  ) => {
    try {
      setError('');

      setLoadingProduct(true);

      /*
       * IMPORTANT:
       *
       * Change this URL to your real API.
       *
       * Example:
       *
       * GET /api/products/barcode/123456789
       */

      const response = await fetch(
        `/api/products/barcode/${encodeURIComponent(
          code
        )}`
      );

      if (!response.ok) {
        throw new Error(
          'Product not found'
        );
      }

      const product =
        await response.json();

      console.log(
        'Product found:',
        product
      );

      /*
       * Expected response:
       *
       * {
       *   id: 1,
       *   name: "Coffee",
       *   barcode: "123456789",
       *   price: 5
       * }
       */

      addToCart(product);

      setBarcode('');

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    } catch (err) {
      console.error(
        'Product lookup error:',
        err
      );

      setError(
        `Product with barcode "${code}" was not found.`
      );

      setBarcode('');

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    } finally {
      setLoadingProduct(false);
    }
  };

  // =====================================================
  // ADD PRODUCT TO CART
  // =====================================================

  const addToCart = (product) => {
    setCartItems(
      (currentItems) => {
        const existingItem =
          currentItems.find(
            (item) =>
              item.id === product.id
          );

        /*
         * Product already exists.
         * Increase quantity.
         */

        if (existingItem) {
          return currentItems.map(
            (item) =>
              item.id === product.id
                ? {
                    ...item,
                    qty:
                      item.qty + 1
                  }
                : item
          );
        }

        /*
         * New product.
         */

        return [
          ...currentItems,

          {
            id: product.id,

            name: product.name,

            barcode:
              product.barcode,

            price: Number(
              product.price
            ),

            qty: 1
          }
        ];
      }
    );
  };

  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  const increaseQuantity = (
    id
  ) => {
    setCartItems(
      (items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                qty:
                  item.qty + 1
              }
            : item
        )
    );
  };

  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  const decreaseQuantity = (
    id
  ) => {
    setCartItems(
      (items) =>
        items
          .map((item) =>
            item.id === id
              ? {
                  ...item,
                  qty:
                    item.qty - 1
                }
              : item
          )
          .filter(
            (item) =>
              item.qty > 0
          )
    );
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = (id) => {
    setCartItems(
      (items) =>
        items.filter(
          (item) =>
            item.id !== id
        )
    );
  };

  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart = () => {
    setCartItems([]);

    setCustomerName('');

    setPaymentMethod('cash');

    setBarcode('');

    setError('');

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const subtotal =
    cartItems.reduce(
      (sum, item) =>
        sum +
        item.qty *
          item.price,
      0
    );

  const tax = subtotal * 0.1;

  const total =
    subtotal + tax;

  // =====================================================
  // COMPLETE SALE
  // =====================================================

  const completeSale =
    async () => {
      if (
        cartItems.length ===
        0
      ) {
        setError(
          'Please add at least one product to the cart.'
        );

        return;
      }

      const sale = {
        customerName,

        paymentMethod,

        items: cartItems.map(
          (item) => ({
            productId:
              item.id,

            barcode:
              item.barcode,

            quantity:
              item.qty,

            price:
              item.price
          })
        ),

        subtotal,

        tax,

        total
      };

      console.log(
        'SALE:',
        sale
      );

      /*
       * Connect your API here:
       *
       * const response =
       *   await fetch('/api/sales', {
       *     method: 'POST',
       *     headers: {
       *       'Content-Type':
       *         'application/json'
       *     },
       *     body:
       *       JSON.stringify(sale)
       *   });
       */

      alert(
        'Sale completed successfully'
      );

      clearCart();
    };

  // =====================================================
  // PRINT RECEIPT
  // =====================================================

  const printReceipt = () => {
    window.print();
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <MainCard title="POS Checkout">
      <Grid container spacing={3}>
        {/* =================================================
            BARCODE SECTION
        ================================================= */}

        <Grid item xs={12}>
          <Box
            sx={{
              p: 2,

              backgroundColor:
                'background.default',

              borderRadius: 2
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
            >
              Scan Product
            </Typography>

            {/* ERROR */}

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

            {/* INPUT + BUTTON */}

            <Stack
              direction={{
                xs: 'column',
                sm: 'row'
              }}
              spacing={2}
            >
              <TextField
                inputRef={
                  barcodeInputRef
                }
                label="Barcode"
                placeholder="Scan or enter barcode"
                value={barcode}
                onChange={
                  handleBarcodeChange
                }
                onKeyDown={
                  handleBarcodeKeyDown
                }
                fullWidth
                autoFocus
                disabled={
                  loadingProduct
                }
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={
                  handleOpenScanner
                }
                disabled={
                  loadingProduct
                }
                sx={{
                  minWidth: {
                    xs: '100%',
                    sm: 180
                  }
                }}
              >
                Scan Barcode
              </Button>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mt: 1
              }}
            >
              Scan using your camera,
              barcode scanner, or enter
              the barcode manually.
            </Typography>
          </Box>
        </Grid>

        {/* =================================================
            CART
        ================================================= */}

        <Grid
          item
          xs={12}
          md={7}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
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

          {/* EMPTY */}

          {cartItems.length ===
          0 ? (
            <Box
              sx={{
                py: 6,

                textAlign:
                  'center',

                border:
                  '1px dashed',

                borderColor:
                  'divider',

                borderRadius: 2
              }}
            >
              <Typography
                color="text.secondary"
                gutterBottom
              >
                Your cart is
                empty
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Scan a product
                to add it to
                the cart
              </Typography>
            </Box>
          ) : (
            <List>
              {cartItems.map(
                (item) => (
                  <ListItem
                    key={item.id}
                    divider
                    sx={{
                      py: 2,

                      flexWrap: {
                        xs: 'wrap',
                        sm: 'nowrap'
                      }
                    }}
                  >
                    {/* PRODUCT */}

                    <ListItemText
                      sx={{
                        minWidth: 0,
                        flex: 1
                      }}
                      primary={
                        <Typography
                          fontWeight="bold"
                        >
                          {
                            item.name
                          }
                        </Typography>
                      }
                      secondary={
                        <>
                          Barcode:{' '}
                          {
                            item.barcode
                          }
                          <br />
                          $
                          {item.price.toFixed(
                            2
                          )}{' '}
                          each
                        </>
                      }
                    />

                    {/* QUANTITY */}

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{
                        mr: {
                          xs: 0,
                          sm: 2
                        },

                        mt: {
                          xs: 1,
                          sm: 0
                        }
                      }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          decreaseQuantity(
                            item.id
                          )
                        }
                        sx={{
                          minWidth: 35
                        }}
                      >
                        −
                      </Button>

                      <Typography
                        sx={{
                          minWidth: 30,

                          textAlign:
                            'center',

                          fontWeight:
                            'bold'
                        }}
                      >
                        {
                          item.qty
                        }
                      </Typography>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          increaseQuantity(
                            item.id
                          )
                        }
                        sx={{
                          minWidth: 35
                        }}
                      >
                        +
                      </Button>
                    </Stack>

                    {/* TOTAL */}

                    <Typography
                      sx={{
                        minWidth: 90,

                        textAlign:
                          'right',

                        fontWeight:
                          'bold'
                      }}
                    >
                      $
                      {(
                        item.qty *
                        item.price
                      ).toFixed(
                        2
                      )}
                    </Typography>

                    {/* REMOVE */}

                    <Button
                      color="error"
                      size="small"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                      sx={{
                        ml: {
                          xs: 1,
                          sm: 2
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

        {/* =================================================
            PAYMENT
        ================================================= */}

        <Grid
          item
          xs={12}
          md={5}
        >
          <Box
            sx={{
              p: 3,

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
              {/* CUSTOMER */}

              <TextField
                label="Customer Name"
                fullWidth
                value={
                  customerName
                }
                onChange={(event) =>
                  setCustomerName(
                    event.target
                      .value
                  )
                }
              />

              {/* PAYMENT */}

              <Select
                value={
                  paymentMethod
                }
                onChange={(event) =>
                  setPaymentMethod(
                    event.target
                      .value
                  )
                }
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

              <Divider />

              {/* SUBTOTAL */}

              <Box
                display="flex"
                justifyContent="space-between"
              >
                <Typography>
                  Subtotal
                </Typography>

                <Typography>
                  $
                  {subtotal.toFixed(
                    2
                  )}
                </Typography>
              </Box>

              {/* TAX */}

              <Box
                display="flex"
                justifyContent="space-between"
              >
                <Typography>
                  Tax (10%)
                </Typography>

                <Typography>
                  $
                  {tax.toFixed(
                    2
                  )}
                </Typography>
              </Box>

              <Divider />

              {/* TOTAL */}

              <Box
                display="flex"
                justifyContent="space-between"
              >
                <Typography variant="h6">
                  Total
                </Typography>

                <Typography
                  variant="h6"
                  color="primary"
                >
                  $
                  {total.toFixed(
                    2
                  )}
                </Typography>
              </Box>

              {/* COMPLETE */}

              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={
                  cartItems.length ===
                  0
                }
                onClick={
                  completeSale
                }
              >
                Complete Sale
              </Button>

              {/* PRINT */}

              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                disabled={
                  cartItems.length ===
                  0
                }
                onClick={
                  printReceipt
                }
              >
                Print Receipt
              </Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* =================================================
          CAMERA DIALOG
      ================================================= */}

      <Dialog
        open={scannerOpen}
        onClose={
          handleCloseScanner
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Scan Product Barcode
        </DialogTitle>

        <DialogContent>
          {/* CAMERA ERROR */}

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

          {/* CAMERA */}

          <Box
            sx={{
              width: '100%',

              minHeight: 300,

              position: 'relative',

              overflow: 'hidden'
            }}
          >
            <div
              id="barcode-reader"
              style={{
                width: '100%'
              }}
            />

            {/* LOADING */}

            {scannerLoading && (
              <Box
                sx={{
                  textAlign:
                    'center',

                  py: 2
                }}
              >
                <Typography
                  color="text.secondary"
                >
                  Starting camera...
                </Typography>
              </Box>
            )}
          </Box>

          {/* HELP */}

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{
              mt: 2
            }}
          >
            Point the camera at the
            product barcode.
          </Typography>

          {!window.isSecureContext && (
            <Alert
              severity="warning"
              sx={{
                mt: 2
              }}
            >
              Camera access requires
              HTTPS or localhost.
              If you are testing on a
              phone, do not use a plain
              HTTP network address.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            color="error"
            onClick={
              handleCloseScanner
            }
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}