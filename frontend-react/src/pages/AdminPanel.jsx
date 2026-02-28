import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [vistaActiva, setVistaActiva] = useState('productos');
    const itemsPorPagina = 10;

    const [busquedaProd, setBusquedaProd] = useState("");
    const [busquedaUsr, setBusquedaUsr] = useState("");
    const [busquedaVen, setBusquedaVen] = useState("");

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

    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({ 
        title: '', product_type: '', vendor: 'Gymshark', 
        sku: '', price: 0, variants: [] 
    });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    const getAuthHeaders = () => ({ 
        'x-auth-token': localStorage.getItem('token'), 
        'Cache-Control': 'no-cache' 
    });

    const formatFecha = (fechaRaw) => {
        if (!fechaRaw) return "Pendiente";
        const d = fechaRaw.$date ? new Date(fechaRaw.$date) : new Date(fechaRaw);
        return isNaN(d.getTime()) ? "Pendiente" : d.toLocaleDateString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const cargarProductos = async () => {
        try {
            const res = await axios.get(`${baseURL}/productos?page=${pagProductos}&limit=${itemsPorPagina}&search=${busquedaProd}`, { headers: getAuthHeaders() });
            setProductos(res.data.productos || []);
            setTotalPagProductos(res.data.pagination?.pages || 1);
            setTotalProductosCount(res.data.pagination?.total || 0);
        } catch (e) { console.error(e); }
    };

    const cargarUsuarios = async () => {
        try {
            const res = await axios.get(`${baseURL}/admin/panel/usuarios?page=${pagUsuarios}&limit=${itemsPorPagina}&search=${busquedaUsr}`, { headers: getAuthHeaders() });
            setListaUsuarios(res.data.usuarios || []);
            setTotalUsuariosCount(res.data.pagination?.total || 0);
            setTotalPagUsuarios(res.data.pagination?.pages || 1);
        } catch (e) { console.error(e); }
    };

    const cargarVentas = async () => {
        try {
            const res = await axios.get(`${baseURL}/admin/panel/ventas?page=${pagVentas}&limit=${itemsPorPagina}&search=${busquedaVen}`, { headers: getAuthHeaders() });
            setListaVentas(res.data.ventas || []);
            setTotalVentasCount(res.data.pagination?.total || 0);
            setTotalPagVentas(res.data.pagination?.pages || 1);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { cargarProductos(); }, [pagProductos, busquedaProd]);
    useEffect(() => { cargarUsuarios(); }, [pagUsuarios, busquedaUsr]);
    useEffect(() => { cargarVentas(); }, [pagVentas, busquedaVen]);

    const variantsByColor = useMemo(() => {
        const grouped = {};
        formData.variants.forEach((v, index) => {
            const key = v.color || "Sin Color";
            if (!grouped[key]) grouped[key] = { color: v.color, image: v.image || '', items: [] };
            grouped[key].items.push({ ...v, originalIndex: index });
        });
        return Object.values(grouped);
    }, [formData.variants]);

    const addEmptyColorGroup = () => {
        setFormData({ ...formData, variants: [...formData.variants, { color: '', size: '', price: formData.price || 0, sku: '', image: "" }] });
    };

    const addSizeToColor = (colorName, colorImage) => {
        setFormData({ ...formData, variants: [...formData.variants, { color: colorName, size: '', price: formData.price || 0, sku: '', image: colorImage }] });
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, handle: formData.title.toLowerCase().replace(/ /g, '-') };
            if (editandoId) await axios.put(`${baseURL}/productos/${editandoId}`, payload, { headers: getAuthHeaders() });
            else await axios.post(`${baseURL}/productos`, payload, { headers: getAuthHeaders() });
            setModalAbierto(false); cargarProductos();
        } catch (e) { alert("Error al guardar"); }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <img src="/logo-makia-pages.png" alt="Logo" className="brand-logo-img" />
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">Nos alegra verte de nuevo!</span>
                        <span className="user-name-blue-header">{user?.nombre || 'Administrador'}</span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
                </div>
            </header>

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
                            onChange={(e) => {
                                const val = e.target.value;
                                if(vistaActiva === 'productos') setBusquedaProd(val);
                                else if(vistaActiva === 'usuarios') setBusquedaUsr(val);
                                else setBusquedaVen(val);
                            }} />
                    </div>
                    {vistaActiva === 'productos' && <button className="admin-add-btn" onClick={() => { setEditandoId(null); setFormData({title:'', product_type:'', vendor:'Gymshark', sku:'', price:0, variants:[]}); setModalAbierto(true); }}>+ NUEVO PRODUCTO</button>}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table-fixed">
                        <thead>
                            {vistaActiva === 'productos' && <tr><th>Imagen</th><th>Título</th><th>Tipo</th><th className="center">Acciones</th></tr>}
                            {vistaActiva === 'usuarios' && <tr><th>Nombre</th><th>Email</th><th>Rol</th><th className="center">Acciones</th></tr>}
                            {vistaActiva === 'ventas' && <tr><th>Orden</th><th>Cliente</th><th>Fecha</th><th>Total</th><th className="center">Estado</th></tr>}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => (
                                <tr key={p._id}>
                                    <td className="center"><img src={p.variants?.[0]?.image || p.image_principal} className="table-thumb" alt="p" /></td>
                                    <td>{p.title}</td><td>{p.product_type}</td>
                                    <td className="center">
                                        <button className="btn-table btn-edit" onClick={() => { setEditandoId(p._id); setFormData({...p}); setModalAbierto(true); }}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => { if(window.confirm("¿Eliminar?")) axios.delete(`${baseURL}/productos/${p._id}`, {headers:getAuthHeaders()}).then(cargarProductos) }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td>{u.nombre} {u.apellido}</td><td>{u.email}</td><td className="center"><span className="role-badge">{u.rol}</span></td>
                                    <td className="center">
                                        <button className="btn-table btn-edit">Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => { if(window.confirm("¿Eliminar?")) axios.delete(`${baseURL}/admin/panel/usuarios/${u._id}`, {headers:getAuthHeaders()}).then(cargarUsuarios) }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'ventas' && listaVentas.map(v => (
                                <tr key={v._id}>
                                    <td>#{v.numeroOrden || v._id.substring(0,8)}</td><td>{v.usuario?.nombre || 'Anónimo'}</td>
                                    <td>{formatFecha(v.fecha || v.createdAt)}</td><td>${v.total?.toFixed(2)}</td>
                                    <td className="center"><span className="role-badge">{v.estado || 'Pagado'}</span></td>
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
                                <div className="field-group"><label>SKU Base</label><input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
                                <div className="field-group"><label>Precio Base</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} /></div>
                            </div>
                            <div className="variants-section">
                                <div className="section-header-variants">
                                    <h3>Variantes</h3>
                                    <button type="button" className="btn-makia-save" onClick={addEmptyColorGroup}>+ Color</button>
                                </div>
                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group color-input-fixed"><label>Color</label><input type="text" value={group.color} onChange={e => { const nv = formData.variants.map(v => v.color === group.color ? {...v, color: e.target.value} : v); setFormData({...formData, variants: nv}); }} /></div>
                                            <div className="field-group url-input-expanded"><label>URL Imagen</label><input type="text" value={group.image} onChange={e => { const nv = formData.variants.map(v => v.color === group.color ? {...v, image: e.target.value} : v); setFormData({...formData, variants: nv}); }} /></div>
                                            <div className="mini-preview-box">{group.image ? <img src={group.image} alt="p" /> : <span className="preview-placeholder">URL</span>}</div>
                                        </div>
                                        {group.items.map(item => (
                                            <div key={item.originalIndex} className="size-row-container">
                                                <div className="size-row-inputs">
                                                    <div className="field-group"><label>Talla</label><input type="text" value={item.size} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].size = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Precio</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group sku-field"><label>SKU Variante</label><input type="text" value={item.sku} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].sku = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                </div>
                                                <button type="button" className="btn-x-red" onClick={() => { const nv = formData.variants.filter((_, i) => i !== item.originalIndex); setFormData({...formData, variants: nv}); }}>✕</button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn-add-size" onClick={() => addSizeToColor(group.color, group.image)}>+ Talla</button>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer"><button type="button" className="btn-makia-cancel" onClick={() => setModalAbierto(false)}>Cancelar</button><button type="submit" className="btn-makia-save">Guardar Cambios</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;