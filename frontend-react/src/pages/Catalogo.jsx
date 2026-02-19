import React, { useState, useEffect } from 'react';
import './Catalogo.css'; 

const Catalogo = () => {
    // 1. ESTADOS PARA LA INTERFAZ
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // 2. ESTADOS PARA LOS DATOS (Aquí entrarán Isaac y Kevin)
    const [productos, setProductos] = useState([]); // Isaac usará esto para la paginación
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    // 3. FUNCIONES DE CONTROL
    const toggleCart = () => setIsCartOpen(!isCartOpen);
    const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

    return (
        <div className="client-view">
            {/* HEADER */}
            <header className="client-header">
                <div className="logo">MAKIA</div>
                <div className="header-icons">
                    <div className="cart-wrapper" onClick={toggleCart} style={{cursor: 'pointer'}}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{carrito.length}</span>
                    </div>
                    <div className="user-menu-container" onClick={toggleUserMenu} style={{cursor: 'pointer'}}>
                        <i className="far fa-user" id="userIcon"></i>
                        {isUserMenuOpen && (
                            <div className="user-dropdown" id="userDropdown">
                                <button id="logoutBtn" onClick={() => console.log("Logout")}>Cerrar Sesión</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO BANNER */}
            <div className="hero-banner">
                <img src="/hero-banner-client.jpg" alt="Banner Hero" />
            </div>

            {/* LAYOUT PRINCIPAL */}
            <div className="store-layout">
                <aside className="filters-sidebar">
                    <h2 className="sidebar-title">Filtros</h2>

                    <div className="filter-section">
                        <h3>Talla</h3>
                        <div className="size-grid" id="sizeFilters">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(talla => (
                                <button key={talla}>{talla}</button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>DISPONIBILIDAD</h3>
                        <div className="filter-options">
                            <label className="custom-checkbox">  
                                <input type="checkbox" id="checkAvailable" /> 
                                <span className="checkmark"></span> Disponible
                            </label>
                            <label className="custom-checkbox">
                                <input type="checkbox" id="checkOutOfStock" />
                                <span className="checkmark"></span> Fuera de Stock
                            </label>
                        </div>
                    </div>
                </aside>

                <main className="shop-content">
                    <div className="shop-controls">
                        <div className="search-bar">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="Search" 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </div>
                        <span className="view-all" style={{cursor: 'pointer', textDecoration: 'underline'}}>Ver todo</span>
                    </div>

                    <div className="products-grid" id="productsGrid">
                        {productos.length === 0 ? (
                            <p className="loading-text">Cargando catálogo de MAKIA...</p>
                        ) : (
                            productos.map(prod => (
                                <div key={prod._id} className="product-card">
                                    {/* Aquí Isaac inyectará el mapeo de productos paginados */}
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>

            {/* MODAL DEL CARRITO */}
            {isCartOpen && (
                <div id="cartModal" className="cart-modal">
                    <div className="cart-content">
                        <div className="cart-header">
                            <h2>TU BOLSA</h2>
                            <span className="close-btn" onClick={toggleCart}>&times;</span>
                        </div>
                        <div id="cartItemsContainer" className="cart-items-list">
                            {/* Megan: Aquí mapearás los items que se agreguen al carrito */}
                        </div>
                        <div className="cart-footer">
                            <div className="cart-total">
                                <span>Total:</span>
                                <span id="cartTotalValue">$0.00</span>
                            </div>
                            <button className="checkout-btn" onClick={() => setShowSuccessModal(true)}>Finalizar Compra</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ÉXITO */}
            {showSuccessModal && (
                <div id="orderSuccessModal" className="order-modal">
                    <div className="order-content">  
                        <i className="fas fa-check-circle success-icon"></i>  
                        <h2>¡PEDIDO RECIBIDO!</h2>   
                        <p>Tu orden ha sido procesada con éxito.</p>   
                        <button className="close-success-btn" onClick={() => setShowSuccessModal(false)}>VOLVER A LA TIENDA</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;