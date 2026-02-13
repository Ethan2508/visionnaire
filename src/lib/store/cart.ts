import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  requiresPrescription: boolean;
  category: string;
  // Options verres
  lensType: string | null;
  lensOptions: { id: string; name: string; price: number }[];
  prescriptionUrl: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getLensTotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === item.variantId && i.lensType === item.lensType
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

      getLensTotal: () => {
        return get().items.reduce((acc, item) => {
          const lensPrice = item.lensOptions.reduce((sum, opt) => sum + opt.price, 0);
          return acc + lensPrice * item.quantity;
        }, 0);
      },

      getTotal: () => {
        return get().getSubtotal() + get().getLensTotal();
      },
    }),
    {
      name: "visionnaire-cart",
    }
  )
);
