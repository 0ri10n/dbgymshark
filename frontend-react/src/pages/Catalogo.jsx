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

// Paleta de colores completa para los círculos
const getColorHex = (name = "") => {
    const n = name.toLowerCase().trim();
    if (n === 'black') return "#111111";
    if (n === 'white') return "#FFFFFF";
    if (n.includes('teal')) return "#008080";
    if (n.includes('olive') || n.includes('aloe') || n.includes('alpine')) return "#556b2f";
    if (n.includes('green')) return "#2d4d43";
    if (n.includes('blue')) return "#1e3a8a";
    if (n.includes('navy')) return "#000080";
    if (n.includes('pink') || n.includes('rose')) return "#db2777";
    if (n.includes('red')) return "#991b1b";
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
    const [catFiltro, setCatFiltro] = useState(null);
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
            } catch (e) { console.error("Error cargando productos:", e); }
            finally { setCargando(false); }
        };
        cargarData();
    }, [pagina, busqueda, baseURL]);

    const granTotal = cart.reduce((acc, item) => acc + ((item.precioMXN || item.price) * item.quantity), 0);

    const handleAgregar = (p) => {
        const talla = tallasSeleccionadas[p._id];
        // Captura el color activo para cambiar la imagen y guardarlo en la bolsa
        const colorActivo = colorVisual[p._id] || (p.colors_available && p.colors_available[0]);
        const imagenSeleccionada = p.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(p);

        if (!talla) { 
            alert("Por favor selecciona una talla."); 
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
        if (!user) {
            alert("Debes iniciar sesión con tu cuenta de cliente para realizar una compra.");
            return;
        }
        if (cart.length === 0) return;

        try {
            const token = localStorage.getItem('token');
            // Mapeo dinámico de nombre y apellido real para evitar nombres genéricos
            const nombreCompleto = `${user.nombre || ''} ${user.apellido || ''}`.trim();

            const ordenData = {
                nombreCliente: nombreCompleto,
                productos: cart.map(item => ({
                    nombre: item.title,
                    talla: item.selectedSize,
                    color: item.selectedColor,
                    precio: Number(item.precioMXN || item.price),
                    cantidad: Number(item.quantity)
                })),
                total: Number(granTotal.toFixed(2)),
                fechaPedido: new Date()
            };

            await axios.post(`${baseURL}/admin/panel/ventas`, ordenData, {
                headers: { 'x-auth-token': token }
            });
            
            alert("¡Compra finalizada con éxito!");
            clearCart();
            setIsCartOpen(false);
        } catch (error) {
            console.error("Error en la compra:", error);
            alert("Hubo un error al procesar tu pedido.");
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

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <div className="sidebar-sticky-wrapper">
                        <h2 className="sidebar-h2">Filtros</h2>
                        <div className="cat-dropdown-list">
                            {CATEGORIAS_LIMPIAS.map(cat => (
                                <div key={cat} className={`sub-item ${catFiltro === cat ? 'active' : ''}`} onClick={() => setCatFiltro(cat)}>
                                    {cat}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productos.filter(p => !catFiltro || p.product_type === catFiltro).map((prod) => {
                            const colorActivo = colorVisual[prod._id] || (prod.colors_available && prod.colors_available[0]);
                            const imagenAMostrar = prod.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(prod);

                            return (
                                <div key={prod._id} className="makia-product-card">
                                    <div className="img-frame">
                                        <img src={imagenAMostrar} alt="p" className="p-img" />
                                    </div>
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

            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-top">
                            <h2>TU BOLSA</h2>
                            <span onClick={() => setIsCartOpen(false)} className="close-cart-x" style={{cursor:'pointer'}}>&times;</span>
                        </div>
                        <div className="cart-modal-list">
                            {cart.map((item, i) => (
                                <div key={i} className="cart-modal-row">
                                    {/* Estilo forzado para imagen pequeña con bordes redondeados */}
                                    <div style={{ width: '70px', height: '90px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid #333' }}>
                                        <img src={item.selectedImage} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div className="cart-item-info">
                                        <p className="cart-item-title">{item.title}</p>
                                        <div className="cart-item-controls-row">
                                            <select 
                                                className="cart-mini-select"
                                                value={item.selectedSize}
                                                onChange={(e) => updateCartItem(i, { ...item, selectedSize: e.target.value })}
                                            >
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
                            <div className="total-row">
                                <span>TOTAL:</span>
                                <span className="total-amount">${granTotal.toLocaleString()} MXN</span>
                            </div>
                            <button className="btn-checkout-makia" onClick={handleFinalizarCompra}>FINALIZAR COMPRA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;