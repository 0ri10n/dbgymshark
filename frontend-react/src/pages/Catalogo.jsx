:root {
    --makia-accent: #d9fb56;
    --bg-black: #050508;
}

* { box-sizing: border-box; }
body { margin: 0; font-family: 'Poppins', sans-serif; background-color: var(--bg-black); color: #fff; }

/* --- HEADER ORIGINAL --- */
.client-header-makia {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 5%; background: #000; height: 75px; position: sticky; top: 0; z-index: 1000;
}
.logo-text { font-weight: 900; font-size: 28px; letter-spacing: 5px; color: #fff; }
.header-right-icons { display: flex; gap: 20px; align-items: center; }
.cart-wrapper, .user-icon { cursor: pointer; font-size: 22px; position: relative; }
#cartCountBadge { position: absolute; top: -10px; right: -12px; background: var(--makia-accent); color: #000; font-size: 10px; padding: 2px 6px; border-radius: 50%; font-weight: bold; }

/* --- LAYOUT Y FILTROS --- */
.store-layout-container {
    display: grid; grid-template-columns: 260px 1fr;
    max-width: 1400px; margin: 30px auto; padding: 0 5%; gap: 40px;
}
.sidebar-filter-box { background: #0c0f16; border: 1px solid #1a1e26; padding: 25px; border-radius: 12px; align-self: start; }
.sidebar-btn-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
.filter-size-btn { background: transparent; color: #fff; border: 1px solid #2f3543; padding: 10px 0; border-radius: 8px; cursor: pointer; }

/* --- BUSCADOR BLANCO --- */
.search-bar-row { display: flex; justify-content: flex-end; margin-bottom: 30px; }
.white-search-box { display: flex; align-items: center; background: #fff; padding: 10px 15px; border-radius: 4px; width: 100%; max-width: 380px; }
.white-search-box input { border: none; outline: none; width: 100%; color: #000; font-weight: 600; margin-left: 10px; }
.white-search-box i { color: #000; }

/* --- GRID DE 3 PRODUCTOS (DISTRIBUCIÓN ORIGINAL) --- */
.fixed-grid-3 {
    display: grid; 
    grid-template-columns: repeat(3, 1fr) !important; /* 3 COLUMNAS EXACTAS */
    gap: 30px;
}
.makia-product-card { display: flex; flex-direction: column; background: transparent; min-height: 580px; }
.img-frame { height: 420px; border-radius: 8px; overflow: hidden; background: #111; } /* ALTO PORTRAIT */
.p-img { width: 100%; height: 100%; object-fit: cover; }

/* --- COLORES CIRCULARES Y ACCIONES --- */
.swatch-row-carrusel { display: flex; gap: 12px; margin: 15px 0; overflow-x: auto; scrollbar-width: none; }
.swatch-circle { width: 22px; height: 22px; border-radius: 50% !important; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; flex-shrink: 0; }
.swatch-circle.active { box-shadow: 0 0 0 2px #000, 0 0 0 4px var(--makia-accent); }

.makia-size-dropdown { width: 100%; padding: 12px; background: #0c0f16; color: #fff; border: 1px solid #222; border-radius: 6px; margin-bottom: 10px; }
.btn-add-to-bag-makia { background: #fff; color: #000; border: none; padding: 16px; font-weight: 900; text-transform: uppercase; border-radius: 4px; cursor: pointer; }

/* --- BOLSA MODAL --- */
.cart-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 2000; display: flex; justify-content: flex-end; }
.cart-modal-panel { width: 400px; background: #000; height: 100%; padding: 30px; border-left: 1px solid #222; }