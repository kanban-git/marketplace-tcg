import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface CartItem {
  listingId: string;
  cardName: string;
  cardImage: string;
  priceCents: number;
  quantity: number;
  maxQuantity: number;
  sellerId: string;
  sellerName: string;
  condition: string;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const sellerId = items.length > 0 ? items[0].sellerId : null;

  const addItem = useCallback(
    (item: CartItem) => {
      if (sellerId && item.sellerId !== sellerId) {
        toast.error("Apenas um vendedor por pedido", {
          description:
            "Finalize ou limpe o carrinho antes de adicionar itens de outro vendedor.",
        });
        return false;
      }

      setItems((prev) => {
        const existing = prev.find((i) => i.listingId === item.listingId);
        if (existing) {
          if (existing.quantity >= existing.maxQuantity) {
            toast.error("Quantidade máxima atingida");
            return prev;
          }
          return prev.map((i) =>
            i.listingId === item.listingId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [...prev, item];
      });
      toast.success(`${item.cardName} adicionado ao carrinho`);
      return true;
    },
    [sellerId]
  );

  const removeItem = useCallback((listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalCents = items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0
  );

  return { items, addItem, removeItem, clearCart, totalCents, sellerId };
}
