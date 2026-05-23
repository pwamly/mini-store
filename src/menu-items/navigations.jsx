// assets
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  TransactionOutlined,
  TeamOutlined,
  LineChartOutlined
} from '@ant-design/icons';

// icons
const icons = {
  ShoppingCartOutlined,
  ShoppingOutlined,
  DollarCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  TransactionOutlined,
  TeamOutlined,
  LineChartOutlined
};

// ==============================|| MENU ITEMS - NAVIGATIONS ||============================== //

const navigations = {
  id: 'navigations',
  title: 'Navigations',
  type: 'group',
  children: [
    {
      id: 'today-sales',
      title: 'Today’s Sales',
      type: 'item',
      url: '/store',
      icon: icons.LineChartOutlined
    },
    {
      id: 'orders-count',
      title: 'Orders Count',
      type: 'item',
      url: '/orders',
      icon: icons.ShoppingCartOutlined
    },
    {
      id: 'revenue',
      title: 'Revenue',
      type: 'item',
      url: '/revenue',
      icon: icons.DollarCircleOutlined
    },
    {
      id: 'low-stock-alerts',
      title: 'Low Stock Alerts',
      type: 'item',
      url: '/low-stock',
      icon: icons.WarningOutlined
    },
    {
      id: 'top-selling-products',
      title: 'Top-selling Products',
      type: 'item',
      url: '/top-selling',
      icon: icons.TrophyOutlined
    },
    {
      id: 'recent-transactions',
      title: 'Recent Transactions',
      type: 'item',
      url: '/recent-transactions',
      icon: icons.TransactionOutlined
    },
    {
      id: 'staff-activity',
      title: 'Staff Activity',
      type: 'item',
      url: '/staff-activity',
      icon: icons.TeamOutlined
    },
    {
      id: 'products',
      title: 'Products',
      type: 'item',
      url: '/products',
      icon: icons.ShoppingOutlined
    }
  ]
};

export default navigations;