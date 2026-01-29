document.addEventListener('DOMContentLoaded', async () => {
    const dbSelector = document.getElementById('dbSelector');
    const tablesNav = document.getElementById('tablesNav');
    const tableBody = document.getElementById('adminTableBody');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }

    // 1. CARGAR BASES DE DATOS REALES AL INICIAR
    async function cargarDBs() {
        try {
            const respuesta = await fetch('http://localhost:4000/api/admin/dbs', {
                headers: { 'x-auth-token': token }
            });
            const dbs = await respuesta.json();

            if (respuesta.ok) {
                dbSelector.innerHTML = '<option value="">Seleccionar DB</option>' +
                    dbs.map(db => `<option value="${db}">${db}</option>`).join('');
            }
        } catch (error) {
            console.error('Error al cargar DBs:', error);
        }
    }

    cargarDBs();

    // 2. EVENTO AL CAMBIAR DE DB (CARGAR TABLAS/COLECCIONES REALES)
    dbSelector.addEventListener('change', async (e) => {
        const selectedDB = e.target.value;
        tablesNav.innerHTML = ''; 

        if (selectedDB) {
            try {
                const respuesta = await fetch(`http://localhost:4000/api/admin/tablas/${selectedDB}`, {
                    headers: { 'x-auth-token': token }
                });
                const tablas = await respuesta.json();

                if (tablas.length > 0) {
                    tablas.forEach(tableName => {
                        const link = document.createElement('a');
                        link.href = '#';
                        link.textContent = tableName;
                        link.onclick = (event) => {
                            event.preventDefault();
                            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
                            link.classList.add('active');
                            loadTableData(selectedDB, tableName);
                        };
                        tablesNav.appendChild(link);
                    });
                } else {
                    tablesNav.innerHTML = '<p class="nav-hint">No hay tablas en esta DB</p>';
                }
            } catch (error) {
                console.error('Error al cargar tablas:', error);
            }
        } else {
            tablesNav.innerHTML = '<p class="nav-hint">Seleccione una DB para ver tablas</p>';
        }
    });

    // 3. FUNCIÓN PARA CARGAR DATOS REALES DE UNA TABLA
    async function loadTableData(dbName, tableName) {
        document.getElementById('currentTableName').textContent = tableName;
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando datos...</td></tr>';
        
        try {
            const respuesta = await fetch(`http://localhost:4000/api/admin/datos/${dbName}/${tableName}`, {
                headers: { 'x-auth-token': token }
            });
            const documentos = await respuesta.json();

            if (documentos.length > 0) {
                tableBody.innerHTML = documentos.map((doc, index) => `
                    <tr>
                        <td><input type="checkbox"></td>
                        <td>${doc._id || index + 1}</td>
                        <td>${doc.nombre || doc.name || 'N/A'}</td>
                        <td>${doc.email || doc.valor || 'N/A'}</td>
                        <td>${doc.rol || 'Cliente'}</td>
                        <td>${new Date(doc.registro || Date.now()).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            } else {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">La tabla está vacía</td></tr>';
            }
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar datos</td></tr>';
        }
    }

    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = this.checked);
    });
});