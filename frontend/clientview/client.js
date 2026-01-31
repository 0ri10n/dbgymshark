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
const rawImages = p.IMAGE_SRC || p.image_src || p.image_principal || p.imagen || "";
let imagenFinal = "";

if (Array.isArray(rawImages)) {
    imagenFinal = rawImages[0];
} else {
    imagenFinal = rawImages.split(',')[0].trim();
}

if (!imagenFinal) {
    imagenFinal = 'https://placehold.co/400x500?text=Sin+Imagen';
} 
else if (imagenFinal.startsWith('http')) {
    // Si ya es una URL completa, la dejamos así
    imagenFinal = imagenFinal;
}
else if (imagenFinal.startsWith('//')) {
    imagenFinal = 'https:' + imagenFinal;
}
else {
    // Si solo es el nombre del archivo (ej: "botella.png")
    // Gymshark suele usar este formato para sus imágenes:
    imagenFinal = `https://cdn.shopify.com/s/files/1/0156/6146/products/${imagenFinal}`;
}
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
    // Abrir el carrito al hacer clic en la bolsita
    // Abrir el carrito al hacer clic en la bolsita (CORREGIDO)
if (btnAbrirBolsa) {
    btnAbrirBolsa.addEventListener('click', () => {
        if (carrito.length === 0) {
            alert("Tu bolsa está vacía.");
        } else {
            const detalle = carrito.map((p, index) => `${index + 1}. ${p.nombre} - $${p.precio}`).join('\n');
            const total = carrito.reduce((sum, p) => sum + p.precio, 0);
            alert(`Artículos en tu bolsa:\n\n${detalle}\n\nTotal a pagar: $${total.toFixed(2)}`);
        }
    });
}
    // Carga inicial
    loadProducts();
    actualizarContador();

    
// --- LÓGICA DE USUARIO Y SESIÓN ---
    const userIcon = document.getElementById('userIcon');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    // 1. Mostrar/Ocultar el menú al hacer clic en el icono
    if (userIcon && userDropdown) {
        userIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic se propague al documento
            userDropdown.classList.toggle('active');
        });

        // Cerrar el menú si se hace clic fuera de él
        document.addEventListener('click', () => {
            userDropdown.classList.remove('active');
        });
    }

    // 2. Funcionalidad del botón Cerrar Sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Eliminar datos de sesión
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Opcional: Limpiar carrito si quieres que sea una sesión limpia
            // localStorage.removeItem('makia_cart');

            alert("Cerrando sesión...");
            
            // Redirigir (cambia 'index.html' por tu página de inicio/login)
            window.location.href = '../login/login.html'; 
        });
    }
});
