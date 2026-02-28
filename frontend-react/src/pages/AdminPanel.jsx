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

    // --- ESTADOS DE BÚSQUEDA ---
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
    const [formData, setFormData] = useState({ 
        title: '', product_type: '', vendor: 'Gymshark | Be a visionary.', 
        sku: '', price: 0, inventory_quantity: 0, variants: [], image_principal: ''
    });

    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
    const [formDataUsuario, setFormDataUsuario] = useState({ nombre: '', apellido: '', email: '', rol: 'cliente', direccion: '' });

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-ddk1.onrender.com/api';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || '';
        return { 
            'x-auth-token': token, 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
        };
    };

    // --- CARGA DE DATOS ---
    const cargarProductos = async () => {
        try {
            const res = await axios.get(`${baseURL}/productos?page=${pagProductos}&limit=${itemsPorPagina}&search=${busquedaProd}`, { headers: getAuthHeaders() });
            if (res.data) {
                setProductos(res.data.productos || []);
                setTotalPagProductos(res.data.pagination?.pages || 1);
                setTotalProductosCount(res.data.pagination?.total || 0); 
            }
        } catch (error) { console.error("Error productos:", error); }
    };

    const cargarDatosExtra = async (vista) => {
        const pagina = vista === 'usuarios' ? pagUsuarios : pagVentas;
        const search = vista === 'usuarios' ? busquedaUsr : busquedaVen;
        try {
            const res = await axios.get(`${baseURL}/admin/panel/${vista}?page=${pagina}&limit=${itemsPorPagina}&search=${search}`, { headers: getAuthHeaders() });
            if (vista === 'usuarios') {
                setListaUsuarios(res.data.usuarios || []);
                setTotalPagUsuarios(res.data.pagination?.pages || 1);
                setTotalUsuariosCount(res.data.pagination?.total || 0);
            } else {
                setListaVentas(res.data.ventas || []);
                setTotalPagVentas(res.data.pagination?.pages || 1);
                setTotalVentasCount(res.data.pagination?.total || 0);
            }
        } catch (error) { console.error(`Error en ${vista}:`, error); }
    };

    useEffect(() => { cargarProductos(); }, [pagProductos, busquedaProd]);
    useEffect(() => { cargarDatosExtra('usuarios'); }, [pagUsuarios, busquedaUsr]);
    useEffect(() => { cargarDatosExtra('ventas'); }, [pagVentas, busquedaVen]);

    // --- DATALISTS Y VARIANTES ---
    const categoriasExistentes = useMemo(() => [...new Set(productos.map(p => p.product_type))].filter(Boolean), [productos]);
    const coloresExistentes = useMemo(() => [...new Set(productos.flatMap(p => p.colors_available || []))].filter(Boolean), [productos]);
    const tallasExistentes = useMemo(() => [...new Set(productos.flatMap(p => p.sizes_available || []))].filter(Boolean), [productos]);

    const variantsByColor = useMemo(() => {
        const grouped = {};
        (formData.variants || []).forEach((v, index) => {
            const colorKey = v.color || "Sin Color";
            if (!grouped[colorKey]) grouped[colorKey] = { color: v.color, image: v.image || '', items: [] };
            grouped[colorKey].items.push({ ...v, originalIndex: index });
        });
        return Object.values(grouped);
    }, [formData.variants]);

    const addSizeToColor = (colorName) => {
        const currentImage = formData.variants.find(v => v.color === colorName)?.image || "";
        setFormData({ ...formData, variants: [...formData.variants, { color: colorName, size: '', price: formData.price || 0, inventory_quantity: 0, sku: '', image: currentImage }] });
    };

    const addEmptyColorGroup = () => {
        setFormData({ ...formData, variants: [...formData.variants, { color: '', size: '', price: formData.price || 0, inventory_quantity: 0, sku: '', image: "" }] });
    };

    // CORRECCIÓN: Asegura que todas las variantes del mismo color reciban la URL
    const updateColorImage = (colorName, newUrl) => {
        setFormData({ 
            ...formData, 
            variants: formData.variants.map(v => v.color === colorName ? { ...v, image: newUrl } : v) 
        });
    };

// --- GENERADOR DE SKU PROFESIONAL Y PERMANENTE ---
    const generarSKU = (categoria, titulo) => {
        const marca = "MAK"; // Prefijo de tu marca (Makia)
        // Tomamos las primeras 3 letras de la categoría (Ej: "Accessories" -> "ACC")
        const cat = (categoria || "GEN").substring(0, 3).toUpperCase();
        // Tomamos un fragmento de la fecha para hacerlo único
        const idUnico = Date.now().toString().slice(-5); 
        
        // Resultado: MAK-ACC-45912
        return `${marca}-${cat}-${idUnico}`;
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            // 1. MAGIA DE QA: Extraemos todos los colores y tallas únicos de las variantes actuales
            const coloresExtraidos = [...new Set(formData.variants.map(v => v.color))].filter(Boolean);
            const tallasExtraidas = [...new Set(formData.variants.map(v => v.size))].filter(Boolean);

            const skuDefinitivo = formData.sku && formData.sku.trim() !== '' 
                ? formData.sku 
                : generarSKU(formData.product_type, formData.title);

            // 2. Armamos el paquete asegurando que todos los campos del catálogo se enteren del cambio
            const payload = { 
                ...formData, 
                handle: formData.title.toLowerCase().replace(/ /g, '-'),
                variants: formData.variants,
                // ¡Aquí está la clave! Actualizamos las listas maestras
                colors_available: coloresExtraidos,
                sizes_available: tallasExtraidas,
                // Sincronizamos ambos precios para evitar bugs de visualización
                precioMXN: formData.price 
            };
            
            if (editandoId) {
                await axios.put(`${baseURL}/productos/${editandoId}`, payload, { headers: getAuthHeaders() });
            } else {
                await axios.post(`${baseURL}/productos`, payload, { headers: getAuthHeaders() });
            }
            setModalAbierto(false); 
            cargarProductos(); 
            alert("Guardado correctamente");
        } catch (error) { 
            console.error("Error al guardar:", error);
            alert("Error al guardar"); 
        }
    };

    const handleGuardarUsuario = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${baseURL}/admin/panel/usuarios/${editandoUsuarioId}`, formDataUsuario, { headers: getAuthHeaders() });
            setModalUsuarioAbierto(false); cargarDatosExtra('usuarios'); alert("Usuario actualizado");
        } catch (error) { alert("Error al actualizar usuario"); }
    };

    return (
        <div className="admin-container">
            <datalist id="lista-categorias">{categoriasExistentes.map(cat => <option key={cat} value={cat} />)}</datalist>
            <datalist id="lista-colores">{coloresExistentes.map(col => <option key={col} value={col} />)}</datalist>
            <datalist id="lista-tallas">{tallasExistentes.map(talla => <option key={talla} value={talla} />)}</datalist>

            <header className="admin-header">
                <img src="/logo-makia-pages.png" alt="Logo" className="brand-logo-img" />
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
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
                        <input type="text" placeholder="Buscar..." 
                            value={vistaActiva === 'productos' ? busquedaProd : vistaActiva === 'usuarios' ? busquedaUsr : busquedaVen} 
                            onChange={(e) => {
                                if(vistaActiva === 'productos') setBusquedaProd(e.target.value);
                                else if(vistaActiva === 'usuarios') setBusquedaUsr(e.target.value);
                                else setBusquedaVen(e.target.value);
                            }} />
                    </div>
                    {vistaActiva === 'productos' && (
                        <button className="admin-add-btn" onClick={() => { setEditandoId(null); setFormData({title:'', product_type:'', vendor:'Gymshark', sku:'', price:0, inventory_quantity:0, variants:[], image_principal:''}); setModalAbierto(true); }}>
                            + NUEVO PRODUCTO
                        </button>
                    )}
                </div>

                <div className="admin-table-wrapper">
                    <table className="admin-table-fixed">
                        <thead>
                            {vistaActiva === 'productos' && <tr><th>Imagen</th><th>Título</th><th>Tipo</th><th className="center">Acciones</th></tr>}
                            {vistaActiva === 'usuarios' && <tr><th>Nombre Completo</th><th>Email</th><th>Rol</th><th className="center">Acciones</th></tr>}
                            {vistaActiva === 'ventas' && <tr><th>Orden</th><th>Cliente</th><th>Fecha</th><th>Total</th><th className="center">Estado</th></tr>}
                        </thead>
                        <tbody>
                            {vistaActiva === 'productos' && productos.map(p => {
                                const imgURL = p.image_principal || (p.image_src?.split(',')[0]) || p.variants?.[0]?.image || "/placeholder.png";
                                return (
                                    <tr key={p._id}>
                                        <td className="center"><img src={imgURL} className="table-thumb" alt="p" /></td>
                                        <td>{p.title}</td><td>{p.product_type}</td>
                                        <td className="col-actions center">
                                            <button className="btn-table btn-edit" onClick={() => { setEditandoId(p._id); setFormData({...p}); setModalAbierto(true); }}>Editar</button>
                                            <button className="btn-table btn-delete" onClick={() => { if(window.confirm("¿Eliminar?")) axios.delete(`${baseURL}/productos/${p._id}`, {headers:getAuthHeaders()}).then(cargarProductos) }}>Eliminar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                <tr key={u._id}>
                                    <td>{u.nombre} {u.apellido}</td><td>{u.email}</td><td className="center"><span className="role-badge">{u.rol}</span></td>
                                    <td className="col-actions center">
                                        <button className="btn-table btn-edit" onClick={() => { setEditandoUsuarioId(u._id); setFormDataUsuario({...u}); setModalUsuarioAbierto(true); }}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => { if(window.confirm("¿Eliminar?")) axios.delete(`${baseURL}/admin/panel/usuarios/${u._id}`, {headers:getAuthHeaders()}).then(() => cargarDatosExtra('usuarios')) }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {vistaActiva === 'ventas' && listaVentas.map(v => {
                                const rawDate = v.fechaPedido?.$date || v.fechaPedido || v.createdAt;
                                const dateObj = rawDate ? new Date(rawDate) : null;
                                const displayDate = (dateObj && !isNaN(dateObj.getTime())) ? dateObj.toLocaleDateString() : "Sin fecha";
                                return (
                                    <tr key={v._id}>
                                        <td>#{v.numeroOrden || (v._id?.$oid || v._id).substring(0,8)}</td>
                                        <td>{v.nombreCliente || v.usuario?.nombre || 'Anónimo'}</td>
                                        <td>{displayDate}</td>
                                        <td>${v.total?.toFixed(2)}</td>
                                        <td className="center"><span className="role-badge">{v.estado || 'Pagado'}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <PaginationControls 
                    page={vistaActiva === 'productos' ? pagProductos : vistaActiva === 'usuarios' ? pagUsuarios : pagVentas} 
                    totalPages={vistaActiva === 'productos' ? totalPagProductos : vistaActiva === 'usuarios' ? totalPagUsuarios : totalPagVentas} 
                    onPageChange={vistaActiva === 'productos' ? setPagProductos : vistaActiva === 'usuarios' ? setPagUsuarios : setPagVentas} />
            </main>

            {/* MODAL PRODUCTOS */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-xl">
                        <h2>{editandoId ? 'Editar' : 'Nuevo'} Producto</h2>
                        <form onSubmit={handleGuardar} className="admin-form-vertical">
                            <div className="form-grid-2-cols">
                                <div className="field-group"><label>Título</label><input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                                <div className="field-group"><label>Categoría</label><input type="text" list="lista-categorias" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} /></div>
                                <div className="field-group"><label>SKU Base</label><input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} /></div>
                                <div className="field-group"><label>Precio Base</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} /></div>
                                <div className="field-group url-input-expanded"><label>URL Imagen Principal</label><input type="text" value={formData.image_principal || ""} onChange={e => setFormData({...formData, image_principal: e.target.value})} /></div>
                            </div>
                            <div className="variants-section">
                                <div className="section-header-variants"><h3>Variantes</h3><button type="button" className="btn-makia-save" onClick={addEmptyColorGroup}>+ Color</button></div>
                                {variantsByColor.map((group, idx) => (
                                    <div key={idx} className="color-group-card">
                                        <div className="color-header-row">
                                            <div className="field-group color-input-fixed"><label>Color</label><input type="text" list="lista-colores" value={group.color} onChange={e => setFormData({...formData, variants: (formData.variants || []).map(v => v.color === group.color ? {...v, color: e.target.value} : v)})} /></div>
                                            <div className="field-group url-input-expanded"><label>URL Imagen Color</label><input type="text" value={group.image} onChange={e => updateColorImage(group.color, e.target.value)} /></div>
                                            <div className="mini-preview-box">
                                                {group.image ? <img src={group.image} alt="Preview" /> : <span className="preview-placeholder">URL</span>}
                                            </div>
                                        </div>
                                        <div className="sizes-grid">
                                            {group.items.map(item => (
                                                <div key={item.originalIndex} className="size-row-container">
                                                    <div className="size-row-inputs">
                                                        <div className="field-group"><label>Talla</label><input type="text" list="lista-tallas" value={item.size} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].size = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                        <div className="field-group"><label>Precio</label><input type="number" value={item.price} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].price = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                        <div className="field-group"><label>Stock</label><input type="number" value={item.inventory_quantity} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].inventory_quantity = Number(e.target.value); setFormData({...formData, variants: nv}); }} /></div>
                                                        <div className="field-group sku-field"><label>SKU Variante</label><input type="text" value={item.sku || ""} onChange={e => { const nv = [...formData.variants]; nv[item.originalIndex].sku = e.target.value; setFormData({...formData, variants: nv}); }} /></div>
                                                    </div>
                                                    <button type="button" className="btn-x-red" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== item.originalIndex)})}>✕</button>
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

            {/* MODAL USUARIOS */}
            {modalUsuarioAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Editar Usuario</h2>
                        <form onSubmit={handleGuardarUsuario} className="admin-form-vertical">
                            <div className="form-grid-2-cols">
                                <div className="field-group"><label>Nombre</label><input type="text" value={formDataUsuario.nombre} onChange={e => setFormDataUsuario({...formDataUsuario, nombre: e.target.value})} /></div>
                                <div className="field-group"><label>Apellido</label><input type="text" value={formDataUsuario.apellido} onChange={e => setFormDataUsuario({...formDataUsuario, apellido: e.target.value})} /></div>
                                <div className="field-group"><label>Email</label><input type="email" value={formDataUsuario.email} onChange={e => setFormDataUsuario({...formDataUsuario, email: e.target.value})} /></div>
                                <div className="field-group"><label>Rol</label>
                                    <select value={formDataUsuario.rol} onChange={e => setFormDataUsuario({...formDataUsuario, rol: e.target.value})}>
                                        <option value="cliente">Cliente</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn-makia-cancel" onClick={() => setModalUsuarioAbierto(false)}>Cancelar</button><button type="submit" className="btn-makia-save">Actualizar Usuario</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;