import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// Lista completa de categorías solicitada
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
    const { cart, addToCart, removeFromCart, updateCartItem, clearCart } = useContext(CartContext);
    
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
    const [catDesplegado, setCatDesplegado] = useState(true);

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    useEffect(() => {
        const cargarData = async () => {
            setCargando(true);
            try {
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
        const precioActual = p.precioMXN || p.price; 
        const matchCat = !catFiltro || p.product_type === catFiltro;
        const matchPrecio = precioActual <= precioMax;
        return matchCat && matchPrecio;
    });

    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        const colorActivo = colorVisual[p._id] || p.colors_available?.[0];
        const imagenSeleccionada = p.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(p);

        if (!talla) {
            alert("Por favor seleccione una talla antes de añadir.");
            return;
        }

        addToCart({ 
            ...p, 
            selectedSize: talla, 
            selectedColor: colorActivo,
            selectedImage: imagenSeleccionada,
            quantity: 1
        });
        setIsCartOpen(true); 
    };

    const handleFinalizarCompra = async () => {
        if (cart.length === 0) return;
        try {
            const total = cart.reduce((acc, item) => acc + ((item.precioMXN || item.price) * item.quantity), 0);
            
            const ordenData = {
                nombreCliente: user?.nombre || "Invitado",
                productos: cart.map(item => ({
                    nombre: item.title,
                    talla: item.selectedSize,
                    color: item.selectedColor,
                    precio: item.precioMXN || item.price,
                    cantidad: item.quantity
                })),
                total: total,
                fechaPedido: new Date().toISOString()
            };

            const token = localStorage.getItem('token');
            await axios.post(`${baseURL}/admin/panel/ventas`, ordenData, {
                headers: { 'x-auth-token': token, 'Authorization': `Bearer ${token}` }
            });
            
            alert("¡Compra finalizada correctamente!");
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            console.error("Error al procesar compra:", error);
            alert("Error al procesar la compra. Intente de nuevo.");
        }
    };

    return (
        <div className="client-view">
            <header className="client-header-makia">
                <img src="/logo-makia-pages.png" alt="Makia Logo" className="brand-logo-img" />
                <div className="header-right-icons">
                    <div className="cart-wrapper" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{cart.length}</span>
                    </div>
                    <div className="user-icon" onClick={logout} style={{cursor:'pointer'}}><i className="far fa-user"></i></div>
                </div>
            </header>

            <div className="hero-banner-full">
                <img src="/hero-banner-client.jpg" alt="MAKIA Performance" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <div className="sidebar-sticky-wrapper">
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
                            <input 
                                type="range" 
                                min="0" 
                                max="3500" 
                                step="100" 
                                value={precioMax} 
                                onChange={(e) => setPrecioMax(Number(e.target.value))} 
                                className="price-slider" 
                            />
                        </div>
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="¿Qué estás buscando hoy?" 
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
                                        <p className="p-price">${(prod.precioMXN || prod.price).toLocaleString()} MXN</p>
                                        
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
                                            <select 
                                                className="makia-size-dropdown" 
                                                value={tallasSeleccionadas[prod._id] || ""} 
                                                onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}
                                            >
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
                                    <img src={item.selectedImage} alt={item.title} className="cart-item-mini-img" />
                                    <div className="cart-item-info">
                                        <p className="cart-item-title">{item.title}</p>
                                        <p className="cart-item-details">{item.selectedColor} / {item.selectedSize}</p>
                                        <div className="qty-controls">
                                            <button onClick={() => updateCartItem(i, { ...item, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateCartItem(i, { ...item, quantity: item.quantity + 1 })}>+</button>
                                        </div>
                                    </div>
                                    <div className="cart-item-end">
                                        <p className="cart-item-price">${((item.precioMXN || item.price) * item.quantity).toLocaleString()}</p>
                                        <button onClick={() => removeFromCart(i)} className="btn-remove">&times;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-checkout-makia" onClick={handleFinalizarCompra}>FINALIZAR COMPRA</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;