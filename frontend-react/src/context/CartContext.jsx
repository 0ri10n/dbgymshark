import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // Cargar carrito desde localStorage para que no se borre al refrescar
    useEffect(() => {
        const savedCart = localStorage.getItem('makia_cart');
        if (savedCart) setCart(JSON.parse(savedCart));
    }, []);

    // Guardar en localStorage cada vez que cambie
    useEffect(() => {
        localStorage.setItem('makia_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart((prev) => {
            // Si el producto con la misma talla ya existe, solo subimos cantidad
            const existingIndex = prev.findIndex(item => item._id === product._id && item.selectedSize === product.selectedSize);
            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex].quantity += 1;
                return newCart;
            }
            return [...prev, product];
        });
    };

    const updateCartItem = (index, newItem) => {
        const newCart = [...cart];
        newCart[index] = newItem;
        setCart(newCart);
    };

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('makia_cart');
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartItem, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};