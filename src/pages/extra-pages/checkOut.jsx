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

export default function CheckOut() {
  // =========================================================
  // DUMMY PRODUCTS
  // =========================================================

  const products = [
  {
    id: 1,
    barcode: '6161101661447',
    sku: 'MAR-PRESTIGE-VAN-500G',
    name: 'Prestige Margarine',
    brand: 'Prestige',
    variant: 'Vanilla Flavour',
    type: 'Fat Spread / Margarine',
    category: 'Margarine & Spreads',
    weight: '500g',
    unit: 'Tub',
    price: 5500
  },

  {
    id: 2,
    barcode: '5053990161966',
    sku: 'SNP-PRINGLES-BBQ-165G',
    name: 'Pringles Barbeque',
    brand: 'Pringles',
    variant: 'Barbeque',
    type: 'Stacked Potato Crisps',
    category: 'Crisps & Chips',
    weight: '165g',
    unit: 'Can',
    price: 7500
  },

  {
    id: 3,
    barcode: '8904022916344',
    sku: 'BIS-BONN-BOURBON-60G',
    name: 'Bonn Classic Bourbon',
    brand: 'Bonn',
    variant: 'Chocolate Cream',
    type: 'Chocolate Cream Sandwich Biscuit',
    category: 'Biscuits & Cookies',
    weight: '60g',
    unit: 'Packet',
    price: 1000
  }
];

  // =========================================================
  // STATE
  // =========================================================

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

  // =========================================================
  // FORMAT TZS
  // =========================================================

  const formatTZS = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // =========================================================
  // OPEN SCANNER
  // =========================================================

  const handleOpenScanner = () => {
    setError('');
    setScannerError('');

    if (!window.isSecureContext) {
      setScannerOpen(true);

      setScannerError(
        'Camera access requires HTTPS or localhost.'
      );

      return;
    }

    setScannerOpen(true);

    setTimeout(() => {
      startScanner();
    }, 500);
  };

  // =========================================================
  // START CAMERA SCANNER
  // =========================================================

  const startScanner = async () => {
    try {
      setScannerLoading(true);
      setScannerError('');

      if (!window.isSecureContext) {
        throw new Error(
          'Camera requires HTTPS or localhost.'
        );
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Camera is not supported by this browser.'
        );
      }

      const reader =
        document.getElementById('barcode-reader');

      if (!reader) {
        throw new Error(
          'Barcode scanner element was not found.'
        );
      }

      // Clean up an existing scanner
      if (scannerRef.current) {
        try {
          if (
            scannerRef.current.isScanning
          ) {
            await scannerRef.current.stop();
          }

          await scannerRef.current.clear();
        } catch (cleanupError) {
          console.log(
            'Scanner cleanup:',
            cleanupError
          );
        }

        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(
        'barcode-reader'
      );

      scannerRef.current = scanner;

      // Barcode formats
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

        qrbox: (width, height) => {
          const scanWidth = Math.min(
            width * 0.9,
            360
          );

          const scanHeight = Math.min(
            height * 0.4,
            180
          );

          return {
            width: scanWidth,
            height: scanHeight
          };
        },

        aspectRatio: 1.777778,

        disableFlip: false,

        formatsToSupport: formats,

        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false
        }
      };

      const onScanSuccess = async (
        decodedText,
        decodedResult
      ) => {
        if (scanProcessingRef.current) {
          return;
        }

        scanProcessingRef.current = true;

        console.log(
          'BARCODE DETECTED:',
          decodedText
        );

        console.log(
          'BARCODE FORMAT:',
          decodedResult?.result?.format
            ?.formatName
        );

        try {
          await stopScanner();

          setScannerOpen(false);

          setBarcode(decodedText);

          await scanProduct(decodedText);
        } catch (scanError) {
          console.error(
            'Scan error:',
            scanError
          );
        } finally {
          scanProcessingRef.current = false;
        }
      };

      const onScanFailure = () => {
        // Scanner keeps searching.
      };

      await scanner.start(
        {
          facingMode: 'environment'
        },

        config,

        onScanSuccess,

        onScanFailure
      );

      setScannerLoading(false);
    } catch (cameraError) {
      console.error(
        'Camera error:',
        cameraError
      );

      setScannerLoading(false);

      let message =
        'Unable to start camera.';

      if (!window.isSecureContext) {
        message =
          'Camera access requires HTTPS or localhost.';
      } else if (
        cameraError?.name ===
        'NotAllowedError'
      ) {
        message =
          'Camera permission was denied. Please allow camera access.';
      } else if (
        cameraError?.name ===
        'NotFoundError'
      ) {
        message =
          'No camera was found.';
      } else if (
        cameraError?.name ===
        'NotReadableError'
      ) {
        message =
          'Camera is already being used by another application.';
      } else if (cameraError?.message) {
        message = cameraError.message;
      }

      setScannerError(message);
    }
  };

  // =========================================================
  // STOP SCANNER
  // =========================================================

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
    } catch (error) {
      console.error(
        'Stop scanner error:',
        error
      );
    }

    scannerRef.current = null;
  };

  // =========================================================
  // CLOSE SCANNER
  // =========================================================

  const handleCloseScanner = async () => {
    await stopScanner();

    setScannerOpen(false);

    setScannerLoading(false);

    setScannerError('');

    scanProcessingRef.current = false;

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 300);
  };

  // =========================================================
  // BARCODE INPUT
  // =========================================================

  const handleBarcodeChange = (event) => {
    setBarcode(event.target.value);
  };

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

  // =========================================================
  // FIND PRODUCT
  // =========================================================

  const scanProduct = async (code) => {
    const cleanCode = String(code).trim();

    if (!cleanCode) {
      return;
    }

    setError('');

    setLoadingProduct(true);

    // Simulate product lookup
    await new Promise((resolve) =>
      setTimeout(resolve, 300)
    );

    const product = products.find(
      (item) =>
        String(item.barcode) === cleanCode
    );

    if (!product) {
      setError(
        `Product with barcode "${cleanCode}" was not found.`
      );

      setLoadingProduct(false);

      setBarcode('');

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);

      return;
    }

    addToCart(product);

    setBarcode('');

    setLoadingProduct(false);

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // =========================================================
  // ADD PRODUCT TO CART
  // =========================================================

  const addToCart = (product) => {
    setCartItems((currentItems) => {
      const existing = currentItems.find(
        (item) =>
          String(item.id) ===
          String(product.id)
      );

      if (existing) {
        return currentItems.map((item) =>
          String(item.id) ===
          String(product.id)
            ? {
                ...item,
                qty: item.qty + 1
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          qty: 1
        }
      ];
    });
  };

  // =========================================================
  // INCREASE QUANTITY
  // =========================================================

  const increaseQuantity = (id) => {
    setCartItems((items) =>
      items.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              qty: item.qty + 1
            }
          : item
      )
    );
  };

  // =========================================================
  // DECREASE QUANTITY
  // =========================================================

  const decreaseQuantity = (id) => {
    setCartItems((items) =>
      items
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                qty: item.qty - 1
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const removeItem = (id) => {
    setCartItems((items) =>
      items.filter(
        (item) =>
          String(item.id) !== String(id)
      )
    );
  };

  // =========================================================
  // CLEAR CART
  // =========================================================

  const clearCart = () => {
    setCartItems([]);

    setBarcode('');

    setCustomerName('');

    setPaymentMethod('cash');

    setError('');

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 200);
  };

  // =========================================================
  // TOTALS
  // =========================================================

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      item.qty *
        Number(item.price),
    0
  );

  // =========================================================
  // TAX
  // =========================================================

  // Tax is intentionally 0 for now.
  // You can change this later when you are ready.
  const tax = 0;

  // =========================================================
  // TOTAL
  // =========================================================

  const total = subtotal + tax;

  // =========================================================
  // COMPLETE SALE
  // =========================================================

  const completeSale = () => {
    if (cartItems.length === 0) {
      setError(
        'Please scan a product first.'
      );

      return;
    }

    const sale = {
      customerName,
      paymentMethod,
      items: cartItems,

      subtotal,

      tax: 0,

      total
    };

    console.log(
      'SALE:',
      sale
    );

    alert(
      'Sale completed successfully!'
    );

    clearCart();
  };

  // =========================================================
  // PRINT RECEIPT
  // =========================================================

  const printReceipt = () => {
    window.print();
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <MainCard title="POS Checkout">
      <Grid
        container
        spacing={3}
      >
        {/* =================================================
            SCAN PRODUCT
        ================================================= */}

        <Grid
          item
          xs={12}
        >
          <Box
            sx={{
              p: {
                xs: 2,
                sm: 3
              },

              border: '1px solid',

              borderColor: 'divider',

              borderRadius: 2
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
            >
              Scan Product
            </Typography>

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
              Test barcode:{' '}
              <strong>
                6161101661447
              </strong>
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

            {cartItems.length > 0 && (
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

          {cartItems.length === 0 ? (
            <Box
              sx={{
                py: 6,
                px: 2,
                textAlign: 'center',
                border: '1px dashed',
                borderColor:
                  'divider',
                borderRadius: 2
              }}
            >
              <Typography
                color="text.secondary"
              >
                Cart is empty
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1
                }}
              >
                Scan barcode{' '}
                <strong>
                  6161101661447
                </strong>{' '}
                to test.
              </Typography>
            </Box>
          ) : (
            <List
              disablePadding
              sx={{
                width: '100%'
              }}
            >
              {cartItems.map(
                (item) => (
                  <ListItem
                    key={item.id}
                    divider
                    disableGutters
                    sx={{
                      py: 2,

                      display: 'flex',

                      flexWrap: 'wrap',

                      alignItems:
                        'flex-start',

                      gap: 1
                    }}
                  >
                    {/* PRODUCT */}

                    <Box
                      sx={{
                        flex:
                          '1 1 180px',

                        minWidth: 0,

                        pr: 1
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

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.brand} -{' '}
                        {item.variant}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.weight}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display:
                            'block',
                          wordBreak:
                            'break-all'
                        }}
                      >
                        Barcode:{' '}
                        {item.barcode}
                      </Typography>
                    </Box>

                    {/* UNIT PRICE */}

                    <Box
                      sx={{
                        flex: {
                          xs:
                            '1 1 100%',
                          sm:
                            '0 0 auto'
                        },

                        order: {
                          xs: 3,
                          sm: 0
                        }
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Unit price
                      </Typography>

                      <Typography
                        fontWeight="bold"
                      >
                        {formatTZS(
                          item.price
                        )}
                      </Typography>
                    </Box>

                    {/* QUANTITY */}

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{
                        flex:
                          '0 0 auto'
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
                          minWidth: 36,
                          width: 36,
                          height: 36,
                          p: 0
                        }}
                      >
                        −
                      </Button>

                      <Typography
                        sx={{
                          minWidth: 28,
                          textAlign:
                            'center',
                          fontWeight:
                            'bold'
                        }}
                      >
                        {item.qty}
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
                          minWidth: 36,
                          width: 36,
                          height: 36,
                          p: 0
                        }}
                      >
                        +
                      </Button>
                    </Stack>

                    {/* ITEM TOTAL */}

                    <Box
                      sx={{
                        flex:
                          '0 0 auto',

                        minWidth: {
                          xs: 100,
                          sm: 110
                        },

                        textAlign:
                          'right'
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Total
                      </Typography>

                      <Typography
                        fontWeight="bold"
                        color="primary"
                      >
                        {formatTZS(
                          item.qty *
                            Number(
                              item.price
                            )
                        )}
                      </Typography>
                    </Box>

                    {/* REMOVE */}

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
                        flex: {
                          xs:
                            '1 1 100%',
                          sm:
                            '0 0 auto'
                        },

                        width: {
                          xs: '100%',
                          sm: 'auto'
                        },

                        minWidth: {
                          xs: 0,
                          sm: 80
                        },

                        mt: {
                          xs: 1,
                          sm: 0
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
            PAYMENT SUMMARY
        ================================================= */}

        <Grid
          item
          xs={12}
          md={5}
        >
          <Box
            sx={{
              p: {
                xs: 2,
                sm: 3
              },

              border: '1px solid',

              borderColor: 'divider',

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
                value={
                  customerName
                }
                onChange={(event) =>
                  setCustomerName(
                    event.target
                      .value
                  )
                }
                fullWidth
              />

              {/* PAYMENT METHOD */}

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
                gap={2}
              >
                <Typography>
                  Subtotal
                </Typography>

                <Typography
                  fontWeight="bold"
                >
                  {formatTZS(
                    subtotal
                  )}
                </Typography>
              </Box>

              {/* TAX */}

              <Box
                display="flex"
                justifyContent="space-between"
                gap={2}
              >
                <Typography>
                  Tax
                </Typography>

                <Typography>
                  {formatTZS(0)}
                </Typography>
              </Box>

              <Divider />

              {/* TOTAL */}

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
                  sx={{
                    textAlign:
                      'right'
                  }}
                >
                  {formatTZS(
                    total
                  )}
                </Typography>
              </Box>

              {/* COMPLETE SALE */}

              <Button
                variant="contained"
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

      {/* =====================================================
          CAMERA SCANNER DIALOG
      ===================================================== */}

      <Dialog
        open={scannerOpen}
        onClose={
          handleCloseScanner
        }
        fullWidth
        maxWidth="sm"
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            m: {
              xs: 0,
              sm: 2
            }
          }
        }}
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

          {/* CAMERA VIEW */}

          <Box
            sx={{
              width: '100%',

              minHeight: {
                xs: 300,
                sm: 350
              },

              position: 'relative',

              overflow: 'hidden',

              backgroundColor: '#000',

              borderRadius: 2,

              '& video': {
                width:
                  '100% !important',

                height:
                  'auto !important',

                objectFit:
                  'cover'
              },

              '& canvas': {
                maxWidth:
                  '100%'
              },

              '& #qr-shaded-region': {
                borderWidth:
                  '3px !important'
              }
            }}
          >
            <div
              id="barcode-reader"
              style={{
                width: '100%'
              }}
            />

            {scannerLoading && (
              <Box
                sx={{
                  position:
                    'absolute',

                  bottom: 20,

                  left: 0,

                  right: 0,

                  textAlign:
                    'center'
                }}
              >
                <Typography
                  color="white"
                >
                  Starting camera...
                </Typography>
              </Box>
            )}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{
              mt: 2
            }}
          >
            Point the camera at
            the barcode.
          </Typography>

          <Typography
            variant="h6"
            align="center"
            sx={{
              mt: 1
            }}
          >
            6161101661447
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{
              display: 'block',
              mt: 1
            }}
          >
            Prestige Margarine -
            Vanilla Flavour - 500g
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2,
            pb: 2
          }}
        >
          <Button
            color="error"
            variant="outlined"
            fullWidth
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