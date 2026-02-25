import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import PaginationControls from '../components/PaginationControls';
import Login from './Login';
import './Catalogo.css';

const TIPO_CAMBIO_USD_MXN = 17.00;

// [ARREGLO CATEGORÍAS] Lista exhaustiva basada en tu base de datos para filtros exactos
const categoryGroups = {
    'Womens': [
        "Womens Bodysuit", "Womens Bottoms", "Womens Crop Top", "Womens Crop Tops", "Womens Dress", 
        "Womens Hoodie", "Womens Hoodies", "Womens Jacket", "Womens Jackets / Outerwear", "Womens Leggings", 
        "Womens Long Sleeve Top", "Womens Ls Tops", "Womens One Piece", "Womens One Pieces", "Womens Pants", 
        "Womens Pullover", "Womens Pullovers", "Womens Shorts", "Womens Skort", "Womens Sleeveless Top", 
        "Womens Sleeveless Tops", "Womens Socks", "Womens Sports Bra", "Womens Sports Bras", "Womens Ss Tops", 
        "Womens Sweater", "Womens Swimwear", "Womens T-Shirt", "Womens Tank", "Womens Tanks", "Womens Underwear", 
        "Womens Vest", "womens Accessories", "womens Bags", "womens Headwear", "womens Socks"
    ],
    'Mens': [
        "Mens Baselayer", "Mens Bottoms", "Mens Drop Armhole Tank", "Mens Hoodie", "Mens Jacket", "Mens Jackets", 
        "Mens Jackets / Outerwear", "Mens Joggers", "Mens Leggings", "Mens Long Sleeve Top", "Mens Ls Tops", 
        "Mens Outerwear", "Mens Pants", "Mens Pullover", "Mens Pullovers", "Mens Shirt", "Mens Shorts", 
        "Mens Sleeveless Tops", "Mens Ss Tops", "Mens Stringer", "Mens T-Shirt", "Mens Tank", "Mens Tops", 
        "Mens Underwear", "Mens t", "mens unisex Bottoms", "mens unisex Pullovers"
    ],
    'Accessories': [
        "Accessories", "Bag", "Bags", "Bottles", "Footwear", "Gift Card", "Headwear", "Misc.", 
        "Pants", "Pullovers", "Socks", "Ss Tops", "Thirft Bag", "Underwear", "footwear"
    ]
};

const getColorHex = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes('blue')) return "#1e3a8a";
    if (n.includes('pink')) return "#db2777";
    if (n.includes('green')) return "#2d4d43";
    if (n.includes('red')) return "#991b1b";
    if (n.includes('black')) return "#111";
    if (n.includes('white')) return "#fff";
    return "#555";
};

const getPrimaryImage = (p = {}) => {
    // Intenta obtener la imagen de varios campos comunes en tu estructura JSON
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
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [catFiltro, setCatFiltro] = useState(null);
    const [precioMax, setPrecioMax] = useState(3500);
    const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
    const [colorVisual, setColorVisual] = useState({});

    useEffect(() => {
        const cargarData = async () => {
            setCargando(true);
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';
                const res = await axios.get(`${baseURL}/productos?page=${pagina}`);
                if (res.data.productos) {
                    setProductos(res.data.productos);
                    setTotalPaginas(res.data.pagination?.pages || 1);
                }
            } catch (e) { console.error("Error MAKIA:", e); }
            finally { setCargando(false); }
        };
        cargarData();
    }, [pagina]);

    // [ARREGLO BÚSQUEDA] Ultra sensible: busca palabra por palabra en título y product_type
    const productosAMostrar = productos.filter(p => {
        const keywords = busqueda.toLowerCase().split(' ').filter(k => k);
        const titulo = (p.title || '').toLowerCase();
        const tipoDB = (p.product_type || '').trim();
        const precioPesos = p.precioMXN || (Number(p.price) * TIPO_CAMBIO_USD_MXN);

        const matchSearch = keywords.every(k => titulo.includes(k) || tipoDB.toLowerCase().includes(k));
        const matchCat = !catFiltro || categoryGroups[catFiltro].includes(tipoDB);
        const matchPrecio = precioPesos <= precioMax;

        return matchSearch && matchCat && matchPrecio;
    });

    // [ARREGLO AÑADIR] Bloqueo si no hay talla seleccionada
    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        if (!talla) {
            alert("Por favor seleccione una talla antes de añadir un artículo a la bolsa.");
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

    // [ARREGLO VENTAS] Registro de pedido en la base de datos
    const handleFinalizarCompra = async () => {
        if (cart.length === 0) return;

        if (!user) {
            
            setIsCartOpen(false);
            setShowLoginModal(true);
            return; 
        }

        const total = cart.reduce((acc, item) => acc + (item.precioMXN || item.price * TIPO_CAMBIO_USD_MXN) * item.quantity, 0);
        
        const ventaData = {
            usuario: user?.email || "Invitado",
            productos: cart.map(item => ({
                id: item._id,
                titulo: item.title,
                talla: item.selectedSize,
                cantidad: item.quantity,
                precioUnitario: item.precioMXN || item.price * TIPO_CAMBIO_USD_MXN
            })),
            total: total,
            fecha: new Date().toISOString()
        };

        try {
            const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';
            await axios.post(`${baseURL}/productos/ventas`, ventaData, {
                headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}` // O donde sea que guardes tu JWT
                }
            });
            alert("¡Compra registrada con éxito en MAKIA!");
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            alert("Error al registrar la venta en la base de datos.");
            // Esto nos dirá exactamente qué le dolió al backend
            console.error("Error completo del backend:", error.response?.data || error.message);
            alert(`Error: ${error.response?.data?.mensaje || "No se pudo registrar la venta"}`);
        }
    };

    return (
        <div className="client-view">
            <header className="client-header-makia">
                <div className="logo-text">MAKIA</div>
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
                    <div className="sidebar-top-row">
                        <h2 className="sidebar-h2">Filtros</h2>
                        {/* Botón limpiar neón */}
                        <button className="clear-filters-btn" onClick={() => {setCatFiltro(null); setBusqueda(''); setPrecioMax(3500);}}>Limpiar</button>
                    </div>
                    
                    <div className="filter-group">
                        <h3 className="sidebar-h3">Categoría</h3>
                        {Object.keys(categoryGroups).map(cat => (
                            <div key={cat}>
                                <div className={`cat-main-label ${catFiltro === cat ? 'selected' : ''}`} onClick={() => setCatFiltro(catFiltro === cat ? null : cat)}>
                                    {cat} <i className={`fas fa-chevron-${catFiltro === cat ? 'up' : 'down'}`}></i>
                                </div>
                                {catFiltro === cat && (
                                    <div className="sub-cat-list">
                                        {categoryGroups[cat].map(sub => (
                                            <div key={sub} className="sub-item" onClick={() => setBusqueda(sub)}>
                                                {sub} {/* Lista con nombres completos de tu DB */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="filter-group">
                        <h3 className="sidebar-h3">Presupuesto: ${precioMax} MXN</h3>
                        <input type="range" min="0" max="3500" step="100" value={precioMax} onChange={(e) => setPrecioMax(Number(e.target.value))} className="price-slider" />
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Busca nombre o tipo de prenda (ej. Ss Tops)..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productosAMostrar.map((prod) => {
                            const colorActivo = colorVisual[prod._id] || prod.colors_available?.[0];
                            const imgFinal = prod.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(prod);

                            return (
                                <div key={prod._id} className="makia-product-card">
                                    <div className="img-frame"><img src={imgFinal} alt={prod.title} className="p-img" /></div>
                                    <div className="info-frame">
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
                    {busqueda === '' && <PaginationControls page={pagina} totalPages={totalPaginas} onPageChange={setPagina} />}
                </main>
            </div>

            {/* BOLSA INTERACTIVA */}
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
                                            {/* Cambio de talla en bolsa */}
                                            <select className="mini-dropdown" value={item.selectedSize} onChange={(e) => updateCartItem(i, { ...item, selectedSize: e.target.value })}>
                                                {item.sizes_available?.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            {/* Control de cantidad */}
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
                        <button className="btn-checkout-makia" onClick={handleFinalizarCompra}>FINALIZAR COMPRA</button>
                    </div>
                </div>
            )}
            {/* MODAL DE LOGIN INTERCEPTADO */}
            {showLoginModal && (
                <div className="login-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
                    {/* Aquí llamamos a tu componente Login. 
                        Asegúrate de que tu Login.jsx tenga un botón o forma de cerrarse, 
                        o pásale esta función como prop si la necesitas: onClose={() => setShowLoginModal(false)} 
                    */}
                    <Login />
                    
                    {/* Botón de emergencia para cerrar el modal por si el usuario se arrepiente */}
                    <button 
                        onClick={() => setShowLoginModal(false)}
                        style={{ position: 'absolute', top: '20px', right: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '30px', cursor: 'pointer', zIndex: 10000 }}
                    >
                        &times;
                    </button>
                </div>
            )}
        </div>
    );
};

export default Catalogo;