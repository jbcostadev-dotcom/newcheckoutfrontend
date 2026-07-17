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

export type OrderStatus =
  | "pending"
  | "processing"
  | "waiting_payment"
  | "in_analysis"
  | "authorized"
  | "paid"
  | "failed"
  | "refused"
  | "canceled"
  | "refunded"
  | "in_protest"
  | "chargedback";

export type PaymentMethod = "pix" | "credit_card" | "boleto";

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
  card_brand?: string | null;
  card_last4?: string | null;
  installments?: number | null;
  boleto_url?: string | null;
  boleto_barcode?: string | null;
  boleto_digitable_line?: string | null;
  gateway_expires_at?: string | null;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export type GatewayProvider =
  | "unipay"
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
  banner_height?: string;
  enable_order_bump: boolean;
  dark_mode: boolean;
  button_text?: string | null;
  banner_message?: string | null;
  header_store_name_visible?: boolean;
  header_secure_badge?: boolean;
  header_logo_alignment?: string;
  header_bg_color?: string;
  header_icon_color?: string;
  announcement_bar_enabled?: boolean;
  announcement_bar_bg?: string;
  announcement_bar_text_color?: string;
  summary_title?: string;
  summary_show_discount?: boolean;
  summary_coupon_enabled?: boolean;
  step_title_font_size?: string;
  scarcity_enabled?: boolean;
  scarcity_type?: string;
  scarcity_text?: string | null;
  scarcity_countdown_minutes?: number;
  pix_confirmation_title?: string;
  pix_confirmation_message?: string | null;
  pix_confirmation_logo?: string | null;
  footer_text?: string;
  footer_show_cnpj?: boolean;
  footer_cnpj?: string | null;
  font_family?: string;
  font_size_base?: string;
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

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  waiting_payment: "Aguardando Pagamento",
  in_analysis: "Em Análise",
  authorized: "Autorizado",
  paid: "Pago",
  failed: "Recusado",
  refused: "Recusado",
  canceled: "Cancelado",
  refunded: "Reembolsado",
  in_protest: "Em Contestação",
  chargedback: "Chargeback",
};

export const GATEWAY_LABELS: Record<string, string> = {
  unipay: "Unipay (FastSoft)",
  mercadopago: "Mercado Pago",
  stripe: "Stripe",
  pagseguro: "PagSeguro",
  asaas: "Asaas",
};

export type ShippingMethodIcon =
  | "correios"
  | "sedex"
  | "jadlog"
  | "loggi"
  | "full"
  | null;

export interface ShippingMethod {
  id: number;
  store_id: number;
  name: string;
  price: number | null;
  min_value_free_shipping: number | null;
  min_delivery_days: number;
  max_delivery_days: number;
  icon: ShippingMethodIcon;
  is_active: boolean;
  created_at?: string;
}

export const SHIPPING_METHOD_ICON_LABEL: Record<NonNullable<ShippingMethodIcon>, string> = {
  correios: "Correios",
  sedex: "Sedex",
  jadlog: "Jadlog",
  loggi: "Loggi",
  full: "Full",
};
