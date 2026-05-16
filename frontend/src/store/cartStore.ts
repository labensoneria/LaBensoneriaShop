import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductColor } from '../types';

function key(productId: string, asKeychain: boolean, colorHex?: string) {
  return `${productId}_${asKeychain}_${colorHex ?? ''}`;
}

interface CartState {
  items: CartItem[];
  addItem:        (product: Product, asKeychain?: boolean, color?: ProductColor) => void;
  removeItem:     (productId: string, asKeychain: boolean, colorHex?: string) => void;
  updateQuantity: (productId: string, asKeychain: boolean, colorHex: string | undefined, qty: number) => void;
  syncStock:      (productId: string, newStock: number | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, asKeychain = false, color) =>
        set((state) => {
          const k = key(product.id, asKeychain, color?.hex);
          const exists = state.items.find((i) => key(i.productId, i.asKeychain, i.selectedColorHex) === k);
          if (exists) {
            const newQty = exists.quantity + 1;
            const capped = product.stock !== null && product.stock !== undefined
              ? Math.min(newQty, product.stock)
              : newQty;
            return {
              items: state.items.map((i) =>
                key(i.productId, i.asKeychain, i.selectedColorHex) === k
                  ? { ...i, quantity: capped }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId:  product.id,
                name:       product.name,
                price:      parseFloat(product.effectivePrice ?? product.price),
                imageUrl:   product.images[0]?.cloudinaryUrl,
                quantity:   1,
                asKeychain,
                stock:      product.stock ?? null,
                selectedColorHex:  color?.hex,
                selectedColorName: color?.name,
              },
            ],
          };
        }),

      removeItem: (productId, asKeychain, colorHex) =>
        set((state) => ({
          items: state.items.filter(
            (i) => key(i.productId, i.asKeychain, i.selectedColorHex) !== key(productId, asKeychain, colorHex)
          ),
        })),

      updateQuantity: (productId, asKeychain, colorHex, qty) => {
        if (qty < 1) return;
        set((state) => ({
          items: state.items.map((i) => {
            if (key(i.productId, i.asKeychain, i.selectedColorHex) !== key(productId, asKeychain, colorHex)) return i;
            const capped = i.stock !== null ? Math.min(qty, i.stock) : qty;
            return { ...i, quantity: capped };
          }),
        }));
      },

      syncStock: (productId, newStock) =>
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.productId !== productId) return i;
              const capped = newStock !== null ? Math.min(i.quantity, newStock) : i.quantity;
              return { ...i, stock: newStock, quantity: capped };
            })
            .filter((i) => i.quantity > 0),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: 'bensoneria-cart' }
  )
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartTotal = (s: CartState) =>
  s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
