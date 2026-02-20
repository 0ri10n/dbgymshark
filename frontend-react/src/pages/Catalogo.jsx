import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Catalogo.css'; 

const Catalogo = () => {
    // 1. CONTEXTO Y ESTADOS BASE
    const { logout } = useAuth();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const [productos, setProductos] = useState([]); 
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    // 2. ESTADOS DE PAGINACIÓN DINÁMICA (Requisito de Isaac)
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // 3. EFECTO DE CARGA CON LÍMITE DE 20
    useEffect(() => {
        const cargarCatalogo = async () => {
            setCargando(true);
            try {
                // Usamos la variable de entorno de Render
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark.onrender.com/api';
                const url = `${baseURL}/productos?page=${pagina}&limit=20`; 
                
                const respuesta = await axios.get(url);
                
                // Sincronización con el backend de Kevin
                // Ajustamos según si la API devuelve el objeto directo o un envoltorio con metadata
                if (respuesta.data.productos) {
                    setProductos(respuesta.data.productos);
                    setTotalPaginas(respuesta.data.paginasTotales);
                } else {
                    setProductos(respuesta.data);
                }
            } catch (error) {
                console.error("Error al conectar con MAKIA API:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarCatalogo();
    }, [pagina]); // Se dispara cada vez que cambia la página

    // 4. FUNCIONES DE INTERACCIÓN
    const agregarAlCarrito = (prod) => {
        setCarrito([...carrito, prod]);
        setShowSuccessModal(true);
    };

    const productosFiltrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const toggleCart = () => setIsCartOpen(!isCartOpen);
    const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

    return (
        <div className="client-view">
            <header className="client-header">
                <div className="logo">MAKIA</div>
                <div className="header-icons">
                    <div className="cart-wrapper" onClick={toggleCart} style={{cursor: 'pointer'}}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{carrito.length}</span>
                    </div>
                    <div className="user-menu-container" onClick={toggleUserMenu} style={{cursor: 'pointer'}}>
                        <i className="far fa-user"></i>
                        {isUserMenuOpen && (
                            <div className="user-dropdown">
                                <button id="logoutBtn" onClick={logout}>Cerrar Sesión</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="hero-banner">
                <img src="/hero-banner-client.jpg" alt="Banner Hero" />
            </div>

            <div className="store-layout">
                <aside className="filters-sidebar">
                    <h2 className="sidebar-title">Filtros</h2>
                    <div className="filter-section">
                        <h3>Talla</h3>
                        <div className="size-grid">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(talla => (
                                <button key={talla}>{talla}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="shop-content">
                    <div className="shop-controls">
                        <div className="search-bar">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="¿Qué estás buscando hoy?" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="products-grid">
                        {cargando ? (
                            <div className="loading-container">
                                <p className="loading-text">Conectando con el servidor de Kevin...</p>
                            </div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="no-results-container">
                                <i className="fas fa-search-minus"></i>
                                <h3>Ups, no encontramos nada</h3>
                                <p>No hay productos que coincidan con "{busqueda}". Intenta con otra palabra.</p>
                            </div>
                        ) : (
                            productosFiltrados.map(prod => (
                                <div key={prod._id} className="product-card">
                                    <img src={prod.imagen || '/placeholder.jpg'} alt={prod.nombre} className="product-img" />
                                    <div className="product-info">
                                        <h4>{prod.nombre}</h4>
                                        <p className="product-price">
                                            {prod.precioMXN?.toLocaleString('es-MX', { 
                                                style: 'currency', 
                                                currency: 'MXN' 
                                            })}
                                        </p>
                                        <div className="product-sizes">
                                            {prod.tallasDisponibles?.map(talla => (
                                                <span key={talla} className="size-badge">{talla}</span>
                                            ))}
                                        </div>
                                        <button className="add-to-cart-btn" onClick={() => agregarAlCarrito(prod)}>
                                            Añadir a la bolsa
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 5. CONTROLES DE PAGINACIÓN (Para el reto de Isaac) */}
                    <div className="pagination-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px', gap: '20px'}}>
                        <button 
                            className="btn-paginacion" 
                            disabled={pagina === 1} 
                            onClick={() => { setPagina(prev => prev - 1); window.scrollTo(0, 0); }}
                        >
                            Anterior
                        </button>
                        <span className="page-info">Página <strong>{pagina}</strong> de {totalPaginas}</span>
                        <button 
                            className="btn-paginacion" 
                            disabled={pagina === totalPaginas} 
                            onClick={() => { setPagina(prev => prev + 1); window.scrollTo(0, 0); }}
                        >
                            Siguiente
                        </button>
                    </div>
                </main>
            </div>

            {/* Modales */}
            {isCartOpen && (
                <div className="cart-modal">
                    <div className="cart-content">
                        <div className="cart-header">
                            <h2>TU BOLSA</h2>
                            <span className="close-btn" onClick={toggleCart}>&times;</span>
                        </div>
                        <div className="cart-items-list">
                            {carrito.map((item, index) => (
                                <div key={index} className="cart-item">
                                    <span>{item.nombre}</span>
                                    <span>{item.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                                </div>
                            ))}
                            {carrito.length === 0 && <p style={{textAlign: 'center', padding: '20px'}}>Tu bolsa está vacía.</p>}
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="order-modal">
                    <div className="order-content">
                        <i className="fas fa-check-circle success-icon"></i>
                        <h2>¡AGREGADO!</h2>
                        <button onClick={() => setShowSuccessModal(false)}>CONTINUAR COMPRANDO</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;