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
    const [formDataUsuario, setFormDataUsuario] = useState({ 
        nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: '' 
    });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-mb5q.onrender.com/api';

    // --- CARGA DE DATOS TOTALES (INVENTARIO ABSOLUTO) ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            // Paginado real que consulta a la DB
            const res = await axios.get(`${baseURL}/productos?page=${pagina}&limit=10&search=${busqueda}`);
            if (res.data.productos) {
                setProductos(res.data.productos);
                setTotalPaginas(res.data.paginasTotales || 1);
                // Contador dinámico basado en la suma total de elementos en la DB
                setTotalProductosCount(res.data.totalCount || res.data.totalProductos || 0); 
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

    // --- SUGERENCIAS DINÁMICAS (DATALISTS DESDE DB) ---
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
        return { cats: [...cats], colors: [...colors], sizes: [...sizes] };
    }, [productos]);

    // --- LÓGICA DE VARIANTES (AGRUPACIÓN POR COLOR) ---
    const variantsByColor = useMemo(() => {
        const grouped = {};
        formData.variants.forEach((v, index) => {
            const colorKey = v.color || "Nuevo Color";
            if (!grouped[colorKey]) grouped[colorKey] = { color: v.color, image: v.image || '', items: [] };
            grouped[colorKey].items.push({ ...v, originalIndex: index });
        });
        return Object.values(grouped);
    }, [formData.variants]);

    const addSizeToColor = (colorName) => {
        const existingVariant = formData.variants.find(v => v.color === colorName);
        const newSize = { 
            color: colorName, size: '', price: existingVariant?.price || 0, 
            inventory_quantity: 0, image: existingVariant?.image || "" 
        };
        setFormData({ ...formData, variants: [...formData.variants, newSize] });
    };

    const addEmptyColorGroup = () => {
        setFormData({ ...formData, variants: [...formData.variants, { color: '', size: '', price: 0, inventory_quantity: 0, image: "" }] });
    };

    // --- ACCIONES DE FORMULARIO ---
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
        } catch (error) { alert("Error al guardar"); }
    };

    const abrirModalEditarUsuario = (u) => {
        setEditandoUsuarioId(u._id);
        setFormDataUsuario({
            nombre: u.nombre || '', 
            apellido: u.apellido || '', 
            email: u.email || '',
            rol: u.rol || 'cliente', 
            direccion: u.direccion || ''
        });
        setModalUsuarioAbierto(true);
    };

    const handleActualizarUsuario = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${baseURL}/admin/panel/usuarios/${editandoUsuarioId}`, formDataUsuario, config);
            setModalUsuarioAbierto(false);
            cargarDatosExtra('usuarios');
            alert("Usuario actualizado");
        } catch (error) { alert("Error al actualizar"); }
    };

    return (
        <div className="admin-container">
            {/* Listas Dinámicas para Selección */}
            <datalist id="cats">{sugerencias.cats.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="colors">{sugerencias.colors.map(c => <option key={c} value={c} />)}</datalist>
            <datalist id="sizes">{sugerencias.sizes.map(s => <option key={s} value={s} />)}</datalist>

            <header className="admin-header">
                <h1 className="brand-logo">MAKIA</h1>
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
                        <span className="user-name">Admin: <strong>{user?.nombre || 'Vania'}</strong></span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
                </div>
            </header>

            <hr className="header-divider" />
            <h2 className="panel-subtitle">Panel de Administración</h2>

            <main className="admin-main">
                {/* ESTADÍSTICAS GLOBALES */}
                <section className="admin-stats">
                    <div className={`admin-stat-card ${vistaActiva === 'productos' ? 'active-prod' : ''}`} onClick={() => setVistaActiva('productos')}>
                        <div className="stat-info"><h3>Productos</h3><p>Inventario Total</p></div>
                        <span className="stat-count">{totalProductosCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'ventas' ? 'active-ventas' : ''}`} onClick={() => setVistaActiva('ventas')}>
                        <div className="stat-info"><h3>Ventas</h3><p>Historial Total</p></div>
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
                            <span className="search-icon">🔍</span>
                            <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }} />
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
                                <tr><th className="center">Imagen</th><th className="col-title">Título</th><th className="center">Tipo</th><th className="center">Acciones</th></tr>
                            ) : vistaActiva === 'usuarios' ? (
                                <tr><th className="col-title">Nombre Completo</th><th className="center">Email</th><th className="center">Rol</th><th className="center">Acciones</th></tr>
                            ) : (
                                <tr><th className="center">Orden</th><th className="col-title">Cliente</th><th className="center">Dirección</th><th className="center">Total</th><th className="center">Fecha</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => (
                                <tr key={p._id}>
                                    <td className="center"><img src={p.variants?.[0]?.image || p.image_principal} className="table-thumb" alt="p" /></td>
                                    <td className="col-title">{p.title}</td>
                                    <td className="center">{p.product_type}</td>
                                    <td className="center">
                                        <div className="admin-row-actions">
                                            <button className="btn-table btn-edit" onClick={() => { setEditandoId(p._id); setFormData(p); setModalAbierto(true); }}>Editar</button>
                                            <button className="btn-table btn-delete">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td className="col-title">{u.nombre} {u.apellido}</td>
                                    <td className="center">{u.email}</td>
                                    <td className="center"><span className="role-badge">{u.rol}</span></td>
                                    <td className="center"><button className="btn-table btn-edit" onClick={() => abrirModalEditarUsuario(u)}>Editar</button></td>
                                </tr>
                            ))}
                            {vistaActiva === 'ventas' && listaVentas.map(v => (
                                <tr key={v._id}>
                                    <td className="center">{v.numeroOrden || v._id.slice(-6)}</td>
                                    <td className="col-title">{v.usuario?.nombre} {v.usuario?.apellido}</td>
                                    <td className="center">{v.usuario?.direccion || '---'}</td>
                                    <td className="center">${v.total}</td>
                                    <td className="center">{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '---'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Paginado Funcional */}
                {vistaActiva === 'productos' && <PaginationControls page={pagina} totalPages={totalPaginas} onPageChange={setPagina} className="admin-pagination-theme" />}
            </main>

            {/* MODAL PRODUCTO - BOTÓN DERECHA, PREVIEW Y CIRCULO DE COLOR */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-xl">
                        <h2>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="field-group"><label>Nombre del Producto</label><input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                            <div className="field-group"><label>Categoría</label><input type="text" list="cats" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} /></div>
                            
                            <div className="variants-section">
                                <div className="section-header-right">
                                    <h3>Variantes por Color</h3>
                                    {/* Botón a la derecha con espacio */}
                                    <button type="button" className="btn-makia-blue" onClick={addEmptyColorGroup}>+ Añadir Color</button>
                                </div>

                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group color-picker-wrapper">
                                                <label>Color</label>
                                                <div className="input-with-circle">
                                                    {/* Selector circular que se pinta y permite cambiar */}
                                                    <input type="color" className="color-circle-input" value={group.color.startsWith('#') ? group.color : '#ffffff'} onChange={(e) => {
                                                        const updated = formData.variants.map(v => v.color === group.color ? { ...v, color: e.target.value } : v);
                                                        setFormData({ ...formData, variants: updated });
                                                    }} />
                                                    <input type="text" list="colors" value={group.color} onChange={(e) => {
                                                        const updated = formData.variants.map(v => v.color === group.color ? { ...v, color: e.target.value } : v);
                                                        setFormData({ ...formData, variants: updated });
                                                    }} />
                                                </div>
                                            </div>
                                            <div className="field-group flex-2">
                                                <label>URL Foto del Color</label>
                                                <input type="text" value={group.image} onChange={(e) => {
                                                    const updated = formData.variants.map(v => v.color === group.color ? { ...v, image: e.target.value } : v);
                                                    setFormData({ ...formData, variants: updated });
                                                }} />
                                            </div>
                                        </div>
                                        {/* Previsualización imagen pequeña abajo de la URL */}
                                        {group.image && (
                                            <div className="preview-centered">
                                                <img src={group.image} className="mini-preview-form" alt="preview" />
                                            </div>
                                        )}
                                        <div className="sizes-grid">
                                            {group.items.map((item) => (
                                                <div key={item.originalIndex} className="size-row">
                                                    <div className="field-group"><label>Talla</label><input type="text" list="sizes" value={item.size} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].size = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Precio</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Stock</label><input type="number" value={item.inventory_quantity} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    {/* Botón Tache (X) para eliminar talla */}
                                                    <button type="button" className="btn-x" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== item.originalIndex)})}>✕</button>
                                                </div>
                                            ))}
                                            <button type="button" className="btn-add-size" onClick={() => addSizeToColor(group.color)}>+ Añadir Talla</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Botones de acción alineados a la derecha */}
                            <div className="modal-footer">
                                <button type="button" className="btn-makia-cancel" onClick={() => setModalAbierto(false)}>Cancelar</button>
                                <button type="submit" className="btn-makia-save">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL USUARIOS - NOMBRE Y APELLIDO */}
            {modalUsuarioAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Editar Usuario</h2>
                        <form onSubmit={handleActualizarUsuario} className="admin-form-vertical">
                            <div className="field-group"><label>Nombre</label><input type="text" value={formDataUsuario.nombre} onChange={e => setFormDataUsuario({...formDataUsuario, nombre: e.target.value})} /></div>
                            <div className="field-group"><label>Apellido</label><input type="text" value={formDataUsuario.apellido} onChange={e => setFormDataUsuario({...formDataUsuario, apellido: e.target.value})} /></div>
                            <div className="field-group"><label>Email</label><input type="email" value={formDataUsuario.email} onChange={e => setFormDataUsuario({...formDataUsuario, email: e.target.value})} /></div>
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