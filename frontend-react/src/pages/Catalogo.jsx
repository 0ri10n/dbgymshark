import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

const getPrimaryImage = (prod = {}) => {
    // Prioriza la imagen principal, luego la del CSV
    const img = prod.image_principal || prod.imagen || (prod.image_src ? prod.image_src.split(',')[0] : '/placeholder.jpg');
    return img.trim();
};

const Catalogo = () => {
    const { logout } = useAuth();
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    useEffect(() => {
        const cargarCatalogo = async () => {
            setCargando(true);
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';
                const respuesta = await axios.get(`${baseURL}/productos?page=${pagina}`);
                if (respuesta.data.productos) {
                    setProductos(respuesta.data.productos);
                    setTotalPaginas(respuesta.data.pagination?.pages || 1);
                }
            } catch (error) {
                console.error('Error MAKIA API:', error);
            } finally {
                setCargando(false);
            }
        };
        cargarCatalogo();
    }, [pagina]);

    const agregarAlCarrito = (prod) => {
        const tallasReales = (prod.tallasDisponibles || []).filter(t => t !== 'Única' && t !== 'N/A');
        const necesitaTalla = tallasReales.length > 0;
        
        const item = {
            ...prod,
            tallaElegida: necesitaTalla ? tallasSeleccionadas[prod._id] : 'Única'
        };

        setCarrito([...carrito, item]);
        setShowSuccessModal(true);
    };

    const seleccionarTalla = (id, talla) => {
        setTallasSeleccionadas(prev => ({ ...prev, [id]: talla }));
    };

    const productosFiltrados = productos.filter(p => 
        (p.title || p.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="client-view">
            <header className="client-header">
                <div className="logo">MAKIA</div>
                <div className="header-icons">
                    <div className="cart-wrapper" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{carrito.length}</span>
                    </div>
                    <i className="far fa-user" onClick={logout} style={{cursor: 'pointer'}}></i>
                </div>
            </header>

            <div className="hero-banner">
                <img src="/hero-banner-client.jpg" alt="MAKIA Hero" />
            </div>

            <div className="store-layout">
                <aside className="filters-sidebar">
                    <h2 className="sidebar-title">Filtros</h2>
                    <div className="filter-section">
                        <h3>Talla</h3>
                        <div className="size-grid">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => <button key={t}>{t}</button>)}
                        </div>
                    </div>
                </aside>

                <main className="shop-content">
                    <div className="shop-controls">
                        <div className="search-bar" style={{width: '100%'}}>
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
                            <div className="loading-container"><p>Cargando MAKIA...</p></div>
                        ) : (
                            productosFiltrados.map((prod) => {
                                const tallasReales = (prod.tallasDisponibles || []).filter(t => t !== 'Única' && t !== 'N/A');
                                const tieneTallas = tallasReales.length > 0;

                                return (
                                    <div key={prod._id} className="product-card">
                                        <div className="product-image-container">
                                            <img src={getPrimaryImage(prod)} alt={prod.title} className="product-img" />
                                        </div>
                                        <div className="product-info">
                                            <h3>{prod.title}</h3>
                                            <p className="price">
                                                {prod.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </p>

                                            <div className="product-sizes">
                                                {tieneTallas ? (
                                                    tallasReales.map(t => (
                                                        <button 
                                                            key={t}
                                                            className={`size-badge-btn ${tallasSeleccionadas[prod._id] === t ? 'activa' : ''}`}
                                                            onClick={() => seleccionarTalla(prod._id, t)}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))
                                                ) : <span className="size-badge">Única</span>}
                                            </div>

                                            <button 
                                                className="add-to-cart-btn"
                                                onClick={() => agregarAlCarrito(prod)}
                                                disabled={tieneTallas && !tallasSeleccionadas[prod._id]}
                                            >
                                                {tieneTallas && !tallasSeleccionadas[prod._id] ? 'SELECCIONA TALLA' : 'AÑADIR A LA BOLSA'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <PaginationControls page={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
                </main>
            </div>

            {isCartOpen && (
                <div className="cart-modal" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-content" onClick={e => e.stopPropagation()}>
                        <div className="cart-header">
                            <h2>TU BOLSA</h2>
                            <span className="close-btn" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-items-list">
                            {carrito.map((item, i) => (
                                <div key={i} className="cart-item">
                                    <div className="cart-item-info">
                                        <span>{item.title}</span>
                                        <span className="item-talla-label">TALLA: {item.tallaElegida}</span>
                                    </div>
                                    <span>{item.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;