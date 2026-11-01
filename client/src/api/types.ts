export type Role = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: Role
  createdAt?: string
  updatedAt?: string
}

export interface Settings {
  storeName: string
  supportEmail: string
  currency: string
  flatShippingCents: number
  freeShippingThresholdCents: number
  taxRateBps: number
}

export interface AdminSettings extends Settings {
  id: string
  lowStockThreshold: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  parentId: string | null
  active: boolean
  sortOrder: number
}

export interface ProductImage {
  url: string
  alt: string
  sortOrder: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  priceCents: number
  compareAtCents: number | null
  sku: string
  stock: number
  active: boolean
  featured: boolean
  categoryId: string
  category?: { id: string; name: string; slug: string }
  images: ProductImage[]
  inStock: boolean
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ProductList {
  products: Product[]
  pagination: Pagination
}

export interface Banner {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
  placement: string
  sortOrder: number
  active: boolean
}

export interface CartLine {
  productId: string
  name: string
  slug: string
  sku: string
  imageUrl: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
  stock: number
  categoryId: string
}

export interface Cart {
  items: CartLine[]
  itemCount: number
  coupon: { id: string; code: string; type: string; value: number } | null
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  currency: string
}

export interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    slug: string
    priceCents: number
    stock: number
    imageUrl: string
    inStock: boolean
  }
}

export interface AddressInput {
  fullName: string
  line1: string
  line2: string
  city: string
  region: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

export interface Address extends AddressInput {
  id: string
}

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface OrderItem {
  productId: string
  name: string
  sku: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
  imageUrl: string
}

export interface ShippingAddress {
  fullName: string
  line1: string
  line2: string
  city: string
  region: string
  postalCode: string
  country: string
  phone: string
}

export interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  shippingAddress: ShippingAddress
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  status: OrderStatus
  couponCode: string | null
  paymentRef: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  email: string
  name: string
}

export interface AdminOrder extends Order {
  customer: Customer | null
}

export const RETURN_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'] as const
export type ReturnStatus = (typeof RETURN_STATUSES)[number]

export interface ReturnRequest {
  id: string
  orderId: string
  userId: string
  reason: string
  status: ReturnStatus
  adminNote: string
  createdAt: string
  updatedAt: string
}

export interface AdminReturnRequest extends ReturnRequest {
  orderNumber: string | null
  customer: Customer | null
}

export type CouponType = 'PERCENT' | 'FIXED'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minSubtotalCents: number
  maxDiscountCents: number | null
  startsAt: string | null
  endsAt: string | null
  usageLimit: number | null
  usedCount: number
  active: boolean
  categoryId: string | null
}

export interface Metrics {
  revenueCents: number
  orderCount: number
  customerCount: number
  lowStockCount: number
  openReturns: number
  currency: string
}

export interface RecentOrder {
  id: string
  orderNumber: string
  totalCents: number
  status: OrderStatus
  createdAt: string
}
