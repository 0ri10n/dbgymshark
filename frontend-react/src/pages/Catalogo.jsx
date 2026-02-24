import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css';

// Agrupación de product_type en categorías para el menú desplegable
const categoryGroups = {
    'Womens': [
        'Womens Bodysuit', 'Womens Bottoms', 'Womens Crop Top', 'Womens Crop Tops', 'Womens Dress', 
        'Womens Hoodie', 'Womens Hoodies', 'Womens Jacket', 'Womens Jackets / Outerwear', 'Womens Leggings', 
        'Womens Long Sleeve Top', 'Womens Ls Tops', 'Womens One Piece', 'Womens One Pieces', 'Womens Pants', 
        'Womens Pullover', 'Womens Pullovers', 'Womens Shorts', 'Womens Skort', 'Womens Sleeveless Top', 
        'Womens Sleeveless Tops', 'Womens Socks', 'Womens Sports Bra', 'Womens Sports Bras', 'Womens Ss Tops', 
        'Womens Sweater', 'Womens Swimwear', 'Womens T-Shirt', 'Womens Tank', 'Womens Tanks', 'Womens Underwear', 'Womens Vest'
    ],
    'Mens': [
        'Mens Baselayer', 'Mens Bottoms', 'Mens Drop Armhole Tank', 'Mens Hoodie', 'Mens Jacket', 'Mens Jackets', 
        'Mens Jackets / Outerwear', 'Mens Joggers', 'Mens Leggings', 'Mens Long Sleeve Top', 'Mens Ls Tops', 
        'Mens Outerwear', 'Mens Pants', 'Mens Pullover', 'Mens Pullovers', 'Mens Shirt', 'Mens Shorts', 
        'Mens Sleeveless Tops', 'Mens Ss Tops', 'Mens Stringer', 'Mens T-Shirt', 'Mens Tank', 'Mens Tops', 
        'Mens Underwear', 'Mens t', 'mens unisex Bottoms', 'mens unisex Pullovers'
    ],
    'Accessories': [
        'Accessories', 'Bag', 'Bags', 'Bottles', 'Footwear', 'Headwear', 'Socks', 'Thirft Bag', 'footwear',
        'womens Accessories', 'womens Bags', 'womens Headwear', 'womens Socks'
    ]
};

const getColorHex = (colorName) => {
    if (!colorName) return "#555";
    const name = colorName.toLowerCase();
    if (name.includes('blue')) return "#1e3a8a";
    if (name.includes('pink')) return "#db2777";
    if (name.includes('green')) return "#2d4d43";
    if (name.includes('red')) return "#991b1b";
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
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Estados de Filtros (Sin Talla en sidebar por redundancia)
    const [catFiltro, setCatFiltro] = useState(null);
    const [subCatFiltro, setSubCatFiltro] = useState(null);
    const [precioMax, setPrecioMax] = useState(2500);
    const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
    const [colorVisual, setColorVisual] = useState({});

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
            } catch (error) { 
                console.error('Error MAKIA:', error); 
            } finally { 
                setCargando(false); 
            }
        };
        cargarCatalogo();
    }, [pagina, busqueda]);

    // Lógica de filtrado: Categoría, Subcategoría y Precio
    const productosAMostrar = productos.filter(p => {
        const matchCat = catFiltro ? categoryGroups[catFiltro].includes(p.product_type) : true;
        const matchSub = subCatFiltro ? p.product_type === subCatFiltro : true;
        const matchPrecio = (p.price || p.precioMXN || 0) <= precioMax;
        return matchCat && matchSub && matchPrecio;
    });

    const agregarAlCarrito = (prod, colorElegido) => {
        const item = { 
            ...prod, 
            tallaElegida: tallasSeleccionadas[prod._id] || 'Única', 
            colorElegido: colorElegido || (prod.colors_available?.[0] || 'N/A') 
        };
        setCarrito([...carrito, item]);
        setIsCartOpen(true);
    };

    return (
        <div className="client-view">
            <header className="client-header-makia">
                <div className="logo-text">MAKIA</div>
                <div className="header-right-icons">
                    <div className="cart-wrapper" onClick={() => setIsCartOpen(true)}>
                        <i className="fas fa-shopping-bag"></i>
                        <span id="cartCount">{carrito.length}</span>
                    </div>
                    <div className="user-icon" onClick={logout}>
                        <i className="far fa-user"></i>
                    </div>
                </div>
            </header>

            <div className="hero-banner-full">
                <img src="/hero-banner-client.jpg" alt="Banner MAKIA" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <h2 className="sidebar-h2">Filtros</h2>
                    
                    {/* Filtro Categoría Desplegable */}
                    <div className="filter-group">
                        <h3 className="sidebar-h3">Categoría</h3>
                        {Object.keys(categoryGroups).map(cat => (
                            <div key={cat} className="category-dropdown-item">
                                <div 
                                    className={`cat-main-label ${catFiltro === cat ? 'selected' : ''}`} 
                                    onClick={() => {
                                        setCatFiltro(catFiltro === cat ? null : cat); 
                                        setSubCatFiltro(null);
                                    }}
                                >
                                    {cat} <i className={`fas fa-chevron-${catFiltro === cat ? 'up' : 'down'}`}></i>
                                </div>
                                {catFiltro === cat && (
                                    <div className="sub-cat-list">
                                        {categoryGroups[cat].map(sub => (
                                            <div 
                                                key={sub} 
                                                className={`sub-item ${subCatFiltro === sub ? 'active' : ''}`} 
                                                onClick={() => setSubCatFiltro(subCatFiltro === sub ? null : sub)}
                                            >
                                                {sub.replace('Womens ', '').replace('Mens ', '')}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Filtro Precio */}
                    <div className="filter-group">
                        <h3 className="sidebar-h3">Presupuesto: ${precioMax}</h3>
                        <input 
                            type="range" 
                            min="0" 
                            max="3000" 
                            step="50" 
                            value={precioMax} 
                            onChange={(e) => setPrecioMax(parseInt(e.target.value))} 
                            className="price-slider" 
                        />
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="¿Qué estás buscando hoy?" 
                            value={busqueda} 
                            onChange={(e) => setBusqueda(e.target.value)} 
                        />
                    </div>

                    <div className="fixed-grid-3">
                        {!cargando && productosAMostrar.map((prod) => {
                            const colorActivo = colorVisual[prod._id] || (prod.colors_available?.[0]);
                            const imgAMostrar = prod.variants?.find(v => v.color === colorActivo)?.image || getPrimaryImage(prod);

                            return (
                                <div key={prod._id} className="makia-product-card">
                                    <div className="img-frame">
                                        <img src={imgAMostrar} alt={prod.title} className="p-img" />
                                    </div>
                                    <div className="info-frame">
                                        <h3>{prod.title}</h3>
                                        <p className="p-price">${prod.price || prod.precioMXN}</p>
                                        
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
                                                <option value="">Seleccionar Talla</option>
                                                {(prod.sizes_available || []).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <button className="btn-add-to-bag-makia" onClick={() => agregarAlCarrito(prod, colorActivo)}>
                                                AÑADIR A LA BOLSA
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

            {/* Modal de la Bolsa */}
            {isCartOpen && (
                <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
                    <div className="cart-modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="cart-modal-top">
                            <h2>TU BOLSA</h2>
                            <span className="close-cart-btn" onClick={() => setIsCartOpen(false)}>&times;</span>
                        </div>
                        <div className="cart-modal-list">
                            {carrito.map((item, i) => (
                                <div key={i} className="cart-modal-row">
                                    <div>
                                        <p>{item.title}</p>
                                        <small>{item.tallaElegida} | {item.colorElegido}</small>
                                    </div>
                                    <p>${item.price || item.precioMXN}</p>
                                </div>
                            ))}
                            {carrito.length === 0 && <p style={{textAlign: 'center', padding: '20px'}}>Tu bolsa está vacía.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Catalogo;