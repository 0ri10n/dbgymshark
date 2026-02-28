import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    
    // --- ESTADOS DE VISTA Y CARGA ---
    const [vistaActiva, setVistaActiva] = useState('productos');
    const [cargando, setCargando] = useState(false);

    const itemsPorPagina = 10;

    // --- ESTADOS DE BÚSQUEDA INDEPENDIENTES ---
    const [busquedaProd, setBusquedaProd] = useState("");
    const [busquedaUsr, setBusquedaUsr] = useState("");
    const [busquedaVen, setBusquedaVen] = useState("");

    // --- ESTADOS DE DATOS Y PAGINACIÓN ---
    const [productos, setProductos] = useState([]);
    const [pagProductos, setPagProductos] = useState(1);
    const [totalPagProductos, setTotalPagProductos] = useState(1);
    const [totalProductosCount, setTotalProductosCount] = useState(0); 

    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [pagUsuarios, setPagUsuarios] = useState(1);
    const [totalPagUsuarios, setTotalPagUsuarios] = useState(1);
    const [totalUsuariosCount, setTotalUsuariosCount] = useState(0);

    const [listaVentas, setListaVentas] = useState([]);
    const [pagVentas, setPagVentas] = useState(1);
    const [totalPagVentas, setTotalPagVentas] = useState(1);
    const [totalVentasCount, setTotalVentasCount] = useState(0);

    // --- ESTADOS DE MODALES ---
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({ title: '', product_type: '', vendor: '', variants: [] });

    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
    const [formDataUsuario, setFormDataUsuario] = useState({ nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: '' });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || '';
        return {
            'x-auth-token': token,
            'Authorization': `Bearer ${token}`
        };
    };

    // --- CARGA DE DATOS ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            const config = { headers: getAuthHeaders() };
            const res = await axios.get(`${baseURL}/productos?page=${pagProductos}&limit=${itemsPorPagina}&search=${busquedaProd}`, config);
            if (res.data) {
                const dataArr = res.data.productos || res.data || [];
                setProductos(Array.isArray(dataArr) ? dataArr : []);
                setTotalPagProductos(res.data.pagination?.pages || 1);
                setTotalProductosCount(res.data.pagination?.total || 0); 
            }
        } catch (error) { console.error("Error productos:", error); }
        finally { setCargando(false); }
    };

    const cargarDatosExtra = async (vista) => {
        const paginaActual = vista === 'usuarios' ? pagUsuarios : pagVentas;
        const busquedaActual = vista === 'usuarios' ? busquedaUsr : busquedaVen;
        try {
            const config = { headers: getAuthHeaders() }; 
            const res = await axios.get(`${baseURL}/admin/panel/${vista}?page=${paginaActual}&limit=${itemsPorPagina}&search=${busquedaActual}`, config);
            if (vista === 'usuarios') {
                const arr = res.data.usuarios || res.data || [];
                setListaUsuarios(arr);
                setTotalPagUsuarios(res.data.pagination?.pages || 1);
                setTotalUsuariosCount(res.data.pagination?.total || 0);
            }
            if (vista === 'ventas') {
                const arr = res.data.ventas || res.data || [];
                setListaVentas(arr);
                setTotalPagVentas(res.data.pagination?.pages || 1);
                setTotalVentasCount(res.data.pagination?.total || 0);
            }
        } catch (error) { console.error(`Error en ${vista}:`, error); }
    };

    useEffect(() => { cargarProductos(); }, [pagProductos, busquedaProd]);
    useEffect(() => { cargarDatosExtra('usuarios'); }, [pagUsuarios, busquedaUsr]);
    useEffect(() => { cargarDatosExtra('ventas'); }, [pagVentas, busquedaVen]);

    const formatFecha = (fechaRaw) => {
        if (!fechaRaw) return "N/A";
        const d = fechaRaw.$date ? new Date(fechaRaw.$date) : new Date(fechaRaw);
        return isNaN(d.getTime()) ? "Fecha Inválida" : d.toLocaleDateString();
    };

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
            color: colorName, size: '', price: existingVariant?.price || 0, 
            inventory_quantity: 0, sku: '', image: existingVariant?.image || "" 
        };
        setFormData({ ...formData, variants: [...formData.variants, newSize] });
    };

    const addEmptyColorGroup = () => {
        setFormData({ ...formData, variants: [...formData.variants, { color: '', size: '', price: 0, inventory_quantity: 0, sku: '', image: "" }] });
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: getAuthHeaders() }; 
            if (editandoId) await axios.put(`${baseURL}/productos/${editandoId}`, formData, config);
            else await axios.post(`${baseURL}/productos`, formData, config);
            setModalAbierto(false);
            cargarProductos();
            alert("Guardado con éxito");
        } catch (error) { alert("Error: Cada variante debe tener un SKU válido."); }
    };

    const handleGuardarUsuario = async (e) => {
        e.preventDefault();
        try {
            const { nombre, apellido, email, rol, direccion } = formDataUsuario;
            await axios.put(`${baseURL}/admin/panel/usuarios/${editandoUsuarioId}`, { nombre, apellido, email, rol, direccion }, { headers: getAuthHeaders() });
            setModalUsuarioAbierto(false);
            cargarDatosExtra('usuarios'); 
            alert("Usuario actualizado");
        } catch (error) { alert("Error al actualizar usuario"); }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Eliminar este registro?")) return;
        try {
            const config = { headers: getAuthHeaders() };
            const endpoint = vistaActiva === 'productos' ? `productos/${id}` : `admin/panel/usuarios/${id}`;
            await axios.delete(`${baseURL}/${endpoint}`, config);
            vistaActiva === 'productos' ? cargarProductos() : cargarDatosExtra('usuarios');
        } catch (error) { alert("Error al eliminar"); }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <img src="/logo-makia-pages.png" alt="Logo" className="brand-logo-img" />
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="user-name-blue-header">{user?.nombre || 'Administrador'}</span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
                </div>
            </header>
            <div className="header-divider-sutil"></div>

            <main className="admin-main">
                <section className="admin-stats">
                    <div className={`admin-stat-card ${vistaActiva === 'productos' ? 'active-prod' : ''}`} onClick={() => setVistaActiva('productos')}>
                        <h3>Productos</h3><span className="stat-count">{totalProductosCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'ventas' ? 'active-ventas' : ''}`} onClick={() => setVistaActiva('ventas')}>
                        <h3>Ventas</h3><span className="stat-count">{totalVentasCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'usuarios' ? 'active-user' : ''}`} onClick={() => setVistaActiva('usuarios')}>
                        <h3>Usuarios</h3><span className="stat-count">{totalUsuariosCount}</span>
                    </div>
                </section>

                <div className="admin-controls-row">
                    <div className="search-bar-makia">
                        <i className="fas fa-search"></i>
                        <input type="text" placeholder="Buscar..." value={vistaActiva === 'productos' ? busquedaProd : vistaActiva === 'usuarios' ? busquedaUsr : busquedaVen} 
                            onChange={(e) => vistaActiva === 'productos' ? setBusquedaProd(e.target.value) : vistaActiva === 'usuarios' ? setBusquedaUsr(e.target.value) : setBusquedaVen(e.target.value)} />
                    </div>
                    {vistaActiva === 'productos' && (
                        <button className="admin-add-btn" onClick={() => { setEditandoId(null); setFormData({title:'', product_type:'', vendor:'Gymshark', sku:'', price:0, inventory_quantity:0, variants:[]}); setModalAbierto(true); }}>
                            + Nuevo Producto
                        </button>
                    )}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table-fixed">
                        <thead>
                            {vistaActiva === 'productos' && <tr><th>Imagen</th><th className="col-title">Título</th><th>Categoría</th><th className="center">Acciones</th></tr>}
                            {vistaActiva === 'usuarios' && <tr><th>Nombre</th><th>Email</th><th>Rol</th><th className="center">Acciones</th></tr>}
                            {vistaActiva === 'ventas' && <tr><th>Número de Orden</th><th>Cliente</th><th>Fecha</th><th>Total</th><th className="center">Estado</th></tr>}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => (
                                <tr key={p._id}>
                                    <td className="center"><img src={p.variants?.[0]?.image || p.image_principal} className="table-thumb" alt="p" /></td>
                                    <td>{p.title}</td><td>{p.product_type}</td>
                                    <td className="col-actions center">
                                        <button className="btn-table btn-edit" onClick={() => { setEditandoId(p._id); setFormData({...p}); setModalAbierto(true); }}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => handleEliminar(p._id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td>{u.nombre} {u.apellido}</td><td>{u.email}</td><td><span className="role-badge">{u.rol}</span></td>
                                    <td className="col-actions center">
                                        <button className="btn-table btn-edit" onClick={() => { setEditandoUsuarioId(u._id); setFormDataUsuario({...u}); setModalUsuarioAbierto(true); }}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => handleEliminar(u._id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'ventas' && listaVentas.map(v => (
                                <tr key={v._id}>
                                    <td className="center">#{v.numeroOrden || v.order_number || v._id.substring(0,8)}</td>
                                    <td className="center">{v.usuario?.nombre ? `${v.usuario.nombre} ${v.usuario.apellido || ''}` : 'Anon'}</td>
                                    <td className="center">{formatFecha(v.fecha)}</td>
                                    <td className="center">${v.total?.toFixed(2)}</td><td className="center"><span className="role-badge">{v.estado || 'Pagado'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationControls page={vistaActiva === 'productos' ? pagProductos : vistaActiva === 'usuarios' ? pagUsuarios : pagVentas} totalPages={vistaActiva === 'productos' ? totalPagProductos : vistaActiva === 'usuarios' ? totalPagUsuarios : totalPagVentas} onPageChange={vistaActiva === 'productos' ? setPagProductos : vistaActiva === 'usuarios' ? setPagUsuarios : setPagVentas} />
            </main>

            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-xl">
                        <h2>{editandoId ? 'Editar' : 'Nuevo'} Producto</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="form-grid-2-cols">
                                <div className="field-group"><label>Título</label><input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                                <div className="field-group"><label>Categoría</label><input type="text" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} /></div>
                            </div>
                            <div className="variants-section">
                                <div className="section-header-variants"><h3>Variantes</h3><button type="button" className="btn-makia-save" onClick={addEmptyColorGroup}>+ Color</button></div>
                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group color-input-fixed"><label>Color</label><input type="text" value={group.color} onChange={e => setFormData({...formData, variants: formData.variants.map(v => v.color === group.color ? {...v, color: e.target.value} : v)})} /></div>
                                            <div className="field-group url-input-expanded"><label>URL Imagen Color</label><input type="text" value={group.image} onChange={e => setFormData({...formData, variants: formData.variants.map(v => v.color === group.color ? {...v, image: e.target.value} : v)})} /></div>
                                            <div className="mini-preview-container">{group.image ? <img src={group.image} alt="p" className="form-mini-preview" /> : <div className="form-mini-preview-placeholder">URL</div>}</div>
                                        </div>
                                        <div className="sizes-grid">
                                            {group.items.map(item => (
                                                <div key={item.originalIndex} className="size-row">
                                                    <div className="field-group"><label>Talla</label><input type="text" value={item.size} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].size = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Precio</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Stock</label><input type="number" value={item.inventory_quantity} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>SKU Variante</label><input type="text" value={item.sku || ""} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].sku = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    <button type="button" className="btn-x" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== item.originalIndex)})}>✕</button>
                                                </div>
                                            ))}
                                            <button type="button" className="btn-add-size" onClick={() => addSizeToColor(group.color)}>+ Talla</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer"><button type="button" className="btn-makia-cancel" onClick={() => setModalAbierto(false)}>Cancelar</button><button type="submit" className="btn-makia-save">Guardar Cambios</button></div>
                        </form>
                    </div>
                </div>
            )}

            {modalUsuarioAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{maxWidth:'500px'}}>
                        <h2>Editar Usuario</h2>
                        <form onSubmit={handleGuardarUsuario} className="admin-form-vertical">
                            <div className="field-group"><label>Nombre</label><input type="text" value={formDataUsuario.nombre} onChange={e => setFormDataUsuario({...formDataUsuario, nombre: e.target.value})} /></div>
                            <div className="field-group"><label>Apellido</label><input type="text" value={formDataUsuario.apellido} onChange={e => setFormDataUsuario({...formDataUsuario, apellido: e.target.value})} /></div>
                            <div className="field-group"><label>Email</label><input type="email" value={formDataUsuario.email} onChange={e => setFormDataUsuario({...formDataUsuario, email: e.target.value})} /></div>
                            <div className="field-group"><label>Dirección</label><input type="text" value={formDataUsuario.direccion} onChange={e => setFormDataUsuario({...formDataUsuario, direccion: e.target.value})} /></div>
                            <div className="field-group">
                                <label>Rol</label>
                                <select value={formDataUsuario.rol} onChange={e => setFormDataUsuario({...formDataUsuario, rol: e.target.value})}>
                                    <option value="cliente">Cliente</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn-makia-cancel" onClick={() => setModalUsuarioAbierto(false)}>Cerrar</button><button type="submit" className="btn-makia-save">Actualizar</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;