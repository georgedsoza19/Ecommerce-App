import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/layout/guards'
import { StoreLayout } from './components/layout/StoreLayout'
import { AccountAddressesPage } from './pages/store/AccountAddressesPage'
import { AccountLayout } from './pages/store/AccountLayout'
import { AccountOrdersPage } from './pages/store/AccountOrdersPage'
import { AccountProfilePage } from './pages/store/AccountProfilePage'
import { AccountWishlistPage } from './pages/store/AccountWishlistPage'
import { CartPage } from './pages/store/CartPage'
import { CheckoutPage } from './pages/store/CheckoutPage'
import { HomePage } from './pages/store/HomePage'
import { LoginPage } from './pages/store/LoginPage'
import { NotFoundPage } from './pages/store/NotFoundPage'
import { OrderDetailPage } from './pages/store/OrderDetailPage'
import { ProductDetailPage } from './pages/store/ProductDetailPage'
import { ProductsPage } from './pages/store/ProductsPage'
import { RegisterPage } from './pages/store/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<AccountProfilePage />} />
            <Route path="addresses" element={<AccountAddressesPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
          </Route>
          <Route path="account/orders/:id" element={<OrderDetailPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
