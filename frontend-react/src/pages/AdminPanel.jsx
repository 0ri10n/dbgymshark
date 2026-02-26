import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [productos, setProductos] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargando, setCargando] = useState(false);
    const totalPaginasSeguras = Math.max(Number(totalPaginas) || 1, 1);
    
    // Estados de Modales
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        title: '', handle: '', vendor: '', product_type: '',
        image_src: '', image_principal: '', variants: [] 
    });
    const [formDataUsuario, setFormDataUsuario] = useState({
        nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: ''
    });

    const [vistaActiva, setVistaActiva] = useState('productos');
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [listaVentas, setListaVentas] = useState([]);

    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark-mb5q.onrender.com/api';

    // --- LÓGICA DE CARGA DE DATOS ---
    const cargarProductos = async () => {
        setCargando(true);
        try {
            const url = `${baseURL}/productos?page=${pagina}&limit=20`;
            const respuesta = await axios.get(url);
            if (respuesta.data.productos) {
                const paginasRaw = respuesta.data.paginasTotales || respuesta.data.pagination?.pages || 1;
                setProductos(respuesta.data.productos);
                setTotalPaginas(Math.max(Number(paginasRaw) || 1, 1));
            } else {
                setProductos(Array.isArray(respuesta.data) ? respuesta.data : []);
                setTotalPaginas(1);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setCargando(false);
        }
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
        } catch (error) {
            console.error(`Error al cargar ${vista}:`, error);
        }
    };

    useEffect(() => {
        cargarProductos();
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
            const handleAutomatico = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const datosAEnviar = { ...formData, handle: handleAutomatico };

            if (editandoId) {
                await axios.put(`${baseURL}/productos/${editandoId}`, datosAEnviar, config);
                alert("Producto actualizado.");
            } else {
                await axios.post(`${baseURL}/productos`, datosAEnviar, config);
                alert("Producto creado exitosamente.");
            }
            setModalAbierto(false);
            cargarProductos();
        } catch (error) {
            alert(`Error al guardar: ${error.response?.data?.mensaje || error.message}`);
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
        try {
            await axios.delete(`${baseURL}/productos/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert("Producto eliminado.");
            cargarProductos();
        } catch (error) {
            alert("Error al eliminar.");
        }
    };

    // --- MANEJO DE VARIANTES ---
    const agregarVariante = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { size: '', color: '', sku: '', price: 0, inventory_quantity: 0 }]
        });
    };

    const actualizarVariante = (index, campo, valor) => {
        const nuevasVariantes = [...formData.variants];
        nuevasVariantes[index][campo] = valor;
        setFormData({ ...formData, variants: nuevasVariantes });
    };

    const eliminarVariante = (index) => {
        const nuevasVariantes = formData.variants.filter((_, i) => i !== index);
        setFormData({ ...formData, variants: nuevasVariantes });
    };

    // --- MANEJO DE USUARIOS ---
    const abrirModalCrearUsuario = () => {
        setEditandoUsuarioId(null);
        setFormDataUsuario({ nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: '' });
        setModalUsuarioAbierto(true);
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
            const datosAEnviar = { ...formDataUsuario };
            if (editandoUsuarioId && !datosAEnviar.password) delete datosAEnviar.password;

            if (editandoUsuarioId) {
                await axios.put(`${baseURL}/admin/panel/usuarios/${editandoUsuarioId}`, datosAEnviar, config);
                alert("Usuario actualizado.");
            } else {
                await axios.post(`${baseURL}/admin/panel/usuarios`, datosAEnviar, config);
                alert("Usuario creado.");
            }
            setModalUsuarioAbierto(false);
            cargarDatosExtra('usuarios'); 
        } catch (error) {
            alert(`Error: ${error.response?.data?.msg || 'Revisa los datos'}`);
        }
    };

    const handleEliminarUsuario = async (id) => {
        if (!window.confirm("¿Eliminar usuario definitivamente?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}/admin/panel/usuarios/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Usuario eliminado.");
            cargarDatosExtra('usuarios');
        } catch (error) {
            alert("Error al eliminar.");
        }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Panel de Administracion - MAKIA</h1>
                <div className="admin-header-actions">
                    <span>Bienvenido, <strong>{user?.role}</strong></span>
                    <button onClick={logout} className="admin-logout-btn">Cerrar Sesion</button>
                </div>
            </header>

            <main className="admin-main">
                <section className="admin-stats">
                    <div className={`admin-stat-card ${vistaActiva === 'productos' ? 'active-prod' : ''}`} onClick={() => setVistaActiva('productos')}>
                        <h3>Productos</h3>
                        <p>Gestionar inventario</p>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'ventas' ? 'active-ventas' : ''}`} onClick={() => { setVistaActiva('ventas'); cargarDatosExtra('ventas'); }}>
                        <h3>Ventas</h3>
                        <p>Historial de pedidos</p>
                    </div>
                    <div className={`admin-stat-card ${vistaActiva === 'usuarios' ? 'active-user' : ''}`} onClick={() => { setVistaActiva('usuarios'); cargarDatosExtra('usuarios'); }}>
                        <h3>Usuarios</h3>
                        <p>Base de datos</p>
                    </div>
                </section>

                <section className="admin-actions">
                    <div className="admin-section-header">
                        <h2>Gestión de {vistaActiva.charAt(0).toUpperCase() + vistaActiva.slice(1)}</h2>
                        {vistaActiva === 'productos' && <button className="admin-add-btn" onClick={abrirModalCrear}>+ Nuevo Producto</button>}
                        {vistaActiva === 'usuarios' && <button className="admin-add-btn btn-user-purple" onClick={abrirModalCrearUsuario}>+ Nuevo Usuario</button>}
                    </div>

                    {cargando ? <p className="loading-text">Cargando datos del servidor...</p> : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    {vistaActiva === 'productos' && <tr><th>Titulo</th><th>Precio (MXN)</th><th>Tipo</th><th>Acciones</th></tr>}
                                    {vistaActiva === 'ventas' && <tr><th>Orden</th><th>Cliente</th><th>Total (MXN)</th><th>Fecha</th></tr>}
                                    {vistaActiva === 'usuarios' && <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr>}
                                </thead>
                                <tbody>
                                    {vistaActiva === 'productos' && productos.map(prod => (
                                        <tr key={prod._id}>
                                            <td data-label="Titulo">{prod.title || prod.nombre}</td>
                                            <td data-label="Precio">${prod.precioMXN || prod.price || '0.00'}</td>
                                            <td data-label="Tipo">{prod.product_type || 'N/A'}</td>
                                            <td className="admin-row-actions">
                                                <button className="admin-edit-btn" onClick={() => abrirModalEditar(prod)}>Editar</button>
                                                <button className="admin-delete-btn" onClick={() => handleEliminar(prod._id)}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {vistaActiva === 'ventas' && listaVentas.map(venta => (
                                        <tr key={venta._id}>
                                            <td><strong>{venta.numeroOrden}</strong></td>
                                            <td>{venta.nombreCliente}</td>
                                            <td>${venta.total}</td>
                                            <td>{new Date(venta.fechaPedido).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {vistaActiva === 'usuarios' && listaUsuarios.map(u => (
                                        <tr key={u._id}>
                                            <td>{u.nombre} {u.apellido}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`role-badge ${u.rol}`}>{u.rol}</span></td>
                                            <td>{new Date(u.registro).toLocaleDateString()}</td>
                                            <td className="admin-row-actions">
                                                <button className="admin-edit-btn" onClick={() => abrirModalEditarUsuario(u)}>Editar</button>
                                                <button className="admin-delete-btn" onClick={() => handleEliminarUsuario(u._id)}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <PaginationControls
                        page={pagina}
                        totalPages={totalPaginasSeguras}
                        onPageChange={setPagina}
                        className="admin-pagination-theme"
                    />
                </section>
            </main>

            {/* --- MODAL PRODUCTOS --- */}
            {modalAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content modal-large">
                        <h2>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleGuardar} className="admin-form">
                            <div className="form-grid">
                                <input type="text" placeholder="Título" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                <input type="text" placeholder="Tipo" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} />
                                <input type="text" placeholder="Marca" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} />
                            </div>
                            <input type="text" placeholder="URL Imagen Principal" value={formData.image_principal} onChange={e => setFormData({...formData, image_principal: e.target.value})} />
                            <input type="text" placeholder="URL Imagen Secundaria" value={formData.image_src} onChange={e => setFormData({...formData, image_src: e.target.value})} />

                            <div className="variants-section">
                                <div className="section-header">
                                    <h3>Variantes</h3>
                                    <button type="button" onClick={agregarVariante} className="btn-add-variant">+ Talla/Color</button>
                                </div>
                                {formData.variants.map((v, index) => (
                                    <div key={index} className="variant-row">
                                        <input type="text" placeholder="Talla" value={v.size} onChange={e => actualizarVariante(index, 'size', e.target.value)} />
                                        <input type="text" placeholder="Color" value={v.color} onChange={e => actualizarVariante(index, 'color', e.target.value)} />
                                        <input type="text" placeholder="SKU" required value={v.sku} onChange={e => actualizarVariante(index, 'sku', e.target.value)} />
                                        <input type="number" placeholder="$" required value={v.price} onChange={e => actualizarVariante(index, 'price', Number(e.target.value))} />
                                        <button type="button" onClick={() => eliminarVariante(index)} className="btn-remove">X</button>
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

            {/* --- MODAL USUARIOS --- */}
            {modalUsuarioAbierto && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editandoUsuarioId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleGuardarUsuario} className="admin-form">
                            <div className="form-grid">
                                <input type="text" placeholder="Nombre" required value={formDataUsuario.nombre} onChange={e => setFormDataUsuario({...formDataUsuario, nombre: e.target.value})} />
                                <input type="text" placeholder="Apellido" required value={formDataUsuario.apellido} onChange={e => setFormDataUsuario({...formDataUsuario, apellido: e.target.value})} />
                            </div>
                            <input type="email" placeholder="Email" required value={formDataUsuario.email} onChange={e => setFormDataUsuario({...formDataUsuario, email: e.target.value})} />
                            <input type="password" placeholder="Contraseña (opcional)" value={formDataUsuario.password} onChange={e => setFormDataUsuario({...formDataUsuario, password: e.target.value})} />
                            <input type="text" placeholder="Dirección" value={formDataUsuario.direccion} onChange={e => setFormDataUsuario({...formDataUsuario, direccion: e.target.value})} />
                            <select value={formDataUsuario.rol} onChange={e => setFormDataUsuario({...formDataUsuario, rol: e.target.value})}>
                                <option value="cliente">Cliente</option>
                                <option value="admin">Administrador</option>
                            </select>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setModalUsuarioAbierto(false)} className="btn-cancel">Cancelar</button>
                                <button type="submit" className="btn-save btn-user-purple">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;