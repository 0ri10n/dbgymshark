import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// 1. LISTA DE CATEGORÍAS COMPLETA
const CATEGORIAS_LIMPIAS = [
    'Accessories', 'Bags', 'Baselayers', 'Bodysuits', 'Bottles', 'Bottoms',
    'Crop Tops', 'Dresses', 'Footwear', 'Gift Cards', 'Headwear', 'Hoodies',
    'Jackets', 'Jackets & Outerwear', 'Joggers', 'Leggings', 'Long Sleeve Tops',
    'Miscellaneous', 'One Pieces', 'Outerwear', 'Pants', 'Pullovers',
    'Short Sleeve Tops', 'Shorts', 'Skorts', 'Sleeveless Tops', 'Socks',
    'Sports Bras', 'Stringers', 'Sweaters', 'Swimwear', 'T-Shirts',
    'Tanks', 'Tops', 'Uncategorized', 'Underwear', 'Vests'
];

// 2. PALETA DE COLORES MAKIA
const getColorHex = (name = "") => {
    const n = name.toLowerCase().trim();
    if (n === 'black') return "#111111";
    if (n === 'white') return "#FFFFFF";
    if (n.includes('blue')) return "#1e3a8a";
    if (n.includes('red')) return "#991b1b";
    if (n.includes('pink') || n.includes('rose')) return "#db2777";
    if (n.includes('green') || n.includes('aloe')) return "#2d4d43";
    if (n.includes('teal')) return "#008080";
    if (n.includes('grey') || n.includes('gray')) return "#4b5563";
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
    
    // 3. ESTADOS DE FILTROS (FLECHA Y PRECIO)
    const [catFiltro, setCatFiltro] = useState(null);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(true); 
    const [rangoPrecio, setRangoPrecio] = useState(5000); 
    
    const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
    const [colorVisual, setColorVisual] = useState({});

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    useEffect(() => {
        const cargarData = async () => {
            setCargando(true);
            try {
                const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=20&search=${busqueda}`);
                setProductos(res.data.productos || []);
                setTotalPaginas(res.data.pagination?.pages || 1);
            } catch (e) { console.error(e); }
            finally { setCargando(false); }
        };
        cargarData();
    }, [pagina, busqueda, baseURL]);

    const granTotal = cart.reduce((acc, item) => acc + ((item.precioMXN || item.price) * item.quantity), 0);

    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        const colorActivo = colorVisual[p._id] || (p.colors_available && p.colors_available[0]);
        const imagenSeleccionada = p.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(p);

        if (!talla) { alert("Por favor selecciona una talla."); return; }

        addToCart({ 
            ...p, 
            selectedSize: talla, 
            selectedColor: colorActivo,
            selectedImage: imagenSeleccionada,
            quantity: 1
        });
        setIsCartOpen(true); 
    };

    // 4. FUNCIÓN DE COMPRA (SOLUCIONA ERROR 500)
    const handleFinalizarCompra = async () => {
        if (cart.length === 0) return;
        try {
            const token = localStorage.getItem('token');
            // Generación automática del nombre para evitar campos vacíos
            const nombreFinal = (user?.nombre && user?.apellido) 
                ? `${user.nombre} ${user.apellido}` 
                : "Cliente Registrado";

            const ordenData = {
                nombreCliente: nombreFinal,
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
            
            alert("¡Compra exitosa!");
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            console.error("Error al procesar compra:", error);
            alert("Error en el servidor al guardar la venta.");
        }
    };

    // 5. LÓGICA DE FILTRADO
    const productosFiltrados = productos.filter(p => {
        const cumpleCat = !catFiltro || p.product_type === catFiltro;
        const cumplePrecio = (p.precioMXN || p.price) <= rangoPrecio;
        return cumpleCat && cumplePrecio;
    });

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
                <img src="/hero-banner-client.jpg" alt="MAKIA" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <div className="sidebar-sticky-wrapper">
                        {/* FLECHITA Y DESPLIEGUE */}
                        <div className="filter-accordion-header" onClick={() => setFiltrosAbiertos(!filtrosAbiertos)} style={{cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <h2 className="sidebar-h2">Categorías</h2>
                            <i className={`fas fa-chevron-${filtrosAbiertos ? 'up' : 'down'}`} style={{color: 'var(--makia-accent)'}}></i>
                        </div>
                        
                        {filtrosAbiertos && (
                            <div className="cat-dropdown-list" style={{maxHeight:'400px', overflowY:'auto', paddingRight:'10px'}}>
                                {CATEGORIAS_LIMPIAS.map(cat => (
                                    <div key={cat} className={`sub-item ${catFiltro === cat ? 'active' : ''}`} onClick={() => setCatFiltro(cat)}>
                                        {cat}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* RANGO DE PRECIOS */}
                        <div className="price-filter-section" style={{marginTop:'30px'}}>
                            <h2 className="sidebar-h2">Precio máx: ${rangoPrecio}</h2>
                            <input 
                                type="range" 
                                min="0" 
                                max="5000" 
                                step="100"
                                value={rangoPrecio} 
                                onChange={(e) => setRangoPrecio(Number(e.target.value))}
                                className="makia-range-slider"
                                style={{width:'100%', accentColor:'var(--makia-accent)'}}
                            />
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#555', marginTop:'8px'}}>
                                <span>$0</span><span>$5,000+</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productosFiltrados.map((prod) => {
                            const colorActivo = colorVisual[prod._id] || (prod.colors_available && prod.colors_available[0]);
                            const imagenAMostrar = prod.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(prod);

                            return (
                                <div key={prod._id} className="makia-product-card">
                                    <div className="img-frame">
                                        <img src={imagenAMostrar} alt="p" className="p-img" />
                                    </div>
                                    <div className="info-frame">
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
                                            <select className="makia-size-dropdown" onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [prod._id]: e.target.value }))}>
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

            {/* BOLSA / CARRITO */}
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
                                    <div style={{ width: '70px', height: '90px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #222' }}>
                                        <img src={item.selectedImage} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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