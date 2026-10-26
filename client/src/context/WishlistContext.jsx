import { createContext, useContext, useState, useCallback } from 'react';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    } catch { return []; }
  });

  const save = (items) => {
    setWishlist(items);
    localStorage.setItem('wishlist', JSON.stringify(items));
  };

  const addToWishlist = useCallback((course) => {
    setWishlist((prev) => {
      if (prev.find((c) => c.id === course.id)) return prev;
      const next = [...prev, { id: course.id, title: course.title, instructor: course.instructor, thumbnail: course.thumbnail, price: course.price, originalPrice: course.originalPrice, rating: course.rating, level: course.level }];
      localStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromWishlist = useCallback((courseId) => {
    setWishlist((prev) => {
      const next = prev.filter((c) => c.id !== courseId);
      localStorage.setItem('wishlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const isWishlisted = useCallback((courseId) => wishlist.some((c) => c.id === courseId), [wishlist]);

  const toggleWishlist = useCallback((course) => {
    if (isWishlisted(course.id)) {
      removeFromWishlist(course.id);
      return false;
    } else {
      addToWishlist(course);
      return true;
    }
  }, [isWishlisted, addToWishlist, removeFromWishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, items: wishlist, addToWishlist, removeFromWishlist, isWishlisted, toggleWishlist, count: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
