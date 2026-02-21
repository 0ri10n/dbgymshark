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

    useEffect(() => {
        const obtenerProductos = async () => {
            setCargando(true);
            try {
                const baseURL = import.meta.env.VITE_API_URL || 'https://dbgymshark.onrender.com/api';
                const url = `${baseURL}/productos?page=${pagina}&limit=20`;
                const respuesta = await axios.get(url);

                if (respuesta.data.productos) {
                    const paginasRaw = respuesta.data.paginasTotales || respuesta.data.pagination?.pages || 1;
                    const paginas = Math.max(Number(paginasRaw) || 1, 1);
                    setProductos(respuesta.data.productos);
                    setTotalPaginas(paginas);
                } else {
                    setProductos(Array.isArray(respuesta.data) ? respuesta.data : []);
                    setTotalPaginas(1);
                }
            } catch (error) {
                console.error('Error al cargar productos en panel admin:', error);
            } finally {
                setCargando(false);
            }
        };

        obtenerProductos();
    }, [pagina]);

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
                    <div className="admin-stat-card">
                        <h3>Productos</h3>
                        <p>Listo para gestionar el inventario</p>
                    </div>
                    <div className="admin-stat-card">
                        <h3>Ventas</h3>
                        <p>$0.00 MXN hoy</p>
                    </div>
                    <div className="admin-stat-card">
                        <h3>Usuarios</h3>
                        <p>Base de datos activa</p>
                    </div>
                </section>

                <section className="admin-actions">
                    <div className="admin-section-header">
                        <h2>Gestion de Catalogo (DBGymshark)</h2>
                        <button className="admin-add-btn">
                            + Agregar Nuevo Producto
                        </button>
                    </div>

                    {cargando ? (
                        <p>Cargando inventario del servidor...</p>
                    ) : (
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
                                            <td data-label="Precio (MXN)">${prod.precioMXN}</td>
                                            <td data-label="Tipo">{prod.product_type || 'N/A'}</td>
                                            <td data-label="Acciones" className="admin-row-actions">
                                                <button className="admin-edit-btn">Editar</button>
                                                <button className="admin-delete-btn">Eliminar</button>
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
                        groupSize={8}
                        className="admin-pagination-theme"
                        ariaLabel="Paginacion del panel de administracion"
                        onPageChange={(nextPage) => setPagina(nextPage)}
                    />
                </section>
            </main>
        </div>
    );
};

export default AdminPanel;
