import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

const getColorHex = (colorName) => {
    if (!colorName) return "#555";
    const name = colorName.toLowerCase();
    if (name.includes('blue') || name.includes('teal')) return "#1e3a8a";
    if (name.includes('pink') || name.includes('fuchsia')) return "#db2777";
    if (name.includes('green') || name.includes('olive')) return "#2d4d43";
    if (name.includes('red') || name.includes('burgundy')) return "#991b1b";
    if (name.includes('black')) return "#111";
    if (name.includes('white')) return "#fff";
    if (name.includes('grey')) return "#777";
    return "#555";
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
        setIsCartOpen(true); // Abre la bolsa automáticamente al añadir
    };

    return (
        <div className="client-view">
            <header className="client-header-makia">
                <div className="logo-text">MAKIA</div>
                <div className="header-right-icons">
                    <div className="cart-wrapper" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{carrito.length}</span>
                    </div>
                    <div className="user-icon" onClick={logout}>
                        <i className="far fa-user"></i>
                    </div>
                </div>
            </header>

            <div className="hero-banner-fixed">
                <img src="/hero-banner-client.jpg" alt="MAKIA Hero" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <h2 className="sidebar-h2">Filtros</h2>
                    <div className="filter-group">
                        <h3 className="sidebar-h3">Talla</h3>
                        <div className="sidebar-btn-grid">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => (
                                <button key={t} className="filter-size-btn">{t}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="search-bar-row">
                        <div className="white-search-box">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="¿Qué estás buscando hoy?" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="fixed-grid-3">
                        {cargando ? (
                            <div className="loading-container"><p>Cargando MAKIA...</p></div>
                        ) : (
                            productos.map((prod) => {
                                const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
                                const colorActivo = colorVisual[prod._id] || (prod.colors_available?.[0]);
                                const varianteColor = prod.variants?.find(v => v.color === colorActivo);
                                const imagenAMostrar = varianteColor?.image || getPrimaryImage(prod);

                                return (
                                    <div key={prod._id} className="makia-product-card">
                                        <div className="img-frame">
                                            <img src={imagenAMostrar} alt={prod.title} className="p-img" />
                                        </div>
                                        <div className="info-frame">
                                            <h3>{prod.title}</h3>
                                            <p className="p-price">
                                                {prod.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                            </p>

                                            <div className="swatch-row">
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

                                            <div className="card-footer">
                                                {tallasReales.length > 0 ? (
                                                    <select 
                                                        className="makia-size-dropdown"
                                                        value={tallasSeleccionadas[prod._id] || ""}
                                                        onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}
                                                    >
                                                        <option value="">Seleccionar Talla</option>
                                                        {tallasReales.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                ) : <div className="unique-size-label">Talla Única</div>}

                                                <button 
                                                    className="btn-add-to-bag-makia"
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

            {/* MODAL DE LA BOLSA (Overlay completo añadido) */}
            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-top">
                            <h2>TU BOLSA</h2>
                            <span className="close-cart-btn" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-modal-list">
                            {carrito.length === 0 ? <p style={{textAlign: 'center', padding: '20px'}}>Tu bolsa está vacía</p> : carrito.map((item, i) => (
                                <div key={i} className="cart-modal-row">
                                    <div className="item-details-box">
                                        <p className="item-name">{item.title}</p>
                                        <small className="item-meta">{item.tallaElegida} | {item.colorElegido}</small>
                                    </div>
                                    <p className="item-price-val">{item.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
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