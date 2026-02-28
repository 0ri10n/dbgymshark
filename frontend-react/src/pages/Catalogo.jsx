import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

const CATEGORIAS_LIMPIAS = [
    'Accessories', 'Bags', 'Baselayers', 'Bodysuits', 'Bottles', 'Bottoms',
    'Crop Tops', 'Dresses', 'Footwear', 'Gift Cards', 'Headwear', 'Hoodies',
    'Jackets', 'Jackets & Outerwear', 'Joggers', 'Leggings', 'Long Sleeve Tops',
    'Miscellaneous', 'One Pieces', 'Outerwear', 'Pants', 'Pullovers',
    'Short Sleeve Tops', 'Shorts', 'Skorts', 'Sleeveless Tops', 'Socks',
    'Sports Bras', 'Stringers', 'Sweaters', 'Swimwear', 'T-Shirts',
    'Tanks', 'Tops', 'Uncategorized', 'Underwear', 'Vests'
];

// PALETA DE COLORES MAKIA COMPLETA
const getColorHex = (name = "") => {
    const n = name.toLowerCase().trim();
    if (n === 'black' || n.includes('onyx') || n.includes('asphalt')) return "#111111";
    if (n === 'white') return "#FFFFFF";
    if (n.includes('teal') || n.includes('aqua')) return "#008080";
    if (n.includes('olive') || n.includes('aloe') || n.includes('alpine') || n.includes('green')) return "#2d4d43";
    if (n.includes('sage') || n.includes('eucalyptus')) return "#b2ac88";
    if (n.includes('navy') || n.includes('evening blue')) return "#000080";
    if (n.includes('blue') || n.includes('aegean') || n.includes('lakeside')) return "#1e3a8a";
    if (n.includes('pink') || n.includes('rose') || n.includes('dolly') || n.includes('guava')) return "#db2777";
    if (n.includes('red') || n.includes('carmine') || n.includes('cherry')) return "#991b1b";
    if (n.includes('grey') || n.includes('gray') || n.includes('pebble') || n.includes('core')) return "#4b5563";
    if (n.includes('brown') || n.includes('truffle') || n.includes('espresso')) return "#3b2f2f";
    if (n.includes('purple') || n.includes('plum') || n.includes('orchid')) return "#6b21a8";
    if (n.includes('orange') || n.includes('apricot') || n.includes('peach')) return "#f97316";
    if (n.includes('yellow') || n.includes('lemon')) return "#facc15";
    return "#374151"; 
};

const getPrimaryImage = (p = {}) => {
    const img = p.image_principal || p.imagen || (p.variants && p.variants[0]?.image);
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
    const [dropdownAbierto, setDropdownAbierto] = useState(false); // Control para el único botón
    const [rangoPrecio, setRangoPrecio] = useState(5000); 
    
    const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
    const [colorVisual, setColorVisual] = useState({});

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    // 1. Cargar datos UNA SOLA VEZ (traemos un lote grande para que React trabaje)
    useEffect(() => {
        const cargarData = async () => {
            setCargando(true);
            try {
                // Pedimos un límite muy alto para traer todo el catálogo a la memoria de React
                const res = await axios.get(`${baseURL}/productos?limit=5000`);
                setProductos(res.data.productos || []);
            } catch (e) { console.error(e); }
            finally { setCargando(false); }
        };
        cargarData();
    }, [baseURL]); 

    // 2. NUEVO: Si cambias de categoría, precio o buscas algo, ¡regresamos a la página 1!
    useEffect(() => {
        setPagina(1);
    }, [catFiltro, rangoPrecio, busqueda]);

    const granTotal = cart.reduce((acc, item) => acc + ((item.precioMXN || item.price) * item.quantity), 0);

    const handleFinalizarCompra = async () => {
        if (!user) {
            alert("Inicia sesión para finalizar tu compra.");
            return;
        }
        if (cart.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            const nombreFinal = `${user.nombre || ''} ${user.apellido || ''}`.trim();

            const ordenData = {
                nombreCliente: nombreFinal || "Cliente Registrado",
                productos: cart.map(item => ({
                    nombre: item.title,
                    talla: item.selectedSize || "N/A",
                    color: item.selectedColor || "N/A",
                    precio: Number(item.precioMXN || item.price),
                    cantidad: Number(item.quantity)
                })),
                total: Number(granTotal.toFixed(2))
            };

            await axios.post(`${baseURL}/admin/panel/ventas`, ordenData, {
                headers: { 'x-auth-token': token }
            });
            
            alert("¡Compra finalizada con éxito!");
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            console.error("Error 500:", error.response?.data);
            alert("Error en el servidor al procesar la venta.");
        }
    };

    // --- 1. PRIMERO FILTRAMOS TODO ---
    const productosFiltrados = productos.filter(p => {
        const tipoProductoDB = p.product_type ? String(p.product_type).trim().toLowerCase() : "";
        const categoriaSeleccionada = catFiltro ? String(catFiltro).trim().toLowerCase() : "";
        const cumpleCat = !catFiltro || tipoProductoDB === categoriaSeleccionada;
        
        const precioReal = Number(p.precioMXN || p.price || 0);
        const cumplePrecio = precioReal <= rangoPrecio;

        // Como trajimos todo a React, hacemos la búsqueda por texto aquí también (súper rápido)
        const cumpleBusqueda = busqueda ? (p.title || "").toLowerCase().includes(busqueda.toLowerCase()) : true;

        return cumpleCat && cumplePrecio && cumpleBusqueda;
    });

    // --- 2. LUEGO CALCULAMOS LAS PÁGINAS REALES ---
    const ITEMS_POR_PAGINA = 20;
    const totalPaginasReales = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA) || 1;

    // --- 3. REBANAMOS SOLO LOS 20 QUE VAN EN PANTALLA ---
    const productosPaginados = productosFiltrados.slice(
        (pagina - 1) * ITEMS_POR_PAGINA,
        pagina * ITEMS_POR_PAGINA
    );

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
                        
                        {/* SECCIÓN CATEGORÍAS - UN SOLO BOTÓN */}
                        <h2 className="sidebar-section-title">CATEGORÍA</h2>
                        <div className="filter-group-stack">
                            <div className="filter-item-accordion">
                                <button 
                                    className={`accordion-header ${dropdownAbierto ? 'active' : ''} ${catFiltro ? 'selected-glow' : ''}`}
                                    onClick={() => setDropdownAbierto(!dropdownAbierto)}
                                >
                                    <span>{catFiltro || "Categories"}</span>
                                    <i className={`fas fa-chevron-down ${dropdownAbierto ? 'rotate' : ''}`}></i>
                                </button>
                                
                                {dropdownAbierto && (
                                    <div className="category-scroll-menu">
                                        {CATEGORIAS_LIMPIAS.map((cat) => (
                                            <div 
                                                key={cat} 
                                                className={`category-option ${catFiltro === cat ? 'active-opt' : ''}`}
                                                onClick={() => {
                                                    setCatFiltro(cat);
                                                    setDropdownAbierto(false);
                                                }}
                                            >
                                                {cat}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECCIÓN PRESUPUESTO */}
                        <div className="price-filter-section-new">
                            <h2 className="sidebar-section-title">PRESUPUESTO: ${rangoPrecio}</h2>
                            <div className="slider-container">
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="5000" 
                                    step="50" 
                                    value={rangoPrecio} 
                                    onChange={(e) => setRangoPrecio(Number(e.target.value))} 
                                    className="makia-custom-slider" 
                                />
                            </div>
                        </div>

                        {catFiltro && (
                            <button className="btn-clear-minimal" onClick={() => setCatFiltro(null)}>
                                Limpiar filtros ✕
                            </button>
                        )}
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productosPaginados.map((prod) => {
                            const colorActivo = colorVisual[prod._id] || (prod.colors_available && prod.colors_available[0]);
                            const imagenAMostrar = prod.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(prod);
                            return (
                                <div key={prod._id} className="makia-product-card">
                                    <div className="img-frame"><img src={imagenAMostrar} alt="p" className="p-img" /></div>
                                    <div className="info-frame">
                                        <h3 className="card-title-text">{prod.title}</h3>
                                        <p className="p-price">${(prod.precioMXN || prod.price).toLocaleString()} MXN</p>
                                        <div className="swatch-row-carrusel">
                                            {prod.colors_available?.map(col => (
                                                <button key={col} className={`swatch-circle ${colorActivo === col ? 'active' : ''}`} style={{ backgroundColor: getColorHex(col) }} onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))} />
                                            ))}
                                        </div>
                                        <div className="card-footer">
                                            <select className="makia-size-dropdown" onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}>
                                                <option value="">Talla</option>
                                                {prod.sizes_available?.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <button className="btn-add-to-bag-makia" onClick={() => {
                                                const talla = tallasSeleccionadas[prod._id];
                                                if (!talla) { alert("Selecciona talla"); return; }
                                                addToCart({ ...prod, selectedSize: talla, selectedColor: colorActivo, selectedImage: imagenAMostrar, quantity: 1 });
                                                setIsCartOpen(true);
                                            }}>AÑADIR</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <PaginationControls page={pagina} totalPages={totalPaginasReales} onPageChange={setPagina} />
                </main>
            </div>

            {/* MODAL BOLSA */}
            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-top">
                            <h2>TU BOLSA</h2>
                            <span onClick={() => setIsCartOpen(false)} className="close-cart-x">&times;</span>
                        </div>
                        <div className="cart-modal-list">
                            {cart.map((item, i) => (
                                <div key={i} className="cart-modal-row">
                                    <div className="cart-img-fixed-box">
                                        <img src={item.selectedImage} alt="item" className="cart-item-mini-img" />
                                    </div>
                                    <div className="cart-item-info">
                                        <p className="cart-item-title">{item.title}</p>
                                        <div className="cart-item-controls-row">
                                            <select className="cart-mini-select" value={item.selectedSize} onChange={(e) => updateCartItem(i, { ...item, selectedSize: e.target.value })}>
                                                {item.sizes_available?.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <div className="qty-stepper">
                                                <button onClick={() => updateCartItem(i, { ...item, quantity: Math.max(1, item.quantity - 1) })}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateCartItem(i, { ...item, quantity: item.quantity + 1 })}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cart-item-end">
                                        <p className="cart-item-price">${((item.precioMXN || item.price) * item.quantity).toLocaleString()}</p>
                                        <button className="btn-remove-x-red" onClick={() => removeFromCart(i)}>&times;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="cart-footer-totals">
                            <div className="total-row"><span>TOTAL:</span><span className="total-amount">${granTotal.toLocaleString()} MXN</span></div>
                            <button className="btn-checkout-makia" onClick={handleFinalizarCompra}>FINALIZAR COMPRA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;