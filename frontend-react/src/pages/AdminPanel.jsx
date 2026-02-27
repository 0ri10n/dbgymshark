import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

// --- FUNCIONES DE UTILIDAD (MAKIA) ---
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
    // Intenta obtener la primera imagen de una lista separada por comas o de los campos estándar
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
    const [busqueda, setBusqueda] = useState(""); // Estado para el buscador
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

    // --- CARGA DE DATOS ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            // Paginado de 10 productos por página con búsqueda dinámica
            const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=10&search=${busqueda}`);
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
    }, [pagina, busqueda]); // Recarga al cambiar página o escribir en el buscador

    useEffect(() => {
        cargarDatosExtra('usuarios');
        cargarDatosExtra('ventas');
    }, []);

    // --- MANEJO DE PRODUCTOS ---
    const abrirModalCrear = () => {
        setEditandoId(null);
        setFormData({ title: '', vendor: '', product_type: '', image_src: '', image_principal: '', variants: [] });
        setModalAbierto(true);
    };

    const abrirModalEditar = (prod) => {
        setEditandoId(prod._id);
        setFormData(prod);
        setModalAbierto(true);
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const handleAuto = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const data = { ...formData, handle: handleAuto };

            if (editandoId) await axios.put(`${baseURL}/productos/${editandoId}`, data, config);
            else await axios.post(`${baseURL}/productos`, data, config);
            
            setModalAbierto(false);
            cargarProductos();
        } catch (error) { alert("Error al guardar producto."); }
    };

    // --- MANEJO DE USUARIOS (FIX) ---
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
            alert("Usuario actualizado.");
        } catch (error) { alert("Error al guardar usuario."); }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <div className="admin-brand-section">
                    <h1 className="brand-logo">MAKIA</h1>
                </div>
                
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
                        <span className="user-name">Admin: {user?.nombre || user?.name || 'Administrador'}</span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
                </div>
            </header>

            <hr className="header-divider" />

            <main className="admin-main">
                <div className="section-title-wrapper">
                    <h2 className="panel-subtitle">Panel de Administración</h2>
                </div>

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
                    <div className="admin-controls-row">
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Buscar productos..." 
                                value={busqueda} 
                                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }} 
                            />
                        </div>
                        {vistaActiva === 'productos' && (
                            <button className="admin-add-btn" onClick={abrirModalCrear}>
                                + Nuevo Producto
                            </button>
                        )}
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                {vistaActiva === 'productos' && <tr><th>Imagen</th><th className="th-title">Título</th><th>Tipo</th><th className="th-actions">Acciones</th></tr>}
                                {vistaActiva === 'usuarios' && <tr><th>Nombre</th><th>Email</th><th>Rol</th><th className="th-actions">Acciones</th></tr>}
                                {vistaActiva === 'ventas' && <tr><th>Orden</th><th>Cliente</th><th>Total</th><th className="th-actions">Fecha</th></tr>}
                            </thead>
                            <tbody>
                                {vistaActiva === 'productos' && productos.map(p => (
                                    <tr key={p._id}>
                                        <td><img src={getPrimaryImage(p)} alt="prod" className="table-thumb" /></td>
                                        <td className="td-title">{p.title}</td>
                                        <td>{p.product_type}</td>
                                        <td className="admin-row-actions">
                                            <button className="admin-edit-btn" onClick={() => abrirModalEditar(p)}>Editar</button>
                                            <button className="admin-delete-btn" onClick={() => {}}>Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                                {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                    <tr key={u._id}>
                                        <td>{u.nombre} {u.apellido}</td>
                                        <td>{u.email}</td>
                                        <td>{u.rol}</td>
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

                            <div className="form-image-section">
                                <label>URLs de Imágenes (Separadas por comas para múltiples)</label>
                                <textarea 
                                    className="admin-textarea"
                                    value={formData.image_principal} 
                                    onChange={e => setFormData({...formData, image_principal: e.target.value})}
                                    placeholder="https://cdn.url1.jpg, https://cdn.url2.jpg..."
                                />
                                {formData.image_principal && (
                                    <div className="preview-container centered">
                                        <img src={getPrimaryImage(formData)} alt="Preview" className="image-preview-box small-centered" />
                                    </div>
                                )}
                            </div>

                            <div className="variants-section">
                                <div className="variants-header">
                                    <h3>Variantes (Tallas, Colores e Inventario)</h3>
                                    <button type="button" className="btn-add-variant" onClick={() => setFormData({...formData, variants: [...formData.variants, {size:'', color:'', price:0, inventory_quantity: 0}]})}>+ Añadir</button>
                                </div>
                                {formData.variants.map((v, i) => (
                                    <div key={i} className="variant-card clean-layout">
                                        <div className="inline-fields">
                                            <div className="field-group flex-2">
                                                <label>Color</label>
                                                <input type="text" value={v.color} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].color = e.target.value; setFormData({...formData, variants: nv});
                                                }} />
                                            </div>
                                            <div className="field-group flex-1">
                                                <label>Talla</label>
                                                <input type="text" value={v.size} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].size = e.target.value; setFormData({...formData, variants: nv});
                                                }} />
                                            </div>
                                            <div className="field-group flex-1">
                                                <label>Precio</label>
                                                <input type="number" value={v.price} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].price = Number(e.target.value); setFormData({...formData, variants: nv});
                                                }} />
                                            </div>
                                            <div className="field-group flex-1">
                                                <label>Stock</label>
                                                <input type="number" value={v.inventory_quantity} onChange={e => {
                                                    const nv = [...formData.variants]; nv[i].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv});
                                                }} />
                                            </div>
                                            <button type="button" className="btn-remove-fixed" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, idx) => idx !== i)})}>✕</button>
                                        </div>
                                    </div>
                                ))}
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