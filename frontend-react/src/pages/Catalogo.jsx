import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// MAPA DE COLORES RECARGADO: Para que coincidan con tus fotos
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
    "Deep Teal": "#014d4e",
    "Aesthete Blue": "#4a90e2",
    "Digital Teal": "#008b8b",
    "Dragon Pink": "#c026d3", // El fucsia que se ve en la foto
    "Bright Fuchsia": "#db2777"
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
            <header className="client-header-makia">
                <div className="logo-original">MAKIA</div>
                <div className="header-right-icons">
                    <div className="cart-btn" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span className="cart-dot-count">{carrito.length}</span>
                    </div>
                    <div className="user-btn" onClick={logout}>
                        <i className="far fa-user"></i>
                    </div>
                </div>
            </header>

            <div className="hero-banner-fixed">
                <img src="/hero-banner-client.jpg" alt="MAKIA Hero" />
            </div>

            <div className="store-container-layout">
                <aside className="filters-sidebar-fixed">
                    <h2 className="f-title">Filtros</h2>
                    <div className="f-group">
                        <h3>Talla</h3>
                        <div className="f-size-grid">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => (
                                <button key={t} className="f-size-btn">{t}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="shop-search-container">
                        <div className="search-bar-makia">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="¿Qué estás buscando hoy?" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="products-grid-3-columns">
                        {cargando ? (
                            <div className="loading-container"><p>Cargando MAKIA...</p></div>
                        ) : (
                            productos.map((prod) => {
                                const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
                                const colorActivo = colorVisual[prod._id] || (prod.colors_available?.[0]);
                                const varianteColor = prod.variants?.find(v => v.color === colorActivo);
                                const imagenAMostrar = varianteColor?.image || getPrimaryImage(prod);

                                return (
                                    <div key={prod._id} className="card-makia">
                                        <div className="card-img-holder">
                                            <img src={imagenAMostrar} alt={prod.title} className="product-img" />
                                        </div>
                                        <div className="card-content-holder">
                                            <h3>{prod.title}</h3>
                                            <p className="price-tag">
                                                {prod.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </p>

                                            <div className="swatch-carousel">
                                                {prod.colors_available?.map(col => (
                                                    <button 
                                                        key={col}
                                                        className={`swatch-dot ${colorActivo === col ? 'active' : ''}`}
                                                        style={{ backgroundColor: getColorHex(col) }}
                                                        onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))}
                                                        title={col}
                                                    />
                                                ))}
                                            </div>

                                            <div className="card-actions-fixed">
                                                {tallasReales.length > 0 ? (
                                                    <select 
                                                        className="dropdown-size"
                                                        value={tallasSeleccionadas[prod._id] || ""}
                                                        onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}
                                                    >
                                                        <option value="">Seleccionar Talla</option>
                                                        {tallasReales.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                ) : <div className="unique-box">Talla Única</div>}

                                                <button 
                                                    className="btn-add-to-bag"
                                                    onClick={() => agregarAlCarrito(prod, colorActivo)}
                                                    disabled={tallasReales.length > 0 && !tallasSeleccionadas[prod._id]}
                                                >
                                                    {tallasReales.length > 0 && !tallasSeleccionadas[prod._id] ? 'SELECCIONA TALLA' : 'AÑADIR A LA BOLSA'}
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
                <div className="cart-fixed-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-fixed-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-fixed-header">
                            <h2>TU BOLSA</h2>
                            <span className="close-cart-icon" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-fixed-list">
                            {carrito.map((item, i) => (
                                <div key={i} className="cart-fixed-item">
                                    <div>
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