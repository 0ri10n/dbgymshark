document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://dbgymshark.onrender.com/api';

    let carrito = JSON.parse(localStorage.getItem('makia_cart')) || [];
    let selectedSize = '';
    let filterStock = '';

    const grid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('searchInput');
    const cartCount = document.getElementById('cartCount');
    const btnAbrirBolsa = document.getElementById('openCart');

    async function loadProducts(query = '', ignoreSize = false) {
        if (!grid) return;
        
        const tallaParaEnviar = ignoreSize ? '' : selectedSize;

        try {
            const url = `${API_BASE_URL}/productos?search=${query}&talla=${tallaParaEnviar}&stock=${filterStock}`;
            const res = await fetch(url);
            
            if (!res.ok) throw new Error("Error en la respuesta del servidor");

            const data = await res.json();
            const listaProductos = data.productos || data; 

            if (!Array.isArray(listaProductos) || listaProductos.length === 0) {
                grid.innerHTML = '<div style="color:white; padding:20px;">No se encontraron productos.</div>';
                return;
            }

            // RENDERIZADO DE TARJETAS
            grid.innerHTML = listaProductos.map(p => {
                // 1. LIMPIEZA DE IMAGEN
                const rawImages = p.IMAGE_SRC || p.image_principal || ""; 
                let imagenFinal = rawImages.split(',')[0].trim();
                
                // Corregir protocolos para evitar Mixed Content
                if (imagenFinal.startsWith('//')) imagenFinal = 'https:' + imagenFinal;
                if (!imagenFinal.startsWith('http')) imagenFinal = 'https://placehold.co/400x500?text=Sin+Imagen';

                // 2. DATOS (Usando MAYÚSCULAS según tu DB)
                const nombre = p.TITLE || p.title || "Producto Gymshark";
                const precio = p.PRICE || p.price || 0; 

                return `
                    <div class="product-card">
                        <div class="product-image-container">
                            <img src="${imagenFinal}" 
                                 alt="${nombre}" 
                                 onerror="this.src='https://placehold.co/400x500?text=Error+Link';">
                        </div>
                        <div class="product-info">
                            <h3>${nombre}</h3>
                            <p class="price">$${precio}</p>
                            <button onclick="agregarAlCarrito('${nombre.replace(/'/g, "\\'")}', ${precio})">
                                Agregar a la bolsa
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error("Error en fetch:", err);
            grid.innerHTML = `<div style="color:red; padding:20px;">Error: ${err.message}</div>`;
        }
    }

    // Funciones de Carrito
    window.agregarAlCarrito = (nombre, precio) => {
        carrito.push({ nombre, precio });
        localStorage.setItem('makia_cart', JSON.stringify(carrito));
        if (cartCount) cartCount.innerText = carrito.length;
    };

    const actualizarContador = () => {
        if (cartCount) cartCount.innerText = carrito.length;
    };

    // Buscador
    if (searchInput) {
        searchInput.oninput = (e) => loadProducts(e.target.value, e.target.value.trim() !== "");
    }

    // Carga inicial
    loadProducts();
    actualizarContador();
});