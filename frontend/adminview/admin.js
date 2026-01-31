document.addEventListener('DOMContentLoaded', async () => {
    // 1. SELECTORES GLOBALES
    const dbSelector = document.getElementById('dbSelector');
    const tablesNav = document.getElementById('tablesNav');
    const tableBody = document.getElementById('adminTableBody');
    const tableHead = document.getElementById('adminTableHead');
    const currentTableNameElem = document.getElementById('currentTableName');
    const token = localStorage.getItem('token');
    const estructuras = {
    usuarios: ['nombre', 'email', 'registro']
    // Si agregas más tablas a tu DB, solo pon el nombre aquí
};

    // Variables de estado para el Modal
    let editMode = false;
    let currentEditId = null;

    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }

    // --- FUNCIONES DE CARGA ---

    async function cargarDBs() {
        try {
            const respuesta = await fetch('http://localhost:4000/api/admin/dbs', {
                headers: { 'x-auth-token': token }
            });

            if (respuesta.status === 401 || respuesta.status === 403) {
                alert("Sesión expirada. Redirigiendo al login...");
                localStorage.removeItem('token');
                window.location.href = '../login/login.html';
                return;
            }

            const dbs = await respuesta.json();
            if (respuesta.ok) {
                dbSelector.innerHTML = '<option value="">Seleccionar DB</option>' +
                    dbs.map(db => `<option value="${db}">${db}</option>`).join('');
            }
        } catch (error) {
            console.error('Error al cargar DBs:', error);
        }
    }

// 2. Aquí la función que carga los datos sin romperse
async function loadTableData(dbName, tableName) {
    const currentTableNameElem = document.getElementById('currentTableName');
    const tableBody = document.getElementById('adminTableBody');
    const tableHead = document.getElementById('adminTableHead');

    currentTableNameElem.textContent = tableName;
    tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Cargando...</td></tr>';

    try {
        const respuesta = await fetch(`http://localhost:4000/api/admin/datos/${dbName}/${tableName}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        const documentos = await respuesta.json();

        let todasLasLlaves = new Set();

        // Inteligencia: Si conocemos la tabla, sugerimos columnas
        const tablaKey = tableName.toLowerCase();
        if (estructuras[tablaKey]) {
            estructuras[tablaKey].forEach(col => todasLasLlaves.add(col));
        }

        // Escaneamos lo que venga de la DB
        if (Array.isArray(documentos) && documentos.length > 0) {
            documentos.forEach(doc => {
                Object.keys(doc).forEach(key => {
                    if (key !== '__v' && key !== 'password') todasLasLlaves.add(key);
                });
            });
        }

        const columnas = Array.from(todasLasLlaves);

        // Si después de todo no hay columnas (tabla nueva y vacía), ponemos una por defecto
        if (columnas.length === 0) columnas.push('nombre');

        // Renderizar Encabezados
        tableHead.innerHTML = `
            <tr>
                <th><input type="checkbox" id="selectAll"></th>
                ${columnas.map(col => `<th>${col.toUpperCase()}</th>`).join('')}
            </tr>
        `;

        // Renderizar Filas
        if (Array.isArray(documentos) && documentos.length > 0) {
            tableBody.innerHTML = documentos.map(doc => `
                <tr>
                    <td><input type="checkbox" value="${doc._id}"></td>
                    ${columnas.map(col => {
                        let valor = doc[col] !== undefined ? doc[col] : '';
                        if (Array.isArray(valor)) valor = valor.join(', ');
                        if (col === '_id') valor = `<code>${valor.toString().substring(0, 8)}...</code>`;
                        return `<td>${valor}</td>`;
                    }).join('')}
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Tabla vacía. Haz clic en "Agregar" para empezar.</td></tr>';
        }

        // Re-vincular el checkbox maestro
        const selectAll = document.getElementById('selectAll');
        if(selectAll) {
            selectAll.onclick = (e) => {
                const checks = tableBody.querySelectorAll('input[type="checkbox"]');
                checks.forEach(c => c.checked = e.target.checked);
            };
        }

    } catch (error) {
        console.error("Error cargando tabla:", error);
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Error al cargar datos.</td></tr>';
    }
}

    // --- EVENTOS DE INTERFAZ ---

    dbSelector.addEventListener('change', async (e) => {
        const selectedDB = e.target.value;
        tablesNav.innerHTML = '';
        if (!selectedDB) return;
        try {
            const respuesta = await fetch(`http://localhost:4000/api/admin/tablas/${selectedDB}`, {
                headers: { 'x-auth-token': token }
            });
            const tablas = await respuesta.json();
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
        } catch (error) { console.error('Error:', error); }
    });

    // --- LÓGICA DE MODAL UNIVERSAL ---

    function abrirModal(titulo, esEdicion = false, datosPrevios = null) {
        editMode = esEdicion;
        document.getElementById('modalTitle').textContent = titulo;
        const fieldsContainer = document.getElementById('modalFields');
        fieldsContainer.innerHTML = '';

        let headers = Array.from(document.querySelectorAll('#adminTableHead th'))
                             .map(th => th.textContent.trim())
                             .filter(h => h !== '' && h !== 'ID' && h !== '_ID');

        if (headers.length === 0) headers = ['nombre', 'precio', 'categoria'];

        headers.forEach(header => {
            const valor = datosPrevios ? (datosPrevios[header.toLowerCase()] || '') : '';
            fieldsContainer.innerHTML += `
                <div style="margin-bottom:15px;">
                    <label style="display:block; color:#aaa; font-size:0.8rem;">${header.toUpperCase()}</label>
                    <input type="text" id="field_${header}" class="form-control" 
                           value="${valor}"
                           style="width:100%; background:#222; color:white; border:1px solid #444; padding:8px;">
                </div>`;
        });
        document.getElementById('dynamicModal').style.display = 'block';
    }

    // --- BOTONES DE ACCIÓN ---

    // AGREGAR
    document.querySelector('.btn-primary:nth-child(1)').onclick = () => {
        const dbName = dbSelector.value;
        const tableName = currentTableNameElem.textContent.trim();
        if (!dbName || tableName === "NombreTabla1") return alert("Selecciona una tabla");
        abrirModal("➕ Nuevo Registro", false);
    };

    // EDITAR
    document.querySelector('.btn-primary:nth-child(2)').onclick = () => {
        const seleccionado = document.querySelector('#adminTableBody input[type="checkbox"]:checked');
        if (!seleccionado) return alert("Selecciona un registro para editar");

        const fila = seleccionado.closest('tr');
        const headers = Array.from(document.querySelectorAll('#adminTableHead th')).map(th => th.textContent.trim());
        let datosPrevios = {};
        
        Array.from(fila.cells).forEach((cell, index) => {
            if (headers[index] && headers[index] !== '') {
                datosPrevios[headers[index].toLowerCase()] = cell.textContent.trim();
            }
        });

        currentEditId = seleccionado.value;
        abrirModal("✏️ Editar Registro", true, datosPrevios);
    };

    // ELIMINAR
    document.querySelector('.btn-primary:nth-child(3)').onclick = async () => {
        const dbName = dbSelector.value;
        const tableName = currentTableNameElem.textContent.trim();
        const seleccionados = Array.from(tableBody.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

        if (!dbName || !tableName || seleccionados.length === 0) return alert("Selección inválida");

        if (confirm(`¿Eliminar ${seleccionados.length} elementos?`)) {
            try {
                for (let id of seleccionados) {
                    await fetch(`http://localhost:4000/api/admin/eliminar/${dbName}/${tableName}/${id}`, {
                        method: 'DELETE',
                        headers: { 'x-auth-token': token }
                    });
                }
                alert("Eliminado con éxito");
                loadTableData(dbName, tableName);
            } catch (error) { alert("Error al eliminar"); }
        }
    };

    // BOTÓN GUARDAR (MODAL)
    document.getElementById('btnSave').onclick = async () => {
        const dbName = dbSelector.value;
        const tableName = currentTableNameElem.textContent.trim();
        const headers = Array.from(document.querySelectorAll('#adminTableHead th'))
                             .map(th => th.textContent.trim())
                             .filter(h => h !== '' && h !== 'ID' && h !== '_ID');

        const bodyData = {};
        headers.forEach(h => {
            bodyData[h.toLowerCase()] = document.getElementById(`field_${h}`).value;
        });

        const url = editMode 
            ? `http://localhost:4000/api/admin/editar/${dbName}/${tableName}/${currentEditId}`
            : `http://localhost:4000/api/admin/crear/${dbName}/${tableName}`;
        
        const metodo = editMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                document.getElementById('dynamicModal').style.display = 'none';
                loadTableData(dbName, tableName);
                alert(editMode ? "Actualizado correctamente" : "Creado correctamente");
            }
        } catch (error) { alert("Error en el servidor"); }
    };

    cargarDBs();
});