import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

// --- FUNCIONS D'UTILITAT ---
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
    // Prioritat: imatge de la primera variant, després imatge_principal
    const img = (p.variants && p.variants[0]?.image) || p.image_principal || p.imagen || p.image_src;
    if (typeof img === 'string' && img.includes(',')) return img.split(',')[0].trim();
    return img || "/placeholder.jpg";
};

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [productos, setProductos] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalProductosCount, setTotalProductosCount] = useState(0);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);

    const [vistaActiva, setVistaActiva] = useState('productos');
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [listaVentas, setListaVentas] = useState([]);

    // Estats de Modals
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({ title: '', product_type: '', vendor: '', variants: [] });

    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
    const [formDataUsuario, setFormDataUsuario] = useState({ nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: '' });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-mb5q.onrender.com/api';

    // --- CÀRREGA DE DADES ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            // Paginació fixada a 10 per permetre la navegació correcta
            const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=10&search=${busqueda}`);
            if (res.data.productos) {
                setProductos(res.data.productos);
                setTotalPaginas(res.data.paginasTotales || Math.ceil((res.data.totalCount || 500) / 10));
                setTotalProductosCount(res.data.totalCount || 500); 
            }
        } catch (error) { console.error('Error carregant productes:', error); }
        finally { setCargando(false); }
    };

    const cargarDatosExtra = async (vista) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${baseURL}/admin/panel/${vista}`, config);
            if (vista === 'usuarios') setListaUsuarios(res.data);
            if (vista === 'ventas') setListaVentas(res.data);
        } catch (error) { console.error(`Error carregant ${vista}:`, error); }
    };

    useEffect(() => { cargarProductos(); }, [pagina, busqueda]);
    useEffect(() => { 
        if (vistaActiva === 'usuarios') cargarDatosExtra('usuarios');
        if (vistaActiva === 'ventas') cargarDatosExtra('ventas');
    }, [vistaActiva]);

    // --- FUNCIONS DE PRODUCTE ---
    const handleEliminar = async (id) => {
        if (!window.confirm("Segur que vols eliminar aquest producte?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}/productos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            cargarProductos();
        } catch (error) { alert("Error en eliminar el producte."); }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (editandoId) await axios.put(`${baseURL}/productos/${editandoId}`, formData, config);
            else await axios.post(`${baseURL}/productos`, formData, config);
            setModalAbierto(false);
            cargarProductos();
        } catch (error) { alert("Error en desar."); }
    };

    // --- USuaris ---
    const abrirModalEditarUsuario = (u) => {
        setEditandoUsuarioId(u._id);
        setFormDataUsuario({
            nombre: u.nombre || '',
            apellido: u.apellido || '',
            email: u.email || '',
            rol: u.rol || 'cliente',
            password: '',
            direccion: u.direccion || ''
        });
        setModalUsuarioAbierto(true);
    };

    // --- VARIANTS AGRUPADES PER COLOR ---
    const variantsByColor = useMemo(() => {
        const grouped = {};
        formData.variants.forEach((v, index) => {
            if (!grouped[v.color]) grouped[v.color] = { color: v.color, image: v.image || '', items: [] };
            grouped[v.color].items.push({ ...v, originalIndex: index });
        });
        return Object.values(grouped);
    }, [formData.variants]);

    const updateColorImage = (colorName, newUrl) => {
        const updated = formData.variants.map(v => v.color === colorName ? { ...v, image: newUrl } : v);
        setFormData({ ...formData, variants: updated });
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-brand-section">
                    <h1 className="brand-logo">MAKIA</h1>
                </div>
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">Ens alegra veure't de nou!</span>
                        <span className="user-name">Admin: <strong>{user?.nombre || user?.name || 'Administrador'}</strong></span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Tancar Sessió</button>
                </div>
            </header>

            <hr className="header-divider" />
            <h2 className="panel-subtitle">Panel de Administración</h2>

            <main className="admin-main">
                <section className="admin-stats">
                    <div className={`admin-stat-card ${vistaActiva === 'productos' ? 'active-prod' : ''}`} onClick={() => setVistaActiva('productos')}>
                        <div className="stat-info"><h3>Productes</h3><p>Inventari Actual</p></div>
                        <span className="stat-count">{totalProductosCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'ventas' ? 'active-ventas' : ''}`} onClick={() => setVistaActiva('ventas')}>
                        <div className="stat-info"><h3>Vendes</h3><p>Historial</p></div>
                        <span className="stat-count">{listaVentas.length}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'usuarios' ? 'active-user' : ''}`} onClick={() => setVistaActiva('usuarios')}>
                        <div className="stat-info"><h3>Usuaris</h3><p>Base de Dades</p></div>
                        <span className="stat-count">{listaUsuarios.length}</span>
                    </div>
                </section>

                <div className="admin-controls-row">
                    {vistaActiva === 'productos' ? (
                        <div className="search-bar-makia">
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Busca nom o tipus de peça..." 
                                value={busqueda}
                                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                            />
                        </div>
                    ) : <div />}
                    {vistaActiva === 'productos' && (
                        <button className="admin-add-btn" onClick={() => { setEditandoId(null); setFormData({title:'', variants:[]}); setModalAbierto(true); }}>
                            + Nou Producte
                        </button>
                    )}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table-fixed">
                        <thead>
                            {vistaActiva === 'productos' ? (
                                <tr><th className="col-img">Imatge</th><th className="col-title">Títol</th><th>Tipus</th><th className="col-actions">Accions</th></tr>
                            ) : (
                                <tr><th>Nom</th><th>Email</th><th>Rol</th><th className="col-actions">Accions</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => (
                                <tr key={p._id}>
                                    <td className="col-img"><img src={getPrimaryImage(p)} className="table-thumb" alt="p" /></td>
                                    <td className="col-title">{p.title}</td>
                                    <td>{p.product_type}</td>
                                    <td className="col-actions">
                                        <button className="btn-table btn-edit" onClick={() => { setEditandoId(p._id); setFormData(p); setModalAbierto(true); }}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => handleEliminar(p._id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td>{u.nombre} {u.apellido}</td>
                                    <td>{u.email}</td>
                                    <td><span className="role-badge">{u.rol}</span></td>
                                    <td className="col-actions">
                                        <button className="btn-table btn-edit" onClick={() => abrirModalEditarUsuario(u)}>Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {vistaActiva === 'productos' && <PaginationControls page={pagina} totalPages={totalPaginas} onPageChange={setPagina} className="admin-pagination-theme" />}
            </main>

            {/* MODAL PRODUCTE AGRUPAT PER COLOR */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-xl">
                        <h2>{editandoId ? 'Editar Producte' : 'Nou Producte'}</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="field-group">
                                <label>Títol del Producte</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            
                            <div className="variants-section">
                                <div className="section-header">
                                    <h3>Variants i Fotos per Color</h3>
                                    <button type="button" className="btn-add-variant" onClick={() => setFormData({...formData, variants: [...formData.variants, {color:'', size:'', price:0, inventory_quantity:0}]})}>+ Afegir Variant</button>
                                </div>

                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group flex-1"><label>Color</label><input type="text" value={group.color} onChange={(e) => {
                                                const updated = formData.variants.map(v => v.color === group.color ? { ...v, color: e.target.value } : v);
                                                setFormData({ ...formData, variants: updated });
                                            }} /></div>
                                            <div className="field-group flex-2"><label>URL Imatge del Color</label><input type="text" value={group.image} onChange={(e) => updateColorImage(group.color, e.target.value)} /></div>
                                        </div>
                                        {group.image && <div className="preview-centered"><img src={group.image} className="image-preview-box" alt="p" /></div>}
                                        <div className="sizes-grid">
                                            {group.items.map((item) => (
                                                <div key={item.originalIndex} className="size-row">
                                                    <div className="field-group"><label>Talla</label><input type="text" value={item.size} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].size = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Preu</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Stock</label><input type="number" value={item.inventory_quantity} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <button type="button" className="btn-x" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== item.originalIndex)})}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setModalAbierto(false)}>Cancel·lar</button>
                                <button type="submit" className="btn-save">Desar Canvis</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;