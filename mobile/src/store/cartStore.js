import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],           // [{ menu_item_id, name, price, quantity }]
  vendorId: null,
  vendorName: '',

  addItem: (vendorId, vendorName, item) => {
    const { items, vendorId: currentVendorId } = get();

    // If adding from a different vendor, clear cart first
    if (currentVendorId && currentVendorId !== vendorId) {
      set({
        items: [{ ...item, quantity: 1 }],
        vendorId,
        vendorName,
      });
      return 'cleared'; // signal to UI that cart was cleared
    }

    const existing = items.find((i) => i.menu_item_id === item.menu_item_id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.menu_item_id === item.menu_item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }], vendorId, vendorName });
    }
    return 'added';
  },

  removeItem: (menu_item_id) => {
    const items = get().items;
    const existing = items.find((i) => i.menu_item_id === menu_item_id);
    if (!existing) return;

    if (existing.quantity === 1) {
      const newItems = items.filter((i) => i.menu_item_id !== menu_item_id);
      set({
        items: newItems,
        vendorId: newItems.length === 0 ? null : get().vendorId,
        vendorName: newItems.length === 0 ? '' : get().vendorName,
      });
    } else {
      set({
        items: items.map((i) =>
          i.menu_item_id === menu_item_id ? { ...i, quantity: i.quantity - 1 } : i
        ),
      });
    }
  },

  clearCart: () => set({ items: [], vendorId: null, vendorName: '' }),

  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  getItemQuantity: (menu_item_id) =>
    get().items.find((i) => i.menu_item_id === menu_item_id)?.quantity || 0,
}));

export default useCartStore;
