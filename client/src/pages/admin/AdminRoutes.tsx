import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { RequireAdmin } from '../../components/layout/guards'
import { AdminBannersPage } from './AdminBannersPage'
import { AdminCategoriesPage } from './AdminCategoriesPage'
import { AdminCouponsPage } from './AdminCouponsPage'
import { AdminOrderDetailPage } from './AdminOrderDetailPage'
import { AdminOrdersPage } from './AdminOrdersPage'
import { AdminOverviewPage } from './AdminOverviewPage'
import { AdminProductFormPage } from './AdminProductFormPage'
import { AdminProductsPage } from './AdminProductsPage'
import { AdminReturnsPage } from './AdminReturnsPage'
import { AdminSettingsPage } from './AdminSettingsPage'

/** Mounted at /admin/* and code-split from the storefront bundle. Requires role ADMIN. */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
