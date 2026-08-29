import { lazy } from 'react';

import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from '../ProtectedRoute';

const DashboardDefault = Loadable(
  lazy(() => import('pages/dashboard/default'))
);

const Color = Loadable(
  lazy(() => import('pages/component-overview/color'))
);

const Typography = Loadable(
  lazy(() => import('pages/component-overview/typography'))
);

const Shadow = Loadable(
  lazy(() => import('pages/component-overview/shadows'))
);

const CheckOut = Loadable(
  lazy(() => import('pages/checkOut'))
);

const ItemRegistration = Loadable(
  lazy(() => import('pages/ItemRegistration'))
);

const MainRoutes = {
  path: '/',
  element: <ProtectedRoute />,
  children: [
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        {
          path: '/',
          element: <DashboardDefault />
        },
        {
          path: 'dashboard',
          children: [
            {
              path: 'default',
              element: <DashboardDefault />
            }
          ]
        },
        {
          path: 'typography',
          element: <Typography />
        },
        {
          path: 'color',
          element: <Color />
        },
        {
          path: 'shadow',
          element: <Shadow />
        },
        {
          path: 'check-out',
          element: <CheckOut />
        },
        {
          path: 'product-registration',
          element: <ItemRegistration />
        }
      ]
    }
  ]
};

export default MainRoutes;
