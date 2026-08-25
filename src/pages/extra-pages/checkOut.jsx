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
      category: 'Margarine & Spreads',
      weight: '500g',
      unit: 'Tub',
      price: 5000
    },

    {
      id: 2,
      barcode: '5053990161966',
      sku: 'SNP-PRINGLES-BBQ-165G',
      name: 'Pringles Barbeque',
      brand: 'Pringles',
      variant: 'Barbeque',
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
      category: 'Biscuits & Cookies',
      weight: '60g',
      unit: 'Packet',
      price: 3000
    },

    // Example product with NO BARCODE
    {
      id: 4,
      barcode: '',
      sku: 'MILK-500ML-001',
      name: 'Fresh Milk',
      brand: 'Local Dairy',
      variant: 'Full Cream',
      category: 'Dairy',
      weight: '500ml',
      unit: 'Bottle',
      price: 2500
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

  const [cashGiven, setCashGiven] =
    useState('');

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
  // TZS FORMAT
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
  // INPUT CHANGE
  // =========================================================

  const handleBarcodeChange = (event) => {
    setBarcode(event.target.value);

    if (error) {
      setError('');
    }
  };

  // =========================================================
  // MANUAL ADD PRODUCT
  // =========================================================
  //
  // IMPORTANT:
  // The cashier does NOT need to press Enter.
  //
  // They type the barcode/SKU/Product ID and tap
  // "Add Product".
  // =========================================================

  const handleAddProduct = async () => {
    const code = barcode.trim();

    if (!code) {
      setError(
        'Enter a barcode or Product ID / SKU first.'
      );

      barcodeInputRef.current?.focus();

      return;
    }

    await scanProduct(code);
  };

  // =========================================================
  // ENTER SUPPORT
  // =========================================================
  //
  // This is optional convenience for physical scanners
  // and keyboards. Mobile users can simply press Add Product.
  // =========================================================

  const handleBarcodeKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      await handleAddProduct();
    }
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

    // Simulate database lookup
    await new Promise((resolve) =>
      setTimeout(resolve, 250)
    );

    const searchCode =
      cleanCode.toLowerCase();

    const product = products.find(
      (item) => {
        const itemBarcode =
          String(
            item.barcode || ''
          ).toLowerCase();

        const itemSku =
          String(
            item.sku || ''
          ).toLowerCase();

        const itemId =
          String(
            item.id || ''
          ).toLowerCase();

        return (
          itemBarcode ===
            searchCode ||
          itemSku === searchCode ||
          itemId === searchCode
        );
      }
    );

    // =======================================================
    // NOT FOUND
    // =======================================================

    if (!product) {
      setError(
        `No product found for "${cleanCode}". Check the barcode or Product ID / SKU.`
      );

      setBarcode('');

      setLoadingProduct(false);

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);

      return;
    }

    // =======================================================
    // ADD
    // =======================================================

    addToCart(product);

    setBarcode('');

    setLoadingProduct(false);

    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 100);
  };

  // =========================================================
  // ADD TO CART
  // =========================================================

  const addToCart = (product) => {
    setCartItems((currentItems) => {
      const existing = currentItems.find(
        (item) =>
          String(item.id) ===
          String(product.id)
      );

      if (existing) {
        return currentItems.map(
          (item) =>
            String(item.id) ===
            String(product.id)
              ? {
                  ...item,
                  qty:
                    item.qty + 1
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
  // INCREASE
  // =========================================================

  const increaseQuantity = (id) => {
    setCartItems((items) =>
      items.map((item) =>
        String(item.id) ===
        String(id)
          ? {
              ...item,
              qty:
                item.qty + 1
            }
          : item
      )
    );
  };

  // =========================================================
  // DECREASE
  // =========================================================

  const decreaseQuantity = (id) => {
    setCartItems((items) =>
      items
        .map((item) =>
          String(item.id) ===
          String(id)
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

  // =========================================================
  // REMOVE
  // =========================================================

  const removeItem = (id) => {
    setCartItems((items) =>
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

    setBarcode('');

    setCustomerName('');

    setPaymentMethod('cash');

    setCashGiven('');

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

  // TAX = ZERO FOR NOW
  const tax = 0;

  const total = subtotal + tax;

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
  // CAMERA
  // =========================================================

  const handleOpenScanner = () => {
    setScannerError('');

    setScannerOpen(true);

    setTimeout(() => {
      startScanner();
    }, 500);
  };

  // =========================================================
  // START SCANNER
  // =========================================================

  const startScanner = async () => {
    try {
      setScannerLoading(true);

      setScannerError('');

      if (!window.isSecureContext) {
        throw new Error(
          'Camera access requires HTTPS or localhost.'
        );
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        throw new Error(
          'Camera is not supported by this browser.'
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

      // Clean previous scanner
      if (scannerRef.current) {
        try {
          if (
            scannerRef.current
              .isScanning
          ) {
            await scannerRef.current.stop();
          }

          await scannerRef.current.clear();
        } catch (error) {
          console.log(
            'Scanner cleanup:',
            error
          );
        }

        scannerRef.current = null;
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

        qrbox: (
          width,
          height
        ) => {
          const scanWidth =
            Math.min(
              width * 0.9,
              360
            );

          const scanHeight =
            Math.min(
              height * 0.4,
              180
            );

          return {
            width:
              scanWidth,
            height:
              scanHeight
          };
        },

        aspectRatio:
          1.777778,

        disableFlip: false,

        formatsToSupport:
          formats,

        experimentalFeatures: {
          useBarCodeDetectorIfSupported:
            false
        }
      };

      const onScanSuccess =
        async (
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

            setScannerOpen(
              false
            );

            setBarcode(
              decodedText
            );

            await scanProduct(
              decodedText
            );
          } catch (error) {
            console.error(
              'Barcode scan error:',
              error
            );
          } finally {
            scanProcessingRef.current =
              false;
          }
        };

      const onScanFailure = () => {
        // Continue scanning.
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

      setScannerLoading(false);
    } catch (error) {
      console.error(
        'Camera error:',
        error
      );

      setScannerLoading(false);

      let message =
        'Unable to start camera.';

      if (!window.isSecureContext) {
        message =
          'Camera access requires HTTPS or localhost.';
      } else if (
        error?.name ===
        'NotAllowedError'
      ) {
        message =
          'Camera permission was denied. Please allow camera access.';
      } else if (
        error?.name ===
        'NotFoundError'
      ) {
        message =
          'No camera was found.';
      } else if (
        error?.name ===
        'NotReadableError'
      ) {
        message =
          'Camera is already being used by another application.';
      } else if (
        error?.message
      ) {
        message =
          error.message;
      }

      setScannerError(
        message
      );
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
      if (
        scanner.isScanning
      ) {
        await scanner.stop();
      }

      await scanner.clear();
    } catch (error) {
      console.error(
        'Stop scanner error:',
        error
      );
    }

    scannerRef.current =
      null;
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
        barcodeInputRef.current?.focus();
      }, 300);
    };

  // =========================================================
  // COMPLETE SALE
  // =========================================================

  const completeSale = () => {
    setError('');

    if (
      cartItems.length === 0
    ) {
      setError(
        'Please add at least one product.'
      );

      return;
    }

    // CASH IS REQUIRED
    if (
      paymentMethod ===
      'cash'
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
            total -
              cashAmount
          )}.`
        );

        return;
      }
    }

    const sale = {
      customerName,

      paymentMethod,

      items: cartItems,

      subtotal,

      tax: 0,

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
  // UI
  // =========================================================

  return (
    <MainCard title="POS Checkout">
      <Grid
        container
        spacing={3}
      >
        {/* ===================================================
            ADD PRODUCT
        =================================================== */}

        <Grid item xs={12}>
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
              Add Product
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
              spacing={2}
            >
              {/* =================================================
                  MOBILE-FRIENDLY INPUT
              ================================================= */}

              <TextField
                inputRef={
                  barcodeInputRef
                }
                label="Barcode or Product ID / SKU"
                placeholder="Scan barcode or enter Product ID"
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
                slotProps={{
                  htmlInput: {
                    inputMode:
                      'text',
                    enterKeyHint:
                      'done',
                    autoCapitalize:
                      'none',
                    autoCorrect:
                      'off',
                    spellCheck:
                      false
                  }
                }}
              />

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <Stack
                direction={{
                  xs: 'column',
                  sm: 'row'
                }}
                spacing={2}
                sx={{
                  width: '100%'
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={
                    handleAddProduct
                  }
                  disabled={
                    loadingProduct ||
                    !barcode.trim()
                  }
                  fullWidth
                  sx={{
                    minHeight: 52
                  }}
                >
                  {loadingProduct
                    ? 'Adding...'
                    : 'Add Product'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={
                    handleOpenScanner
                  }
                  disabled={
                    loadingProduct
                  }
                  fullWidth
                  sx={{
                    minHeight: 52
                  }}
                >
                  Scan Barcode
                </Button>
              </Stack>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Type a barcode or
                Product ID / SKU and
                tap Add Product.
                You do not need to
                press Enter.
              </Typography>

              {/* =================================================
                  TEST DATA
              ================================================= */}

              <Box
                sx={{
                  p: 2,

                  borderRadius: 2,

                  backgroundColor:
                    'background.default'
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{
                    mb: 1
                  }}
                >
                  Test products
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                >
                  Prestige:{' '}
                  6161101661447
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                >
                  Pringles:{' '}
                  5053990161966
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                >
                  Bonn:{' '}
                  8904022916344
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                >
                  Prestige SKU:{' '}
                  MAR-PRESTIGE-VAN-500G
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                >
                  Pringles SKU:{' '}
                  SNP-PRINGLES-BBQ-165G
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                >
                  Bonn SKU:{' '}
                  BIS-BONN-BOURBON-60G
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                >
                  No-barcode product:{' '}
                  MILK-500ML-001
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>

        {/* ===================================================
            CART
        =================================================== */}

        <Grid
          item
          xs={12}
          md={7}
        >
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
                Scan a barcode
                or enter a
                Product ID / SKU.
              </Typography>
            </Box>
          ) : (
            <List
              disablePadding
            >
              {cartItems.map(
                (item) => (
                  <ListItem
                    key={item.id}
                    divider
                    disableGutters
                    sx={{
                      py: 2,

                      display:
                        'flex',

                      flexWrap:
                        'wrap',

                      gap: 1.5
                    }}
                  >
                    {/* PRODUCT */}

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

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.brand}{' '}
                        {item.variant
                          ? `- ${item.variant}`
                          : ''}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.weight}{' '}
                        / {item.unit}
                      </Typography>

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

                    {/* PRICE */}

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Price
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

                    {/* TOTAL */}

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

            <Stack
              spacing={2}
            >
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
                onChange={(event) => {
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

              {/* CASH GIVEN */}

              {paymentMethod ===
                'cash' && (
                <>
                  <TextField
                    label="Cash Given"
                    type="number"
                    value={
                      cashGiven
                    }
                    onChange={(event) => {
                      setCashGiven(
                        event.target
                          .value
                      );

                      setError('');
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

              {/* SUBTOTAL */}

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

              {/* COMPLETE */}

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

              {/* PRINT */}

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

              minHeight: {
                xs: 300,
                sm: 350
              },

              backgroundColor:
                '#000',

              borderRadius: 2,

              overflow: 'hidden',

              position: 'relative',

              '& video': {
                width:
                  '100% !important',

                height:
                  'auto !important',

                objectFit:
                  'cover'
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
                <Typography color="white">
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
            Point the camera at
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
            After the barcode is
            detected, the product
            will automatically be
            added to the cart.
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