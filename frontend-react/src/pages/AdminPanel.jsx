import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    
    // --- ESTADOS DE DATOS ---
    const [productos, setProductos] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalProductosCount, setTotalProductosCount] = useState(0); 
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(false);

    const [vistaActiva, setVistaActiva] = useState('productos');
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [listaVentas, setListaVentas] = useState([]);

    // --- ESTADOS DE MODALES ---
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({ title: '', product_type: '', vendor: '', variants: [] });

    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
    const [formDataUsuario, setFormDataUsuario] = useState({ nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: '' });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-mb5q.onrender.com/api';

    // --- CARGA DE DATOS DESDE LA DB ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=10&search=${busqueda}`);
            if (res.data.productos) {
                setProductos(res.data.productos);
                setTotalPaginas(res.data.paginasTotales || 1);
                // Contador dinámico basado en la respuesta total de la API
                setTotalProductosCount(res.data.totalCount || res.data.totalProductos || res.data.productos.length); 
            }
        } catch (error) { console.error("Error al cargar productos:", error); }
        finally { setCargando(false); }
    };

    const cargarDatosExtra = async (vista) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${baseURL}/admin/panel/${vista}`, config);
            if (vista === 'usuarios') setListaUsuarios(res.data);
            if (vista === 'ventas') setListaVentas(res.data);
        } catch (error) { console.error(`Error en ${vista}:`, error); }
    };

    useEffect(() => { cargarProductos(); }, [pagina, busqueda]);
    useEffect(() => { 
        if (vistaActiva === 'usuarios') cargarDatosExtra('usuarios');
        if (vistaActiva === 'ventas') cargarDatosExtra('ventas');
    }, [vistaActiva]);

    // --- LÓGICA DE VARIANTES AGRUPADAS POR COLOR ---
    // Permite manejar múltiples tallas bajo un mismo encabezado de color e imagen
    const variantsByColor = useMemo(() => {
        const grouped = {};
        formData.variants.forEach((v, index) => {
            const colorKey = v.color || "Sin Color";
            if (!grouped[colorKey]) grouped[colorKey] = { color: v.color, image: v.image || '', items: [] };
            grouped[colorKey].items.push({ ...v, originalIndex: index });
        });
        return Object.values(grouped);
    }, [formData.variants]);

    const addSizeToColor = (colorName) => {
        const existingVariant = formData.variants.find(v => v.color === colorName);
        const newSize = { 
            color: colorName, 
            size: '', 
            price: existingVariant?.price || 0, 
            inventory_quantity: 0, 
            image: existingVariant?.image || "" 
        };
        setFormData({ ...formData, variants: [...formData.variants, newSize] });
    };

    const addEmptyColorGroup = () => {
        setFormData({ ...formData, variants: [...formData.variants, { color: '', size: '', price: 0, inventory_quantity: 0, image: "" }] });
    };

    // --- ACCIONES DE PRODUCTOS ---
    const abrirModalEditar = (prod) => {
        setEditandoId(prod._id);
        setFormData({ ...prod });
        setModalAbierto(true);
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
            alert("Guardado con éxito");
        } catch (error) { alert("Error al guardar cambios"); }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Eliminar este producto permanentemente?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}/productos/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            cargarProductos();
        } catch (error) { alert("Error al eliminar"); }
    };

    // --- ACCIONES DE USUARIOS ---
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
            const data = { ...formDataUsuario };
            if (!data.password) delete data.password;

            if (editandoUsuarioId) await axios.put(`${baseURL}/admin/panel/usuarios/${editandoUsuarioId}`, data, config);
            else await axios.post(`${baseURL}/admin/panel/usuarios`, data, config);
            
            setModalUsuarioAbierto(false);
            cargarDatosExtra('usuarios');
        } catch (error) { alert("Error al actualizar usuario"); }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1 className="brand-logo">MAKIA</h1>
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
                        {/* Nombre dinámico del administrador logueado */}
                        <span className="user-name">Admin: <strong>{user?.nombre || user?.name || 'Administrador'}</strong></span>
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
                    {vistaActiva === 'productos' ? (
                        <div className="search-bar-makia">
                            {/* Lupa minimalista */}
                            <span className="search-icon">🔍</span>
                            <input type="text" placeholder="Busca nombre o tipo de prenda..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }} />
                        </div>
                    ) : <div />}
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
                                <tr><th>Imagen</th><th className="col-title">Título</th><th>Tipo</th><th className="center">Acciones</th></tr>
                            ) : (
                                <tr><th className="col-title">Nombre</th><th>Email</th><th>Rol</th><th className="center">Acciones</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => (
                                <tr key={p._id}>
                                    <td className="col-img"><img src={p.variants?.[0]?.image || p.image_principal} className="table-thumb" alt="p" /></td>
                                    <td className="col-title">{p.title}</td>
                                    <td>{p.product_type}</td>
                                    <td className="col-actions">
                                        <button className="btn-table btn-edit" onClick={() => abrirModalEditar(p)}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => handleEliminar(p._id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td className="col-title">{u.nombre} {u.apellido}</td>
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

            {/* MODAL PRODUCTO - AGRUPADO POR COLOR */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-xl">
                        <h2>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="field-group">
                                <label>Nombre del Producto</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            
                            <div className="variants-section">
                                <div className="section-header">
                                    <h3>Variantes por Color</h3>
                                    <button type="button" className="btn-makia-save" onClick={addEmptyColorGroup}>+ Añadir Color</button>
                                </div>
                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group flex-1">
                                                <label>Color</label>
                                                <input type="text" value={group.color} onChange={(e) => {
                                                    const updated = formData.variants.map(v => v.color === group.color ? { ...v, color: e.target.value } : v);
                                                    setFormData({ ...formData, variants: updated });
                                                }} />
                                            </div>
                                            <div className="field-group flex-2">
                                                <label>URL Foto del Color</label>
                                                <input type="text" value={group.image} onChange={(e) => {
                                                    const updated = formData.variants.map(v => v.color === group.color ? { ...v, image: e.target.value } : v);
                                                    setFormData({ ...formData, variants: updated });
                                                }} />
                                            </div>
                                        </div>
                                        <div className="sizes-grid">
                                            {group.items.map((item) => (
                                                <div key={item.originalIndex} className="size-row">
                                                    <div className="field-group"><label>Talla</label><input type="text" value={item.size} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].size = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Precio</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Stock</label><input type="number" value={item.inventory_quantity} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <button type="button" className="btn-x" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== item.originalIndex)})}>✕</button>
                                                </div>
                                            ))}
                                            {/* Botón para añadir otra talla al mismo color */}
                                            <button type="button" className="btn-add-size" onClick={() => addSizeToColor(group.color)}>+ Añadir otra talla en este color</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-makia-cancel" onClick={() => setModalAbierto(false)}>Cancelar</button>
                                <button type="submit" className="btn-makia-save">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL USUARIOS */}
            {modalUsuarioAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Editar Usuario</h2>
                        <form onSubmit={handleGuardarUsuario} className="admin-form-vertical">
                            <div className="field-group"><label>Nombre</label><input type="text" value={formDataUsuario.nombre} onChange={e => setFormDataUsuario({...formDataUsuario, nombre: e.target.value})} /></div>
                            <div className="field-group"><label>Email</label><input type="email" value={formDataUsuario.email} onChange={e => setFormDataUsuario({...formDataUsuario, email: e.target.value})} /></div>
                            <div className="field-group">
                                <label>Rol</label>
                                <select value={formDataUsuario.rol} onChange={e => setFormDataUsuario({...formDataUsuario, rol: e.target.value})}>
                                    <option value="cliente">Cliente</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-makia-cancel" onClick={() => setModalUsuarioAbierto(false)}>Cerrar</button>
                                <button type="submit" className="btn-makia-save">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;