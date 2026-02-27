import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

// --- FUNCIONES DE UTILIDAD ---
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
    // Prioridad: imagen de la primera variante, luego imagen_principal
    const img = (p.variants && p.variants[0]?.image) || p.image_principal || p.imagen || p.image_src;
    if (typeof img === 'string' && img.includes(',')) return img.split(',')[0].trim();
    return img || "/placeholder.jpg";
};

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [productos, setProductos] = useState([]);
    const [totalProductosCount, setTotalProductosCount] = useState(0); 
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);
    
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({
        title: '', vendor: '', product_type: '', variants: [] 
    });

    const [vistaActiva, setVistaActiva] = useState('productos');
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [listaVentas, setListaVentas] = useState([]);
    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
    const [formDataUsuario, setFormDataUsuario] = useState({
        nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: ''
    });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-mb5q.onrender.com/api';

    // --- CARGA DE DATOS ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            // Paginado de 10 productos con búsqueda activa
            const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=10&search=${busqueda}`);
            if (res.data.productos) {
                setProductos(res.data.productos);
                setTotalPaginas(res.data.paginasTotales || 1);
                setTotalProductosCount(res.data.totalProductos || 500);
            }
        } catch (error) { console.error('Error productos:', error); }
        finally { setCargando(false); }
    };

    const cargarDatosExtra = async (vista) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (vista === 'usuarios') {
                const res = await axios.get(`${baseURL}/admin/panel/usuarios`, config);
                setListaUsuarios(res.data);
            } else if (vista === 'ventas') {
                const res = await axios.get(`${baseURL}/admin/panel/ventas`, config);
                setListaVentas(res.data);
            }
        } catch (error) { console.error(`Error ${vista}:`, error); }
    };

    useEffect(() => { 
        cargarProductos(); 
    }, [pagina, busqueda]);

    useEffect(() => {
        cargarDatosExtra('usuarios');
        cargarDatosExtra('ventas');
    }, []);

    // --- SUGERENCIAS DINÁMICAS ---
    const sugerencias = useMemo(() => {
        const cats = new Set();
        const colors = new Set();
        const sizes = new Set();
        productos.forEach(p => {
            if (p.product_type) cats.add(p.product_type);
            p.variants?.forEach(v => {
                if (v.color) colors.add(v.color);
                if (v.size) sizes.add(v.size);
            });
        });
        return {
            categorias: Array.from(cats).sort(),
            colores: Array.from(colors).sort(),
            tallas: Array.from(sizes).sort()
        };
    }, [productos]);

    // --- LOGICA DE VARIANTES AGRUPADAS POR COLOR ---
    const variantsByColor = useMemo(() => {
        const grouped = {};
        formData.variants.forEach((v, index) => {
            if (!grouped[v.color]) {
                grouped[v.color] = { color: v.color, image: v.image || '', items: [] };
            }
            grouped[v.color].items.push({ ...v, originalIndex: index });
        });
        return Object.values(grouped);
    }, [formData.variants]);

    // --- MANEJO DE PRODUCTOS ---
    const abrirModalEditar = (prod) => {
        setEditandoId(prod._id);
        setFormData(prod);
        setModalAbierto(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Eliminar este producto?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}/productos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            cargarProductos();
        } catch (error) { alert("Error al eliminar."); }
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
        } catch (error) { alert("Error al guardar."); }
    };

    // --- MANEJO DE USUARIOS ---
    const abrirModalEditarUsuario = (u) => {
        setEditandoUsuarioId(u._id);
        setFormDataUsuario({
            nombre: u.nombre || '', apellido: u.apellido || '', email: u.email || '',
            rol: u.rol || 'cliente', password: '', direccion: u.direccion || ''
        });
        setModalUsuarioAbierto(true);
    };

    const handleGuardarUsuario = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const datos = { ...formDataUsuario };
            if (editandoUsuarioId && !datos.password) delete datos.password;

            if (editandoUsuarioId) await axios.put(`${baseURL}/admin/panel/usuarios/${editandoUsuarioId}`, datos, config);
            else await axios.post(`${baseURL}/admin/panel/usuarios`, datos, config);
            
            setModalUsuarioAbierto(false);
            cargarDatosExtra('usuarios');
        } catch (error) { alert("Error al guardar usuario."); }
    };

    return (
        <div className="admin-container">
            <datalist id="list-cats">{sugerencias.categorias.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="list-colores">{sugerencias.colores.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="list-tallas">{sugerencias.tallas.map(s => <option key={s} value={s} />)}</datalist>

            <header className="admin-header">
                <h1 className="brand-logo">MAKIA</h1>
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
                        <span className="user-name">Admin: <strong>{user?.nombre || user?.role || 'Administrador'}</strong></span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
                </div>
            </header>

            <hr className="header-divider" />
            <h2 className="panel-subtitle">Panel de Administración</h2>

            <main className="admin-main">
                <section className="admin-stats">
                    <div className={`admin-stat-card ${vistaActiva === 'productos' ? 'active-prod' : ''}`} onClick={() => setVistaActiva('productos')}>
                        <div className="stat-info"><h3>Productos</h3><p>Inventario Actual</p></div>
                        <span className="stat-count">{totalProductosCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'ventas' ? 'active-ventas' : ''}`} onClick={() => setVistaActiva('ventas')}>
                        <div className="stat-info"><h3>Ventas</h3><p>Historial</p></div>
                        <span className="stat-count">{listaVentas.length}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'usuarios' ? 'active-user' : ''}`} onClick={() => setVistaActiva('usuarios')}>
                        <div className="stat-info"><h3>Usuarios</h3><p>Base de Datos</p></div>
                        <span className="stat-count">{listaUsuarios.length}</span>
                    </div>
                </section>

                <div className="admin-controls-row">
                    <div className="search-bar-makia">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Busca nombre o tipo de prenda (ej. Ss Tops)..." 
                            value={busqueda}
                            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                        />
                    </div>
                    {vistaActiva === 'productos' && (
                        <button className="admin-add-btn" onClick={() => { setEditandoId(null); setFormData({title:'', variants:[]}); setModalAbierto(true); }}>
                            + Nuevo Producto
                        </button>
                    )}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table-fixed">
                        <thead>
                            {vistaActiva === 'productos' ? (
                                <tr><th>Imagen</th><th className="th-title">Título</th><th>Tipo</th><th className="th-actions">Acciones</th></tr>
                            ) : (
                                <tr><th>Nombre</th><th>Email</th><th>Rol</th><th className="th-actions">Acciones</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => (
                                <tr key={p._id}>
                                    <td className="col-img"><img src={getPrimaryImage(p)} alt="p" className="table-thumb" /></td>
                                    <td className="td-title">{p.title}</td>
                                    <td>{p.product_type}</td>
                                    <td className="admin-row-actions">
                                        <button className="admin-edit-btn" onClick={() => abrirModalEditar(p)}>Editar</button>
                                        <button className="admin-delete-btn" onClick={() => handleEliminar(p._id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td>{u.nombre} {u.apellido}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`role-badge ${u.rol}`}>{u.rol}</span></td>
                                    <td className="admin-row-actions">
                                        <button className="admin-edit-btn" onClick={() => abrirModalEditarUsuario(u)}>Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {vistaActiva === 'productos' && <PaginationControls page={pagina} totalPages={totalPaginas} onPageChange={setPagina} className="admin-pagination-theme" />}
            </main>

            {/* --- MODAL PRODUCTOS AGRUPADO POR COLOR --- */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-xl">
                        <h2>{editandoId ? 'Editar Producto' : 'Crear Producto'}</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="field-group">
                                <label>Título del Producto</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div className="field-group">
                                <label>Categoría</label>
                                <input type="text" list="list-cats" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} />
                            </div>

                            <div className="variants-section">
                                <div className="variants-header">
                                    <h3>Variantes por Color</h3>
                                    <button type="button" className="btn-save" onClick={() => setFormData({...formData, variants: [...formData.variants, {color:'', size:'', price:0, inventory_quantity:0}]})}>+ Añadir Variante</button>
                                </div>

                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group">
                                                <label>Color</label>
                                                <input type="text" list="list-colores" value={group.color} onChange={(e) => {
                                                    const updated = formData.variants.map(v => v.color === group.color ? { ...v, color: e.target.value } : v);
                                                    setFormData({ ...formData, variants: updated });
                                                }} />
                                            </div>
                                            <div className="field-group img-field">
                                                <label>Imagen del Color (URL)</label>
                                                <input type="text" value={group.image} onChange={(e) => {
                                                    const updated = formData.variants.map(v => v.color === group.color ? { ...v, image: e.target.value } : v);
                                                    setFormData({ ...formData, variants: updated });
                                                }} />
                                            </div>
                                            {group.image && <img src={group.image} className="mini-preview" alt="c" />}
                                        </div>
                                        <div className="sizes-grid">
                                            {group.items.map((item) => (
                                                <div key={item.originalIndex} className="size-row">
                                                    <div className="field-group"><label>Talla</label><input type="text" list="list-tallas" value={item.size} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].size = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Precio</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Stock</label><input type="number" value={item.inventory_quantity} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <button type="button" className="btn-x" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== item.originalIndex)})}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setModalAbierto(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save shadow-blue">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;