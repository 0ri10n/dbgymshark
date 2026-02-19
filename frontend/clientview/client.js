document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api';

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
                    imagenFinal = imagenFinal;
                }

                else if (imagenFinal.startsWith('//')) {
                    imagenFinal = 'https:' + imagenFinal;
                }
                
                else {
                    imagenFinal = `https://cdn.shopify.com/s/files/1/0156/6146/products/${imagenFinal}`;
                }

                // 2. DATOS BÁSICOS
                const nombre = p.TITLE || p.title || "Producto Gymshark";
                const precio = p.PRICE || p.price || 0; 
                // Usamos el handle o el ID para identificar el select de tallas de forma única
                const productoId = p.handle || p._id;

                // 3. GENERAR OPCIONES DE TALLA (Basado en variantes agrupadas)
                // Filtramos variantes para que solo aparezcan las que tienen inventario si lo deseas
                const opcionesTalla = p.variantes && p.variantes.length > 0 
                    ? p.variantes.map(v => {
                        const stockInfo = v.inventory > 0 ? `(${v.inventory} disp.)` : '(Agotado)';
                        const disabled = v.inventory <= 0 ? 'disabled' : '';
                        return `<option value="${v.talla}" ${disabled}>${v.talla} ${stockInfo}</option>`;
                    }).join('')
                    : '<option value="">Sin tallas disponibles</option>';

                // 4. RETORNO DEL HTML DE LA TARJETA
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
                   <div class="size-selection-wrapper">
                   <label for="size-${productoId}" style="font-size: 10px; color: #888;">SELECCIONAR TALLA:</label>
                   <select id="size-${productoId}" class="size-selector">
                   ${opcionesTalla}
                   </select>
                   </div>
                   <button onclick="prepararCompra('${productoId}', '${nombre.replace(/'/g, "\\'")}', ${precio})">
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

    if (searchInput) {
        searchInput.oninput = (e) => loadProducts(e.target.value, e.target.value.trim() !== "");
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


    document.querySelectorAll('.size-grid button').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.size-grid button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Traducción simple para que coincida con Gymshark/MongoDB
            let tallaTaller = btn.innerText;
            if(tallaTaller === "XS") tallaTaller = "Extra Small";
            if(tallaTaller === "S")  tallaTaller = "Small";
            if(tallaTaller === "M")  tallaTaller = "Medium";
            if(tallaTaller === "L")  tallaTaller = "Large";
            if(tallaTaller === "XL") tallaTaller = "Extra Large";
            
            selectedSize = tallaTaller; 
            loadProducts();   
        };
    });

    document.querySelectorAll('.filter-section input[type="checkbox"]').forEach(check => {
        check.onchange = () => {
            if (check.parentElement.textContent.includes('Disponibles')) {
                filterStock = check.checked ? 'true' : '';
            }
            loadProducts();
        };
    });
    
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
    checkoutBtn.addEventListener('click', async () => {
        if (carrito.length === 0) return alert("Tu bolsa está vacía");

        const randomID = Math.floor(Math.random() * 900000000000) + 100000000000;
        const totalCompra = carrito.reduce((sum, p) => sum + p.precio, 0);

        try {
            const res = await fetch(`${API_BASE_URL}/productos/ventas`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_venta: randomID,
                    productos: carrito,
                    total: totalCompra
                })
            });

            const data = await res.json(); // Para leer mensajes de error del backend
         
            if (res.ok) {
                orderIdDisplay.textContent = randomID;
                cartModal.classList.remove('active');
                orderModal.style.display = 'flex';
                localStorage.removeItem('makia_cart');
                carrito = [];
                renderizarCarrito();
            } else {
                alert("Error: " + (data.message || "No se pudo procesar la compra"));
            }
        } catch (err) {
            alert("Error al procesar la compra");
        }
    });
}

// Cerrar el modal de éxito
closeSuccessBtn.addEventListener('click', () => {
    orderModal.style.display = 'none';
    location.reload(); 
});
});

window.prepararCompra = (id, nombre, precio) => {
    const selector = document.getElementById(`size-${id}`);
    const tallaSeleccionada = selector.value;

    if (!tallaSeleccionada) {
        alert("Por favor selecciona una talla");
        return;
    }
    
    agregarAlCarrito(`${nombre} (${tallaSeleccionada})`, precio);
    
    const cartModal = document.getElementById('cartModal');
    if (cartModal) cartModal.classList.add('active');
};
