import React from 'react';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { user, logout } = useAuth(); // Obtenemos el usuario y la función de salida

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
                    <h2>Gestión de Catálogo (DBGymshark)</h2>
                    <p style={{ color: '#666' }}>
                        Isaac, aquí puedes empezar a programar el CRUD para los más de 100 productos. 
                        La seguridad ya está activa: solo tú y Kevin pueden ver esto.
                    </p>
                    
                    {/* Botón placeholder para Isaac */}
                    <button style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        + Agregar Nuevo Producto
                    </button>
                </section>
            </main>
        </div>
    );
};

export default AdminPanel;