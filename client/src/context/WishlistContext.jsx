import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

const getWishlistKey = (userId) =>
  userId ? `wishlist_${userId}` : 'wishlist_guest';

const readWishlist = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const userId = user?.id || null;
  const storageKey = getWishlistKey(userId);

  const [wishlist, setWishlist] = useState(() =>
    readWishlist(getWishlistKey(null))
  );

  // Load the correct wishlist whenever the logged-in user changes.
  useEffect(() => {
    if (authLoading) return;

    setWishlist(readWishlist(storageKey));
  }, [storageKey, authLoading]);

  const addToWishlist = useCallback(
    (course) => {
      if (!userId) return;

      setWishlist((previous) => {
        if (
          previous.some(
            (item) => String(item.id) === String(course.id)
          )
        ) {
          return previous;
        }

        const next = [
          ...previous,
          {
            id: course.id,
            title: course.title,
            instructor: course.instructor,
            thumbnail: course.thumbnail,
            price: course.price,
            originalPrice: course.originalPrice,
            rating: course.rating,
            level: course.level,
          },
        ];

        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [userId, storageKey]
  );

  const removeFromWishlist = useCallback(
    (courseId) => {
      setWishlist((previous) => {
        const next = previous.filter(
          (item) => String(item.id) !== String(courseId)
        );

        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey]
  );

  const isWishlisted = useCallback(
    (courseId) =>
      wishlist.some(
        (item) => String(item.id) === String(courseId)
      ),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (course) => {
      const exists = wishlist.some(
        (item) => String(item.id) === String(course.id)
      );

      if (exists) {
        removeFromWishlist(course.id);
        return false;
      }

      addToWishlist(course);
      return true;
    },
    [wishlist, addToWishlist, removeFromWishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        items: wishlist,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        toggleWishlist,
        count: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      'useWishlist must be used within WishlistProvider'
    );
  }

  return context;
};
