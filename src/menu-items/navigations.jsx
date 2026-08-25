// assets
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  TransactionOutlined,
  TeamOutlined,
  BarChartOutlined,
  InboxOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  ShopOutlined,
  ScanOutlined,
  RollbackOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  PrinterOutlined,
  WalletOutlined
} from '@ant-design/icons';

// icons
const icons = {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  TransactionOutlined,
  TeamOutlined,
  BarChartOutlined,
  InboxOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SettingOutlined,
  ShopOutlined,
  ScanOutlined,
  RollbackOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  PrinterOutlined,
  WalletOutlined
};

// ==============================|| MENU ITEMS ||============================== //

const navigations = {
  id: 'navigation',
  title: 'MINIMART POS',
  type: 'group',
  children: [
    // ================= DASHBOARD =================
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard',
      icon: icons.DashboardOutlined
    },

    // ================= CASHIER / POS =================
    {
      id: 'pos',
      title: 'POS Checkout',
      type: 'item',
      url: '/check-out',
      icon: icons.ShoppingCartOutlined
    },

    // ================= ORDERS =================
    {
      id: 'orders',
      title: 'Orders',
      type: 'item',
      url: '/orders',
      icon: icons.TransactionOutlined
    },

    // ================= RETURNS =================
    {
      id: 'returns',
      title: 'Returns',
      type: 'item',
      url: '/returns',
      icon: icons.RollbackOutlined
    },

    // ================= PRODUCTS =================
    {
      id: 'products',
      title: 'Products',
      type: 'item',
      url: '/products',
      icon: icons.ShoppingOutlined
    },

    // ================= CATEGORIES =================
    {
      id: 'categories',
      title: 'Categories',
      type: 'item',
      url: '/categories',
      icon: icons.AppstoreOutlined
    },

    // ================= INVENTORY =================
    {
      id: 'inventory',
      title: 'Inventory',
      type: 'item',
      url: '/inventory',
      icon: icons.InboxOutlined
    },

    // ================= LOW STOCK =================
    {
      id: 'low-stock',
      title: 'Low Stock Alerts',
      type: 'item',
      url: '/low-stock',
      icon: icons.WarningOutlined
    },

    // ================= BARCODE =================
    {
      id: 'barcode-scanner',
      title: 'Barcode Scanner',
      type: 'item',
      url: '/barcode-scanner',
      icon: icons.ScanOutlined
    },

    // ================= SUPPLIERS =================
    {
      id: 'suppliers',
      title: 'Suppliers',
      type: 'item',
      url: '/suppliers',
      icon: icons.ShopOutlined
    },

    // ================= PURCHASE ORDERS =================
    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      type: 'item',
      url: '/purchase-orders',
      icon: icons.FileTextOutlined
    },

    // ================= EXPENSES =================
    {
      id: 'expenses',
      title: 'Expenses',
      type: 'item',
      url: '/expenses',
      icon: icons.WalletOutlined
    },

    // ================= CUSTOMERS =================
    {
      id: 'customers',
      title: 'Customers',
      type: 'item',
      url: '/customers',
      icon: icons.TeamOutlined
    },

    // ================= REVENUE =================
    {
      id: 'revenue',
      title: 'Revenue',
      type: 'item',
      url: '/revenue',
      icon: icons.DollarCircleOutlined
    },

    // ================= ANALYTICS =================
    {
      id: 'analytics',
      title: 'Analytics',
      type: 'item',
      url: '/analytics',
      icon: icons.BarChartOutlined
    },

    // ================= TOP SELLING =================
    {
      id: 'top-selling',
      title: 'Top Selling Products',
      type: 'item',
      url: '/top-selling',
      icon: icons.TrophyOutlined
    },

    // ================= USER ROLES =================
    {
      id: 'roles',
      title: 'User Roles',
      type: 'item',
      url: '/roles',
      icon: icons.SafetyCertificateOutlined
    },

    // ================= MULTI BRANCH =================
    {
      id: 'branches',
      title: 'Multi Branch',
      type: 'item',
      url: '/branches',
      icon: icons.ApartmentOutlined
    },

    // ================= RECEIPT PRINTING =================
    {
      id: 'receipt-printing',
      title: 'Receipt Printing',
      type: 'item',
      url: '/receipt-printing',
      icon: icons.PrinterOutlined
    },

    // ================= SETTINGS =================
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/settings',
      icon: icons.SettingOutlined
    }
  ]
};

export default navigations;