import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    
    // --- ESTADOS ---
    const [vistaActiva, setVistaActiva] = useState('productos');
    const [cargando, setCargando] = useState(false);
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
        title: '', product_type: '', vendor: 'Gymshark | Be a visionary.', 
        variants: [], image_principal: '' 
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

    // --- DATALISTS ---
    const categoriasExistentes = useMemo(() => [...new Set(productos.map(p => p.product_type))].filter(Boolean), [productos]);
    const coloresExistentes = useMemo(() => [...new Set(productos.flatMap(p => p.colors_available || []))].filter(Boolean), [productos]);

    // --- LÓGICA DE VARIANTES ---
    const agregarVariante = () => {
        setFormData({ 
            ...formData, 
            variants: [...formData.variants, { color: '', size: '', price: 0, inventory_quantity: 0, sku: '', image: '' }] 
        });
    };

    const actualizarVariante = (index, campo, valor) => {
        const nuevasVariantes = [...formData.variants];
        nuevasVariantes[index][campo] = valor;
        setFormData({ ...formData, variants: nuevasVariantes });
    };

    const eliminarVariante = (index) => {
        setFormData({ 
            ...formData, 
            variants: formData.variants.filter((_, i) => i !== index) 
        });
    };

    const generarSKU = (categoria) => {
        const marca = "MAK"; 
        const cat = (categoria || "GEN").substring(0, 3).toUpperCase();
        const idUnico = Date.now().toString().slice(-5); 
        return `${marca}-${cat}-${idUnico}`;
    };

    // --- GUARDAR ---
    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!formData.variants || formData.variants.length === 0) {
            alert("Debes agregar al menos una variante");
            return;
        }

        try {
            const variantesLimpias = formData.variants.map(v => ({
                ...v, 
                color: (v.color || '').trim(),
                size: (v.size || '').trim()
            }));

            const coloresExtraidos = [...new Set(variantesLimpias.map(v => v.color))].filter(Boolean);
            const tallasExtraidas = [...new Set(variantesLimpias.map(v => v.size))].filter(Boolean);

            const variantesProcesadas = variantesLimpias.map((v, i) => ({
                ...v,
                sku: (v.sku && v.sku.trim() !== '') ? v.sku.trim() : `${generarSKU(formData.product_type)}-V${i + 1}`,
                price: Number(v.price) || 0,
                inventory_quantity: Number(v.inventory_quantity) || 0
            }));

            const precioPrincipal = variantesProcesadas[0]?.price || 0;
            const imagenPrincipal = variantesProcesadas[0]?.image || '';

            const payload = { 
                ...formData, 
                handle: formData.title ? formData.title.toLowerCase().replace(/ /g, '-') : '',
                variants: variantesProcesadas,
                colors_available: coloresExtraidos,
                sizes_available: tallasExtraidas,
                precioMXN: precioPrincipal, 
                price: precioPrincipal,
                image_principal: imagenPrincipal 
            };

            delete payload._id; delete payload.__v; delete payload.createdAt; delete payload.updatedAt;
            
            if (editandoId) {
                await axios.put(`${baseURL}/productos/${editandoId}`, payload, { headers: getAuthHeaders() });
            } else {
                await axios.post(`${baseURL}/productos`, payload, { headers: getAuthHeaders() });
            }
            setModalAbierto(false); 
            cargarProductos(); 
            alert("¡Producto guardado con éxito!");
        } catch (error) { 
            console.error("Error:", error.response?.data || error);
            alert("Error al guardar producto"); 
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
            {/* Datalists Globales */}
            <datalist id="lista-categorias">
                {categoriasExistentes.map(cat => <option key={`cat-${cat}`} value={cat} />)}
                <option value="T-Shirts" /><option value="Shorts" /><option value="Hoodies" /><option value="Accessories" />
            </datalist>
            <datalist id="lista-colores">
                {coloresExistentes.map(col => <option key={`col-${col}`} value={col} />)}
                <option value="Black" /><option value="White" /><option value="Grey" /><option value="Red" /><option value="Blue" />
            </datalist>

            <header className="admin-header">
                <img src="/logo-makia-pages.png" alt="Logo" className="brand-logo-img" />
                <div className="admin-user-panel">
                    <div className="user-welcome-info">
                        <span className="welcome-text">¡Nos alegra verte de nuevo!</span>
                        <span className="user-name-blue-header">{user?.nombre || 'Admin'}</span>
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
                        <input type="text" placeholder="Buscar..." 
                            value={vistaActiva === 'productos' ? busquedaProd : vistaActiva === 'usuarios' ? busquedaUsr : busquedaVen} 
                            onChange={(e) => {
                                if(vistaActiva === 'productos') setBusquedaProd(e.target.value);
                                else if(vistaActiva === 'usuarios') setBusquedaUsr(e.target.value);
                                else setBusquedaVen(e.target.value);
                            }} />
                    </div>
                    {vistaActiva === 'productos' && (
                        <button className="admin-add-btn" onClick={() => { setEditandoId(null); setFormData({title:'', product_type:'', vendor:'Gymshark', variants:[], image_principal:''}); setModalAbierto(true); }}>
                            + NUEVO PRODUCTO
                        </button>
                    )}
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
                                    <td className="center"><img src={p.image_principal || "/placeholder.png"} className="table-thumb" alt="p" /></td>
                                    <td>{p.title}</td><td>{p.product_type}</td>
                                    <td className="col-actions center">
                                        <button className="btn-table btn-edit" onClick={() => { setEditandoId(p._id); setFormData({...p}); setModalAbierto(true); }}>Editar</button>
                                        <button className="btn-table btn-delete" onClick={() => { if(window.confirm("¿Eliminar?")) axios.delete(`${baseURL}/productos/${p._id}`, {headers:getAuthHeaders()}).then(cargarProductos) }}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
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
                                <div className="field-group">
                                    <label>Título del Producto</label>
                                    <input type="text" required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div className="field-group">
                                    <label>Categoría</label>
                                    <input type="text" list="lista-categorias" value={formData.product_type || ''} onChange={e => setFormData({...formData, product_type: e.target.value})} />
                                </div>
                            </div>

                            <div className="variants-section">
                                <div className="section-header-variants">
                                    <h3>Variantes</h3>
                                    <button type="button" className="btn-makia-save" onClick={agregarVariante}>+ Agregar Variante</button>
                                </div>

                                {formData.variants.map((variante, index) => (
                                    <div key={index} className="color-group-card" style={{ padding: '15px', marginBottom: '15px', border: '1px solid #222', borderRadius: '8px' }}>
                                        <div className="form-grid-2-cols">
                                            <div className="field-group">
                                                <label>Color</label>
                                                <input type="text" list="lista-colores" placeholder="Ej. Black" value={variante.color || ''} onChange={e => actualizarVariante(index, 'color', e.target.value)} />
                                            </div>
                                            <div className="field-group">
                                                <label>Talla (Manual)</label>
                                                <input type="text" placeholder="Ej. M" value={variante.size || ''} onChange={e => actualizarVariante(index, 'size', e.target.value)} />
                                            </div>
                                            <div className="field-group">
                                                <label>Precio (MXN)</label>
                                                <input type="number" value={variante.price || 0} onChange={e => actualizarVariante(index, 'price', Number(e.target.value))} />
                                            </div>
                                            <div className="field-group">
                                                <label>Stock</label>
                                                <input type="number" value={variante.inventory_quantity || 0} onChange={e => actualizarVariante(index, 'inventory_quantity', Number(e.target.value))} />
                                            </div>
                                            <div className="field-group" style={{ gridColumn: 'span 2' }}>
                                                <label>URL Imagen</label>
                                                <input type="text" placeholder="URL de la imagen..." value={variante.image || ''} onChange={e => actualizarVariante(index, 'image', e.target.value)}/>
                                                {variante.image && (
                                            <div className="preview-mini-wrapper">
                                                <img 
                                                    src={variante.image} 
                                                    alt="preview" 
                                                    style={{ 
                                                        width: '45px', 
                                                        height: '45px', 
                                                        objectFit: 'cover', 
                                                        borderRadius: '4px',
                                                        border: '1px solid #444' 
                                                    }} 
                                                    onError={(e) => e.target.src = "/placeholder.png"} // Por si la URL está rota
                                                />
                                                </div>
                                            )}
                                            </div>
                                            <div className="field-group" style={{ gridColumn: 'span 2' }}>
                                                <button type="button" className="btn-x-red" onClick={() => eliminarVariante(index)}>✕ Eliminar Variante</button>
                                            </div>
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
        </div>
    );
};

export default AdminPanel;