import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductsListingProps {
  category: "product" | "accessory";
  title: string;
  subtitle: string;
}

const PAGE_SIZE = 24;

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface ProductWithStats {
  id: string;
  name: string;
  brand: string | null;
  image: string | null;
  active_listings: number;
  min_price_cents: number | null;
}

function useProducts(category: string, search: string, page: number) {
  return useQuery({
    queryKey: ["products", category, search, page],
    queryFn: async () => {
      // Fetch product items
      let query = supabase
        .from("product_items")
        .select("*", { count: "exact" })
        .eq("category", category)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%`);
      }

      const { data: items, count, error } = await query;
      if (error) throw error;

      if (!items || items.length === 0) {
        return { products: [] as ProductWithStats[], total: count || 0, totalPages: 0 };
      }

      // Get listing stats for these products
      const ids = items.map((i) => i.id);
      const { data: listings } = await supabase
        .from("listings")
        .select("entity_id, price_cents")
        .eq("entity_type", category)
        .eq("status", "active")
        .in("entity_id", ids);

      const statsMap = new Map<string, { count: number; min: number }>();
      (listings || []).forEach((l) => {
        const key = l.entity_id!;
        const prev = statsMap.get(key);
        if (!prev) {
          statsMap.set(key, { count: 1, min: l.price_cents });
        } else {
          prev.count++;
          if (l.price_cents < prev.min) prev.min = l.price_cents;
        }
      });

      const products: ProductWithStats[] = items.map((item) => {
        const stat = statsMap.get(item.id);
        return {
          id: item.id,
          name: item.name,
          brand: item.brand,
          image: item.image,
          active_listings: stat?.count || 0,
          min_price_cents: stat?.min ?? null,
        };
      });

      return {
        products,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / PAGE_SIZE),
      };
    },
  });
}

const ProductsListing = ({ category, title, subtitle }: ProductsListingProps) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(0);
    }, 400);
    setTimer(t);
  };

  const { data, isLoading } = useProducts(category, debouncedSearch, page);
  const products = data?.products || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-6">
        {/* Title + Search */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mb-6 relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou marca..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-secondary aspect-[3/4]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 py-20 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-foreground">
              Nenhum {category === "accessory" ? "acessório" : "produto"} disponível no momento.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Em breve você poderá encontrar e anunciar {category === "accessory" ? "acessórios" : "produtos"} aqui.
            </p>
            <Button className="mt-6" variant="outline">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Quero vender um {category === "accessory" ? "acessório" : "produto"}
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-3 text-xs text-muted-foreground">
              {total} {category === "accessory" ? "acessório" : "produto"}{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-glow"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-secondary">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="h-full w-full object-contain p-3 transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {product.active_listings > 0 && (
                      <div className="absolute right-1.5 top-1.5">
                        <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-1.5">
                          {product.active_listings} anúncio{product.active_listings !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                      {product.name}
                    </p>
                    {product.brand && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{product.brand}</p>
                    )}
                    <div className="mt-auto pt-2">
                      {product.min_price_cents != null ? (
                        <p className="font-display text-sm font-bold text-primary">
                          a partir de {formatPrice(product.min_price_cents)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sem anúncios</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductsListing;
