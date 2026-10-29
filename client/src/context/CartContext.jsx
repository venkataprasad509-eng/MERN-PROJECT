
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import cartService from '../services/cartService';
import { toast } from '../utils/toast';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const emptyCart = () => ({ items: [], coupon: null });

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id || null;

  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!userId) {
      setCart(emptyCart());
      return;
    }

    try {
      const data = await cartService.getCart();

      // Ignore results if the account changed during the request.
      if (data.success && userId) {
        setCart(data.cart || emptyCart());
      }
    } catch (error) {
      setCart(emptyCart());
      console.error('Could not load cart:', error.message);
    }
  }, [userId]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const loadCart = async () => {
      if (!userId) {
        setCart(emptyCart());
        return;
      }

      try {
        const data = await cartService.getCart();

        if (!cancelled) {
          setCart(data.cart || emptyCart());
        }
      } catch (error) {
        if (!cancelled) {
          setCart(emptyCart());
          console.error('Could not load cart:', error.message);
        }
      }
    };

    setCart(emptyCart());
    loadCart();

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  const addToCart = async (courseId) => {
    if (!userId) {
      toast.error('Please log in to add courses to your cart.');
      return false;
    }

    setLoading(true);

    try {
      const data = await cartService.addItem(courseId);
      await fetchCart();
      toast.success('Course added to cart!');
      return Boolean(data.success);
    } catch (error) {
      toast.error(error.message || 'Failed to add to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (courseId) => {
    if (!userId) return;

    setLoading(true);

    try {
      await cartService.removeItem(courseId);
      await fetchCart();
      toast.success('Course removed from cart');
    } catch (error) {
      toast.error(error.message || 'Failed to remove from cart');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (code) => {
    if (!userId) {
      throw new Error('Please log in to apply a coupon.');
    }

    const result = await cartService.applyCoupon(code);
    await fetchCart();
    return result;
  };

  const removeCoupon = () => {
    setCart((previous) => ({
      ...previous,
      coupon: null,
    }));
  };

  // Legacy demo checkout. Do not use for real Razorpay payments.
  const checkout = async () => {
    if (!userId) {
      throw new Error('Please log in before checkout.');
    }

    const result = await cartService.checkout();
    setCart(emptyCart());
    return result;
  };

  const cartItems = cart.items || [];

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.course?.price ?? item.price ?? 0);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);

  const originalTotal = cartItems.reduce((sum, item) => {
    const price = Number(
      item.course?.originalPrice ??
      item.originalPrice ??
      item.course?.price ??
      item.price ??
      0
    );
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);

  const couponObj = cart.coupon;
  let discountAmt = 0;

  if (couponObj) {
    if (couponObj.type === 'percentage') {
      discountAmt = subtotal * (couponObj.discount / 100);
    } else {
      discountAmt = Math.min(subtotal, Number(couponObj.discount) || 0);
    }
  }

  const total = Math.max(0, subtotal - discountAmt);

  const isInCart = (courseId) =>
    cartItems.some(
      (item) =>
        String(item.courseId ?? item.course_id) === String(courseId)
    );

  return (
    <CartContext.Provider
      value={{
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
        cartTotal: subtotal,
        originalTotal,
        discountedTotal: total,
        itemCount: cartItems.length,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
};
