export type StoreType = "Shopify" | "Landing Page";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ShopifyInjectStatus {
  connected: boolean;
  shopify_domain: string | null;
  credentials_configured: boolean;
  checkout_injected: boolean;
  injected_theme_id: number | null;
  injected_at: string | null;
}

export interface Store {
  id: string;
  name: string;
  type: StoreType | string;
  subdomain?: string | null;
  custom_domain?: string | null;
  shopify_domain?: string | null;
  shopify_access_token?: string | null;
  status: boolean;
  domain?: string | null;
}

export interface Product {
  id: number;
  store_id: number;
  shopify_product_id?: string | null;
  shopify_variant_id?: string | null;
  name: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  image_url?: string | null;
  checkout_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "pix" | "credit_card";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number | null;
  name: string;
  qty: number;
  unit_price: number;
  product?: Pick<Product, "id" | "name" | "image_url" | "price"> | null;
}

export interface Order {
  id: number;
  store_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_document?: string | null;
  amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  gateway_transaction_id?: string | null;
  pix_qrcode?: string | null;
  pix_copia_cola?: string | null;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export type GatewayProvider =
  | "suitpay"
  | "mercadopago"
  | "stripe"
  | "pagseguro"
  | "asaas";

export interface Gateway {
  id: number;
  store_id: number;
  provider: GatewayProvider | string;
  api_key?: string | null;
  secret_key?: string | null;
  is_active: boolean;
  settings?: Record<string, unknown> | null;
  created_at?: string;
}

export interface CheckoutSettings {
  store_id: number;
  primary_color: string;
  secondary_color: string;
  logo_url?: string | null;
  banner_url?: string | null;
  enable_order_bump: boolean;
  dark_mode: boolean;
  button_text?: string | null;
  // Optional fields that the form may manage locally before saving
}

export interface Metrics {
  revenue_today: number;
  orders_paid: number;
  conversion: number;
  orders_total: number;
  recent_orders?: Order[];
}

export type DomainStatus =
  | "pending"
  | "dns_verified"
  | "active"
  | "failed";

export interface Domain {
  id: number;
  store_id: number;
  domain: string;
  is_primary: boolean;
  ssl_active: boolean;
  status: string;
  dns_verified_at: string | null;
  ssl_status: string;
  verification_token: string | null;
  created_at?: string;
}

export const DOMAIN_STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando DNS",
  dns_verified: "DNS Verificado",
  active: "SSL Ativo",
  failed: "Falhou",
};

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Recusado",
  refunded: "Reembolsado",
};

export const GATEWAY_LABELS: Record<string, string> = {
  suitpay: "SuitPay",
  mercadopago: "Mercado Pago",
  stripe: "Stripe",
  pagseguro: "PagSeguro",
  asaas: "Asaas",
};
