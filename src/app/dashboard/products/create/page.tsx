"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateProductPage() {
  const router = useRouter();
  const { selectedStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      toast.error("Nenhuma loja selecionada.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      if (imageFile) formData.append("image", imageFile);

      await api.post(
        `/stores/${selectedStore.id}/products`,
        formData
      );
      toast.success("Produto criado!");
      router.push("/dashboard/products");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao criar produto.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Criar Produto"
        description="Adicione um novo produto à sua loja."
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações básicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              {/* Upload de imagem */}
              <div className="space-y-2">
                <Label className="text-center text-xs text-muted-foreground">
                  Imagem do produto
                </Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 transition-colors hover:border-primary/60 hover:bg-primary/10"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full rounded-xl object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-xs font-medium">
                        <Upload className="mr-1 inline h-3 w-3" />
                        Clique ou arraste
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  PNG ou JPG — 650×650px
                </p>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-name">Nome do produto</Label>
                  <Input
                    id="prod-name"
                    required
                    placeholder="Ex: Curso de Marketing"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-desc">Descrição</Label>
                  <Textarea
                    id="prod-desc"
                    placeholder="Descrição apresentada no checkout"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="prod-price">Preço (R$)</Label>
                  <Input
                    id="prod-price"
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="99.90"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Produto"}
          </Button>
        </div>
      </form>
    </>
  );
}
