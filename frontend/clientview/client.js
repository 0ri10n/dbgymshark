document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://dbgymshark.onrender.com/api';
    let carrito = JSON.parse(localStorage.getItem('makia_cart')) || [];
    let selectedSize = '';
    let filterStock = '';

    const grid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const cartCount = document.getElementById('cartCount');
    const checkAvailable = document.getElementById('checkAvailable');
    const checkOutOfStock = document.getElementById('checkOutOfStock');

    async function loadProducts(query = '', ignoreSize = false) {
        if (!grid) return;
        grid.innerHTML = '<div style="color:white; padding:20px;">Cargando catálogo...</div>';
        
        const tallaParaEnviar = ignoreSize ? '' : selectedSize;

        try {
            // Agregamos un timestamp para evitar que el navegador guarde versiones viejas (Cache Busting)
            const url = `${API_BASE_URL}/productos?search=${query}&talla=${tallaParaEnviar}&stock=${filterStock}&t=${new Date().getTime()}`;
            const res = await fetch(url);
            
            if (!res.ok) throw new Error("Error en la respuesta del servidor");

            const data = await res.json();
            const listaProductos = data.productos || data; 

            // LOG DE DEPURACIÓN: Esto te dirá en la consola F12 qué campos tiene tu producto
            console.log("Datos recibidos:", listaProductos[0]);

            if (!Array.isArray(listaProductos) || listaProductos.length === 0) {
                grid.innerHTML = '<div style="color:white; padding:20px;">No se encontraron productos con estos filtros.</div>';
                return;
            }

            grid.innerHTML = listaProductos.map(p => {
                // TRUCO: Buscamos el campo sin importar si es P.IMAGE_SRC o p.image_src
                const rawImages = p.IMAGE_SRC || p.image_principal || p.image_src || "";
                
                // Limpieza de URLs múltiples
                const imagenFinal = rawImages.split(',')[0].trim();
                
                // Si la URL no tiene protocolo (Shopify a veces usa //cdn...), se lo agregamos
                let srcFixed = imagenFinal;
                if (srcFixed.startsWith('//')) srcFixed = 'https:' + srcFixed;
                if (!srcFixed.startsWith('http')) srcFixed = 'https://placehold.co/400x400?text=Sin+Imagen';

                const nombre = p.TITLE || p.title || "Producto";
                const precio = p.PRICE || (p.price_range ? p.price_range.min : 0) || 0;

                return `
                    <div class="product-card">
                        <div class="product-image-container">
                            <img src="${srcFixed}" 
                                 alt="${nombre}" 
                                 loading="lazy"
                                 onerror="this.src='https://placehold.co/400x400?text=Error+Link';">
                        </div>
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
            grid.innerHTML = `<div style="color:red; padding:20px;">Error al conectar: ${err.message}</div>`;
        }
    }

    // --- FUNCIONES DE CARRITO Y FILTROS (Se mantienen igual) ---
    window.agregarAlCarrito = (nombre, precio) => {
        carrito.push({ nombre, precio });
        localStorage.setItem('makia_cart', JSON.stringify(carrito));
        if (cartCount) cartCount.innerText = carrito.length;
    };

    if (searchInput) {
        searchInput.oninput = (e) => loadProducts(e.target.value, e.target.value.trim() !== "");
    }

    // Carga inicial
    loadProducts();
});