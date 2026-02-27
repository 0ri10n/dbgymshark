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
    // Productos
    const [productos, setProductos] = useState([]);
    const [pagProductos, setPagProductos] = useState(1);
    const [totalPagProductos, setTotalPagProductos] = useState(1);
    const [totalProductosCount, setTotalProductosCount] = useState(0); 

    // Usuarios
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [pagUsuarios, setPagUsuarios] = useState(1);
    const [totalPagUsuarios, setTotalPagUsuarios] = useState(1);
    const [totalUsuariosCount, setTotalUsuariosCount] = useState(0);

    // Ventas
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

    // URL BASE DEL SERVIDOR
    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    // Función "Llave Maestra" para enviar ambos formatos de Token y evitar el 401
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || '';
        return {
            'x-auth-token': token,
            'Authorization': `Bearer ${token}`
        };
    };

    // --- CARGA DE PRODUCTOS ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            const config = { headers: getAuthHeaders() };
            const res = await axios.get(`${baseURL}/productos?page=${pagProductos}&limit=${itemsPorPagina}&search=${busquedaProd}`, config);
            if (res.data) {
                const dataArr = res.data.productos || res.data || [];
                setProductos(Array.isArray(dataArr) ? dataArr : []);
                
                setTotalPagProductos(res.data.pagination?.pages || res.data.paginasTotales || 1);
                setTotalProductosCount(res.data.pagination?.total || res.data.totalCount || res.data.total || (Array.isArray(dataArr) ? dataArr.length : 0)); 
            }
        } catch (error) { console.error("Error al cargar productos:", error); }
        finally { setCargando(false); }
    };

    // --- CARGA DE USUARIOS Y VENTAS ---
    const cargarDatosExtra = async (vista) => {
        const paginaActual = vista === 'usuarios' ? pagUsuarios : pagVentas;
        const busquedaActual = vista === 'usuarios' ? busquedaUsr : busquedaVen;
        
        try {
            const config = { headers: getAuthHeaders() }; 
            const res = await axios.get(`${baseURL}/admin/panel/${vista}?page=${paginaActual}&limit=${itemsPorPagina}&search=${busquedaActual}`, config);
            
            if (vista === 'usuarios') {
                const arr = res.data.usuarios || res.data || [];
                setListaUsuarios(Array.isArray(arr) ? arr : []);
                setTotalPagUsuarios(res.data.pagination?.pages || res.data.paginasTotales || 1);
                setTotalUsuariosCount(res.data.pagination?.total || res.data.totalCount || res.data.total || (Array.isArray(arr) ? arr.length : 0));
            }
            if (vista === 'ventas') {
                const arr = res.data.ventas || res.data || [];
                setListaVentas(Array.isArray(arr) ? arr : []);
                setTotalPagVentas(res.data.pagination?.pages || res.data.paginasTotales || 1);
                setTotalVentasCount(res.data.pagination?.total || res.data.totalCount || res.data.total || (Array.isArray(arr) ? arr.length : 0));
            }
        } catch (error) { console.error(`Error en ${vista}:`, error); }
    };

    // Efectos sincronizados con la búsqueda independiente de cada tabla
    useEffect(() => { cargarProductos(); }, [pagProductos, busquedaProd]);
    useEffect(() => { cargarDatosExtra('usuarios'); }, [pagUsuarios, busquedaUsr]);
    useEffect(() => { cargarDatosExtra('ventas'); }, [pagVentas, busquedaVen]);

    // --- LÓGICA DE DATOS EXISTENTES PARA SUGERENCIAS ---
    const categoriasExistentes = useMemo(() => [...new Set(productos.map(p => p.product_type).filter(Boolean))], [productos]);
    const coloresExistentes = useMemo(() => {
        const colores = [];
        productos.forEach(p => p.variants?.forEach(v => { if(v.color) colores.push(v.color) }));
        return [...new Set(colores)];
    }, [productos]);
    const tallasExistentes = useMemo(() => {
        const tallas = [];
        productos.forEach(p => p.variants?.forEach(v => { if(v.size) tallas.push(v.size) }));
        return [...new Set(tallas)];
    }, [productos]);

    // --- LÓGICA DE VARIANTES AGRUPADAS ---
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
            inventory_quantity: 0, image: existingVariant?.image || "" 
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
            const config = { headers: getAuthHeaders() }; 
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
            const config = { headers: getAuthHeaders() };
            await axios.delete(`${baseURL}/productos/${id}`, config);
            cargarProductos();
        } catch (error) { alert("Error al eliminar"); }
    };

    // --- ACCIONES DE USUARIOS ---
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
            const config = { headers: getAuthHeaders() };
            const datosAEnviar = { ...formDataUsuario };
            
            if (!datosAEnviar.password) {
                delete datosAEnviar.password;
            }

            // Petición PUT para actualizar el usuario
            await axios.put(`${baseURL}/usuarios/${editandoUsuarioId}`, datosAEnviar, config);
            
            setModalUsuarioAbierto(false);
            cargarDatosExtra('usuarios'); 
            alert("Usuario actualizado con éxito");
        } catch (error) { 
            console.error("Error al actualizar usuario:", error);
            alert("Error al actualizar usuario. Revisa la consola."); 
        }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <img src="/logo-makia-pages.png" alt="Makia Logo" className="brand-logo-img" />
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
                        <span className="user-name-blue-header">{user?.nombre || 'Administrador'}</span>
                    </div>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesión</button>
                </div>
            </header>

            <hr className="header-divider" />
            <h2 className="panel-subtitle">Panel de Administración</h2>

            <main className="admin-main">
                <section className="admin-stats">
                    <div className={`admin-stat-card ${vistaActiva === 'productos' ? 'active-prod' : ''}`} onClick={() => setVistaActiva('productos')}>
                        <div className="stat-info"><h3>Productos</h3><p>Total en DB</p></div>
                        <span className="stat-count">{totalProductosCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'ventas' ? 'active-ventas' : ''}`} onClick={() => setVistaActiva('ventas')}>
                        <div className="stat-info"><h3>Ventas</h3><p>Historial Total</p></div>
                        <span className="stat-count">{totalVentasCount}</span>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'usuarios' ? 'active-user' : ''}`} onClick={() => setVistaActiva('usuarios')}>
                        <div className="stat-info"><h3>Usuarios</h3><p>Base de Datos</p></div>
                        <span className="stat-count">{totalUsuariosCount}</span>
                    </div>
                </section>

                <div className="admin-controls-row">
                    <div className="search-bar-makia" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-search" style={{ color: '#000', fontSize: '18px' }}></i>
                        <input 
                            type="text" 
                            placeholder={`Buscar en ${vistaActiva}...`} 
                            value={vistaActiva === 'productos' ? busquedaProd : vistaActiva === 'usuarios' ? busquedaUsr : busquedaVen} 
                            onChange={(e) => { 
                                const valor = e.target.value;
                                if (vistaActiva === 'productos') { setBusquedaProd(valor); setPagProductos(1); }
                                else if (vistaActiva === 'usuarios') { setBusquedaUsr(valor); setPagUsuarios(1); }
                                else if (vistaActiva === 'ventas') { setBusquedaVen(valor); setPagVentas(1); }
                            }} 
                        />
                    </div>
                    {vistaActiva === 'productos' && (
                        <button className="admin-add-btn" onClick={() => { setEditandoId(null); setFormData({title:'', product_type:'', variants:[]}); setModalAbierto(true); }}>
                            + Nuevo Producto
                        </button>
                    )}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table-fixed">
                        <thead>
                            {vistaActiva === 'productos' && (
                                <tr><th>Imagen</th><th className="col-title">Título</th><th>Tipo</th><th className="center">Acciones</th></tr>
                            )}
                            {vistaActiva === 'usuarios' && (
                                <tr><th>Nombre Completo</th><th>Email</th><th>Dirección</th><th>Rol</th><th className="center">Acciones</th></tr>
                            )}
                            {vistaActiva === 'ventas' && (
                                <tr><th>ID Venta</th><th>Cliente</th><th>Dirección</th><th>Fecha</th><th>Total</th><th className="center">Estado</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => (
                                <tr key={p._id}>
                                    <td className="center"><img src={p.variants?.[0]?.image || p.image_principal} className="table-thumb" alt="p" /></td>
                                    <td className="col-title center">{p.title}</td>
                                    <td className="center">{p.product_type}</td>
                                    <td className="col-actions center">
                                        <button className="btn-table btn-edit" onClick={() => abrirModalEditar(p)}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => handleEliminar(p._id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td className="center">{u.nombre} {u.apellido}</td>
                                    <td className="center">{u.email}</td>
                                    <td className="center">{u.direccion || 'N/A'}</td>
                                    <td className="center"><span className="role-badge">{u.rol}</span></td>
                                    <td className="col-actions center">
                                        <button className="btn-table btn-edit" onClick={() => abrirModalEditarUsuario(u)}>Editar</button>
                                    </td>
                                </tr>
                            ))}
                            
                            {vistaActiva === 'ventas' && listaVentas.map(v => (
                                <tr key={v._id}>
                                    <td className="center">{v._id.substring(0,8)}...</td>
                                    <td className="center">{v.usuario?.nombre || 'Anon'}</td>
                                    <td className="center">{v.direccion || 'N/A'}</td>
                                    <td className="center">{new Date(v.fecha).toLocaleDateString()}</td>
                                    <td className="center">${v.total?.toFixed(2)}</td>
                                    <td className="center"><span className="role-badge">{v.estado || 'Pagado'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {vistaActiva === 'productos' && <PaginationControls page={pagProductos} totalPages={totalPagProductos} onPageChange={setPagProductos} className="admin-pagination-theme" />}
                {vistaActiva === 'usuarios' && <PaginationControls page={pagUsuarios} totalPages={totalPagUsuarios} onPageChange={setPagUsuarios} className="admin-pagination-theme" />}
                {vistaActiva === 'ventas' && <PaginationControls page={pagVentas} totalPages={totalPagVentas} onPageChange={setPagVentas} className="admin-pagination-theme" />}
            </main>

            {/* MODAL PRODUCTO */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-xl">
                        <h2>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="field-group">
                                <label>Nombre del Producto</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>

                            <div className="field-group">
                                <label>Categoría</label>
                                <input list="db-cats" type="text" placeholder="Selecciona o escribe..." value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} />
                                <datalist id="db-cats">{categoriasExistentes.map(c => <option key={c} value={c} />)}</datalist>
                            </div>
                            
                            <div className="variants-section">
                                <div className="section-header-variants">
                                    <h3>Variantes por Color</h3>
                                    <button type="button" className="btn-makia-save" onClick={addEmptyColorGroup}>+ Añadir Color</button>
                                </div>
                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group color-input-fixed">
                                                <label>Color</label>
                                                <input list="db-cols" type="text" value={group.color} onChange={(e) => {
                                                    const updated = formData.variants.map(v => v.color === group.color ? { ...v, color: e.target.value } : v);
                                                    setFormData({ ...formData, variants: updated });
                                                }} />
                                                <datalist id="db-cols">{coloresExistentes.map(c => <option key={c} value={c} />)}</datalist>
                                            </div>
                                            <div className="field-group url-input-expanded">
                                                <label>URL Foto del Color</label>
                                                <input type="text" value={group.image} onChange={(e) => {
                                                    const updated = formData.variants.map(v => v.color === group.color ? { ...v, image: e.target.value } : v);
                                                    setFormData({ ...formData, variants: updated });
                                                }} />
                                            </div>
                                            <div className="mini-preview-container">
                                                {group.image ? <img src={group.image} alt="p" className="form-mini-preview" /> : <div className="form-mini-preview-placeholder">URL</div>}
                                            </div>
                                        </div>
                                        <div className="sizes-grid">
                                            {group.items.map((item) => (
                                                <div key={item.originalIndex} className="size-row">
                                                    <div className="field-group">
                                                        <label>Talla</label>
                                                        <input list="db-tallas" type="text" value={item.size} onChange={e => { 
                                                            const nv = [...formData.variants]; 
                                                            nv[item.originalIndex].size = e.target.value; 
                                                            setFormData({...formData, variants: nv}); 
                                                        }} />
                                                    </div>
                                                    <div className="field-group"><label>Precio</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <div className="field-group"><label>Stock</label><input type="number" value={item.inventory_quantity} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                    <button type="button" className="btn-x" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== item.originalIndex)})}>✕</button>
                                                </div>
                                            ))}
                                            <button type="button" className="btn-add-size" onClick={() => addSizeToColor(group.color)}>+ Añadir otra talla en este color</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <datalist id="db-tallas">{tallasExistentes.map(t => <option key={t} value={t} />)}</datalist>
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
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <h2>Editar Usuario</h2>
                        <form onSubmit={handleGuardarUsuario} className="admin-form-vertical">
                            <div className="field-group">
                                <label>Nombre</label>
                                <input type="text" required value={formDataUsuario.nombre} onChange={e => setFormDataUsuario({...formDataUsuario, nombre: e.target.value})} />
                            </div>
                            <div className="field-group">
                                <label>Apellido</label>
                                <input type="text" value={formDataUsuario.apellido} onChange={e => setFormDataUsuario({...formDataUsuario, apellido: e.target.value})} />
                            </div>
                            <div className="field-group">
                                <label>Email</label>
                                <input type="email" required value={formDataUsuario.email} onChange={e => setFormDataUsuario({...formDataUsuario, email: e.target.value})} />
                            </div>
                            <div className="field-group">
                                <label>Dirección</label>
                                <input type="text" value={formDataUsuario.direccion} onChange={e => setFormDataUsuario({...formDataUsuario, direccion: e.target.value})} />
                            </div>
                            <div className="field-group">
                                <label>Rol</label>
                                <select value={formDataUsuario.rol} onChange={e => setFormDataUsuario({...formDataUsuario, rol: e.target.value})}>
                                    <option value="cliente">Cliente</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div className="field-group">
                                <label>Nueva Contraseña</label>
                                <input type="password" placeholder="Dejar en blanco para no cambiarla" value={formDataUsuario.password} onChange={e => setFormDataUsuario({...formDataUsuario, password: e.target.value})} />
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn-makia-cancel" onClick={() => setModalUsuarioAbierto(false)}>Cancelar</button>
                                <button type="submit" className="btn-makia-save">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;