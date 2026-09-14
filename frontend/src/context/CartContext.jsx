import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) {
      // Local storage cart for unauthenticated users
      const localCart = JSON.parse(localStorage.getItem('techstore_cart') || '[]');
      setCartItems(localCart);
      const total = localCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setCartTotal(total);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.success) {
        setCartItems(res.data.items || []);
        setCartTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (product, quantity = 1) => {
    if (!user) {
      const localCart = JSON.parse(localStorage.getItem('techstore_cart') || '[]');
      const existingIndex = localCart.findIndex(item => item.id === product.id);
      
      if (existingIndex > -1) {
        localCart[existingIndex].quantity += quantity;
      } else {
        localCart.push({ ...product, quantity });
      }
      
      localStorage.setItem('techstore_cart', JSON.stringify(localCart));
      setCartItems(localCart);
      const total = localCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setCartTotal(total);
      return;
    }

    try {
      const res = await api.post('/cart/items', { product_id: product.id, quantity });
      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(itemId);
    }

    if (!user) {
      const localCart = JSON.parse(localStorage.getItem('techstore_cart') || '[]');
      const updatedCart = localCart.map(item => item.id === itemId ? { ...item, quantity } : item);
      localStorage.setItem('techstore_cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      const total = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setCartTotal(total);
      return;
    }

    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) {
      const localCart = JSON.parse(localStorage.getItem('techstore_cart') || '[]');
      const updatedCart = localCart.filter(item => item.id !== itemId);
      localStorage.setItem('techstore_cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      const total = updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setCartTotal(total);
      return;
    }

    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      if (res.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem('techstore_cart');
      setCartItems([]);
      setCartTotal(0);
      return;
    }

    try {
      await api.delete('/cart');
      setCartItems([]);
      setCartTotal(0);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, cartTotal, itemCount, loading, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
