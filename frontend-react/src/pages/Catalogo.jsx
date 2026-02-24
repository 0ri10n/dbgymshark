import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// RESOLUTOR INTELIGENTE DE COLORES
const getColorHex = (colorName) => {
    if (!colorName) return "#555";
    const name = colorName.toLowerCase();

    if (name.includes('blue') || name.includes('teal') || name.includes('aqua')) return "#1e3a8a";
    if (name.includes('pink') || name.includes('fuchsia') || name.includes('berry')) return "#db2777";
    if (name.includes('green') || name.includes('olive') || name.includes('aloe')) return "#2d4d43";
    if (name.includes('red') || name.includes('burgundy') || name.includes('maroon')) return "#991b1b";
    if (name.includes('orange') || name.includes('apricot')) return "#ea580c";
    if (name.includes('purple') || name.includes('violet') || name.includes('lilac')) return "#7e22ce";
    if (name.includes('black') || name.includes('charcoal') || name.includes('asphalt')) return "#111";
    if (name.includes('white') || name.includes('ecru')) return "#fff";
    if (name.includes('grey') || name.includes('ash')) return "#777";
    if (name.includes('brown') || name.includes('truffle')) return "#451a03";
    if (name.includes('yellow')) return "#eab308";

    return "#555"; // Color por defecto si no encuentra palabra clave
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
            colorElegido: colorElegido || (prod.colors_available?.[0] || 'Único')
        };
        setCarrito([...carrito, item]);
        setIsCartOpen(true);
    };

    return (
        <div className="client-view">
            {/* HEADER CORREGIDO */}
            <header className="header-original-makia">
                <div className="logo-makia-font">MAKIA</div>
                <div className="header-right-tools">
                    <div className="cart-tool" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span className="cart-count-badge">{carrito.length}</span>
                    </div>
                    <div className="user-tool" onClick={logout}>
                        <i className="far fa-user"></i>
                    </div>
                </div>
            </header>

            <div className="hero-banner-original">
                <img src="/hero-banner-client.jpg" alt="MAKIA Hero" />
            </div>

            <div className="store-main-layout">
                {/* FILTROS ORIGINALES */}
                <aside className="sidebar-filters-box">
                    <h2 className="f-title">Filtros</h2>
                    <div className="f-section">
                        <h3>Talla</h3>
                        <div className="f-size-grid">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => (
                                <button key={t} className="f-btn">{t}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="shop-content-area">
                    <div className="search-controls-row">
                        <div className="white-search-bar">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="¿Qué estás buscando hoy?" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* GRID FORZADO DE 3 PRODUCTOS */}
                    <div className="products-grid-3">
                        {cargando ? (
                            <div className="loading-container"><p>Cargando MAKIA...</p></div>
                        ) : (
                            productos.map((prod) => {
                                const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
                                const colorActivo = colorVisual[prod._id] || (prod.colors_available?.[0]);
                                const varianteColor = prod.variants?.find(v => v.color === colorActivo);
                                const imagenAMostrar = varianteColor?.image || getPrimaryImage(prod);

                                return (
                                    <div key={prod._id} className="card-product-makia">
                                        <div className="img-container">
                                            <img src={imagenAMostrar} alt={prod.title} className="p-img" />
                                        </div>
                                        <div className="info-container">
                                            <h3 className="p-title">{prod.title}</h3>
                                            <p className="p-price">
                                                {prod.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </p>

                                            <div className="swatch-row">
                                                {prod.colors_available?.map(col => (
                                                    <button 
                                                        key={col}
                                                        className={`swatch ${colorActivo === col ? 'active' : ''}`}
                                                        style={{ backgroundColor: getColorHex(col) }}
                                                        onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))}
                                                        title={col}
                                                    />
                                                ))}
                                            </div>

                                            <div className="actions-footer">
                                                {tallasReales.length > 0 ? (
                                                    <select 
                                                        className="dropdown-size-makia"
                                                        value={tallasSeleccionadas[prod._id] || ""}
                                                        onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}
                                                    >
                                                        <option value="">Seleccionar Talla</option>
                                                        {tallasReales.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                ) : <div className="label-unique">Talla Única</div>}

                                                <button 
                                                    className="buy-btn-makia"
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