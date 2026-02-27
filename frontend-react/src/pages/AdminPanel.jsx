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
    const img = p.image_principal || p.imagen || p.image_src || (p.variants && p.variants[0]?.image);
    if (typeof img === 'string' && img.includes(',')) return img.split(',')[0].trim();
    return img || "/placeholder.jpg";
};

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [productos, setProductos] = useState([]);
    const [totalProductosCount, setTotalProductosCount] = useState(0); 
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargando, setCargando] = useState(false);
    const totalPaginasSeguras = Math.max(Number(totalPaginas) || 1, 1);
    
    // Estados para Modales
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({
        title: '', handle: '', vendor: '', product_type: '',
        image_src: '', image_principal: '', variants: [] 
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

    // --- LÓGICA DE SUGERENCIAS ---
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

    // --- CARGA DE DATOS ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=20`);
            if (res.data.productos) {
                setProductos(res.data.productos);
                setTotalPaginas(res.data.paginasTotales || 1);
                setTotalProductosCount(res.data.totalProductos || res.data.productos.length);
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
        cargarDatosExtra('usuarios');
        cargarDatosExtra('ventas');
    }, [pagina]);

    // --- MANEJO DE PRODUCTOS ---
    const abrirModalCrear = () => {
        setEditandoId(null);
        setFormData({ title: '', vendor: '', product_type: '', image_src: '', image_principal: '', variants: [] });
        setModalAbierto(true);
    };

    const abrirModalEditar = (prod) => {
        setEditandoId(prod._id);
        setFormData({
            title: prod.title || '', handle: prod.handle || '', vendor: prod.vendor || '',
            product_type: prod.product_type || '', image_principal: prod.image_principal || '',
            image_src: prod.image_src || '', variants: prod.variants || [] 
        });
        setModalAbierto(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const handleAuto = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const datosAEnviar = { ...formData, handle: handleAuto };

            if (editandoId) await axios.put(`${baseURL}/productos/${editandoId}`, datosAEnviar, config);
            else await axios.post(`${baseURL}/productos`, datosAEnviar, config);
            
            setModalAbierto(false);
            cargarProductos();
        } catch (error) { alert("Error al guardar."); }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Eliminar este producto?")) return;
        try {
            await axios.delete(`${baseURL}/productos/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            cargarProductos();
        } catch (error) { alert("Error al eliminar."); }
    };

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
            <datalist id="list-categorias">{sugerencias.categorias.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="list-colores">{sugerencias.colores.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="list-tallas">{sugerencias.tallas.map(s => <option key={s} value={s} />)}</datalist>

            <header className="admin-header">
                <div className="admin-brand-section">
                    <h1 className="brand-logo">MAKIA</h1>
                    <span className="brand-subtitle">Panel de Administración</span>
                </div>
                
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
                        <span className="user-name">{user?.nombre || 'Administrador'}</span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
                </div>
            </header>

            <main className="admin-main">
                <section className="admin-stats">
                    <div className={`admin-stat-card ${vistaActiva === 'productos' ? 'active-prod' : ''}`} onClick={() => setVistaActiva('productos')}>
                        <div className="stat-info">
                            <h3>Productos</h3>
                            <p>Inventario Actual</p>
                        </div>
                        <span className="stat-count">{totalProductosCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'ventas' ? 'active-ventas' : ''}`} onClick={() => { setVistaActiva('ventas'); cargarDatosExtra('ventas'); }}>
                        <div className="stat-info">
                            <h3>Ventas</h3>
                            <p>Historial</p>
                        </div>
                        <span className="stat-count">{listaVentas.length}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'usuarios' ? 'active-user' : ''}`} onClick={() => { setVistaActiva('usuarios'); cargarDatosExtra('usuarios'); }}>
                        <div className="stat-info">
                            <h3>Usuarios</h3>
                            <p>Base de Datos</p>
                        </div>
                        <span className="stat-count">{listaUsuarios.length}</span>
                    </div>
                </section>

                <section className="admin-actions">
                    <div className="admin-section-header">
                        <h2>Gestión de {vistaActiva.toUpperCase()}</h2>
                        {vistaActiva === 'productos' && (
                            <button className="admin-add-btn" onClick={abrirModalCrear}>
                                + Nuevo Producto
                            </button>
                        )}
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                {vistaActiva === 'productos' && <tr><th>Imagen</th><th>Título</th><th>Tipo</th><th>Acciones</th></tr>}
                                {vistaActiva === 'usuarios' && <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr>}
                                {vistaActiva === 'ventas' && <tr><th>Orden</th><th>Cliente</th><th>Total</th><th>Fecha</th></tr>}
                            </thead>
                            <tbody>
                                {vistaActiva === 'productos' && productos.map(p => (
                                    <tr key={p._id}>
                                        <td><img src={getPrimaryImage(p)} alt="prod" className="table-thumb" /></td>
                                        <td>{p.title}</td>
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
                                {vistaActiva === 'ventas' && listaVentas.map(v => (
                                    <tr key={v._id}>
                                        <td><strong>{v.numeroOrden}</strong></td>
                                        <td>{v.nombreCliente}</td>
                                        <td>${v.total} MXN</td>
                                        <td>{new Date(v.fechaPedido).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {vistaActiva === 'productos' && <PaginationControls page={pagina} totalPages={totalPaginasSeguras} onPageChange={setPagina} className="admin-pagination-theme" />}
                </section>
            </main>

            {/* --- MODAL PRODUCTOS --- */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <h2>{editandoId ? 'Editar Producto' : 'Crear Producto'}</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="field-group">
                                <label>Título del Producto</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>

                            <div className="field-group">
                                <label>Categoría / Tipo (Sugerencias disponibles)</label>
                                <input type="text" list="list-categorias" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} />
                            </div>

                            <div className="form-image-section">
                                <div className="field-group">
                                    <label>URL Imagen Principal</label>
                                    <input type="text" value={formData.image_principal} onChange={e => setFormData({...formData, image_principal: e.target.value})} />
                                </div>
                                {formData.image_principal && (
                                    <div className="preview-container">
                                        <p>Previsualización:</p>
                                        <img src={formData.image_principal} alt="Preview" className="image-preview-box" />
                                    </div>
                                )}
                            </div>

                            <div className="variants-section">
                                <h3>Variantes (Tallas, Colores e Inventario)</h3>
                                {formData.variants.map((v, i) => (
                                    <div key={i} className="variant-card">
                                        <div className="field-group">
                                            <label>Color</label>
                                            <div className="color-input-wrapper">
                                                <input type="text" list="list-colores" placeholder="Ej: Blue, Pink, Black" value={v.color} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].color = e.target.value; setFormData({...formData, variants: nv});
                                                }} />
                                                <div className="color-preview" style={{ backgroundColor: getColorHex(v.color) }}></div>
                                            </div>
                                        </div>
                                        <div className="inline-fields">
                                            <div className="field-group" style={{flex: 1}}>
                                                <label>Talla</label>
                                                <input type="text" list="list-tallas" value={v.size} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].size = e.target.value; setFormData({...formData, variants: nv});
                                                }} />
                                            </div>
                                            <div className="field-group" style={{flex: 1}}>
                                                <label>Precio ($)</label>
                                                <input type="number" value={v.price} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].price = Number(e.target.value); setFormData({...formData, variants: nv});
                                                }} />
                                            </div>
                                            <div className="field-group" style={{flex: 1}}>
                                                <label>Cantidad Inventario</label>
                                                <input type="number" value={v.inventory_quantity || 0} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv});
                                                }} />
                                            </div>
                                            <button type="button" className="btn-remove" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, idx) => idx !== i)})}>✕</button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="btn-add-variant" onClick={() => setFormData({...formData, variants: [...formData.variants, {size:'', color:'', price:0, inventory_quantity: 0}]})}>+ Añadir Variante</button>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setModalAbierto(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;