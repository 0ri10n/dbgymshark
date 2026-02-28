import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import PaginationControls from '../components/PaginationControls';
import Login from './Login';
import './Catalogo.css';

const TIPO_CAMBIO_USD_MXN = 17.00;

const CATEGORIAS_LIMPIAS = [
    'Accessories', 'Bags', 'Baselayers', 'Bodysuits', 'Bottles', 'Bottoms',
    'Crop Tops', 'Dresses', 'Footwear', 'Gift Cards', 'Headwear', 'Hoodies',
    'Jackets', 'Jackets & Outerwear', 'Joggers', 'Leggings', 'Long Sleeve Tops',
    'Miscellaneous', 'One Pieces', 'Outerwear', 'Pants', 'Pullovers',
    'Short Sleeve Tops', 'Shorts', 'Skorts', 'Sleeveless Tops', 'Socks',
    'Sports Bras', 'Stringers', 'Sweaters', 'Swimwear', 'T-Shirts',
    'Tanks', 'Tops', 'Uncategorized', 'Underwear', 'Vests'
];

const getColorHex = (name = "") => {
    const n = name.toLowerCase().trim();
    if (n === 'black') return "#111111";
    if (n === 'white') return "#FFFFFF";
    if (n.includes('teal')) return "#008080";
    if (n.includes('olive') || n.includes('aloe') || n.includes('alpine')) return "#556b2f";
    if (n.includes('green')) return "#2d4d43";
    if (n.includes('sage')) return "#b2ac88";
    if (n.includes('navy')) return "#000080";
    if (n.includes('aqua') || n.includes('aegean')) return "#00ffff";
    if (n.includes('blue')) return "#1e3a8a";
    if (n.includes('lilac')) return "#b666d2";
    if (n.includes('burgundy') || n.includes('maroon') || n.includes('berry')) return "#800020";
    if (n.includes('pink') || n.includes('rose') || n.includes('dolly')) return "#db2777";
    if (n.includes('red') || n.includes('carmine')) return "#991b1b";
    if (n.includes('purple') || n.includes('violet')) return "#6b21a8";
    if (n.includes('orange') || n.includes('apricot')) return "#f97316";
    if (n.includes('yellow')) return "#facc15";
    if (n.includes('brown') || n.includes('truffle') || n.includes('baked')) return "#5C4033";
    if (n.includes('beige') || n.includes('sand') || n.includes('ecru')) return "#d6d3d1";
    if (n.includes('grey') || n.includes('gray') || n.includes('asphalt') || n.includes('charcoal')) return "#4b5563";
    if (n.includes('/')) return getColorHex(n.split('/')[0]);
    return "#374151"; 
};

const getPrimaryImage = (p = {}) => {
    const img = p.image_principal || p.imagen || p.image_src || (p.variants && p.variants[0]?.image);
    if (typeof img === 'string' && img.includes(',')) return img.split(',')[0].trim();
    return img || "/placeholder.jpg";
};

const Catalogo = () => {
    const { user, logout } = useAuth();
    const { cart, addToCart, removeFromCart, updateCartItem } = useContext(CartContext);
    
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [catFiltro, setCatFiltro] = useState(null);
    const [precioMax, setPrecioMax] = useState(3500);
    const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
    const [colorVisual, setColorVisual] = useState({});
    const [catDesplegado, setCatDesplegado] = useState(false);

    useEffect(() => {
        const cargarData = async () => {
            setCargando(true);
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';
                const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=20&search=${busqueda}`);
                if (res.data.productos) {
                    setProductos(res.data.productos);
                    setTotalPaginas(res.data.pagination?.pages || 1);
                }
            } catch (e) { console.error("Error MAKIA:", e); }
            finally { setCargando(false); }
        };
        cargarData();
    }, [pagina, busqueda]);

    const productosAMostrar = productos.filter(p => {
        const precioPesos = p.precioMXN || (Number(p.price) * TIPO_CAMBIO_USD_MXN);
        const matchCat = !catFiltro || p.product_type === catFiltro;
        const matchPrecio = precioPesos <= precioMax;
        return matchCat && matchPrecio;
    });

    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        if (!talla) {
            alert("Por favor seleccione una talla antes de añadir.");
            return;
        }
        addToCart({ 
            ...p, 
            selectedSize: talla, 
            quantity: 1,
            selectedColor: colorVisual[p._id] || p.colors_available?.[0]
        });
        setIsCartOpen(true); 
    };

    return (
        <div className="client-view">
            <header className="client-header-makia">
                {/* Logo unificado con el estilo de AdminPanel */}
                <img src="/logo-makia-pages.png" alt="Makia Logo" className="brand-logo-img" />
                
                <div className="header-right-icons">
                    <div className="cart-wrapper" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{cart.length}</span>
                    </div>
                    <div className="user-icon" onClick={logout} style={{cursor:'pointer'}}>
                        <i className="far fa-user"></i>
                    </div>
                </div>
            </header>

            <div className="hero-banner-full">
                <img src="/hero-banner-client.jpg" alt="MAKIA Performance" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <div className="sidebar-top-row">
                        <h2 className="sidebar-h2">Filtros</h2>
                        <button className="clear-filters-btn" onClick={() => {setCatFiltro(null); setBusqueda(''); setPrecioMax(3500);}}>Limpiar</button>
                    </div>
                    
                    <div className="filter-group">
                        <div className="cat-header-clickable" onClick={() => setCatDesplegado(!catDesplegado)}>
                            <h3 className="sidebar-h3" style={{margin:0}}>Categorías</h3>
                            <i className={`fas fa-chevron-${catDesplegado ? 'up' : 'down'}`} style={{color: 'var(--text-muted)'}}></i>
                        </div>
                        
                        {catDesplegado && (
                            <div className="cat-dropdown-list">
                                {CATEGORIAS_LIMPIAS.map(cat => (
                                    <div 
                                        key={cat} 
                                        className={`sub-item ${catFiltro === cat ? 'active' : ''}`} 
                                        onClick={() => setCatFiltro(catFiltro === cat ? null : cat)}
                                    >
                                        {cat}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="filter-group" style={{marginTop: '25px'}}>
                        <h3 className="sidebar-h3">Presupuesto: ${precioMax}</h3>
                        <input type="range" min="0" max="3500" step="100" value={precioMax} onChange={(e) => setPrecioMax(Number(e.target.value))} className="price-slider" />
                    </div>
                </aside>

                <main className="shop-main-content">
                    {/* Buscador unificado con AdminPanel */}
                    <div className="search-bar-makia-client">
                        <i className="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="Que estas buscando hoy?" 
                            value={busqueda} 
                            onChange={(e) => {setBusqueda(e.target.value); setPagina(1);}} 
                        />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productosAMostrar.map((prod) => {
                            const colorActivo = colorVisual[prod._id] || prod.colors_available?.[0];
                            const imgFinal = prod.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(prod);

                            return (
                                <div key={prod._id} className="makia-product-card">
                                    <div className="img-frame"><img src={imgFinal} alt={prod.title} className="p-img" /></div>
                                    <div className="info-frame">
                                        <div className="cat-badge">{prod.product_type}</div>
                                        <h3>{prod.title}</h3>
                                        <p className="p-price">${(prod.precioMXN || prod.price * TIPO_CAMBIO_USD_MXN).toLocaleString()} MXN</p>
                                        
                                        <div className="swatch-row-carrusel">
                                            {prod.colors_available?.map(col => (
                                                <button 
                                                    key={col} 
                                                    className={`swatch-circle ${colorActivo === col ? 'active' : ''}`} 
                                                    style={{ backgroundColor: getColorHex(col) }} 
                                                    onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))} 
                                                />
                                            ))}
                                        </div>

                                        <div className="card-footer">
                                            <select className="makia-size-dropdown" value={tallasSeleccionadas[prod._id] || ""} onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}>
                                                <option value="">Selecciona Talla</option>
                                                {(prod.sizes_available || []).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <button className="btn-add-to-bag-makia" onClick={() => handleAgregar(prod)}>AÑADIR</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {!cargando && productosAMostrar.length === 0 && <p className="center" style={{marginTop:'40px', color: 'var(--text-muted)'}}>No se encontraron productos.</p>}
                    <PaginationControls page={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
                </main>
            </div>

            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-top">
                            <h2>TU BOLSA</h2>
                            <span onClick={() => setIsCartOpen(false)} style={{cursor:'pointer', fontSize: '24px'}}>&times;</span>
                        </div>
                        <div className="cart-modal-list">
                            {cart.map((item, i) => (
                                <div key={i} className="cart-modal-row">
                                    <div style={{flex:1}}>
                                        <p style={{fontWeight:'600'}}>{item.title}</p>
                                        <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                                            <select className="mini-dropdown" value={item.selectedSize} onChange={(e) => updateCartItem(i, { ...item, selectedSize: e.target.value })}>
                                                {item.sizes_available?.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <div className="qty-controls">
                                                <button onClick={() => updateCartItem(i, { ...item, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateCartItem(i, { ...item, quantity: item.quantity + 1 })}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{fontWeight:'800', color:'var(--makia-accent)'}}>${((item.precioMXN || item.price * TIPO_CAMBIO_USD_MXN) * item.quantity).toLocaleString()}</p>
                                    <button onClick={() => removeFromCart(i)} className="btn-remove">&times;</button>
                                </div>
                            ))}
                        </div>
                        <button className="btn-checkout-makia" onClick={() => alert("Compra finalizada")}>FINALIZAR COMPRA</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;