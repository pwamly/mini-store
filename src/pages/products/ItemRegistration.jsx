import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import {
  BarcodeOutlined,
  SaveOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';

export default function ItemRegistration() {
  // =========================================================
  // FORM STATE
  // =========================================================

  const [form, setForm] = useState({
    sku: '',
    itemName: '',
    productName: '',
    brand: '',
    productType: '',
    description: '',

    category: '',
    subcategory: '',

    netWeight: '',
    weightUnit: 'g',
    packagingType: '',
    unitOfMeasure: '',
    servings: '',
    servingSize: '',

    barcode: '',
    alternativeBarcode: '',
    manufacturer: '',
    countryOfOrigin: '',

    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    minimumSellingPrice: '',

    taxGroup: '',
    taxRate: '',

    openingStock: '',
    minimumStock: '',
    reorderLevel: '',
    reorderQuantity: '',
    supplier: '',
    storageLocation: '',

    batchTracking: 'no',
    expiryTracking: 'no',

    fssaiLicense: '',
    manufacturingDate: '',
    expiryDate: '',
    shelfLife: '',
    allergens: '',
    storageInstructions: ''
  });

  const [errors, setErrors] = useState({});

  const [success, setSuccess] = useState('');

  const [saved, setSaved] = useState(false);

  // =========================================================
  // HANDLE CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: ''
      }));
    }

    if (success) {
      setSuccess('');
    }

    setSaved(false);
  };

  // =========================================================
  // GENERATE SKU
  // =========================================================

  const generateSKU = () => {
    const prefix =
      form.brand
        ?.trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 4) || 'ITEM';

    const namePart =
      form.itemName
        ?.trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 8) || 'PRODUCT';

    const random =
      Math.floor(
        1000 + Math.random() * 9000
      );

    const sku =
      `${prefix}-${namePart}-${random}`;

    setForm((current) => ({
      ...current,
      sku
    }));
  };

  // =========================================================
  // GENERATE INTERNAL BARCODE
  // =========================================================
  //
  // This is NOT an official EAN/UPC generator.
  // It generates an internal item code for products
  // that do not have a manufacturer barcode.
  //
  // =========================================================

  const generateInternalBarcode = () => {
    const random =
      Math.floor(
        100000000000 +
          Math.random() *
            899999999999
      );

    setForm((current) => ({
      ...current,
      barcode: String(random)
    }));
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validate = () => {
    const newErrors = {};

    if (!form.itemName.trim()) {
      newErrors.itemName =
        'Item name is required.';
    }

    if (!form.sku.trim()) {
      newErrors.sku =
        'SKU / Item Code is required.';
    }

    if (!form.category) {
      newErrors.category =
        'Please select a category.';
    }

    if (!form.unitOfMeasure) {
      newErrors.unitOfMeasure =
        'Unit of measure is required.';
    }

    if (!form.barcode.trim()) {
      newErrors.barcode =
        'Barcode / EAN is required.';
    }

    if (!form.sellingPrice) {
      newErrors.sellingPrice =
        'Selling price is required.';
    }

    if (
      form.sellingPrice &&
      Number(form.sellingPrice) < 0
    ) {
      newErrors.sellingPrice =
        'Selling price cannot be negative.';
    }

    if (
      form.costPrice &&
      Number(form.costPrice) < 0
    ) {
      newErrors.costPrice =
        'Cost price cannot be negative.';
    }

    if (
      form.openingStock &&
      Number(form.openingStock) < 0
    ) {
      newErrors.openingStock =
        'Opening stock cannot be negative.';
    }

    if (
      form.minimumStock &&
      Number(form.minimumStock) < 0
    ) {
      newErrors.minimumStock =
        'Minimum stock cannot be negative.';
    }

    if (
      form.reorderLevel &&
      Number(form.reorderLevel) < 0
    ) {
      newErrors.reorderLevel =
        'Reorder level cannot be negative.';
    }

    if (
      form.expiryDate &&
      form.manufacturingDate &&
      form.expiryDate <
        form.manufacturingDate
    ) {
      newErrors.expiryDate =
        'Expiry date cannot be before manufacturing date.';
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors)
        .length === 0
    );
  };

  // =========================================================
  // SAVE ITEM
  // =========================================================

  const handleSave = () => {
    setSuccess('');

    if (!validate()) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      return;
    }

    const product = {
      id: Date.now(),

      sku: form.sku.trim(),

      barcode:
        form.barcode.trim(),

      alternativeBarcode:
        form.alternativeBarcode.trim(),

      name:
        form.itemName.trim(),

      productName:
        form.productName.trim(),

      brand:
        form.brand.trim(),

      productType:
        form.productType.trim(),

      description:
        form.description.trim(),

      category:
        form.category,

      subcategory:
        form.subcategory,

      netWeight:
        form.netWeight,

      weightUnit:
        form.weightUnit,

      packagingType:
        form.packagingType,

      unit:
        form.unitOfMeasure,

      servings:
        form.servings,

      servingSize:
        form.servingSize,

      manufacturer:
        form.manufacturer.trim(),

      countryOfOrigin:
        form.countryOfOrigin.trim(),

      costPrice:
        Number(form.costPrice) || 0,

      price:
        Number(form.sellingPrice) || 0,

      wholesalePrice:
        Number(form.wholesalePrice) || 0,

      minimumSellingPrice:
        Number(
          form.minimumSellingPrice
        ) || 0,

      taxGroup:
        form.taxGroup,

      taxRate:
        Number(form.taxRate) || 0,

      openingStock:
        Number(form.openingStock) || 0,

      minimumStock:
        Number(form.minimumStock) || 0,

      reorderLevel:
        Number(form.reorderLevel) || 0,

      reorderQuantity:
        Number(form.reorderQuantity) || 0,

      supplier:
        form.supplier,

      storageLocation:
        form.storageLocation,

      batchTracking:
        form.batchTracking ===
        'yes',

      expiryTracking:
        form.expiryTracking ===
        'yes',

      fssaiLicense:
        form.fssaiLicense.trim(),

      manufacturingDate:
        form.manufacturingDate,

      expiryDate:
        form.expiryDate,

      shelfLife:
        form.shelfLife.trim(),

      allergens:
        form.allergens.trim(),

      storageInstructions:
        form.storageInstructions.trim(),

      createdAt:
        new Date().toISOString()
    };

    console.log(
      'REGISTERED PRODUCT:',
      product
    );

    setSaved(true);

    setSuccess(
      `${product.name} has been registered successfully.`
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // =========================================================
  // RESET
  // =========================================================

  const handleReset = () => {
    setForm({
      sku: '',
      itemName: '',
      productName: '',
      brand: '',
      productType: '',
      description: '',

      category: '',
      subcategory: '',

      netWeight: '',
      weightUnit: 'g',
      packagingType: '',
      unitOfMeasure: '',
      servings: '',
      servingSize: '',

      barcode: '',
      alternativeBarcode: '',
      manufacturer: '',
      countryOfOrigin: '',

      costPrice: '',
      sellingPrice: '',
      wholesalePrice: '',
      minimumSellingPrice: '',

      taxGroup: '',
      taxRate: '',

      openingStock: '',
      minimumStock: '',
      reorderLevel: '',
      reorderQuantity: '',
      supplier: '',
      storageLocation: '',

      batchTracking: 'no',
      expiryTracking: 'no',

      fssaiLicense: '',
      manufacturingDate: '',
      expiryDate: '',
      shelfLife: '',
      allergens: '',
      storageInstructions: ''
    });

    setErrors({});
    setSuccess('');
    setSaved(false);
  };

  // =========================================================
  // CURRENCY
  // =========================================================

  const formatTZS = (amount) => {
    return new Intl.NumberFormat(
      'en-TZ',
      {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    ).format(
      Number(amount) || 0
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <MainCard
      title="Item Registration"
    >
      <Stack spacing={3}>
        {/* =====================================================
            ALERTS
        ===================================================== */}

        {success && (
          <Alert
            severity="success"
            onClose={() =>
              setSuccess('')
            }
          >
            {success}
          </Alert>
        )}

        {Object.keys(errors)
          .length > 0 && (
          <Alert severity="error">
            Please correct the
            highlighted fields before
            saving the item.
          </Alert>
        )}

        {/* =====================================================
            BASIC INFORMATION
        ===================================================== */}

        <Box>
          <Typography
            variant="h6"
            gutterBottom
          >
            Basic Product Information
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Enter the main information
            used to identify this item
            throughout the POS.
          </Typography>

          <Divider
            sx={{ mb: 3 }}
          />

          <Grid
            container
            spacing={2}
          >
            {/* SKU */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="sku"
                label="Item Code / SKU"
                value={form.sku}
                onChange={
                  handleChange
                }
                error={
                  Boolean(errors.sku)
                }
                helperText={
                  errors.sku ||
                  'Unique internal product code'
                }
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={
                          generateSKU
                        }
                      >
                        Generate
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* ITEM NAME */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="itemName"
                label="Item Name"
                value={
                  form.itemName
                }
                onChange={
                  handleChange
                }
                error={
                  Boolean(
                    errors.itemName
                  )
                }
                helperText={
                  errors.itemName ||
                  'Name displayed in POS checkout'
                }
                fullWidth
                required
              />
            </Grid>

            {/* PRODUCT NAME */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="productName"
                label="Product Name"
                value={
                  form.productName
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Bonn Classic Bourbon Biscuits"
              />
            </Grid>

            {/* BRAND */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="brand"
                label="Brand"
                value={form.brand}
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Bonn"
              />
            </Grid>

            {/* PRODUCT TYPE */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="productType"
                label="Product Type"
                value={
                  form.productType
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Chocolate Cream Sandwich Biscuit"
              />
            </Grid>

            {/* CATEGORY */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormControl
                fullWidth
                required
                error={
                  Boolean(
                    errors.category
                  )
                }
              >
                <InputLabel>
                  Category
                </InputLabel>

                <Select
                  name="category"
                  value={
                    form.category
                  }
                  label="Category"
                  onChange={
                    handleChange
                  }
                >
                  <MenuItem value="">
                    Select Category
                  </MenuItem>

                  <MenuItem value="Groceries">
                    Groceries
                  </MenuItem>

                  <MenuItem value="Biscuits">
                    Biscuits
                  </MenuItem>

                  <MenuItem value="Snacks">
                    Snacks
                  </MenuItem>

                  <MenuItem value="Dairy">
                    Dairy
                  </MenuItem>

                  <MenuItem value="Beverages">
                    Beverages
                  </MenuItem>

                  <MenuItem value="Margarine & Spreads">
                    Margarine & Spreads
                  </MenuItem>

                  <MenuItem value="Household">
                    Household
                  </MenuItem>

                  <MenuItem value="Personal Care">
                    Personal Care
                  </MenuItem>
                </Select>

                <FormHelperText>
                  {errors.category ||
                    'Main product category'}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* SUBCATEGORY */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="subcategory"
                label="Subcategory"
                value={
                  form.subcategory
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Cream Biscuits"
              />
            </Grid>

            {/* DESCRIPTION */}

            <Grid
              item
              xs={12}
            >
              <TextField
                name="description"
                label="Full Description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                multiline
                rows={3}
                fullWidth
                placeholder="Bonn Classic Bourbon Biscuits - Chocolaty & Delicious"
              />
            </Grid>
          </Grid>
        </Box>

        {/* =====================================================
            PACKAGING
        ===================================================== */}

        <Box>
          <Typography
            variant="h6"
            gutterBottom
          >
            Packaging & Size
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Define how the item is
            packaged and sold.
          </Typography>

          <Divider
            sx={{ mb: 3 }}
          />

          <Grid
            container
            spacing={2}
          >
            {/* WEIGHT */}

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <TextField
                name="netWeight"
                label="Net Weight"
                value={
                  form.netWeight
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
              />
            </Grid>

            {/* WEIGHT UNIT */}

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Weight Unit
                </InputLabel>

                <Select
                  name="weightUnit"
                  value={
                    form.weightUnit
                  }
                  label="Weight Unit"
                  onChange={
                    handleChange
                  }
                >
                  <MenuItem value="g">
                    Grams (g)
                  </MenuItem>

                  <MenuItem value="kg">
                    Kilograms (kg)
                  </MenuItem>

                  <MenuItem value="ml">
                    Millilitres (ml)
                  </MenuItem>

                  <MenuItem value="L">
                    Litres (L)
                  </MenuItem>

                  <MenuItem value="pcs">
                    Pieces
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* PACKAGING */}

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="packagingType"
                label="Packaging Type"
                value={
                  form.packagingType
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Flow Wrap Packet"
              />
            </Grid>

            {/* UNIT */}

            <Grid
              item
              xs={12}
              md={4}
            >
              <FormControl
                fullWidth
                required
                error={
                  Boolean(
                    errors.unitOfMeasure
                  )
                }
              >
                <InputLabel>
                  Unit of Measure
                </InputLabel>

                <Select
                  name="unitOfMeasure"
                  value={
                    form.unitOfMeasure
                  }
                  label="Unit of Measure"
                  onChange={
                    handleChange
                  }
                >
                  <MenuItem value="">
                    Select Unit
                  </MenuItem>

                  <MenuItem value="Packet">
                    Packet
                  </MenuItem>

                  <MenuItem value="Piece">
                    Piece
                  </MenuItem>

                  <MenuItem value="Bottle">
                    Bottle
                  </MenuItem>

                  <MenuItem value="Can">
                    Can
                  </MenuItem>

                  <MenuItem value="Tub">
                    Tub
                  </MenuItem>

                  <MenuItem value="Box">
                    Box
                  </MenuItem>

                  <MenuItem value="Carton">
                    Carton
                  </MenuItem>

                  <MenuItem value="Kg">
                    Kg
                  </MenuItem>

                  <MenuItem value="Litre">
                    Litre
                  </MenuItem>
                </Select>

                <FormHelperText>
                  {errors.unitOfMeasure}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* SERVINGS */}

            <Grid
              item
              xs={12}
              sm={6}
              md={4}
            >
              <TextField
                name="servings"
                label="Servings Per Pack"
                value={
                  form.servings
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
              />
            </Grid>

            {/* SERVING SIZE */}

            <Grid
              item
              xs={12}
              sm={6}
              md={4}
            >
              <TextField
                name="servingSize"
                label="Serving Size"
                value={
                  form.servingSize
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="1 Pc (10g)"
              />
            </Grid>
          </Grid>
        </Box>

        {/* =====================================================
            BARCODE
        ===================================================== */}

        <Box>
          <Typography
            variant="h6"
            gutterBottom
          >
            Barcode & Identification
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Barcode and SKU information
            is used when selling products
            through POS Checkout.
          </Typography>

          <Divider
            sx={{ mb: 3 }}
          />

          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="barcode"
                label="Barcode / EAN"
                value={form.barcode}
                onChange={
                  handleChange
                }
                error={
                  Boolean(
                    errors.barcode
                  )
                }
                helperText={
                  errors.barcode ||
                  'Example: 8904022916344'
                }
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BarcodeOutlined />
                    </InputAdornment>
                  ),

                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={
                          generateInternalBarcode
                        }
                      >
                        Generate
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="alternativeBarcode"
                label="Alternative Barcode"
                value={
                  form.alternativeBarcode
                }
                onChange={
                  handleChange
                }
                fullWidth
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="manufacturer"
                label="Manufacturer"
                value={
                  form.manufacturer
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Bonn Biscuits Pvt. Ltd."
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="countryOfOrigin"
                label="Country of Origin"
                value={
                  form.countryOfOrigin
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Product of India"
              />
            </Grid>
          </Grid>
        </Box>

        {/* =====================================================
            PRICING
        ===================================================== */}

        <Box>
          <Typography
            variant="h6"
            gutterBottom
          >
            Pricing & Tax
          </Typography>

          <Divider
            sx={{ mb: 3 }}
          />

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
              <TextField
                name="costPrice"
                label="Cost Price"
                value={
                  form.costPrice
                }
                onChange={
                  handleChange
                }
                type="number"
                error={
                  Boolean(
                    errors.costPrice
                  )
                }
                helperText={
                  errors.costPrice
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      TZS
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <TextField
                name="sellingPrice"
                label="Selling Price"
                value={
                  form.sellingPrice
                }
                onChange={
                  handleChange
                }
                type="number"
                required
                error={
                  Boolean(
                    errors.sellingPrice
                  )
                }
                helperText={
                  errors.sellingPrice
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      TZS
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <TextField
                name="wholesalePrice"
                label="Wholesale Price"
                value={
                  form.wholesalePrice
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      TZS
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <TextField
                name="minimumSellingPrice"
                label="Minimum Selling Price"
                value={
                  form.minimumSellingPrice
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      TZS
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Tax Group
                </InputLabel>

                <Select
                  name="taxGroup"
                  value={
                    form.taxGroup
                  }
                  label="Tax Group"
                  onChange={
                    handleChange
                  }
                >
                  <MenuItem value="">
                    No Tax
                  </MenuItem>

                  <MenuItem value="VAT Applicable - Confectionery">
                    VAT Applicable -
                    Confectionery
                  </MenuItem>

                  <MenuItem value="VAT Standard">
                    VAT Standard
                  </MenuItem>

                  <MenuItem value="VAT Zero Rated">
                    VAT Zero Rated
                  </MenuItem>

                  <MenuItem value="VAT Exempt">
                    VAT Exempt
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="taxRate"
                label="Tax Rate"
                value={
                  form.taxRate
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      %
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* =====================================================
            INVENTORY
        ===================================================== */}

        <Box>
          <Typography
            variant="h6"
            gutterBottom
          >
            Inventory Settings
          </Typography>

          <Divider
            sx={{ mb: 3 }}
          />

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
              <TextField
                name="openingStock"
                label="Opening Stock"
                value={
                  form.openingStock
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <TextField
                name="minimumStock"
                label="Minimum Stock"
                value={
                  form.minimumStock
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <TextField
                name="reorderLevel"
                label="Reorder Level"
                value={
                  form.reorderLevel
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
              />
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <TextField
                name="reorderQuantity"
                label="Reorder Quantity"
                value={
                  form.reorderQuantity
                }
                onChange={
                  handleChange
                }
                type="number"
                fullWidth
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Supplier
                </InputLabel>

                <Select
                  name="supplier"
                  value={
                    form.supplier
                  }
                  label="Supplier"
                  onChange={
                    handleChange
                  }
                >
                  <MenuItem value="">
                    Select Supplier
                  </MenuItem>

                  <MenuItem value="Bonn Distributor">
                    Bonn Distributor
                  </MenuItem>

                  <MenuItem value="Local Supplier">
                    Local Supplier
                  </MenuItem>

                  <MenuItem value="Main Wholesaler">
                    Main Wholesaler
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="storageLocation"
                label="Storage Location"
                value={
                  form.storageLocation
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Shelf A3"
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Batch Tracking
                </InputLabel>

                <Select
                  name="batchTracking"
                  value={
                    form.batchTracking
                  }
                  label="Batch Tracking"
                  onChange={
                    handleChange
                  }
                >
                  <MenuItem value="no">
                    No
                  </MenuItem>

                  <MenuItem value="yes">
                    Yes
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Expiry Tracking
                </InputLabel>

                <Select
                  name="expiryTracking"
                  value={
                    form.expiryTracking
                  }
                  label="Expiry Tracking"
                  onChange={
                    handleChange
                  }
                >
                  <MenuItem value="no">
                    No
                  </MenuItem>

                  <MenuItem value="yes">
                    Yes
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* =====================================================
            REGULATORY
        ===================================================== */}

        <Box>
          <Typography
            variant="h6"
            gutterBottom
          >
            Food & Regulatory Information
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Optional information for
            food, grocery and regulated
            products.
          </Typography>

          <Divider
            sx={{ mb: 3 }}
          />

          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="fssaiLicense"
                label="FSSAI License No."
                value={
                  form.fssaiLicense
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="10012063000078"
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={3}
            >
              <TextField
                name="manufacturingDate"
                label="Manufacturing Date"
                value={
                  form.manufacturingDate
                }
                onChange={
                  handleChange
                }
                type="date"
                fullWidth
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={3}
            >
              <TextField
                name="expiryDate"
                label="Expiry Date"
                value={
                  form.expiryDate
                }
                onChange={
                  handleChange
                }
                type="date"
                error={
                  Boolean(
                    errors.expiryDate
                  )
                }
                helperText={
                  errors.expiryDate
                }
                fullWidth
                InputLabelProps={{
                  shrink: true
                }}
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="shelfLife"
                label="Shelf Life"
                value={
                  form.shelfLife
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Best before 12 months from Mfg"
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                name="storageInstructions"
                label="Storage Instructions"
                value={
                  form.storageInstructions
                }
                onChange={
                  handleChange
                }
                fullWidth
                placeholder="Store in Cool & Dry Place"
              />
            </Grid>

            <Grid
              item
              xs={12}
            >
              <TextField
                name="allergens"
                label="Allergens"
                value={
                  form.allergens
                }
                onChange={
                  handleChange
                }
                multiline
                rows={3}
                fullWidth
                placeholder="Contains Wheat (Gluten), Soy and Milk. May contain Nuts."
              />
            </Grid>
          </Grid>
        </Box>

        {/* =====================================================
            PRODUCT PREVIEW
        ===================================================== */}

        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor:
              'background.default',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
          >
            POS Preview
          </Typography>

          <Divider
            sx={{ mb: 2 }}
          />

          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={8}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
              >
                {form.itemName ||
                  'Product Name'}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {form.brand ||
                  'Brand'}
                {form.variant
                  ? ` - ${form.variant}`
                  : ''}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {form.netWeight
                  ? `${form.netWeight} ${form.weightUnit}`
                  : 'Size not specified'}

                {form.unitOfMeasure
                  ? ` / ${form.unitOfMeasure}`
                  : ''}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                SKU:{' '}
                {form.sku ||
                  'Not assigned'}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Barcode:{' '}
                {form.barcode ||
                  'Not assigned'}
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              md={4}
            >
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Selling Price
              </Typography>

              <Typography
                variant="h5"
                color="primary"
                fontWeight="bold"
              >
                {formatTZS(
                  form.sellingPrice
                )}
              </Typography>

              {form.costPrice && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Cost:{' '}
                  {formatTZS(
                    form.costPrice
                  )}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* =====================================================
            ACTIONS
        ===================================================== */}

        <Divider />

        <Stack
          direction={{
            xs: 'column-reverse',
            sm: 'row'
          }}
          spacing={2}
          justifyContent="flex-end"
        >
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={
              <DeleteOutlined />
            }
            onClick={handleReset}
            sx={{
              minHeight: 50
            }}
          >
            Clear Form
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={
              <ReloadOutlined />
            }
            onClick={handleReset}
            sx={{
              minHeight: 50
            }}
          >
            Reset
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={
              <SaveOutlined />
            }
            onClick={handleSave}
            sx={{
              minHeight: 50,
              minWidth: {
                sm: 180
              }
            }}
          >
            Save Item
          </Button>
        </Stack>
      </Stack>
    </MainCard>
  );
}
