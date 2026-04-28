export interface ProductImage {
  id: string;
  productId: string;
  cloudinaryUrl: string;
  order: number;
}

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  stars: number;
  comment?: string;
  createdAt: string;
  user?: { name?: string | null };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string; // Decimal comes as string from JSON
  convertibleToKeychain: boolean;
  soldCount: number;
  stock: number | null;
  active: boolean;
  publishedAt: string;
  images: ProductImage[];
  reviews?: Review[];
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type ProductSort = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';

// ── Carrito ──────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name:      string;
  price:     number;
  imageUrl?: string;
  quantity:  number;
  asKeychain: boolean;
}

// ── Pedidos ──────────────────────────────────────────────────────────────────

export type ShippingZone   = 'peninsular' | 'baleares' | 'canarias' | 'international';
export type OrderStatus    = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED';
export type PaymentStatus  = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItemDetail {
  id:         string;
  productId:  string;
  quantity:   number;
  asKeychain: boolean;
  unitPrice:  string;
  product: {
    name:   string;
    images: { cloudinaryUrl: string }[];
    stock?: number | null;
  };
}

export interface ShippingAddress {
  id:         string;
  name:       string;
  street:     string;
  street2?:   string | null;
  city:       string;
  postalCode: string;
  country:    string;
}

export interface Order {
  id:                      string;
  guestEmail?:             string;
  guestName?:              string;
  status:                  OrderStatus;
  subtotal:                string;
  shippingCost:            string;
  total:                   string;
  createdAt:               string;
  paymentStatus:           PaymentStatus;
  paymentProvider?:        string | null;
  stripeCheckoutSessionId?: string | null;
  paidAt?:                 string | null;
  items:                   OrderItemDetail[];
  address?:                ShippingAddress;
}

export interface PaginatedOrders {
  orders: Order[];
  total:  number;
  page:   number;
  limit:  number;
  pages:  number;
}

export interface OrdersAvailability {
  ordersEnabled: boolean;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number; asKeychain: boolean }[];
  guestEmail:            string;
  guestName:             string;
  shippingZone:          ShippingZone;
  saveAddressToProfile?: boolean;
  address: {
    name:       string;
    street:     string;
    street2?:   string;
    city:       string;
    postalCode: string;
    country:    string;
  };
}

export type ShippingRates = Record<ShippingZone, number>;

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:             string;
  email:          string;
  name?:          string | null;
  isAdmin:        boolean;
  addressName?:    string | null;
  addressStreet?:  string | null;
  addressStreet2?: string | null;
  addressCity?:    string | null;
  addressPostal?:  string | null;
  addressCountry?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email:          string;
  password:       string;
  name?:          string;
  addressName?:   string;
  addressStreet?: string;
  addressStreet2?: string;
  addressCity?:   string;
  addressPostal?: string;
  addressCountry?: string;
}

export interface UpdateProfilePayload {
  name?:           string | null;
  email?:          string;
  addressName?:    string | null;
  addressStreet?:  string | null;
  addressStreet2?: string | null;
  addressCity?:    string | null;
  addressPostal?:  string | null;
  addressCountry?: string | null;
}

export interface CreateReviewPayload {
  stars:    number;
  comment?: string;
}
