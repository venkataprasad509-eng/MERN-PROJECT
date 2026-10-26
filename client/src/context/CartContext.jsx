import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { toast } from '../utils/toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], coupon: null });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const data = await cartService.getCart();
      setCart(data.cart || { items: [], coupon: null });
    } catch {
      // silently fail on initial load
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (courseId) => {
    setLoading(true);
    try {
      const data = await cartService.addItem(courseId);
      setCart(data.cart);
      toast.success('Course added to cart!');
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (courseId) => {
    setLoading(true);
    try {
      const data = await cartService.removeItem(courseId);
      setCart(data.cart);
      toast.success('Course removed from cart');
    } catch (err) {
      toast.error(err.message || 'Failed to remove from cart');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code) => {
    const data = await cartService.applyCoupon(code);
    await fetchCart();
    return data;
  };

  const removeCoupon = async () => {
    try {
      setCart((prev) => ({ ...prev, coupon: null }));
    } catch (_) {}
  };

  const checkout = async () => {
    const data = await cartService.checkout();
    setCart({ items: [], coupon: null });
    return data;
  };

  const isInCart = (courseId) => (cart.items || []).some((i) => String(i.courseId) === String(courseId));

  // Items from API have a nested `course` object with price or top-level price
  const cartItems = cart.items || [];
  const subtotal = cartItems.reduce((s, i) => {
    const p = Number(i.course?.price ?? i.price ?? 0);
    return s + (isNaN(p) ? 0 : p);
  }, 0);
  const cartTotal = subtotal;
  const originalTotal = cartItems.reduce((s, i) => {
    const p = Number(i.course?.originalPrice ?? i.originalPrice ?? i.course?.price ?? i.price ?? 0);
    return s + (isNaN(p) ? 0 : p);
  }, 0);
  const couponObj = cart.coupon;
  let discountAmt = 0;
  if (couponObj) {
    if (couponObj.type === 'percentage') discountAmt = subtotal * (couponObj.discount / 100);
    else discountAmt = Math.min(subtotal, couponObj.discount);
  }
  const total = Math.max(0, subtotal - discountAmt);
  const discountedTotal = total;

  return (
    <CartContext.Provider value={{
      cart,
      items: cartItems,
      coupon: couponObj,
      loading,
      addToCart,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      checkout,
      isInCart,
      subtotal,
      discount: discountAmt,
      total,
      cartTotal,
      originalTotal,
      discountedTotal,
      itemCount: cartItems.length,
      refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
