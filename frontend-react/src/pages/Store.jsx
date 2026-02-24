import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './Catalogo.css'; 

// --- CONFIGURACIÓN DE MONEDA ---
const TIPO_CAMBIO_USD_MXN = 17.00; // Tipo de cambio para conversión

// Agrupación de product_type en categorías principales
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
        'womens Accessories', 'womens Bags', 'womens Headwear', 'womens Socks', 'Misc.', 'Gift Card'
    ]
};

const Store = () => {
    const { logout } = useContext(AuthContext);
    const { cart, addToCart } = useContext(CartContext);
    
    const [productos, setProductos] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cargando, setCargando] = useState(true);

    // Estados de Filtros
    const [catFiltro, setCatFiltro] = useState(null);
    const [subCatFiltro, setSubCatFiltro] = useState(null);
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

    // --- FUNCIONES UTILITARIAS ---

    const getNumericPriceMXN = (prod) => {
        let valor = Number(prod.precioMXN);
        if (!valor || isNaN(valor)) {
            valor = Number(prod.price) * TIPO_CAMBIO_USD_MXN;
        }
        return valor || 0;
    };

    const getFormattedPriceMXN = (prod) => {
        const valor = getNumericPriceMXN(prod);
        return valor.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }) + " MXN";
    };

    // [ARREGLO BOTÓN COMPRA] Función para agregar y abrir bolsa
    const handleAgregarALaBolsa = (p) => {
        const talla = tallasSeleccionadas[p._id] || 'M';
        addToCart(p, talla);
        setIsCartOpen(true); 
    };

    // Lógica de filtrado en frontend
    const productosAMostrar = productos.filter(p => {
        const titulo = (p.title || '').toLowerCase();
        const tipoDB = (p.product_type || '').trim().toLowerCase();
        const precioPesos = getNumericPriceMXN(p);

        const matchSearch = search === '' || titulo.includes(search.toLowerCase());
        const matchCat = catFiltro ? categoryGroups[catFiltro].some(t => t.toLowerCase() === tipoDB) : true;
        const matchSub = subCatFiltro ? tipoDB === subCatFiltro.toLowerCase() : true;
        const matchPrecio = precioPesos <= precioMax;

        return matchSearch && matchCat && matchSub && matchPrecio;
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

            <div className="hero-banner-full">
                <img src="/hero-banner-client.jpg" alt="MAKIA Hero" />
            </div>

            <div className="store-layout-container">
                <aside className="sidebar-filter-box">
                    <div className="sidebar-top-row">
                        <h2 className="sidebar-h2">Filtros</h2>
                        <button className="clear-filters-btn" onClick={() => {setCatFiltro(null); setSubCatFiltro(null); setPrecioMax(3500); setSearch('');}}>Limpiar</button>
                    </div>

                    <div className="filter-group">
                        <h3 className="sidebar-h3">Categoría</h3>
                        {Object.keys(categoryGroups).map(cat => (
                            <div key={cat} className="category-dropdown-item">
                                <div 
                                    className={`cat-main-label ${catFiltro === cat ? 'selected' : ''}`} 
                                    onClick={() => {setCatFiltro(catFiltro === cat ? null : cat); setSubCatFiltro(null);}}
                                >
                                    {cat} <i className={`fas fa-chevron-${catFiltro === cat ? 'up' : 'down'}`}></i>
                                </div>
                                {catFiltro === cat && (
                                    <div className="sub-cat-list">
                                        {categoryGroups[cat].map(sub => (
                                            <div 
                                                key={sub} 
                                                className={`sub-item ${subCatFiltro === sub ? 'active' : ''}`} 
                                                onClick={() => setSubCatFiltro(sub)}
                                            >
                                                {sub.replace('Womens ', '').replace('Mens ', '')}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="filter-group">
                        <h3 className="sidebar-h3">Presupuesto: ${precioMax} MXN</h3>
                        <input 
                            type="range" min="0" max="3500" step="100" 
                            value={precioMax} 
                            onChange={(e) => setPrecioMax(Number(e.target.value))} 
                            className="price-slider" 
                        />
                    </div>
                </aside>

                <main className="shop-main-content">
                    <div className="white-search-box">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="¿Qué buscas hoy?" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    <div className="fixed-grid-2">
                        {!cargando && productosAMostrar.map(p => (
                            <div key={p._id} className="makia-product-card">
                                <div className="img-frame">
                                    <img src={p.image_principal} alt={p.title} className="p-img" />
                                </div>
                                <div className="info-frame">
                                    <h3>{p.title}</h3>
                                    <p className="p-price">{getFormattedPriceMXN(p)}</p>
                                    <div className="card-footer">
                                        <select 
                                            className="makia-size-dropdown" 
                                            onChange={(e) => setTallasSeleccionadas({...tallasSeleccionadas, [p._id]: e.target.value})}
                                        >
                                            <option value="">Seleccionar Talla</option>
                                            {(p.sizes_available || []).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        {/* [CORRECCIÓN BOTÓN] Botón con acción funcional */}
                                        <button className="btn-add-to-bag-makia" onClick={() => handleAgregarALaBolsa(p)}>
                                            AÑADIR A LA BOLSA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
                </main>
            </div>

            {/* BOLSA LATERAL FUNCIONAL */}
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
                                    <div>
                                        <p style={{fontWeight:'600'}}>{item.title}</p>
                                        <small>{item.talla || 'M'}</small>
                                    </div>
                                    <p style={{color:'var(--makia-accent)', fontWeight:'800'}}>
                                        {getFormattedPriceMXN(item)}
                                    </p>
                                </div>
                            ))}
                            {cart.length === 0 && <p style={{textAlign:'center', padding:'40px', color:'#888'}}>Tu bolsa está vacía.</p>}
                        </div>
                        <div className="cart-modal-footer">
                            <button className="btn-checkout-makia">FINALIZAR COMPRA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Store;