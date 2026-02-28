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
    }, [pagina, busqueda, baseURL]);

    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        const colorActivo = colorVisual[p._id] || p.colors_available?.[0];
        const imagenSeleccionada = p.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(p);

        if (!talla) { alert("Por favor seleccione una talla."); return; }

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
            
            // Estructura exacta según tu modelo Venta.js
            const ordenData = {
                nombreCliente: user?.nombre || "Invitado",
                productos: cart.map(item => ({
                    nombre: item.title,
                    talla: item.selectedSize,
                    color: item.selectedColor,
                    precio: Number(item.precioMXN || item.price),
                    cantidad: Number(item.quantity)
                })),
                total: total,
                fechaPedido: new Date() // Se envía como objeto Date para MongoDB
            };

            const token = localStorage.getItem('token');
            
            // Solución Error 404: Se utiliza la ruta universal de creación definida en adminRoutes.js
            await axios.post(`${baseURL}/admin/crear/gymshark/ventas`, ordenData, {
                headers: { 
                    'x-auth-token': token,
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            alert("¡Compra finalizada con éxito! Folio generado.");
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            console.error("Error al procesar compra:", error);
            alert("Error al guardar la venta. Verifique sus permisos de administrador.");
        }
    };

    return (
        <div className="client-view">
            <header className="client-header-makia">
                <img src="/logo-makia-pages.png" alt="Logo" className="brand-logo-img" />
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
                                <i className={`fas fa-chevron-${catDesplegado ? 'up' : 'down'}`}></i>
                            </div>
                            {catDesplegado && (
                                <div className="cat-dropdown-list">
                                    {CATEGORIAS_LIMPIAS.map(cat => (
                                        <div key={cat} className={`sub-item ${catFiltro === cat ? 'active' : ''}`} onClick={() => setCatFiltro(catFiltro === cat ? null : cat)}>
                                            {cat}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="¿Qué estás buscando hoy?" value={busqueda} onChange={(e) => {setBusqueda(e.target.value); setPagina(1);}} />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productos.filter(p => !catFiltro || p.product_type === catFiltro).map((prod) => {
                            const colorActivo = colorVisual[prod._id] || prod.colors_available?.[0];
                            const imgFinal = prod.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(prod);

                            return (
                                <div key={prod._id} className="makia-product-card">
                                    <div className="img-frame"><img src={imgFinal} alt="p" className="p-img" /></div>
                                    <div className="info-frame">
                                        <div className="cat-badge">{prod.product_type}</div>
                                        <h3>{prod.title}</h3>
                                        <p className="p-price">${(prod.precioMXN || prod.price).toLocaleString()} MXN</p>
                                        <div className="swatch-row-carrusel">
                                            {prod.colors_available?.map(col => (
                                                <button key={col} className={`swatch-circle ${colorActivo === col ? 'active' : ''}`} style={{ backgroundColor: getColorHex(col) }} onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))} />
                                            ))}
                                        </div>
                                        <div className="card-footer">
                                            <select className="makia-size-dropdown" value={tallasSeleccionadas[prod._id] || ""} onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}>
                                                <option value="">Talla</option>
                                                {prod.sizes_available?.map(t => <option key={t} value={t}>{t}</option>)}
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
                                <div key={i} className="cart-modal-row" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: '1px solid #111' }}>
                                    {/* Imagen forzada a tamaño pequeño inline para asegurar visualización */}
                                    <img 
                                        src={item.selectedImage} 
                                        alt="item" 
                                        style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid #222' }} 
                                    />
                                    <div className="cart-item-info" style={{ flex: 1 }}>
                                        <p className="cart-item-title" style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 5px 0' }}>{item.title}</p>
                                        <div className="cart-item-controls-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* Cambio estético de talla dentro de la bolsa */}
                                            <select 
                                                style={{ background: '#111', color: '#fff', fontSize: '11px', border: '1px solid #333', borderRadius: '4px', padding: '2px 5px' }}
                                                value={item.selectedSize}
                                                onChange={(e) => updateCartItem(i, { ...item, selectedSize: e.target.value })}
                                            >
                                                {item.sizes_available?.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <div className="qty-stepper" style={{ display: 'flex', alignItems: 'center', background: '#111', borderRadius: '4px', border: '1px solid #333' }}>
                                                <button style={{ background: 'none', border: 'none', color: '#57a4e4', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateCartItem(i, { ...item, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                                                <span style={{ fontSize: '12px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button style={{ background: 'none', border: 'none', color: '#57a4e4', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => updateCartItem(i, { ...item, quantity: item.quantity + 1 })}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cart-item-end" style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#57a4e4', fontWeight: '700', fontSize: '14px', margin: '0 0 5px 0' }}>${((item.precioMXN || item.price) * item.quantity).toLocaleString()}</p>
                                        <button style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => removeFromCart(i)}>Eliminar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn-checkout-makia" onClick={handleFinalizarCompra} style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '20px', fontWeight: '900', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}>FINALIZAR COMPRA</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;