import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// MAPA DE COLORES EXTENDIDO (Basado en CSV y capturas)
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
    "Deep Teal": "#064e3b",
    "Forest Green": "#064e3b",
    "Navy": "#1e3a8a"
};

const getColorHex = (colorName) => {
    if (!colorName) return "#555";
    // Limpia el nombre si trae "/" (ej: Midnight Blue/Lats Blue)
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
                // Añadimos la búsqueda a la petición para que funcione el filtro
                const respuesta = await axios.get(`${baseURL}/productos?page=${pagina}&search=${busqueda}`);
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
    }, [pagina, busqueda]);

    const agregarAlCarrito = (prod, colorElegido) => {
        const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
        const necesitaTalla = tallasReales.length > 0;
        
        const item = {
            ...prod,
            tallaElegida: necesitaTalla ? tallasSeleccionadas[prod._id] : 'Única',
            colorElegido: colorElegido || (prod.colors_available?.[0] || 'Único')
        };

        setCarrito([...carrito, item]);
        setIsCartOpen(true); 
    };

    const toggleTalla = (id, talla) => {
        setTallasSeleccionadas(prev => ({
            ...prev,
            [id]: prev[id] === talla ? null : talla
        }));
    };

    const cambiarColorVisual = (id, color) => {
        setColorVisual(prev => ({ ...prev, [id]: color }));
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
                    <div className="user-menu-container" onClick={logout}>
                         <i className="far fa-user"></i>
                    </div>
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

                                            <div className="color-selector-scroll">
                                                {prod.colors_available?.map(col => (
                                                    <button 
                                                        key={col}
                                                        className={`color-dot ${colorActivo === col ? 'active' : ''}`}
                                                        style={{ backgroundColor: getColorHex(col) }}
                                                        onClick={() => cambiarColorVisual(prod._id, col)}
                                                        title={col}
                                                    />
                                                ))}
                                            </div>

                                            <div className="size-selection-area">
                                                {tieneTallas ? (
                                                    <select 
                                                        className="size-dropdown-select"
                                                        value={tallasSeleccionadas[prod._id] || ""}
                                                        onChange={(e) => toggleTalla(prod._id, e.target.value)}
                                                    >
                                                        <option value="">Selecciona Talla</option>
                                                        {tallasReales.map(t => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                ) : <span className="size-label-unique">Talla Única</span>}
                                            </div>

                                            <button 
                                                className="add-to-cart-btn-makia"
                                                onClick={() => agregarAlCarrito(prod, colorActivo)}
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

            {/* MODAL DE LA BOLSA (Overlay completo) */}
            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-header">
                            <h2>TU BOLSA</h2>
                            <span className="cart-close-icon" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-items-container">
                            {carrito.length === 0 ? <p>Tu bolsa está vacía</p> : carrito.map((item, i) => (
                                <div key={i} className="cart-item-row">
                                    <div className="cart-item-details">
                                        <span className="cart-item-name">{item.title}</span>
                                        <span className="cart-item-meta">{item.tallaElegida} | {item.colorElegido}</span>
                                    </div>
                                    <span>{item.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                                </div>
                            ))}
                        </div>
                        {carrito.length > 0 && <button className="checkout-btn-makia">PAGAR</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;