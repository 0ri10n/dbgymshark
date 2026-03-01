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
    
    // MOLDE LIMPIO
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
    const tallasExistentes = useMemo(() => [...new Set(productos.flatMap(p => p.sizes_available || []))].filter(Boolean), [productos]);

    // --- LÓGICA DE VARIANTES (REFACTORIZADA) ---
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
    // Ya no agrupamos por color en un objeto complejo. Manejamos el array plano directamente.
    
    /* Para renderizar, sí necesitamos saber qué colores existen para poner la cabecera de la "tarjeta"
    const coloresAgrupadosParaVista = useMemo(() => {
        const coloresUnicos = [...new Set(formData.variants.map(v => v.color))];
        return coloresUnicos.map(colorName => {
            // Buscamos todas las variantes que tengan este color
            const variantesDeEsteColor = formData.variants
                .map((v, index) => ({ ...v, originalIndex: index }))
                .filter(v => v.color === colorName);
            
            // Tomamos la imagen de la primera variante de este color que tenga una imagen
            const imagenDelColor = variantesDeEsteColor.find(v => v.image)?.image || '';
            
            return {
                colorName: colorName,
                image: imagenDelColor,
                items: variantesDeEsteColor
            };
        });
    }, [formData.variants]);

    const addSizeToColor = (colorName) => {
        const currentImage = formData.variants.find(v => v.color === colorName)?.image || "";
        // Agregamos una nueva variante plana al final del arreglo, copiando el color y la imagen
        setFormData({ 
            ...formData, 
            variants: [...formData.variants, { color: colorName, size: '', price: 0, inventory_quantity: 0, sku: '', image: currentImage }] 
        });
    };

    const addEmptyColorGroup = () => {
        // Un string vacío literal para empezar. Si el usuario no escribe, se guardará como string vacío
        // Para evitar colisiones visuales inmediatas, usamos un string con un espacio invisible si ya existe uno vacío
        let newColor = "";
        while(formData.variants.some(v => v.color === newColor)){
             newColor += " ";
        }
        
        setFormData({ 
            ...formData, 
            variants: [
                ...formData.variants, 
                { color: newColor, size: '', price: 0, inventory_quantity: 0, sku: '', image: "" }
            ] 
        });
    };

    const updateColorName = (oldColorName, newColorName) => {
         setFormData({
            ...formData,
            // Cambia el nombre del color en TODAS las variantes que tenían el nombre viejo
            variants: formData.variants.map(v => v.color === oldColorName ? { ...v, color: newColorName } : v)
        });
    }

    const updateColorImage = (colorName, newUrl) => {
        setFormData({ 
            ...formData, 
            // Guarda la URL en TODAS las variantes que tengan este color
            variants: formData.variants.map(v => v.color === colorName ? { ...v, image: newUrl } : v) 
        });
    };*/

    const generarSKU = (categoria, titulo) => {
        const marca = "MAK"; 
        const cat = (categoria || "GEN").substring(0, 3).toUpperCase();
        const idUnico = Date.now().toString().slice(-5); 
        return `${marca}-${cat}-${idUnico}`;
    };

    // --- GUARDAR ---
    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!formData.variants || formData.variants.length === 0) {
            alert("Debes agregar al menos una variante (Color/Talla)");
            return;
        }

        try {
            // Limpiamos los textos de forma segura
            const variantesLimpias = formData.variants.map(v => ({
                ...v, 
                color: (v.color || '').trim(),
                size: (v.size || '').trim()
            }));

            const coloresExtraidos = [...new Set(variantesLimpias.map(v => v.color))].filter(Boolean);
            const tallasExtraidas = [...new Set(variantesLimpias.map(v => v.size))].filter(Boolean);

            const variantesProcesadas = variantesLimpias.map((v, i) => ({
                ...v,
                sku: (v.sku && v.sku.trim() !== '') ? v.sku.trim() : `${generarSKU(formData.product_type, formData.title)}-V${i + 1}`,
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

            delete payload._id;
            delete payload.__v;
            delete payload.createdAt;
            delete payload.updatedAt;
            
            if (editandoId) {
                await axios.put(`${baseURL}/productos/${editandoId}`, payload, { headers: getAuthHeaders() });
            } else {
                await axios.post(`${baseURL}/productos`, payload, { headers: getAuthHeaders() });
            }
            setModalAbierto(false); 
            cargarProductos(); 
            alert("¡Producto guardado con éxito!");
        } catch (error) { 
            console.error("Detalle del error:", error.response?.data || error);
            alert(`Error al guardar: ${error.response?.data?.mensaje || error.response?.data?.msg || "Revisa la consola"}`); 
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
            {/* PÉGALO AL PRINCIPIO DEL RETURN, ABAJO DE <div className="admin-container"> */}
<datalist id="lista-categorias">
    {categoriasExistentes.map(cat => <option key={`cat-${cat}`} value={cat} />)}
</datalist>
<datalist id="lista-colores">
    {coloresExistentes.map(col => <option key={`col-${col}`} value={col} />)}
</datalist>
<datalist id="lista-tallas">
    {tallasExistentes.map(talla => <option key={`tal-${talla}`} value={talla} />)}
</datalist>
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
                                             {/* BÚSCALO Y REEMPLÁZALO POR ESTO */}
                                            <button className="btn-table btn-edit" onClick={() => { 
                                                setEditandoId(p._id); 
                                                setFormData({...p}); 
                                                setModalAbierto(true); 
                                            }}>Editar</button>
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

                        {/* DATALISTS MOVIDOS AQUÍ ADENTRO Y BLINDADOS */}
                        <datalist id="lista-categorias">
                            {categoriasExistentes.map(cat => <option key={`cat-${cat}`} value={cat} />)}
                            <option value="T-Shirts" /><option value="Shorts" /><option value="Hoodies" /><option value="Accessories" />
                        </datalist>
                        <datalist id="lista-colores">
                            {coloresExistentes.map(col => <option key={`col-${col}`} value={col} />)}
                            <option value="Black" /><option value="White" /><option value="Grey" /><option value="Red" /><option value="Blue" />
                        </datalist>
                        <datalist id="lista-tallas">
                            {tallasExistentes.map(talla => <option key={`tal-${talla}`} value={talla} />)}
                            <option value="S" /><option value="M" /><option value="L" /><option value="XL" /><option value="XXL" />
                        </datalist>
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
                                    <h3>Variantes del Producto</h3>
                                    <button type="button" className="btn-makia-save" onClick={agregarVariante}>+ Agregar Variante</button>
                                </div>

                                {formData.variants.map((variante, index) => (
                                    <div key={index} className="color-group-card" style={{ padding: '15px', marginBottom: '15px', border: '1px solid #222', borderRadius: '8px' }}>
                                        <div className="form-grid-2-cols">
                                            <div className="field-group">
                                                <label>Color</label>
                                                <input 
                                                    type="text" 
                                                    list="lista-colores" 
                                                    placeholder="Ej. Black"
                                                    value={variante.color || ''} 
                                                    onChange={e => actualizarVariante(index, 'color', e.target.value)} 
                                                />
                                            </div>
                                            <div className="field-group">
                                                <label>Talla</label>
                                                <input 
                                                    type="text" 
                                                    list="lista-tallas" 
                                                    placeholder="Ej. M"
                                                    value={variante.size || ''} 
                                                    onChange={e => actualizarVariante(index, 'size', e.target.value)} 
                                                />
                                            </div>
                                            <div className="field-group">
                                                <label>Precio (MXN)</label>
                                                <input 
                                                    type="number" 
                                                    value={variante.price || 0} 
                                                    onChange={e => actualizarVariante(index, 'price', Number(e.target.value))} 
                                                />
                                            </div>
                                            <div className="field-group">
                                                <label>Stock</label>
                                                <input 
                                                    type="number" 
                                                    value={variante.inventory_quantity || 0} 
                                                    onChange={e => actualizarVariante(index, 'inventory_quantity', Number(e.target.value))} 
                                                />
                                            </div>
                                            <div className="field-group url-input-expanded" style={{ gridColumn: 'span 2' }}>
                                                <label>URL Imagen</label>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Pegar URL aquí..."
                                                        value={variante.image || ''} 
                                                        onChange={e => actualizarVariante(index, 'image', e.target.value)} 
                                                        style={{ flex: 1 }}
                                                    />
                                                    {variante.image && <img src={variante.image} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                                                </div>
                                            </div>
                                            <div className="field-group sku-field" style={{ gridColumn: 'span 2' }}>
                                                <label>SKU (Opcional)</label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Auto-generado"
                                                        value={variante.sku || ""} 
                                                        onChange={e => actualizarVariante(index, 'sku', e.target.value)} 
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button type="button" className="btn-x-red" style={{ position: 'static', padding: '0 15px' }} onClick={() => eliminarVariante(index)}>✕ Eliminar</button>
                                                </div>
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