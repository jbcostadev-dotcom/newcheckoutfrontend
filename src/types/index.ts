export type StoreType = "Shopify" | "Landing Page";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ShopifyInjectStatus {
  connected: boolean;
  shopify_domain: string | null;
  pending_domain: string | null;
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

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id: number;
  store_id: number;
  shopify_product_id?: string | null;
  shopify_variant_id?: string | null;
  name: string;
  parent_title?: string | null;
  attributes?: ProductAttribute[] | null;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  stock_quantity?: number | null;
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
  installment_type?: "default" | "custom";
  default_installment_rate?: number;
  installment_rates?: (number | null)[] | null;
  pre_selected_installment?: number;
  installment_limit?: number;
  interest_free_installments?: number;
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
  social_proofs_enabled?: boolean;
  pix_enabled?: boolean;
  pix_gateway_id?: number | null;
  pix_gateway_ids?: number[];
  card_enabled?: boolean;
  card_gateway_id?: number | null;
  card_gateway_ids?: number[];
  boleto_enabled?: boolean;
  boleto_gateway_id?: number | null;
  boleto_gateway_ids?: number[];
  default_payment_method?: "credit_card" | "pix" | "boleto";
}

export interface SocialProof {
  id: number;
  store_id: number;
  name: string;
  testimonial: string;
  photo_url?: string | null;
  stars: number;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
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

export interface Customer {
  id: number;
  store_id: number;
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
  zip?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  uf?: string | null;
  shopify_customer_id?: string | null;
  created_at?: string;
  // Computed fields (added by /customers endpoints)
  orders_count?: number;
  paid_orders_count?: number;
  paid_total?: number;
  paid?: boolean;
  orders?: Order[];
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

export type OrderBumpDiscountType = "fixed" | "percent";
export type OrderBumpScope = "any" | "specific";

export interface OrderBump {
  id: number;
  store_id: number;
  name: string;
  product_id: number;
  discount_value: number;
  discount_type: OrderBumpDiscountType;
  scope: OrderBumpScope;
  target_product_id?: number | null;
  show_credit_card: boolean;
  show_pix: boolean;
  show_boleto: boolean;
  offer_title: string;
  offer_message?: string | null;
  bg_color: string;
  border_color: string;
  button_color: string;
  button_text_color: string;
  button_label: string;
  is_active: boolean;
  product?: Pick<Product, "id" | "name" | "price" | "image_url"> | null;
  target_product?: Pick<Product, "id" | "name" | "price"> | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderBumpFormData {
  name: string;
  product_id: number;
  discount_value: number;
  discount_type: OrderBumpDiscountType;
  scope: OrderBumpScope;
  target_product_id?: number | null;
  show_credit_card: boolean;
  show_pix: boolean;
  show_boleto: boolean;
  offer_title: string;
  offer_message?: string | null;
  bg_color: string;
  border_color: string;
  button_color: string;
  button_text_color: string;
  button_label: string;
  is_active: boolean;
}

export type CouponDiscountType = "fixed" | "percent";
export type CouponStatus = "active" | "inactive";

export interface Coupon {
  id: number;
  store_id: number;
  code: string;
  name: string;
  description?: string | null;
  status: CouponStatus;
  max_uses: number;
  used_count: number;
  discount_value: number;
  discount_type: CouponDiscountType;
  auto_apply: boolean;
  first_purchase_only: boolean;
  accumulate_with_promos: boolean;
  free_shipping: boolean;
  shipping_method_id?: number | null;
  min_purchase_value?: number | null;
  min_items_required: boolean;
  min_items_quantity?: number | null;
  starts_at: string;
  expires_at: string;
  applies_to_all_products: boolean;
  products?: Product[] | null;
  products_count?: number;
  shipping_method?: Pick<ShippingMethod, "id" | "name"> | null;
  created_at?: string;
  updated_at?: string;
}

export interface CouponFormData {
  code: string;
  name: string;
  description?: string | null;
  status: CouponStatus;
  max_uses: number;
  discount_value: number;
  discount_type: CouponDiscountType;
  auto_apply: boolean;
  first_purchase_only: boolean;
  accumulate_with_promos: boolean;
  free_shipping: boolean;
  shipping_method_id?: number | null;
  min_purchase_value?: number | null;
  min_items_required: boolean;
  min_items_quantity?: number | null;
  starts_at: string;
  expires_at: string;
  applies_to_all_products: boolean;
  product_ids: number[];
}

export type AbandonedCartStep = "dados" | "entrega" | "pagamento" | "pagamento_tentado";
export type AbandonedCartStatus = "open" | "recovered" | "converted" | "expired";
export type AbandonedCartReason =
  | "left_dados"
  | "left_entrega"
  | "left_pagamento"
  | "card_refused"
  | "pix_expired"
  | "boleto_expired";

export interface AbandonedCartItem {
  product_id: number;
  name: string;
  qty: number;
  unit_price: number;
}

export interface AbandonedCartAddress {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
}

export interface AbandonedCart {
  id: number;
  store_id: number;
  customer_id?: number | null;
  order_id?: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_document?: string | null;
  items: AbandonedCartItem[];
  subtotal: number;
  total: number;
  shipping_address?: AbandonedCartAddress | null;
  shipping_method_id?: number | null;
  shipping_method_name?: string | null;
  shipping_price?: number | null;
  step_reached: AbandonedCartStep;
  payment_method?: PaymentMethod | null;
  status: AbandonedCartStatus;
  abandoned_reason?: AbandonedCartReason | null;
  card_brand?: string | null;
  card_last4?: string | null;
  recovery_token?: string | null;
  recovery_url?: string | null;
  recovered_at?: string | null;
  expired_at?: string | null;
  last_activity_at?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  device_type?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  created_at: string;
  updated_at?: string;
  // computed
  items_count?: number;
  customer?: Customer | null;
  order?: Order | null;
}

export const ABANDONED_CART_STATUS_LABEL: Record<AbandonedCartStatus, string> = {
  open: "Aberto",
  recovered: "Recuperado",
  converted: "Convertido",
  expired: "Expirado",
};

export const ABANDONED_CART_STEP_LABEL: Record<AbandonedCartStep, string> = {
  dados: "Identificação",
  entrega: "Entrega",
  pagamento: "Pagamento",
  pagamento_tentado: "Tentou pagar",
};

export const ABANDONED_CART_REASON_LABEL: Record<AbandonedCartReason, string> = {
  left_dados: "Saiu na identificação",
  left_entrega: "Saiu na entrega",
  left_pagamento: "Saiu no pagamento",
  card_refused: "Cartão recusado",
  pix_expired: "PIX expirou",
  boleto_expired: "Boleto expirou",
};
