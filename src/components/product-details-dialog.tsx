"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Ruler, Weight, Tag, Box, Hash } from "lucide-react";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function BooleanDetail({
  label,
  value,
}: {
  label: string;
  value?: boolean | null;
}) {
  if (value === null || value === undefined) return null;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Badge variant={value ? "success" : "secondary"}>
        {value ? "Sim" : "Não"}
      </Badge>
    </div>
  );
}

function formatDimension(
  value?: number | null,
  unit?: string | null
): string | null {
  if (value === null || value === undefined) return null;
  return `${value}${unit ? ` ${unit}` : ""}`;
}

export function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
}: ProductDetailsDialogProps) {
  if (!product) return null;

  const title = product.parent_title || product.name;
  const variantName = product.parent_title ? product.name : undefined;
  const displayName = product.attributes?.length
    ? product.attributes.map((a) => `${a.name}: ${a.value}`).join(" / ")
    : variantName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={title}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <span className="truncate">{title}</span>
          </DialogTitle>
          <DialogDescription>
            {displayName || "Detalhes do produto"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-6">
          {/* Identificação */}
          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Identificação
            </h4>
            <div className="rounded-lg border">
              <DetailItem label="Nome" value={product.name} />
              {product.parent_title && product.parent_title !== product.name && (
                <DetailItem label="Produto pai" value={product.parent_title} />
              )}
              <DetailItem label="SKU" value={product.sku} />
              <DetailItem label="Código de barras" value={product.barcode} />
              <DetailItem
                label="ID Shopify (produto)"
                value={product.shopify_product_id}
              />
              <DetailItem
                label="ID Shopify (variante)"
                value={product.shopify_variant_id}
              />
              <DetailItem
                label="ID item de inventário"
                value={product.inventory_item_id}
              />
              <DetailItem label="Posição" value={product.position} />
            </div>
          </section>

          {/* Preço */}
          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Preço
            </h4>
            <div className="rounded-lg border">
              <DetailItem
                label="Preço"
                value={formatCurrency(Number(product.price))}
              />
              <DetailItem
                label="Preço comparativo"
                value={
                  product.compare_at_price
                    ? formatCurrency(Number(product.compare_at_price))
                    : null
                }
              />
              <DetailItem
                label="Custo"
                value={
                  product.cost ? formatCurrency(Number(product.cost)) : null
                }
              />
            </div>
          </section>

          {/* Estoque e status */}
          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Estoque e status
            </h4>
            <div className="rounded-lg border">
              <DetailItem
                label="Quantidade em estoque"
                value={
                  product.stock_quantity !== null &&
                  product.stock_quantity !== undefined
                    ? product.stock_quantity
                    : null
                }
              />
              <BooleanDetail label="Ativo" value={product.is_active} />
              <BooleanDetail label="Tributável" value={product.taxable} />
              <BooleanDetail
                label="Requer envio"
                value={product.requires_shipping}
              />
              <DetailItem
                label="Política de estoque"
                value={product.inventory_policy}
              />
              <DetailItem
                label="Serviço de fulfillment"
                value={product.fulfillment_service}
              />
            </div>
          </section>

          {/* Peso e dimensões */}
          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Peso e dimensões
            </h4>
            <div className="rounded-lg border">
              <DetailItem
                label="Peso"
                value={formatDimension(product.weight, product.weight_unit)}
                icon={Weight}
              />
              <DetailItem
                label="Peso em gramas"
                value={
                  product.grams !== null && product.grams !== undefined
                    ? `${product.grams} g`
                    : null
                }
                icon={Weight}
              />
              <DetailItem
                label="Altura"
                value={formatDimension(product.height, product.dimension_unit)}
                icon={Ruler}
              />
              <DetailItem
                label="Largura"
                value={formatDimension(product.width, product.dimension_unit)}
                icon={Ruler}
              />
              <DetailItem
                label="Comprimento"
                value={formatDimension(product.length, product.dimension_unit)}
                icon={Ruler}
              />
            </div>
          </section>

          {/* Categorização */}
          <section>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Categorização
            </h4>
            <div className="rounded-lg border">
              <DetailItem
                label="Tipo de produto"
                value={product.product_type}
                icon={Box}
              />
              <DetailItem label="Marca" value={product.vendor} icon={Tag} />
              <DetailItem label="Código fiscal" value={product.tax_code} />
              {product.tags && product.tags.length > 0 && (
                <div className="flex items-start gap-3 py-2">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tags
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Atributos */}
          {product.attributes && product.attributes.length > 0 && (
            <section>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Atributos
              </h4>
              <div className="rounded-lg border p-3">
                <div className="flex flex-wrap gap-2">
                  {product.attributes.map((attr, idx) => (
                    <Badge key={idx} variant="secondary">
                      {attr.name}: {attr.value}
                    </Badge>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Descrição */}
          {product.description && (
            <section>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Descrição
              </h4>
              <div className="rounded-lg border p-3">
                <div
                  className="prose prose-sm max-w-none text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </section>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground">
            Criado em: {product.created_at ? new Date(product.created_at).toLocaleString("pt-BR") : "—"}
            <br />
            Atualizado em: {product.updated_at ? new Date(product.updated_at).toLocaleString("pt-BR") : "—"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
