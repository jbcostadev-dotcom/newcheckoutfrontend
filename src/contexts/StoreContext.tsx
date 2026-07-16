"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import type { Store, StoreType } from "@/types";

export interface StoreWithMeta extends Store {
  revenue?: number;
  orders?: number;
  conversion?: number;
}

interface StoreContextType {
  stores: StoreWithMeta[];
  selectedStore: StoreWithMeta | null;
  setSelectedStoreById: (id: string) => void;
  addStore: (store: {
    name: string;
    type: StoreType | string;
    domain?: string;
  }) => Promise<boolean>;
  deleteStore: (id: string) => Promise<boolean>;
  refreshSelectedStore: () => Promise<void>;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function normalize(raw: Record<string, unknown>): StoreWithMeta {
  const sub = (raw.subdomain as string) ?? null;
  const custom = (raw.custom_domain as string) ?? null;
  return {
    ...(raw as unknown as Store),
    id: String(raw.id),
    domain: custom || sub,
    revenue: 0,
    orders: 0,
    conversion: 0,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<StoreWithMeta[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStores = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      router.push("/");
      return;
    }
    try {
      const data = await api.get<unknown[]>("/stores");
      const mapped = (Array.isArray(data) ? data : []).map((s) =>
        normalize(s as Record<string, unknown>)
      );
      setStores(mapped);
      // preserve current selection if still present, else pick first
      setSelectedStore((prev) => {
        if (prev && mapped.some((m) => m.id === prev.id)) {
          return mapped.find((m) => m.id === prev.id) ?? mapped[0] ?? null;
        }
        return mapped[0] ?? null;
      });
    } catch {
      /* handled by api layer (401 redirect) */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const setSelectedStoreById = (id: string) => {
    const store = stores.find((s) => s.id === id);
    if (store) setSelectedStore(store);
  };

  const addStore: StoreContextType["addStore"] = async (storeData) => {
    try {
      const saved = await api.post<Record<string, unknown>>("/stores", {
        name: storeData.name,
        type: storeData.type,
        subdomain:
          storeData.domain ||
          storeData.name.toLowerCase().replace(/\s+/g, "-"),
      });
      const newStore = normalize(saved);
      setStores((prev) => [...prev, newStore]);
      setSelectedStore(newStore);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar loja.";
      // surface friendly message to the user
      alert(message);
      return false;
    }
  };

  const refreshSelectedStore = async () => {
    if (!selectedStore) return;
    try {
      const updated = await api.get<Record<string, unknown>>(
        `/stores/${selectedStore.id}`
      );
      const next = normalize(updated);
      setStores((prev) =>
        prev.map((s) => (s.id === next.id ? { ...s, ...next } : s))
      );
      setSelectedStore((prev) =>
        prev && prev.id === next.id ? { ...prev, ...next } : prev
      );
    } catch {
      /* no-op */
    }
  };

  const deleteStore: StoreContextType["deleteStore"] = async (id) => {
    try {
      await api.delete(`/stores/${id}`);
      setStores((prev) => prev.filter((s) => s.id !== id));
      setSelectedStore((prev) => {
        if (prev && prev.id === id) {
          const remaining = stores.filter((s) => s.id !== id);
          return remaining[0] ?? null;
        }
        return prev;
      });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao deletar a loja.";
      alert(message);
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        selectedStore,
        setSelectedStoreById,
        addStore,
        deleteStore,
        refreshSelectedStore,
        loading,
      }}
    >
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Carregando suas lojas...</p>
        </div>
      ) : (
        children
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore deve ser usado dentro de StoreProvider");
  }
  return context;
}
