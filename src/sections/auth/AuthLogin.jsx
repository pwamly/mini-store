"use strict";

import {
  useEffect,
  useRef,
  useState
} from "react";

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
} from "@mui/material";

import MainCard from "components/MainCard";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats
} from "html5-qrcode";

import {
  searchProducts
} from "api/productApi";

export default function CheckOut() {

  // =========================================================
  // STATE
  // =========================================================

  const [cartItems, setCartItems] = useState([]);
  const [barcode, setBarcode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashGiven, setCashGiven] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);

  const [loadingProduct, setLoadingProduct] = useState(false);

  const [error, setError] = useState("");
  const [scannerError, setScannerError] = useState("");

  const barcodeInputRef = useRef(null);
  const scannerRef = useRef(null);
  const scanProcessingRef = useRef(false);

  // =========================================================
  // TZS FORMAT
  // =========================================================

  const formatTZS = (amount) => {
    return new Intl.NumberFormat(
      "en-TZ",
      {
        style: "currency",
        currency: "TZS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    ).format(Number(amount) || 0);
  };

  // =========================================================
  // AUTO FOCUS / CLEANUP
  // =========================================================

  useEffect(() => {
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 300);

    return () => {
      stopScanner();
    };
  }, []);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleBarcodeChange = (event) => {
    setBarcode(event.target.value);

    if (error) {
      setError("");
    }
  };

  // =========================================================
  // ADD PRODUCT
  // =========================================================

  const handleAddProduct = async () => {
    const code = barcode.trim();

    if (!code) {
      setError(
        "Enter a barcode, SKU or product name first."
      );

      barcodeInputRef.current?.focus();

      return;
    }

    await scanProduct(code);
  };

  // =========================================================
  // ENTER
  // =========================================================

  const handleBarcodeKeyDown = async (event) => {
    if (event.key === "Enter") {
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

    setError("");
    setLoadingProduct(true);

    try {
      const response = await searchProducts(
        cleanCode
      );

      console.log(
        "PRODUCT SEARCH RESPONSE:",
        response
      );

      if (
        !response?.successful ||
        !Array.isArray(response.data) ||
        response.data.length === 0
      ) {
        setError(
          `No product found for "${cleanCode}".`
        );

        setBarcode("");

        return;
      }

      const product = response.data[0];

      const primaryBarcode =
        product.barcodes?.find(
          (item) =>
            item.isPrimary === true
        ) ||
        product.barcodes?.[0];

      const cartProduct = {
        id: product.id,

        sku: product.sku,

        name:
          product.itemName ||
          product.productName ||
          "Unnamed Product",

        productName:
          product.productName || "",

        description:
          product.description || "",

        productType:
          product.productType || "",

        brand:
          product.brand?.name || "",

        brandId:
          product.brandId,

        variant:
          product.details?.flavor || "",

        category:
          product.category?.name || "",

        categoryId:
          product.categoryId,

        weight:
          product.details?.netWeight
            ? `${product.details.netWeight}${product.details.weightUnit || ""}`
            : "",

        unit:
          product.unit?.name || "",

        unitId:
          product.unitId,

        price:
          Number(
            product.details?.sellingPrice || 0
          ),

        costPrice:
          Number(
            product.details?.costPrice || 0
          ),

        wholesalePrice:
          Number(
            product.details?.wholesalePrice || 0
          ),

        minimumSellingPrice:
          Number(
            product.details?.minimumSellingPrice || 0
          ),

        barcode:
          primaryBarcode?.barcode || "",

        barcodeType:
          primaryBarcode?.barcodeType || "",

        taxGroupId:
          product.taxGroupId,

        taxGroup:
          product.taxGroup?.name || "",

        status:
          product.status,

        details:
          product.details,

        originalProduct:
          product,

        qty: 1
      };

      if (cartProduct.price <= 0) {
        setError(
          `${cartProduct.name} does not have a valid selling price.`
        );

        return;
      }

      addToCart(cartProduct);

      setBarcode("");

    } catch (lookupError) {
      console.error(
        "Product lookup error:",
        lookupError
      );

      setError(
        lookupError?.message ||
        "Failed to fetch product."
      );

    } finally {
      setLoadingProduct(false);

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  };

  // =========================================================
  // ADD TO CART
  // =========================================================

  const addToCart = (product) => {
    setCartItems((currentItems) => {
      const existing =
        currentItems.find(
          (item) =>
            String(item.id) ===
            String(product.id)
        );

      if (existing) {
        return currentItems.map((item) => {
          if (
            String(item.id) !==
            String(product.id)
          ) {
            return item;
          }

          return {
            ...item,
            qty:
              Number(item.qty) + 1
          };
        });
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
  // QUANTITY
  // =========================================================

  const increaseQuantity = (id) => {
    setCartItems((items) =>
      items.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              qty:
                Number(item.qty) + 1
            }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCartItems((items) =>
      items
        .map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                qty:
                  Number(item.qty) - 1
              }
            : item
        )
        .filter(
          (item) =>
            Number(item.qty) > 0
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
    setBarcode("");
    setCustomerName("");
    setPaymentMethod("cash");
    setCashGiven("");
    setError("");

    setTimeout(() => {
      barcodeInputRef.current?.focus();
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

  const total = subtotal + tax;

  // =========================================================
  // CASH
  // =========================================================

  const cashAmount =
    Number(cashGiven) || 0;

  const insufficientCash =
    paymentMethod === "cash" &&
    cashGiven !== "" &&
    cashAmount < total;

  const change =
    paymentMethod === "cash"
      ? Math.max(
          cashAmount - total,
          0
        )
      : 0;

  // =========================================================
  // OPEN SCANNER
  // =========================================================

  const handleOpenScanner = () => {
    setScannerError("");
    scanProcessingRef.current = false;

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
      setScannerError("");

      if (!window.isSecureContext) {
        throw new Error(
          "Camera access requires HTTPS or localhost."
        );
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera is not supported by this browser."
        );
      }

      const reader =
        document.getElementById(
          "barcode-reader"
        );

      if (!reader) {
        throw new Error(
          "Barcode scanner element was not found."
        );
      }

      // -------------------------------------------------------
      // CLEAN PREVIOUS SCANNER
      // -------------------------------------------------------

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
            "Scanner cleanup:",
            cleanupError
          );
        }

        scannerRef.current = null;
      }

      // -------------------------------------------------------
      // CREATE SCANNER
      // -------------------------------------------------------

      const scanner =
        new Html5Qrcode(
          "barcode-reader"
        );

      scannerRef.current = scanner;

      // -------------------------------------------------------
      // SUPPORTED BARCODE FORMATS
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // SIMPLE CONFIG
      // -------------------------------------------------------
      // Important:
      // No forced aspectRatio.
      // No experimental BarcodeDetector.
      // This is more friendly to iPhone Safari.

      const config = {
        fps: 10,

        qrbox: {
          width: 300,
          height: 150
        },

        disableFlip: false,

        formatsToSupport: formats
      };

      // -------------------------------------------------------
      // SUCCESS
      // -------------------------------------------------------

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
          "BARCODE DETECTED:",
          decodedText
        );

        console.log(
          "FORMAT:",
          decodedResult
            ?.result
            ?.format
            ?.formatName
        );

        try {
          // Put barcode into input
          setBarcode(decodedText);

          // Stop camera
          await stopScanner();

          // Close scanner
          setScannerOpen(false);

          // Search product
          await scanProduct(
            decodedText
          );

        } catch (scanError) {
          console.error(
            "Barcode scan error:",
            scanError
          );

          setScannerError(
            scanError?.message ||
            "Failed to process barcode."
          );

        } finally {
          scanProcessingRef.current =
            false;
        }
      };

      // -------------------------------------------------------
      // FAILURE
      // -------------------------------------------------------

      const onScanFailure = () => {
        // Normal failed frames are ignored.
      };

      // -------------------------------------------------------
      // START CAMERA
      // -------------------------------------------------------

      await scanner.start(
        {
          facingMode: {
            ideal: "environment"
          }
        },
        config,
        onScanSuccess,
        onScanFailure
      );

      console.log(
        "BARCODE SCANNER STARTED"
      );

      // Camera information for debugging
      const video =
        document.querySelector(
          "#barcode-reader video"
        );

      if (video) {
        console.log(
          "Camera resolution:",
          video.videoWidth,
          "x",
          video.videoHeight
        );
      }

      setScannerLoading(false);

    } catch (cameraError) {
      console.error(
        "Camera error:",
        cameraError
      );

      setScannerLoading(false);

      let message =
        "Unable to start camera.";

      if (!window.isSecureContext) {
        message =
          "Camera access requires HTTPS or localhost.";

      } else if (
        cameraError?.name ===
        "NotAllowedError"
      ) {
        message =
          "Camera permission was denied. Please allow camera access.";

      } else if (
        cameraError?.name ===
        "NotFoundError"
      ) {
        message =
          "No camera was found.";

      } else if (
        cameraError?.name ===
        "NotReadableError"
      ) {
        message =
          "Camera is already being used by another application.";

      } else if (
        cameraError?.message
      ) {
        message =
          cameraError.message;
      }

      setScannerError(message);
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

      await scanner.clear();

    } catch (scannerError) {
      console.error(
        "Stop scanner error:",
        scannerError
      );
    }

    scannerRef.current = null;
  };

  // =========================================================
  // CLOSE SCANNER
  // =========================================================

  const handleCloseScanner =
    async () => {
      await stopScanner();

      setScannerOpen(false);
      setScannerLoading(false);
      setScannerError("");

      scanProcessingRef.current =
        false;

      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 300);
    };

  // =========================================================
  // COMPLETE SALE
  // =========================================================

  const completeSale = async () => {
    setError("");

    if (cartItems.length === 0) {
      setError(
        "Please add at least one product."
      );

      return;
    }

    if (paymentMethod === "cash") {
      if (cashGiven === "") {
        setError(
          "Please enter the total cash given by the customer."
        );

        return;
      }

      if (cashAmount < total) {
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
          quantity: Number(item.qty),
          unitPrice: Number(item.price),
          total:
            Number(item.qty) *
            Number(item.price)
        })
      ),

      subtotal,
      tax,
      total,

      cashGiven:
        paymentMethod === "cash"
          ? cashAmount
          : null,

      change:
        paymentMethod === "cash"
          ? change
          : 0,

      createdAt:
        new Date().toISOString()
    };

    console.log("SALE:", sale);

    let message = "";

    if (paymentMethod === "cash") {
      message =
        `SALE COMPLETED\n\n` +
        `Total: ${formatTZS(total)}\n` +
        `Cash Given: ${formatTZS(cashAmount)}\n` +
        `Change: ${formatTZS(change)}`;
    } else {
      message =
        `SALE COMPLETED\n\n` +
        `Total: ${formatTZS(total)}`;
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

      <Grid container spacing={3}>

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

              border: "1px solid",
              borderColor: "divider",
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
                sx={{ mb: 2 }}
                onClose={() =>
                  setError("")
                }
              >
                {error}
              </Alert>
            )}

            <Stack spacing={2}>

              <TextField
                inputRef={
                  barcodeInputRef
                }

                label="Barcode, SKU or Product Name"

                placeholder="Scan barcode or enter SKU / product name"

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
                    inputMode: "text",
                    enterKeyHint: "done",
                    autoCapitalize: "none",
                    autoCorrect: "off",
                    spellCheck: false
                  }
                }}
              />

              <Stack
                direction={{
                  xs: "column",
                  sm: "row"
                }}
                spacing={2}
                sx={{
                  width: "100%"
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
                    ? "Searching..."
                    : "Add Product"}
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
                Search using a barcode,
                SKU or product name.
                You can also scan a
                barcode with the camera.
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
            sx={{ mb: 1 }}
          >

            <Typography variant="h6">
              Order Items
            </Typography>

            {cartItems.length > 0 && (
              <Button
                color="error"
                size="small"
                onClick={clearCart}
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
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
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
                sx={{ mt: 1 }}
              >
                Scan a barcode or
                search for a product.
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
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 1.5
                    }}
                  >

                    <Box
                      sx={{
                        flex:
                          "1 1 180px",
                        minWidth: 0
                      }}
                    >

                      <Typography
                        fontWeight="bold"
                        sx={{
                          wordBreak:
                            "break-word"
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
                          {item.variant}
                        </Typography>
                      )}

                      {item.weight && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {item.weight}
                          {item.unit
                            ? ` / ${item.unit}`
                            : ""}
                        </Typography>
                      )}

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{
                          wordBreak:
                            "break-all"
                        }}
                      >
                        SKU: {item.sku}
                      </Typography>

                      {item.barcode ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Barcode:{" "}
                          {item.barcode}
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
                            "center"
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
                        textAlign: "right"
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
                          Number(item.qty) *
                          Number(item.price)
                        )}
                      </Typography>

                    </Box>

                    <Button
                      color="error"
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        removeItem(item.id)
                      }
                      sx={{
                        width: {
                          xs: "100%",
                          sm: "auto"
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

              border: "1px solid",
              borderColor: "divider",
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
                value={customerName}
                onChange={(event) =>
                  setCustomerName(
                    event.target.value
                  )
                }
                fullWidth
              />

              <Select
                value={paymentMethod}
                onChange={(event) => {
                  const method =
                    event.target.value;

                  setPaymentMethod(method);
                  setError("");

                  if (method !== "cash") {
                    setCashGiven("");
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

              {paymentMethod === "cash" && (
                <>

                  <TextField
                    label="Cash Given"
                    type="number"
                    value={cashGiven}
                    onChange={(event) => {
                      setCashGiven(
                        event.target.value
                      );

                      setError("");
                    }}
                    fullWidth
                    required
                    inputProps={{
                      min: 0,
                      step: 500
                    }}
                    placeholder="Enter cash received"
                    error={insufficientCash}
                    helperText={
                      insufficientCash
                        ? `Need ${formatTZS(
                            total -
                            cashAmount
                          )} more`
                        : "Required before completing a cash sale"
                    }
                  />

                  {cashGiven !== "" && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor:
                          insufficientCash
                            ? "error.lighter"
                            : "success.lighter",
                        border: "1px solid",
                        borderColor:
                          insufficientCash
                            ? "error.main"
                            : "success.main"
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

                        <Typography
                          fontWeight="bold"
                        >
                          {formatTZS(
                            cashAmount
                          )}
                        </Typography>

                      </Box>

                      <Box
                        display="flex"
                        justifyContent="space-between"
                        gap={2}
                        sx={{ mt: 1 }}
                      >

                        <Typography fontWeight="bold">
                          {insufficientCash
                            ? "Remaining"
                            : "Change"}
                        </Typography>

                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color={
                            insufficientCash
                              ? "error"
                              : "success.main"
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
                  {formatTZS(subtotal)}
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
                  sx={{
                    textAlign: "right"
                  }}
                >
                  {formatTZS(total)}
                </Typography>

              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={completeSale}
                disabled={
                  cartItems.length === 0 ||
                  (
                    paymentMethod === "cash" &&
                    (
                      cashGiven === "" ||
                      cashAmount < total
                    )
                  )
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
                onClick={printReceipt}
                disabled={
                  cartItems.length === 0
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
          BARCODE SCANNER
      ===================================================== */}

      <Dialog
        open={scannerOpen}
        onClose={handleCloseScanner}
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
              sx={{ mb: 2 }}
            >
              {scannerError}
            </Alert>
          )}

          {/* =================================================
              CAMERA
          ================================================= */}

          <Box
            sx={{
              width: "100%",
              minHeight: {
                xs: 300,
                sm: 350
              },

              backgroundColor: "#000",

              borderRadius: 2,

              overflow: "hidden",

              position: "relative",

              "& video": {
                width: "100% !important",
                maxWidth: "100%",
                objectFit: "cover"
              },

              "& #qr-shaded-region": {
                border:
                  "3px solid #fff !important"
              }
            }}
          >

            <div
              id="barcode-reader"
              style={{
                width: "100%"
              }}
            />

            {scannerLoading && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 20,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  zIndex: 10
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
            sx={{ mt: 2 }}
          >
            Point the camera at the barcode.
          </Typography>

          <Typography
            align="center"
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            The product will be added
            automatically when the barcode
            is detected.
          </Typography>

        </DialogContent>

        <DialogActions
          sx={{ p: 2 }}
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
