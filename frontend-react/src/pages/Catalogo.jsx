import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// Mantenemos tu lógica de colores que ya está perfecta
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
    "Dragon Pink": "#c026d3",
    "Digital Teal": "#008b8b"
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
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => <button key={t} className="sidebar-btn">{t}</button>)}
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

                    {/* USAMOS LA NUEVA CLASE PARA LAS 3 COLUMNAS */}
                    <div className="products-grid-fixed">
                        {cargando ? (
                            <div className="loading-container"><p>Cargando MAKIA...</p></div>
                        ) : (
                            productos.map((prod) => {
                                const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
                                const colorActivo = colorVisual[prod._id] || (prod.colors_available?.[0]);
                                const varianteColor = prod.variants?.find(v => v.color === colorActivo);
                                const imagenAMostrar = varianteColor?.image || getPrimaryImage(prod);

                                return (
                                    <div key={prod._id} className="product-card-original">
                                        <div className="product-img-frame">
                                            <img src={imagenAMostrar} alt={prod.title} className="p-img-fit" />
                                        </div>
                                        <div className="product-details-frame">
                                            <h3>{prod.title}</h3>
                                            <p className="price-label">
                                                {prod.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </p>

                                            <div className="color-swatches-row">
                                                {prod.colors_available?.map(col => (
                                                    <button 
                                                        key={col}
                                                        className={`swatch-circle ${colorActivo === col ? 'active' : ''}`}
                                                        style={{ backgroundColor: getColorHex(col) }}
                                                        onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))}
                                                        title={col}
                                                    />
                                                ))}
                                            </div>

                                            <div className="actions-container">
                                                {tallasReales.length > 0 ? (
                                                    <select 
                                                        className="size-dropdown-makia"
                                                        value={tallasSeleccionadas[prod._id] || ""}
                                                        onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}
                                                    >
                                                        <option value="">Selecciona Talla</option>
                                                        {tallasReales.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                ) : <div className="unique-box-label">Talla Única</div>}

                                                <button 
                                                    className="add-bag-btn-makia"
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
        </div>
    );
};

export default Catalogo;