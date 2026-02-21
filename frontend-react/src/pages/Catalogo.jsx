import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

const Catalogo = () => {
    const { logout } = useAuth();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);

    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const totalPaginasSeguras = Math.max(totalPaginas || 1, 1);

    useEffect(() => {
        const cargarCatalogo = async () => {
            setCargando(true);
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark.onrender.com/api';
                const url = `${baseURL}/productos?page=${pagina}&limit=20`;
                const respuesta = await axios.get(url);

                if (respuesta.data.productos) {
                    const paginasRaw = respuesta.data.paginasTotales || respuesta.data.pagination?.pages || 1;
                    const paginas = Math.max(Number(paginasRaw) || 1, 1);
                    setProductos(respuesta.data.productos);
                    setTotalPaginas(paginas);
                } else {
                    setProductos(Array.isArray(respuesta.data) ? respuesta.data : []);
                    setTotalPaginas(1);
                }
            } catch (error) {
                console.error('Error al conectar con MAKIA API:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarCatalogo();
    }, [pagina]);

    const agregarAlCarrito = (prod) => {
        setCarrito([...carrito, prod]);
        setShowSuccessModal(true);
    };

    const productosFiltrados = productos.filter((p) => {
        const nombre = (p.nombre || p.title || '').toLowerCase();
        return nombre.includes(busqueda.toLowerCase());
    });

    const toggleCart = () => setIsCartOpen(!isCartOpen);
    const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

    return (
        <div className="client-view">
            <header className="client-header">
                <div className="logo">MAKIA</div>
                <div className="header-icons">
                    <div className="cart-wrapper" onClick={toggleCart}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{carrito.length}</span>
                    </div>
                    <div className="user-menu-container" onClick={toggleUserMenu}>
                        <i className="far fa-user"></i>
                        {isUserMenuOpen && (
                            <div className="user-dropdown">
                                <button id="logoutBtn" onClick={logout}>Cerrar Sesion</button>
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
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map((talla) => (
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
                                placeholder="Que estas buscando hoy?"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="products-grid">
                        {cargando ? (
                            <div className="loading-container">
                                <p className="loading-text">Conectando con el servidor...</p>
                            </div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="no-results-container">
                                <i className="fas fa-search-minus"></i>
                                <h3>Ups, no encontramos nada</h3>
                                <p>No hay productos que coincidan con "{busqueda}". Intenta con otra palabra.</p>
                            </div>
                        ) : (
                            productosFiltrados.map((prod) => (
                                <div key={prod._id} className="product-card">
                                    <img
                                        src={prod.imagen || prod.image_principal || prod.imagenUrl || '/placeholder.jpg'}
                                        alt={prod.nombre || prod.title || 'Producto'}
                                        className="product-img"
                                    />
                                    <div className="product-info">
                                        <h4>{prod.nombre || prod.title || 'Producto'}</h4>
                                        <p className="product-price">
                                            {prod.precioMXN?.toLocaleString('es-MX', {
                                                style: 'currency',
                                                currency: 'MXN',
                                            }) || '$0.00 MXN'}
                                        </p>
                                        <div className="product-sizes">
                                            {(prod.tallasDisponibles || prod.sizes_available || []).map((talla) => (
                                                <span key={talla} className="size-badge">{talla}</span>
                                            ))}
                                        </div>
                                        <button className="add-to-cart-btn" onClick={() => agregarAlCarrito(prod)}>
                                            Anadir a la bolsa
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <PaginationControls
                        page={pagina}
                        totalPages={totalPaginasSeguras}
                        groupSize={6}
                        className="catalog-pagination-theme"
                        ariaLabel="Paginacion del catalogo"
                        onPageChange={(nextPage) => {
                            setPagina(nextPage);
                            window.scrollTo(0, 0);
                        }}
                    />
                </main>
            </div>

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
                                    <span>{item.nombre || item.title || 'Producto'}</span>
                                    <span>{item.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) || '$0.00 MXN'}</span>
                                </div>
                            ))}
                            {carrito.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>Tu bolsa esta vacia.</p>}
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="order-modal">
                    <div className="order-content">
                        <i className="fas fa-check-circle success-icon"></i>
                        <h2>Agregado</h2>
                        <button onClick={() => setShowSuccessModal(false)}>Continuar comprando</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;
