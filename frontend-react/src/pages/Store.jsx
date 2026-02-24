import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css'; 

// --- CONFIGURACIÓN MAKIA ---
const TIPO_CAMBIO = 17.00;

// [ARREGLO CATEGORÍAS] Lista exhaustiva para filtros precisos
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
    if (!p) return "/placeholder.jpg";
    const img = p.image_principal || p.imagen || p.image_src || (p.variants && p.variants[0]?.image);
    if (typeof img === 'string' && img.includes(',')) return img.split(',')[0].trim();
    return img || "/placeholder.jpg";
};

const Store = () => {
    const { user, logout } = useContext(AuthContext);
    const { cart, addToCart, removeFromCart, updateCartItem, clearCart } = useContext(CartContext);
    
    const [productos, setProductos] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cargando, setCargando] = useState(true);

    const [catFiltro, setCatFiltro] = useState(null);
    const [precioMax, setPrecioMax] = useState(3500);
    const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});

    useEffect(() => {
        setCargando(true);
        api.get(`/productos?page=${page}`)
           .then(res => {
               setProductos(res.data.productos || []);
               setTotalPages(res.data.pagination?.pages || 1);
           })
           .finally(() => setCargando(false));
    }, [page]);

    // [ARREGLO AÑADIR] Validación de selección de talla obligatoria
    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        if (!talla) {
            alert("Por favor selecciona una talla antes de añadir el producto a la bolsa.");
            return;
        }
        addToCart({ ...p, selectedSize: talla, quantity: 1 });
        setIsCartOpen(true); 
    };

    // [ARREGLO VENTAS] Registro de pedido en base de datos
    const handleFinalizarCompra = async () => {
        if (cart.length === 0) return;
        
        const total = cart.reduce((acc, item) => acc + (item.precioMXN || item.price * TIPO_CAMBIO) * item.quantity, 0);
        
        const ventaData = {
            usuario: user?.email || "Invitado",
            productos: cart.map(item => ({
                id: item._id,
                titulo: item.title,
                talla: item.selectedSize,
                cantidad: item.quantity,
                precioUnitario: item.precioMXN || item.price * TIPO_CAMBIO
            })),
            total: total,
            fecha: new Date().toISOString()
        };

        try {
            await api.post('/ventas', ventaData);
            alert("¡Compra finalizada y registrada con éxito!");
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            console.error("Error al registrar venta:", error);
            alert("Hubo un error al procesar la compra.");
        }
    };

    // [ARREGLO FILTROS] Búsqueda ultra sensible por nombre y categoría
    const productosAMostrar = productos.filter(p => {
        const query = search.toLowerCase().trim();
        const pPrecio = p.precioMXN || (Number(p.price) * TIPO_CAMBIO);
        const pType = (p.product_type || '').trim();
        const pTitle = (p.title || '').toLowerCase();

        const matchSearch = query === '' || pTitle.includes(query) || pType.toLowerCase().includes(query);
        const matchCat = !catFiltro || categoryGroups[catFiltro].includes(pType);
        const matchPrecio = pPrecio <= precioMax;

        return matchSearch && matchCat && matchPrecio;
    });

    return (
        <div className="client-view">
            <header className="client-header-makia">
                <div className="logo-text">MAKIA</div>
                <div className="header-right-icons">
                    <div className="cart-wrapper" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{cart.length}</span>
                    </div>
                    <div className="user-icon" onClick={logout}><i className="far fa-user"></i></div>
                </div>
            </header>

            {/* Banner principal del boxeador recuperado */}
            <div className="hero-banner-full">
                <img src="/hero-banner-client.jpg" alt="MAKIA Performance" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <div className="sidebar-top-row">
                        <h2 className="sidebar-h2">Filtros</h2>
                        <button className="clear-filters-btn" onClick={() => {setCatFiltro(null); setPrecioMax(3500); setSearch('');}}>Limpiar</button>
                    </div>
                    <div className="filter-group">
                        <h3 className="sidebar-h3">Categoría</h3>
                        {Object.keys(categoryGroups).map(cat => (
                            <div key={cat} className={`cat-main-label ${catFiltro === cat ? 'selected' : ''}`} onClick={() => setCatFiltro(catFiltro === cat ? null : cat)}>
                                {cat} <i className={`fas fa-chevron-${catFiltro === cat ? 'up' : 'down'}`}></i>
                            </div>
                        ))}
                    </div>
                    <div className="filter-group">
                        <h3 className="sidebar-h3">Presupuesto: ${precioMax} MXN</h3>
                        <input type="range" min="0" max="3500" step="100" value={precioMax} onChange={e => setPrecioMax(Number(e.target.value))} className="price-slider" />
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="¿Qué buscas hoy? (ej. Crop, Mens)..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productosAMostrar.map(p => (
                            <div key={p._id} className="makia-product-card">
                                <div className="img-frame">
                                    <img src={getPrimaryImage(p)} className="p-img" alt={p.title} />
                                </div>
                                <div className="info-frame">
                                    <h3>{p.title}</h3>
                                    <p className="p-price">${(p.precioMXN || p.price * TIPO_CAMBIO).toLocaleString()} MXN</p>
                                    
                                    <div className="swatch-row-carrusel">
                                        {p.colors_available?.map(c => (
                                            <div key={c} className="swatch-circle" style={{background: getColorHex(c)}} title={c}></div>
                                        ))}
                                    </div>

                                    <div className="card-footer">
                                        <select className="makia-size-dropdown" value={tallasSeleccionadas[p._id] || ""} onChange={(e) => setTallasSeleccionadas({...tallasSeleccionadas, [p._id]: e.target.value})}>
                                            <option value="">Selecciona Talla</option>
                                            {(p.sizes_available || []).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <button className="btn-add-to-bag-makia" onClick={() => handleAgregar(p)}>AÑADIR A LA BOLSA</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
                </main>
            </div>

            {/* BOLSA LATERAL INTERACTIVA */}
            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-top">
                            <h2>TU BOLSA</h2>
                            <span className="close-cart-btn" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-modal-list">
                            {cart.map((item, i) => (
                                <div key={i} className="cart-modal-row">
                                    <div style={{flex:1}}>
                                        <p style={{fontWeight:'600'}}>{item.title}</p>
                                        <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                                            {/* Cambio de talla en la bolsa */}
                                            <select className="mini-dropdown" value={item.selectedSize} onChange={(e) => updateCartItem(i, { ...item, selectedSize: e.target.value })}>
                                                {(item.sizes_available || []).map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            {/* Control de cantidad */}
                                            <div className="qty-controls">
                                                <button onClick={() => updateCartItem(i, { ...item, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateCartItem(i, { ...item, quantity: item.quantity + 1 })}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{fontWeight:'800', color:'var(--makia-accent)'}}>
                                        ${((item.precioMXN || item.price * TIPO_CAMBIO) * item.quantity).toLocaleString()}
                                    </p>
                                    <button onClick={() => removeFromCart(i)} className="btn-remove">&times;</button>
                                </div>
                            ))}
                            {cart.length === 0 && <p style={{textAlign:'center', padding:'40px', color:'#888'}}>Tu bolsa está vacía.</p>}
                        </div>
                        <div className="cart-modal-footer">
                            <button className="btn-checkout-makia" onClick={handleFinalizarCompra}>FINALIZAR COMPRA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;