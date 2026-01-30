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
            const res = await fetch(`http://localhost:4000/api/productos?search=${query}&talla=${tallaParaEnviar}&stock=${filterStock}`);
            const data = await res.json();

            if (countAvailable) countAvailable.innerText = data.counts.totalDisponible;
            if (countOutOfStock) countOutOfStock.innerText = data.counts.totalAgotado;

            if (!data.productos || data.productos.length === 0) {
                grid.innerHTML = '<div style="color:white; padding:20px;">No se encontraron productos.</div>';
                return;
            }

            grid.innerHTML = data.productos.map(p => `
                <div class="product-card">
                    <div class="wishlist-btn" onclick="toggleFav(this)">
                        <i class="far fa-heart"></i>
                    </div>
                    <div class="img-container">
                        <img src="${p.imagenUrl || p.image || p.img}" alt="${p.nombre || p.name}">
                    </div>
                    <div class="product-info">
                        <div class="product-name">${p.nombre || p.name}</div>
                        <div class="product-price">$ ${p.precio || p.price}</div>
                        <button class="add-btn" onclick="agregarAlCarrito('${p.nombre || p.name}', ${p.precio || p.price})">
                            Añadir a la bolsa
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
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