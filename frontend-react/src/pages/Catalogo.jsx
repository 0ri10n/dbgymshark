import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// MAPA DE COLORES (Asegúrate que los nombres coincidan con tu CSV)
const COLOR_MAP = {
    "Midnight Blue": "#1e3a8a",
    "Lats Blue": "#3b82f6",
    "Base Green Marl": "#2d4d43",
    "White": "#ffffff",
    "Black": "#000000",
    "Evening Teal": "#134e4a",
    "Burgundy": "#7f1d1d",
    "Core Olive": "#3f6212",
    "Charcoal": "#374151",
    "Mars Red": "#b91c1c",
    "Deep Teal": "#064e3b"
};

const getColorHex = (colorName) => {
    if (!colorName) return "#555";
    const baseColor = colorName.split('/')[0].trim();
    return COLOR_MAP[baseColor] || "#555"; 
};

const getPrimaryImage = (prod = {}) => {
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
    const [colorVisual, setColorVisual] = useState({}); 
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    useEffect(() => {
        const cargarCatalogo = async () => {
            setCargando(true);
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';
                const respuesta = await axios.get(`${baseURL}/productos?page=${pagina}&search=${busqueda}`);
                if (respuesta.data.productos) {
                    setProductos(respuesta.data.productos);
                    setTotalPaginas(respuesta.data.pagination?.pages || 1);
                }
            } catch (error) {
                console.error('Error MAKIA:', error);
            } finally {
                setCargando(false);
            }
        };
        cargarCatalogo();
    }, [pagina, busqueda]);

    const agregarAlCarrito = (prod, colorElegido) => {
        const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
        const item = {
            ...prod,
            tallaElegida: tallasReales.length > 0 ? tallasSeleccionadas[prod._id] : 'Única',
            colorElegido: colorElegido || (prod.colors_available?.[0] || 'N/A')
        };
        setCarrito([...carrito, item]);
        setIsCartOpen(true);
    };

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
                        <div className="sidebar-size-grid">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => (
                                <button key={t} className="filter-size-btn">{t}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="shop-content">
                    <div className="shop-controls">
                        <div className="search-bar-white">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="¿Qué estás buscando hoy?" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="products-grid-3">
                        {cargando ? (
                            <div className="loading-container"><p>Cargando MAKIA...</p></div>
                        ) : (
                            productos.map((prod) => {
                                const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
                                const tieneTallas = tallasReales.length > 0;
                                const colorActivo = colorVisual[prod._id] || (prod.colors_available?.[0]);
                                const varianteColor = prod.variants?.find(v => v.color === colorActivo);
                                const imagenAMostrar = varianteColor?.image || getPrimaryImage(prod);

                                return (
                                    <div key={prod._id} className="product-card">
                                        <div className="product-image-container">
                                            <img src={imagenAMostrar} alt={prod.title} className="product-img" />
                                        </div>
                                        <div className="product-info">
                                            <h3>{prod.title}</h3>
                                            <p className="price">
                                                {prod.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </p>

                                            <div className="color-dots-container">
                                                {prod.colors_available?.map(col => (
                                                    <button 
                                                        key={col}
                                                        className={`color-dot ${colorActivo === col ? 'active' : ''}`}
                                                        style={{ backgroundColor: getColorHex(col) }}
                                                        onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))}
                                                        title={col}
                                                    />
                                                ))}
                                            </div>

                                            <div className="card-actions">
                                                {tieneTallas ? (
                                                    <select 
                                                        className="size-dropdown"
                                                        value={tallasSeleccionadas[prod._id] || ""}
                                                        onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}
                                                    >
                                                        <option value="">Seleccionar Talla</option>
                                                        {tallasReales.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                ) : <div className="unique-size-box">Talla Única</div>}

                                                <button 
                                                    className="add-to-bag-btn"
                                                    onClick={() => agregarAlCarrito(prod, colorActivo)}
                                                    disabled={tieneTallas && !tallasSeleccionadas[prod._id]}
                                                >
                                                    {tieneTallas && !tallasSeleccionadas[prod._id] ? 'SELECCIONA TALLA' : 'AÑADIR A LA BOLSA'}
                                                </button>
                                            </div>
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
                <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-header-modal">
                            <h2>TU BOLSA</h2>
                            <span className="close-x" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-list">
                            {carrito.map((item, i) => (
                                <div key={i} className="cart-row">
                                    <div className="cart-text">
                                        <p>{item.title}</p>
                                        <small>{item.tallaElegida} | {item.colorElegido}</small>
                                    </div>
                                    <p>{item.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
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