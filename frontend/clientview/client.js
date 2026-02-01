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

// --- LÓGICA DE CARRITO MEJORADA ---
    const cartModal = document.getElementById('cartModal');
    const closeCart = document.getElementById('closeCart');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalValue = document.getElementById('cartTotalValue');

    const renderizarCarrito = () => {
        if (carrito.length === 0) {
            cartItemsContainer.innerHTML = '<p style="color:#888; text-align:center; margin-top:20px;">Tu bolsa está vacía.</p>';
            cartTotalValue.innerText = '$0.00';
        } else {
            cartItemsContainer.innerHTML = carrito.map((p, index) => `
                <div class="cart-item">
                    <div>
                        <div style="font-weight:bold; font-size:14px;">${p.nombre}</div>
                        <div style="color:#888;">$${p.precio}</div>
                    </div>
                    <button class="remove-item" onclick="eliminarDelCarrito(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

            const total = carrito.reduce((sum, p) => sum + p.precio, 0);
            cartTotalValue.innerText = `$${total.toFixed(2)}`;
        }
        if (cartCount) cartCount.innerText = carrito.length;
    };

    window.agregarAlCarrito = (nombre, precio) => {
        carrito.push({ nombre, precio });
        localStorage.setItem('makia_cart', JSON.stringify(carrito));
        renderizarCarrito();
    };

    window.eliminarDelCarrito = (index) => {
        carrito.splice(index, 1);
        localStorage.setItem('makia_cart', JSON.stringify(carrito));
        renderizarCarrito();
    };

    // Abrir Carrito
    if (btnAbrirBolsa) {
        btnAbrirBolsa.addEventListener('click', () => {
            cartModal.classList.add('active');
            renderizarCarrito();
        });
    }

    // Cerrar Carrito
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            cartModal.classList.remove('active');
        });
    }
    
    // Carga inicial
    loadProducts();
    renderizarCarrito();
    
// --- LÓGICA DE USUARIO Y SESIÓN ---
    const userIcon = document.getElementById('userIcon');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (userIcon && userDropdown) {
        userIcon.addEventListener('click', (e) => {
            e.stopPropagation(); 
            userDropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            userDropdown.classList.remove('active');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Opcional: Limpiar carrito al cerrar sesion, por ver
            // localStorage.removeItem('makia_cart');
            window.location.href = '../login/login.html'; 
        });
    }
                          
    // --- LÓGICA DE FINALIZAR COMPRA ---
    const checkoutBtn = document.querySelector('.checkout-btn');
    const orderModal = document.getElementById('orderSuccessModal');
    const orderIdDisplay = document.getElementById('generatedOrderID');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const randomID = Math.floor(Math.random() * 900000000000) + 100000000000;
            orderIdDisplay.textContent = randomID;
            cartModal.classList.remove('active');
            orderModal.style.display = 'flex';
            localStorage.removeItem('makia_cart'); 
        });
    }

// Cerrar el modal de éxito
closeSuccessBtn.addEventListener('click', () => {
    orderModal.style.display = 'none';
    location.reload(); 
});
});
