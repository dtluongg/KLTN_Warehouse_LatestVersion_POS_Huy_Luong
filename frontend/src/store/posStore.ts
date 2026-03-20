import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  sku: string;
  salePrice: number;
  quantity: number;
}

interface PosState {
  cart: CartItem[];
  customerId: string | null;
  discountAmount: number;
  couponCode: string;
  couponDiscountAmount: number;
  surchargeAmount: number;
  paymentMethod: string; // 'CASH', 'TRANSFER', 'MIX', 'DEBT'
  note: string;
  
  // Hành động
  addToCart: (product: any) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  
  setCustomer: (id: string | null) => void;
  setDiscountAmount: (amount: number) => void;
  setCoupon: (code: string, amount: number) => void;
  setSurchargeAmount: (amount: number) => void;
  setPaymentMethod: (method: string) => void;
  setNote: (note: string) => void;
  
  // Tính toán
  getGrossAmount: () => number; // Tổng tiền hàng
  getNetAmount: () => number; // Tổng khách phải trả
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  customerId: null,
  discountAmount: 0,
  couponCode: '',
  couponDiscountAmount: 0,
  surchargeAmount: 0,
  paymentMethod: 'CASH',
  note: '',

  addToCart: (product) => {
    set((state) => {
      const existingItem = state.cart.find((item) => item.id === product.id);
      
      if (existingItem) {
        return {
          cart: state.cart.map((item) => 
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        };
      }
      
      return {
        cart: [...state.cart, { 
          id: product.id, 
          name: product.name, 
          sku: product.sku, 
          salePrice: product.salePrice, 
          quantity: 1 
        }]
      };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId)
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      cart: state.cart.map((item) => 
        item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    }));
  },

  clearCart: () => {
    set({ 
      cart: [], 
      customerId: null, 
      discountAmount: 0, 
      couponCode: '', 
      couponDiscountAmount: 0, 
      surchargeAmount: 0, 
      paymentMethod: 'CASH',
      note: ''
    });
  },

  setCustomer: (id) => set({ customerId: id }),
  setDiscountAmount: (amount) => set({ discountAmount: Math.max(0, amount) }),
  setCoupon: (code, amount) => set({ couponCode: code, couponDiscountAmount: Math.max(0, amount) }),
  setSurchargeAmount: (amount) => set({ surchargeAmount: Math.max(0, amount) }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNote: (note) => set({ note }),

  getGrossAmount: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + (item.salePrice * item.quantity), 0);
  },

  getNetAmount: () => {
    const { getGrossAmount, discountAmount, couponDiscountAmount, surchargeAmount } = get();
    // Khách cần trả = Tổng hàng - Chiết khấu thường - Chiết khấu mã + Phụ phí
    const totalDiscount = discountAmount + couponDiscountAmount;
    const finalAmount = getGrossAmount() - totalDiscount + surchargeAmount;
    return Math.max(0, finalAmount);
  }
}));
