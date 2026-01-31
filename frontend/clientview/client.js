document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURACIÓN: La URL de tu API en Render
    const API_BASE_URL = 'https://dbgymshark.onrender.com/api';

    let carrito = JSON.parse(localStorage.getItem('makia_cart')) || [];
    let selectedSize = '';
    let filterStock = '';

    const grid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const cartCount = document.getElementById('cartCount');
    const checkAvailable = document.getElementById('checkAvailable');
    const checkOutOfStock = document.getElementById('checkOutOfStock');
    const btnAbrirBolsa = document.getElementById('openCart');

    // --- LÓGICA DE PRODUCTOS ---

    async function loadProducts(query = '', ignoreSize = false) {
        if (!grid) return;
        grid.innerHTML = '<div style="color:white; padding:20px;">Cargando catálogo...</div>';
        
        const tallaParaEnviar = ignoreSize ? '' : selectedSize;

        try {
            // CORRECCIÓN: Usamos la URL completa de Render
            const res = await fetch(`${API_BASE_URL}/productos?search=${query}&talla=${tallaParaEnviar}&stock=${filterStock}`);
            
            if (!res.ok) throw new Error("Error en la respuesta del servidor");

            const data = await res.json();
            const listaProductos = data.productos || data; 

            if (!Array.isArray(listaProductos) || listaProductos.length === 0) {
                grid.innerHTML = '<div style="color:white; padding:20px;">No se encontraron productos.</div>';
                return;
            }

            // Renderizamos las tarjetas (He añadido la estructura básica para que se vean)
            // Dentro de loadProducts en client.js
            grid.innerHTML = listaProductos.map(p => {
                // Mapeo manual porque los nombres en la DB son en inglés (Modelo Producto.js)
                const nombre = p.title || p.nombre || "Producto sin nombre"; 
                const precio = p.price_range?.min || (p.variants?.[0]?.price) || 0;
                const imagen = p.image_principal || p.imagen || 'https://via.placeholder.com/200';

                return `
                <div class="product-card">
                <img src="${imagen}" alt="${nombre}" onerror="this.src='https://via.placeholder.com/200'">
                <div class="product-info">
                        <h3>${nombre}</h3>
                        <p class="price">$${precio}</p>
                        <button onclick="agregarAlCarrito('${nombre}', ${precio})">Agregar a la bolsa</button>
                    </div>
                </div>
                `;
            }).join('');

        } catch (err) {
            console.error("Error en fetch:", err);
            grid.innerHTML = '<div style="color:red; padding:20px;">Error al conectar con el servidor. Verifica tu conexión.</div>';
        }
    }

    // --- RESTO DE TUS FUNCIONES (Se mantienen igual) ---

    const actualizarContador = () => {
        if (cartCount) cartCount.innerText = carrito.length;
    };

    if (btnAbrirBolsa) {
        btnAbrirBolsa.onclick = () => {
            if (carrito.length === 0) {
                alert("Tu bolsa está vacía.");
            } else {
                const detalle = carrito.map((p, index) => `${index + 1}. ${p.nombre} - $${p.precio}`).join('\n');
                const total = carrito.reduce((sum, p) => sum + p.precio, 0);
                alert(`Artículos en tu bolsa:\n\n${detalle}\n\nTotal a pagar: $${total}`);
            }
        };
    }

    // Filtros de Stock
    if (checkAvailable) {
        checkAvailable.onclick = () => {
            if (checkAvailable.checked) {
                if(checkOutOfStock) checkOutOfStock.checked = false;
                filterStock = 'true';
            } else { filterStock = ''; }
            loadProducts(searchInput ? searchInput.value : '');
        };
    }

    if (checkOutOfStock) {
        checkOutOfStock.onclick = () => {
            if (checkOutOfStock.checked) {
                if(checkAvailable) checkAvailable.checked = false;
                filterStock = 'false';
            } else { filterStock = ''; }
            loadProducts(searchInput ? searchInput.value : '');
        };
    }

    // Buscador
    if (searchInput) {
        searchInput.oninput = (e) => {
            const valorBusqueda = e.target.value;
            loadProducts(valorBusqueda, valorBusqueda.trim() !== "");
        };
    }

    // Tallas
    document.querySelectorAll('#sizeFilters button').forEach(btn => {
        btn.onclick = () => {
            const isAlreadyActive = btn.classList.contains('active');
            document.querySelectorAll('#sizeFilters button').forEach(b => b.classList.remove('active'));
            if (isAlreadyActive) {
                selectedSize = '';
            } else {
                btn.classList.add('active');
                selectedSize = btn.innerText;
            }
            loadProducts(searchInput ? searchInput.value : '');
        };
    });

    window.agregarAlCarrito = (nombre, precio) => {
        carrito.push({ nombre, precio });
        localStorage.setItem('makia_cart', JSON.stringify(carrito));
        actualizarContador();
    };

    // Carga inicial
    loadProducts();
    actualizarContador();
});