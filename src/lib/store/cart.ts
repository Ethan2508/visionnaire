import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  brandName: string | null;
  colorName: string;
  size: string | null;
  imageUrl: string | null;
  price: number;
  quantity: number;
  category: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (item.quantity < 1) return;
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === item.variantId
          );

          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
            return { items: newItems };
          }

          return { items: [...state.items, item] };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0
        );
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        return subtotal + shipping;
      },
    }),
    {
      name: "visionnaire-cart",
    }
  )
);
