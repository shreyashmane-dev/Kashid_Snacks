import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseMock } from '../config/firebase';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const MOCK_COUPONS = [
  { code: 'KASHID10', type: 'percentage', value: 10, minAmount: 100 },
  { code: 'FESTIVE20', type: 'percentage', value: 20, minAmount: 500 },
  { code: 'SNACK50', type: 'fixed', value: 50, minAmount: 200 }
];

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState(null);
  const [discount, setDiscount] = useState(0);

  // Load cart on mount or when auth state changes, and merge guest cart
  useEffect(() => {
    const loadCart = async () => {
      const guestCart = JSON.parse(localStorage.getItem('kashid_guest_cart') || '[]');

      if (currentUser) {
        let userItems = [];
        if (isFirebaseMock) {
          const userCarts = JSON.parse(localStorage.getItem('mock_user_carts') || '{}');
          userItems = userCarts[currentUser.uid] || [];
        } else {
          try {
            const cartDoc = await getDoc(doc(db, 'carts', currentUser.uid));
            if (cartDoc.exists()) {
              userItems = cartDoc.data().items || [];
            }
          } catch (error) {
            console.error("Error loading cart from Firestore:", error);
          }
        }

        // Merge guest items into user items
        if (guestCart.length > 0) {
          const merged = [...userItems];
          guestCart.forEach(gItem => {
            const gWeight = gItem.selectedVariant?.weight || gItem.weight || 'default';
            const matchIndex = merged.findIndex(
              uItem => uItem.id === gItem.id && 
              ((uItem.selectedVariant?.weight || uItem.weight || 'default') === gWeight)
            );
            if (matchIndex > -1) {
              merged[matchIndex].quantity += gItem.quantity;
            } else {
              merged.push(gItem);
            }
          });

          setCartItems(merged);
          
          // Clear guest cart
          localStorage.removeItem('kashid_guest_cart');
          
          // Force sync merged cart back
          if (isFirebaseMock) {
            const userCarts = JSON.parse(localStorage.getItem('mock_user_carts') || '{}');
            userCarts[currentUser.uid] = merged;
            localStorage.setItem('mock_user_carts', JSON.stringify(userCarts));
          } else {
            try {
              await setDoc(doc(db, 'carts', currentUser.uid), {
                items: merged,
                updatedAt: new Date().toISOString()
              });
            } catch (err) {
              console.error("Error syncing merged cart:", err);
            }
          }
        } else {
          setCartItems(userItems);
        }
      } else {
        // Guest user
        setCartItems(guestCart);
      }
    };

    loadCart();
  }, [currentUser]);

  // Sync cart to storage when cartItems changes
  useEffect(() => {
    const syncCart = async () => {
      if (currentUser) {
        if (isFirebaseMock) {
          const userCarts = JSON.parse(localStorage.getItem('mock_user_carts') || '{}');
          userCarts[currentUser.uid] = cartItems;
          localStorage.setItem('mock_user_carts', JSON.stringify(userCarts));
        } else {
          try {
            await setDoc(doc(db, 'carts', currentUser.uid), {
              items: cartItems,
              updatedAt: new Date().toISOString()
            });
          } catch (error) {
            console.error("Error syncing cart to Firestore:", error);
          }
        }
      } else {
        // Guest user
        localStorage.setItem('kashid_guest_cart', JSON.stringify(cartItems));
      }
    };

    // Avoid syncing empty cart on initial load
    if (cartItems.length > 0 || (currentUser && cartItems.length === 0)) {
      syncCart();
    }
  }, [cartItems, currentUser]);

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    setCartItems(prevItems => {
      // Find matching item by ID and weight variant
      const variantKey = selectedVariant ? selectedVariant.weight : 'default';
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id && (item.selectedVariant?.weight === variantKey || (!item.selectedVariant && !selectedVariant))
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        return [...prevItems, {
          id: product.id,
          name: product.name,
          price: selectedVariant ? selectedVariant.price : product.price,
          weight: selectedVariant ? selectedVariant.weight : product.weight || '100g',
          image: product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78',
          selectedVariant,
          quantity
        }];
      }
    });
  };

  const removeFromCart = (productId, variantWeight = null) => {
    setCartItems(prevItems => {
      return prevItems.filter(item => {
        const matchId = item.id === productId;
        const matchVariant = variantWeight ? item.selectedVariant?.weight === variantWeight : true;
        return !(matchId && matchVariant);
      });
    });
  };

  const updateQuantity = (productId, variantWeight, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantWeight);
      return;
    }

    setCartItems(prevItems => {
      return prevItems.map(item => {
        const matchId = item.id === productId;
        const matchVariant = variantWeight ? item.selectedVariant?.weight === variantWeight : !item.selectedVariant;
        if (matchId && matchVariant) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setPromoCode(null);
    setDiscount(0);
  };

  const cartSubtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Delivery fee — reads from admin settings saved in localStorage
  const standardDeliveryFee = Number(localStorage.getItem('admin_delivery_fee') ?? 40);
  const freeDeliveryThreshold = Number(localStorage.getItem('admin_free_threshold') ?? 500);
  const isFreeDelivery = cartSubtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : standardDeliveryFee;

  // Recalculate discount when subtotal or promo code changes
  useEffect(() => {
    if (!promoCode) {
      setDiscount(0);
      return;
    }

    if (cartSubtotal < promoCode.minAmount) {
      setPromoCode(null);
      setDiscount(0);
      return;
    }

    if (promoCode.type === 'percentage') {
      setDiscount(Math.round((cartSubtotal * promoCode.value) / 100));
    } else if (promoCode.type === 'fixed') {
      setDiscount(promoCode.value);
    }
  }, [cartSubtotal, promoCode]);

  const applyPromoCode = async (code) => {
    if (isFirebaseMock) {
      const found = MOCK_COUPONS.find(c => c.code.toUpperCase() === code.toUpperCase());
      if (!found) {
        throw new Error("Invalid promo code. Try KASHID10, FESTIVE20, or SNACK50");
      }
      if (cartSubtotal < found.minAmount) {
        throw new Error(`Minimum purchase amount of ₹${found.minAmount} required for this coupon.`);
      }
      setPromoCode(found);
      return found;
    }

    // Live Firebase Coupon validation
    try {
      const couponDoc = await getDoc(doc(db, 'coupons', code.toUpperCase()));
      if (!couponDoc.exists() || !couponDoc.data().active) {
        throw new Error("Coupon code is invalid or expired.");
      }
      const data = couponDoc.data();
      if (cartSubtotal < data.minAmount) {
        throw new Error(`Minimum purchase amount of ₹${data.minAmount} required.`);
      }
      setPromoCode(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const removePromoCode = () => {
    setPromoCode(null);
    setDiscount(0);
  };

  const cartTotal = Math.max(0, cartSubtotal - discount + deliveryFee);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartSubtotal,
      cartTotal,
      deliveryFee,
      isFreeDelivery,
      standardDeliveryFee,
      freeDeliveryThreshold,
      discount,
      promoCode,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      applyPromoCode,
      removePromoCode
    }}>
      {children}
    </CartContext.Provider>
  );
}
