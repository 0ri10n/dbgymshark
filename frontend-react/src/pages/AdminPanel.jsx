import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import './AdminPanel.css';
const TABLE_NAME = 'productos'; 
const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark.onrender.com/api';

const AdminPanel = () => {
    const { user, logout } = useAuth();
    const [productos, setProductos] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargando, setCargando] = useState(false);
    const totalPaginasSeguras = Math.max(Number(totalPaginas) || 1, 1);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        handle: '',
        vendor: '',
        product_type: '',
        image_src: '',
        image_principal: '',
        variants: [] 
    });
    const [vistaActiva, setVistaActiva] = useState('productos');
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [listaVentas, setListaVentas] = useState([]);
    const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
    const [editandoUsuarioId, setEditandoUsuarioId] = useState(null);
    const [formDataUsuario, setFormDataUsuario] = useState({
        nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: ''
    });
    const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark.onrender.com/api';
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

    const abrirModalCrearUsuario = () => {
        setEditandoUsuarioId(null);
        setFormDataUsuario({
            nombre: '', apellido: '', email: '', rol: 'cliente', password: '', direccion: ''
        });
        setModalUsuarioAbierto(true);
    };

    const abrirModalEditarUsuario = (user) => {
        setEditandoUsuarioId(user._id);
        setFormDataUsuario({
            nombre: user.nombre || '',
            apellido: user.apellido || '',
            email: user.email || '',
            rol: user.rol || 'cliente',
            password: '', // Lo dejamos vacío por seguridad
            direccion: user.direccion || ''
        });
        setModalUsuarioAbierto(true);
    };

    const handleGuardarUsuario = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const datosAEnviar = { ...formDataUsuario };
            // Si estamos editando y no escribió contraseña, la borramos para no sobreescribirla con vacío
            if (editandoUsuarioId && !datosAEnviar.password) {
                delete datosAEnviar.password;
            }

            if (editandoUsuarioId) {
                await axios.put(`${baseURL}/admin/panel/usuarios/${editandoUsuarioId}`, datosAEnviar, config);
                alert("Usuario actualizado correctamente.");
            } else {
                await axios.post(`${baseURL}/admin/panel/usuarios`, datosAEnviar, config);
                alert("Usuario creado exitosamente.");
            }
            
            setModalUsuarioAbierto(false);
            cargarDatosExtra('usuarios'); 
        } catch (error) {
            console.error(error);
            alert(`Error al guardar: ${error.response?.data?.msg || 'Revisa los datos ingresados'}`);
        }
    };
    const handleEliminarUsuario = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${baseURL}/admin/panel/usuarios/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Usuario eliminado.");
            cargarDatosExtra('usuarios'); // Recargamos la tabla
        } catch (error) {
            console.error(error);
            alert("Error al eliminar usuario.");
        }
    };
    useEffect(() => {
        cargarProductos();
    }, [pagina]);

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
        try {
            await axios.delete(`${baseURL}/productos/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert("Producto eliminado exitosamente.");
            cargarProductos(); // Recargamos la tabla
        } catch (error) {
            console.error(error);
            alert(`Error al eliminar: ${error.response?.data?.mensaje || 'Desconocido'}`);
        }
    };


    const abrirModalEditar = (prod) => {
        setEditandoId(prod._id);
        setFormData({
            title: prod.title || '',
            handle: prod.handle || '',
            vendor: prod.vendor || '',
            product_type: prod.product_type || '',
            image_principal: prod.image_principal || '',
            image_src: prod.image_src || '',
            variants: prod.variants || [] 
        });
        setModalAbierto(true);
    };


    const abrirModalCrear = () => {
        setEditandoId(null);
        setFormData({ 
            title: '', 
            vendor: '', 
            product_type: '', 
            image_src: '', 
            image_principal: '', 
            variants: [] // Súper importante para que no marque error al añadir tallas
        });
        setModalAbierto(true);
    };

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

    const handleGuardar = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Magia invisible: Crea el handle automáticamente a partir del título
            const handleAutomatico = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const datosAEnviar = { ...formData, handle: handleAutomatico };

            if (editandoId) {
                // Modo Edición
                await axios.put(`${baseURL}/productos/${editandoId}`, datosAEnviar, config);
                alert("Producto actualizado.");
            } else {
                // Modo Creación
                await axios.post(`${baseURL}/productos`, datosAEnviar, config);
                alert("Producto creado exitosamente.");
            }
            
            setModalAbierto(false);
            cargarProductos();
        } catch (error) {
            console.error(error);
            alert(`Error al guardar: ${error.response?.data?.mensaje || error.message}`);
        }
    };      

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Panel de Administracion - MAKIA</h1>
                <div className="admin-header-actions">
                    <span>Bienvenido, <strong>{user?.role}</strong></span>
                    <button onClick={logout} className="admin-logout-btn">
                        Cerrar Sesion
                    </button>
                </div>
            </header>

            <main className="admin-main">
                 <section className="admin-stats">
                    <div 
                        className="admin-stat-card" 
                        style={{ cursor: 'pointer', border: vistaActiva === 'productos' ? '2px solid #3b82f6' : 'none' }}
                        onClick={() => setVistaActiva('productos')}
                    >
                        <h3>Productos</h3>
                        <p>Listo para gestionar el inventario</p>
                    </div>
                    <div 
                        className="admin-stat-card" 
                        style={{ cursor: 'pointer', border: vistaActiva === 'ventas' ? '2px solid #10b981' : 'none' }}
                        onClick={() => { setVistaActiva('ventas'); cargarDatosExtra('ventas'); }}
                    >
                        <h3>Ventas</h3>
                        <p>Historial de pedidos</p>
                    </div>
                    <div 
                        className="admin-stat-card" 
                        style={{ cursor: 'pointer', border: vistaActiva === 'usuarios' ? '2px solid #8b5cf6' : 'none' }}
                        onClick={() => { setVistaActiva('usuarios'); cargarDatosExtra('usuarios'); }}
                    >
                        <h3>Usuarios</h3>
                        <p>Base de datos activa</p>
                    </div>
                    </section>

                <section className="admin-actions">
                    <div className="admin-section-header">
                        <h2>Gestion de Catalogo (DBGymshark)</h2>
                            {vistaActiva === 'productos' && (
                                <button className="admin-add-btn" onClick={abrirModalCrear}>
                                    + Agregar Nuevo Producto
                                </button>
                            )}
                            {vistaActiva === 'usuarios' && (
                                <button className="admin-add-btn" onClick={abrirModalCrearUsuario} style={{ background: '#8b5cf6' }}>
                                + Agregar Nuevo Usuario
                                </button>
                            )}
                            </div>

                    {cargando ? (
    <p>Cargando inventario del servidor...</p>
) : (
    <>
        {/* --- TABLA DE PRODUCTOS --- */}
        {vistaActiva === 'productos' && (
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Titulo</th>
                            <th>Precio (MXN)</th>
                            <th>Tipo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((prod) => (
                            <tr key={prod._id}>
                                <td data-label="Titulo">{prod.title || prod.nombre || 'Producto'}</td>
                                <td data-label="Precio (MXN)">${prod.precioMXN || prod.price || '0.00'}</td>
                                <td data-label="Tipo">{prod.product_type || 'N/A'}</td>
                                <td data-label="Acciones" className="admin-row-actions">
                                    <button className="admin-edit-btn" onClick={() => abrirModalEditar(prod)}>
                                        Editar
                                    </button>
                                    <button className="admin-delete-btn" onClick={() => handleEliminar(prod._id)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- TABLA DE VENTAS --- */}
        {vistaActiva === 'ventas' && (
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Cliente</th>
                            <th>Total (MXN)</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listaVentas.length > 0 ? (
                            listaVentas.map((venta) => (
                                <tr key={venta._id}>
                                    <td data-label="Orden"><strong>{venta.numeroOrden}</strong></td>
                                    <td data-label="Cliente">{venta.nombreCliente}</td>
                                    <td data-label="Total (MXN)">${venta.total}</td>
                                    <td data-label="Fecha">{new Date(venta.fechaPedido).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No hay ventas registradas aún.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

{/* --- TABLA DE USUARIOS --- */}
        {vistaActiva === 'usuarios' && (
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Dirección</th> 
                            <th>Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listaUsuarios.length > 0 ? (
                            listaUsuarios.map((user) => (
                                <tr key={user._id}>
                                    <td data-label="Nombre">{user.nombre} {user.apellido}</td>
                                    <td data-label="Email">{user.email}</td>
                                    <td data-label="Rol">
                                        <span style={{ 
                                            background: user.rol === 'admin' ? '#8b5cf6' : '#334155', 
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' 
                                        }}>
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td data-label="Dirección">{user.direccion || 'Sin dirección'}</td> {/* <--- AQUÍ SE MUESTRA EL DATO */}
                                    <td data-label="Registro">{new Date(user.registro).toLocaleDateString()}</td>
                                    <td data-label="Acciones" className="admin-row-actions">
                                        <button className="admin-edit-btn" onClick={() => abrirModalEditarUsuario(user)}>
                                            Editar
                                        </button>
                                        <button className="admin-delete-btn" onClick={() => handleEliminarUsuario(user._id)}>
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No hay usuarios registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </>
)}

                    <PaginationControls
                        page={pagina}
                        totalPages={totalPaginasSeguras}
                        groupSize={8}
                        className="admin-pagination-theme"
                        ariaLabel="Paginacion del panel de administracion"
                        onPageChange={(nextPage) => setPagina(nextPage)}
                    />
                </section>
            </main>
            {/* --- EL MODAL PRODUCTOS --- */}
            {modalAbierto && (
                <div style={overlayStyle}>
                    <div style={{...modalStyle, maxHeight: '90vh', overflowY: 'auto', width: '95%', maxWidth: '600px'}}>
                        <h2>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                        <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            
                            {/* CAMPOS PRINCIPALES */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input type="text" placeholder="Título" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                <input type="text" placeholder="Tipo (ej. Womens Ss Tops)" value={formData.product_type} onChange={e => setFormData({...formData, product_type: e.target.value})} />
                                <input type="text" placeholder="Marca / Vendor" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} />
                            </div>

                            <input type="text" placeholder="URL Imagen Principal" value={formData.image_principal} onChange={e => setFormData({...formData, image_principal: e.target.value})} />
                            <input type="text" placeholder="URL Imagen Secundaria" value={formData.image_src} onChange={e => setFormData({...formData, image_src: e.target.value})} />

                            {/* SECCIÓN DE VARIANTES (Tallas, Colores, Precios) */}
                            <div style={{ marginTop: '15px', borderTop: '1px solid #475569', paddingTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3>Variantes (Tallas/Colores)</h3>
                                    <button type="button" onClick={agregarVariante} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                        + Añadir Variante
                                    </button>
                                </div>
                                
                                {formData.variants.map((v, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '10px', alignItems: 'center', background: '#334155', padding: '10px', borderRadius: '6px' }}>
                                        <input type="text" placeholder="Talla (S, M, L)" value={v.size} onChange={e => actualizarVariante(index, 'size', e.target.value)} style={{ width: '60px' }} />
                                        <input type="text" placeholder="Color" value={v.color} onChange={e => actualizarVariante(index, 'color', e.target.value)} style={{ width: '80px' }} />
                                        <input type="text" placeholder="SKU" required value={v.sku} onChange={e => actualizarVariante(index, 'sku', e.target.value)} style={{ flex: 1 }} />
                                        <input type="number" placeholder="Precio ($)" required value={v.price} onChange={e => actualizarVariante(index, 'price', Number(e.target.value))} style={{ width: '80px' }} />
                                        <input type="number" placeholder="Stock" value={v.inventory_quantity} onChange={e => actualizarVariante(index, 'inventory_quantity', Number(e.target.value))} style={{ width: '60px' }} />
                                        <button type="button" onClick={() => eliminarVariante(index)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px' }}>X</button>
                                    </div>
                                ))}
                                {formData.variants.length === 0 && <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No hay variantes. Agrega al menos una para definir el precio.</p>}
                            </div>

                            {/* BOTONES FINALES */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Guardar Producto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* --- MODAL DE USUARIOS --- */}
            {modalUsuarioAbierto && (
                <div style={overlayStyle}>
                    <div style={{...modalStyle, maxWidth: '400px'}}>
                        <h2>Editar Usuario</h2>
                        <form onSubmit={handleGuardarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input type="text" placeholder="Nombre" required value={formDataUsuario.nombre} onChange={e => setFormDataUsuario({...formDataUsuario, nombre: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: 'none' }} />
                                <input type="text" placeholder="Apellido" required value={formDataUsuario.apellido} onChange={e => setFormDataUsuario({...formDataUsuario, apellido: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: 'none' }} />
                            </div>
    
                            <input type="email" placeholder="Correo electrónico" required value={formDataUsuario.email} onChange={e => setFormDataUsuario({...formDataUsuario, email: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: 'none' }} />
    
                            <input 
                                type="text" 
                                placeholder="Contraseña (Déjala vacía si no la vas a cambiar)" 
                                required={!editandoUsuarioId} // Solo es obligatoria si estamos creando uno nuevo
                                value={formDataUsuario.password} 
                                onChange={e => setFormDataUsuario({...formDataUsuario, password: e.target.value})} 
                                style={{ padding: '8px', borderRadius: '4px', border: 'none' }} 
                            />

                            <input 
                                type="text" 
                                placeholder="Dirección completa de envío (Opcional)" 
                                value={formDataUsuario.direccion} 
                                onChange={e => setFormDataUsuario({...formDataUsuario, direccion: e.target.value})} 
                                style={{ padding: '8px', borderRadius: '4px', border: 'none' }} 
                            />
    
                            <select value={formDataUsuario.rol} onChange={e => setFormDataUsuario({...formDataUsuario, rol: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: 'none' }}>
                                <option value="cliente">Cliente</option>
                                <option value="admin">Administrador</option>
                            </select>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setModalUsuarioAbierto(false)} style={{ padding: '8px 16px', cursor: 'pointer', background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px' }}>Cancelar</button>
                                <button type="submit" style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Usuario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
const overlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px', color: 'white' };
export default AdminPanel;
