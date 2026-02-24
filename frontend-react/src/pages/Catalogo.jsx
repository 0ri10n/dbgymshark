import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// --- CONFIGURACIÓN ---
const TIPO_CAMBIO_USD_MXN = 17.00; //

// [ARREGLO CATEGORÍAS] Lista exhaustiva con los nombres propios exactos para que el filtro responda
const categoryGroups = {
    'Womens': [
        'Womens Bodysuit', 'Womens Bottoms', 'Womens Crop Top', 'Womens Crop Tops', 'Womens Dress', 
        'Womens Hoodie', 'Womens Hoodies', 'Womens Jacket', 'Womens Jackets / Outerwear', 'Womens Leggings', 
        'Womens Long Sleeve Top', 'Womens Ls Tops', 'Womens One Piece', 'Womens One Pieces', 'Womens Pants', 
        'Womens Pullover', 'Womens Pullovers', 'Womens Shorts', 'Womens Skort', 'Womens Sleeveless Top', 
        'Womens Sleeveless Tops', 'Womens Socks', 'Womens Sports Bra', 'Womens Sports Bras', 'Womens Ss Tops', 
        'Womens Sweater', 'Womens Swimwear', 'Womens T-Shirt', 'Womens Tank', 'Womens Tanks', 'Womens Underwear', 
        'Womens Vest', 'womens Accessories', 'womens Bags', 'womens Headwear', 'womens Socks'
    ],
    'Mens': [
        'Mens Baselayer', 'Mens Bottoms', 'Mens Drop Armhole Tank', 'Mens Hoodie', 'Mens Jacket', 'Mens Jackets', 
        'Mens Jackets / Outerwear', 'Mens Joggers', 'Mens Leggings', 'Mens Long Sleeve Top', 'Mens Ls Tops', 
        'Mens Outerwear', 'Mens Pants', 'Mens Pullover', 'Mens Pullovers', 'Mens Shirt', 'Mens Shorts', 
        'Mens Sleeveless Tops', 'Mens Ss Tops', 'Mens Stringer', 'Mens T-Shirt', 'Mens Tank', 'Mens Tops', 
        'Mens Underwear', 'Mens t', 'mens unisex Bottoms', 'mens unisex Pullovers'
    ],
    'Accessories': [
        'Accessories', 'Bag', 'Bags', 'Bottles', 'Footwear', 'Gift Card', 'Headwear', 'Misc.', 
        'Pants', 'Pullovers', 'Socks', 'Ss Tops', 'Thirft Bag', 'Underwear', 'footwear'
    ]
};

// --- FUNCIONES DE APOYO ---
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
    const img = p.image_principal || (p.variants && p.variants[0]?.image) || "/placeholder.jpg";
    return typeof img === 'string' && img.includes(',') ? img.split(',')[0].trim() : img;
};

const getNumericPriceMXN = (prod) => {
    let valor = Number(prod.precioMXN);
    if (!valor || isNaN(valor)) {
        valor = Number(prod.price) * TIPO_CAMBIO_USD_MXN;
    }
    return valor || 0;
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
    const [subCatFiltro, setSubCatFiltro] = useState(null);
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

    // [ARREGLO BÚSQUEDA] Sensible a nombre O product_type para mayor precisión
    const productosAMostrar = productos.filter(p => {
        const query = busqueda.toLowerCase().trim();
        const titulo = (p.title || '').toLowerCase();
        const tipoDB = (p.product_type || '').trim();
        const precioPesos = getNumericPriceMXN(p);

        // Busca en ambos campos
        const matchSearch = query === '' || titulo.includes(query) || tipoDB.toLowerCase().includes(query);
        const matchCat = !catFiltro || categoryGroups[catFiltro].includes(tipoDB);
        const matchSub = !subCatFiltro || tipoDB === subCatFiltro;
        const matchPrecio = precioPesos <= precioMax;

        return matchSearch && matchCat && matchSub && matchPrecio;
    });

    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        if (!talla) {
            alert("Vania, selecciona una talla antes de añadir a la bolsa.");
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

    const handleFinalizarCompra = async () => {
        if (cart.length === 0) return;
        const total = cart.reduce((acc, item) => acc + (getNumericPriceMXN(item) * item.quantity), 0);
        const ventaData = {
            usuario: user?.email || "Invitado",
            productos: cart.map(item => ({
                id: item._id, titulo: item.title, talla: item.selectedSize, cantidad: item.quantity, precioUnitario: getNumericPriceMXN(item)
            })),
            total,
            fecha: new Date().toISOString()
        };

        try {
            const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';
            await axios.post(`${baseURL}/ventas`, ventaData); //
            alert("¡Venta registrada con éxito en MAKIA!");
            clearCart();
            setIsCartOpen(false);
        } catch (error) { alert("Error al registrar la venta."); }
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
                <img src="/hero-banner-client.jpg" alt="MAKIA Hero" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <div className="sidebar-top-row">
                        <h2 className="sidebar-h2">Filtros</h2>
                        <button className="clear-filters-btn" onClick={() => {setCatFiltro(null); setSubCatFiltro(null); setBusqueda(''); setPrecioMax(3500);}}>Limpiar</button>
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
                                            <div key={sub} className={`sub-item ${subCatFiltro === sub ? 'active' : ''}`} onClick={() => setSubCatFiltro(sub)}>
                                                {sub} {/* Mostramos el nombre completo como pediste */}
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
                        <input type="text" placeholder="Busca por nombre o tipo de prenda..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
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
                                        <p className="p-price">${getNumericPriceMXN(prod).toLocaleString()} MXN</p>
                                        <div className="swatch-row-carrusel">
                                            {prod.colors_available?.map(col => (
                                                <button key={col} className={`swatch-circle ${colorActivo === col ? 'active' : ''}`} style={{ backgroundColor: getColorHex(col) }} onClick={() => setColorVisual(prev => ({ ...prev, [prod._id]: col }))} />
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

            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-top"><h2>TU BOLSA</h2><span onClick={() => setIsCartOpen(false)} style={{cursor:'pointer', fontSize: '24px'}}>&times;</span></div>
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
                                    <p style={{fontWeight:'800', color:'var(--makia-accent)'}}>${(getNumericPriceMXN(item) * item.quantity).toLocaleString()}</p>
                                    <button onClick={() => removeFromCart(i)} className="btn-remove">&times;</button>
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