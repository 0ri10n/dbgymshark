import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const Store = () => {
    const { logout } = useContext(AuthContext);
    const { cart, addToCart } = useContext(CartContext);
    const [productos, setProductos] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [talla, setTalla] = useState('');
    const [stock, setStock] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        api.get(`/productos?page=${page}&search=${search}&talla=${talla}&stock=${stock}`)
           .then(res => {
               setProductos(res.data.productos || []);
               setTotalPages(res.data.pagination?.pages || 1);
           });
    }, [page, search, talla, stock]);

    return (
        <div className="store-container">
            <header className="client-header">
                <div className="logo">MAKIA</div>
                <div style={{display:'flex', gap:'25px', alignItems:'center'}}>
                    <div onClick={() => setIsCartOpen(true)} style={{position:'relative', cursor:'pointer'}}><i className="fas fa-shopping-bag"></i><span id="cartCount">{cart.length}</span></div>
                    <i className="far fa-user" onClick={logout} style={{cursor:'pointer', fontSize:'22px'}}></i>
                </div>
            </header>
            <div className="hero-banner"><img src="/hero-banner-client.jpg" alt="Hero" /></div>
            <div className="store-layout">
                <aside className="filters-sidebar">
                    <h2 style={{marginBottom:'20px'}}>Filtros</h2>
                    <h3>Talla</h3>
                    <div className="size-grid">{['XS', 'S', 'M', 'L', 'XL', '2X'].map(t => (<button key={t} className={talla === t ? 'active' : ''} onClick={() => setTalla(t)}>{t}</button>))}</div>
                    <div style={{marginTop:'30px', borderTop:'1px solid #222', paddingTop:'20px'}}>
                        <h3>DISPONIBILIDAD</h3>
                        <label style={{display:'flex', gap:'10px', marginBottom:'10px'}}><input type="checkbox" checked={stock === 'true'} onChange={e => setStock(e.target.checked ? 'true' : '')} /> Disponible</label>
                        <label style={{display:'flex', gap:'10px', color:'#444'}}><input type="checkbox" checked={stock === 'false'} onChange={e => setStock(e.target.checked ? 'false' : '')} /> Fuera de Stock</label>
                    </div>
                </aside>
                <main style={{flex: 1}}>
                    <div className="shop-controls">
                        <div className="search-bar"><i className="fas fa-search"></i><input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <span className="view-all" onClick={() => {setSearch(''); setTalla(''); setStock('');}}>Ver todo</span>
                    </div>
                    <div className="products-grid">
                        {productos.map(p => (
                            <div key={p._id} className="product-card">
                                <div className="product-image-container"><img src={p.image_principal} alt={p.title} /></div>
                                <div style={{padding:'15px 0'}}><h3>{p.title}</h3><p className="price">${p.precioMXN} MXN</p><button className="btn-main-action" style={{width:'100%', padding:'12px', background:'white', color:'black', borderRadius:0}} onClick={() => addToCart(p, 'M')}>Añadir</button></div>
                            </div>
                        ))}
                    </div>
                    <div className="pagination-controls">
                        <button className="btn-paginacion" disabled={page === 1} onClick={() => setPage(page-1)}>Anterior</button>
                        <span>Página {page} de {totalPages}</span>
                        <button className="btn-paginacion" disabled={page >= totalPages} onClick={() => setPage(page+1)}>Siguiente</button>
                    </div>
                </main>
            </div>
            {/* LA BOLSA LATERAL */}
            <div className={`cart-modal ${isCartOpen ? 'active' : ''}`}>
                <div style={{display:'flex', justifyContent:'space-between'}}><h2>TU BOLSA</h2><span onClick={() => setIsCartOpen(false)} style={{cursor:'pointer', fontSize:'30px'}}>&times;</span></div>
                <div style={{flex:1, marginTop:'30px', overflowY:'auto'}}>{cart.map((item, i) => <div key={i} style={{padding:'15px 0', borderBottom:'1px solid #1a1a1a'}}><p>{item.nombre}</p><p style={{color:'#ff4b4b'}}>${item.precio}</p></div>)}</div>
                <button className="btn-main-action" style={{width:'100%', background:'white', color:'black', borderRadius:0}}>PAGAR AHORA</button>
            </div>
        </div>
    );
};
export default Store;