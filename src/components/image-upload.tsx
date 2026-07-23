"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ALLOWED_IMAGE_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/png",
];

export const ALLOWED_IMAGE_EXTENSIONS = ["webp", "jpg", "jpeg", "png"];

export const MAX_IMAGE_SIZE_MB = 8;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

function isValidImageFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const validExt = ext ? ALLOWED_IMAGE_EXTENSIONS.includes(ext) : false;
  return ALLOWED_IMAGE_TYPES.includes(file.type) || validExt;
}

export interface ImageUploadProps {
  value?: File | null;
  previewUrl?: string | null;
  onChange: (file: File | null) => void;
  onPreviewChange?: (previewUrl: string | null) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  recommendedSize?: string;
  placeholder?: string;
  className?: string;
  previewClassName?: string;
  accept?: string;
  maxSizeBytes?: number;
  showRemove?: boolean;
}

export function ImageUpload({
  value,
  previewUrl,
  onChange,
  onPreviewChange,
  onRemove,
  label,
  description,
  recommendedSize,
  placeholder = "Clique para enviar",
  className,
  previewClassName,
  accept = ALLOWED_IMAGE_TYPES.join(","),
  maxSizeBytes = MAX_IMAGE_SIZE_BYTES,
  showRemove = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? objectUrl;

  const revokeObjectUrl = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
  };

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;

    if (!isValidImageFile(file)) {
      toast.error("Formato inválido. Envie apenas .webp, .jpg, .jpeg ou .png.");
      return;
    }

    if (file.size > maxSizeBytes) {
      toast.error(`O arquivo deve ter no máximo ${MAX_IMAGE_SIZE_MB} MB.`);
      return;
    }

    revokeObjectUrl();
    const newUrl = URL.createObjectURL(file);
    setObjectUrl(newUrl);
    onChange(file);
    if (onPreviewChange) {
      onPreviewChange(newUrl);
    }
  };

  const clear = () => {
    revokeObjectUrl();
    onChange(null);
    if (onPreviewChange) onPreviewChange(null);
    if (onRemove) onRemove();
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      {(label || description || recommendedSize) && (
        <div className="mb-1.5">
          {label && <p className="text-xs font-medium">{label}</p>}
          {description && (
            <p className="text-[11px] text-muted-foreground">{description}</p>
          )}
          {recommendedSize && (
            <p className="text-[10px] text-muted-foreground">
              Tamanho recomendado: {recommendedSize}
            </p>
          )}
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          handleFile(file);
        }}
        className={[
          "relative flex items-center justify-center rounded-lg border-2 border-dashed cursor-pointer overflow-hidden transition-colors group",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/60 hover:bg-accent",
          previewClassName || "h-28 w-full",
        ].join(" ")}
      >
        {displayUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Preview"
              className="h-full w-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-5 w-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 text-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {placeholder}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              {ALLOWED_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(", ")} · até{" "}
              {MAX_IMAGE_SIZE_MB} MB
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {showRemove && (value || previewUrl) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1.5 text-xs text-destructive hover:text-destructive gap-1 h-6 px-2"
          onClick={clear}
        >
          <X className="h-3 w-3" />
          Remover imagem
        </Button>
      )}
    </div>
  );
}
