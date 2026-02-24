import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// --- Lógica de Colores (Intacta como pediste) ---
const getColorHex = (colorName) => {
    if (!colorName) return "#555";
    const name = colorName.toLowerCase();
    if (name.includes('blue') || name.includes('teal')) return "#1e3a8a";
    if (name.includes('pink') || name.includes('fuchsia')) return "#db2777";
    if (name.includes('green') || name.includes('olive')) return "#2d4d43";
    if (name.includes('red') || name.includes('burgundy')) return "#991b1b";
    if (name.includes('black')) return "#111";
    if (name.includes('white')) return "#fff";
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
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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
            } catch (error) { console.error('Error MAKIA:', error); }
            finally { setCargando(false); }
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
        setIsCartOpen(true); // Se despliega la bolsa al agregar
    };

    return (
        <div className="client-view">
            <header className="client-header-makia">
                <div className="logo-text">MAKIA</div>
                <div className="header-right-icons">
                    <div className="cart-icon-wrapper" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCountBadge">{carrito.length}</span>
                    </div>
                    <div className="user-icon-wrapper" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                        <i className="far fa-user"></i>
                        {isUserMenuOpen && (
                            <div className="user-dropdown-box">
                                <button onClick={logout}>Cerrar Sesión</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="hero-banner-fixed">
                <img src="/hero-banner-client.jpg" alt="MAKIA Hero" />
            </div>

            <div className="store-layout-grid">
                <aside className="filters-sidebar-original">
                    <h2 className="sidebar-h2">Filtros</h2>
                    <div className="filter-group">
                        <h3 className="sidebar-h3">Talla</h3>
                        <div className="sidebar-buttons">
                            {['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => (
                                <button key={t} className="filter-sz-btn">{t}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="shop-area">
                    <div className="shop-header-row">
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

                    <div className="fixed-grid-3-columns">
                        {!cargando && productos.map((prod) => {
                            const tallasReales = (prod.sizes_available || []).filter(t => t !== 'Única' && t !== 'N/A' && t !== 'Default Title');
                            const colorActivo = colorVisual[prod._id] || (prod.colors_available?.[0]);
                            const varianteColor = prod.variants?.find(v => v.color === colorActivo);
                            const imagenAMostrar = varianteColor?.image || getPrimaryImage(prod);

                            return (
                                <div key={prod._id} className="makia-card">
                                    <div className="image-box">
                                        <img src={imagenAMostrar} alt={prod.title} className="p-img" />
                                    </div>
                                    <div className="info-box">
                                        <h3>{prod.title}</h3>
                                        <p className="price-text">{prod.precioMXN?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>

                                        <div className="swatch-container">
                                            {prod.colors_available?.map(col => (
                                                <button 
                                                    key={col}
                                                    className={`dot ${colorActivo === col ? 'active' : ''}`}
                                                    style={{ backgroundColor: getColorHex(col) }}
                                                    onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))}
                                                    title={col}
                                                />
                                            ))}
                                        </div>

                                        <div className="action-footer">
                                            {tallasReales.length > 0 ? (
                                                <select 
                                                    className="size-select-makia"
                                                    value={tallasSeleccionadas[prod._id] || ""}
                                                    onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}
                                                >
                                                    <option value="">Seleccionar Talla</option>
                                                    {tallasReales.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            ) : <div className="unique-size">Talla Única</div>}

                                            <button 
                                                className="add-to-bag-btn-makia"
                                                onClick={() => agregarAlCarrito(prod, colorActivo)}
                                                disabled={tallasReales.length > 0 && !tallasSeleccionadas[prod._id]}
                                            >
                                                {tallasReales.length > 0 && !tallasSeleccionadas[prod._id] ? 'SELECCIONA TALLA' : 'AÑADIR A LA BOLSA'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <PaginationControls page={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
                </main>
            </div>

            {/* Modal Bolsa Operativo */}
            {isCartOpen && (
                <div className="cart-overlay-fixed" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-panel-fixed" onClick={e => e.stopPropagation()}>
                        <div className="cart-header-fixed">
                            <h2>TU BOLSA</h2>
                            <span className="close-x" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-list-fixed">
                            {carrito.map((item, i) => (
                                <div key={i} className="cart-row-fixed">
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