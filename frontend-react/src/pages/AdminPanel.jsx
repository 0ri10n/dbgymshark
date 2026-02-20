import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { user, logout } = useAuth(); // Obtenemos el usuario y la función de salida
    //ESTADOS Y EFECTO DE PAGINACIÓN
    const [productos, setProductos] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        const obtenerProductos = async () => {
            setCargando(true);
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark.onrender.com/api';
                // La URL cambia dinámicamente según la página actual
                const url = `${baseURL}/productos?page=${pagina}&limit=20`;
                const respuesta = await axios.get(url);
                
                if (respuesta.data.productos) {
                    setProductos(respuesta.data.productos);
                    setTotalPaginas(respuesta.data.paginasTotales);
                } else {
                    setProductos(respuesta.data);
                }
            } catch (error) {
                console.error("Error al cargar productos en panel admin:", error);
            } finally {
                setCargando(false);
            }
        };
        obtenerProductos();
    }, [pagina]);

    return (
        <div className="admin-container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                <h1>Panel de Administración - MAKIA</h1>
                <div>
                    <span>Bienvenido, <strong>{user?.role}</strong></span>
                    <button onClick={logout} style={{ marginLeft: '15px', cursor: 'pointer' }}>
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            <main style={{ marginTop: '30px' }}>
                <section className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: '#f4f4f4', padding: '20px', textAlign: 'center' }}>
                        <h3>Productos</h3>
                        <p>Listo para gestionar el inventario</p>
                    </div>
                    <div style={{ background: '#f4f4f4', padding: '20px', textAlign: 'center' }}>
                        <h3>Ventas</h3>
                        <p>$0.00 MXN hoy</p>
                    </div>
                    <div style={{ background: '#f4f4f4', padding: '20px', textAlign: 'center' }}>
                        <h3>Usuarios</h3>
                        <p>Base de datos activa</p>
                    </div>
                </section>

                <section className="admin-actions">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2>Gestión de Catálogo (DBGymshark)</h2>
                        <button style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            + Agregar Nuevo Producto
                        </button>
                    </div>
                    
                    {/* TABLA DE PRODUCTOS DINÁMICA */}
                    {cargando ? (
                        <p>Cargando inventario del servidor...</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '30px' }}>
                                <thead>
                                    <tr style={{ background: '#111', color: '#fff' }}>
                                        <th style={{ padding: '12px' }}>Título</th>
                                        <th style={{ padding: '12px' }}>Precio (MXN)</th>
                                        <th style={{ padding: '12px' }}>Tipo</th>
                                        <th style={{ padding: '12px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos.map(prod => (
                                        <tr key={prod._id} style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={{ padding: '12px' }}>{prod.title}</td>
                                            <td style={{ padding: '12px' }}>${prod.precioMXN}</td>
                                            <td style={{ padding: '12px' }}>{prod.product_type || 'N/A'}</td>
                                            <td style={{ padding: '12px' }}>
                                                <button style={{ marginRight: '10px', cursor: 'pointer', padding: '5px 10px' }}>Editar</button>
                                                <button style={{ cursor: 'pointer', color: '#fff', background: '#dc3545', border: 'none', padding: '5px 10px' }}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* CONTROLES DE PAGINACIÓN */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                        <button 
                            disabled={pagina === 1} 
                            onClick={() => setPagina(prev => prev - 1)}
                            style={{ padding: '8px 16px', cursor: pagina === 1 ? 'not-allowed' : 'pointer', background: '#ddd', border: 'none' }}
                        >
                            Anterior
                        </button>
                        <span>Página <strong>{pagina}</strong> de {totalPaginas}</span>
                        <button 
                            disabled={pagina === totalPaginas} 
                            onClick={() => setPagina(prev => prev + 1)}
                            style={{ padding: '8px 16px', cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer', background: '#ddd', border: 'none' }}
                        >
                            Siguiente
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminPanel;