document.addEventListener('DOMContentLoaded', () => {
    let carrito = JSON.parse(localStorage.getItem('makia_cart')) || [];
    let selectedSize = '';
    let filterStock = '';

    const grid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const cartCount = document.getElementById('cartCount');

    const checkAvailable = document.getElementById('checkAvailable');
    const checkOutOfStock = document.getElementById('checkOutOfStock');
    const countAvailable = document.getElementById('countAvailable');
    const countOutOfStock = document.getElementById('countOutOfStock');

    const btnAbrirBolsa = document.getElementById('openCart');

    if (btnAbrirBolsa) {
        btnAbrirBolsa.onclick = () => {
            if (carrito.length === 0) {
                alert("Tu bolsa está vacía.");
            } else {
                // Creamos un resumen rápido del contenido
                const detalle = carrito.map((p, index) => `${index + 1}. ${p.nombre} - $${p.precio}`).join('\n');
                const total = carrito.reduce((sum, p) => sum + p.precio, 0);

                alert(`Artículos en tu bolsa:\n\n${detalle}\n\nTotal a pagar: $${total}`);
            }
        };
    }

    const actualizarContador = () => {
        if (cartCount) cartCount.innerText = carrito.length;
    };

async function loadProducts(query = '', ignoreSize = false) {
    grid.innerHTML = '<div style="color:white; padding:20px;">Cargando catálogo...</div>';
    const tallaParaEnviar = ignoreSize ? '' : selectedSize;

    try {
        const res = await fetch(`/api/productos?search=${query}&talla=${tallaParaEnviar}&stock=${filterStock}`);
        const data = await res.json();

        const listaProductos = data.productos || data; 

        if (!Array.isArray(listaProductos) || listaProductos.length === 0) {
            grid.innerHTML = '<div style="color:white; padding:20px;">No se encontraron productos.</div>';
            return;
        }

        grid.innerHTML = listaProductos.map(p => `
            <div class="product-card">
                </div>
        `).join('');
    } catch (err) {
        console.error("Error en fetch:", err);
        grid.innerHTML = '<div style="color:red; padding:20px;">Error al conectar con el servidor.</div>';
    }
}

    if (checkAvailable) {
        checkAvailable.onclick = () => {
            if (checkAvailable.checked) {
                checkOutOfStock.checked = false;
                filterStock = 'true';
            } else {
                filterStock = '';
            }
            loadProducts(searchInput ? searchInput.value : '');
        };
    }

    if (checkOutOfStock) {
        checkOutOfStock.onclick = () => {
            if (checkOutOfStock.checked) {
                checkAvailable.checked = false;
                filterStock = 'false';
            } else {
                filterStock = '';
            }
            loadProducts(searchInput ? searchInput.value : '');
        };
    }

    const viewAllBtn = document.querySelector('.view-all');
    if (viewAllBtn) {
        viewAllBtn.onclick = () => {
            if (searchInput) searchInput.value = '';
            selectedSize = '';
            filterStock = '';
            if (checkAvailable) checkAvailable.checked = false;
            if (checkOutOfStock) checkOutOfStock.checked = false;
            document.querySelectorAll('#sizeFilters button').forEach(btn => btn.classList.remove('active'));
            loadProducts('', false);
        };
    }

    window.agregarAlCarrito = (nombre, precio) => {
        carrito.push({ nombre, precio });
        localStorage.setItem('makia_cart', JSON.stringify(carrito));
        actualizarContador();
    };

    if (searchInput) {
        searchInput.oninput = (e) => {
            const valorBusqueda = e.target.value;
            const debeIgnorarTalla = valorBusqueda.trim() !== "";
            loadProducts(valorBusqueda, debeIgnorarTalla);
        };
    }

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

    loadProducts();
    actualizarContador();
});
