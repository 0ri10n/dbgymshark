// ... (Tus funciones auxiliares normalizeSize, pickFirstImage, etc. se mantienen igual)

exports.obtenerProductos = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const search = (req.query.search || '').trim();
        const talla = (req.query.talla || '').trim();
        const stock = (req.query.stock || '').trim();

        const tasaMXN = await getExchangeRate();

        if (shouldUseMockData()) {
            const filtered = applyMockFilters(mockProducts, search, talla, stock);
            return res.json(buildPaginatedResponse(filtered, page, limit, tasaMXN));
        }

        // --- CORRECCIÓN: CONSTRUCCIÓN DEL FILTRO PARA MONGO ---
        let query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { product_type: { $regex: search, $options: 'i' } }
            ];
        }
        if (talla) {
            query.sizes_available = talla.toUpperCase();
        }
        if (stock === 'true') {
            query['variants.inventory_quantity'] = { $gt: 0 };
        }

        const skip = (page - 1) * limit;
        
        // Ejecutamos la consulta con el objeto 'query' corregido
        const [productos, totalProductos] = await Promise.all([
            Producto.find(query).skip(skip).limit(limit).lean(),
            Producto.countDocuments(query)
        ]);

        const paginasTotales = Math.max(Math.ceil(totalProductos / limit), 1);

        const productosProcesados = productos.map((producto) => {
            const prodObj = { ...producto }; // .lean() ya nos da un objeto plano
            prodObj.image_principal = pickFirstImage(prodObj);

            // Cálculo de precio: $PrecioUSD \times TasaMXN = PrecioMXN$
            if (typeof prodObj.price_range?.min === 'number') {
                prodObj.precioMXN = Number((prodObj.price_range.min * tasaMXN).toFixed(2));
            }

            if (Array.isArray(prodObj.variants) && prodObj.variants.length > 0) {
                prodObj.tallasDisponibles = [...new Set(prodObj.variants.map((v) => v.size).filter(Boolean))];
            } else {
                prodObj.tallasDisponibles = prodObj.sizes_available || [];
            }

            return prodObj;
        });

        res.json({
            productos: productosProcesados,
            paginasTotales,
            pagination: {
                page,
                pages: paginasTotales,
                total: totalProductos,
            },
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ msg: 'Hubo un error al cargar el catalogo' });
    }
};

exports.limpiarBaseDeDatos = async (req, res) => {
    try {
        const productos = await Producto.find({});
        const mapaProductos = {};
        let eliminados = 0;

        productos.forEach(p => {
            // Usamos el 'handle' como clave principal, limpiando espacios
            const clave = (p.handle || p.title).trim().toLowerCase();
            if (!mapaProductos[clave]) {
                mapaProductos[clave] = [];
            }
            mapaProductos[clave].push(p);
        });

        for (const clave in mapaProductos) {
            const grupo = mapaProductos[clave];

            if (grupo.length > 1) {
                const maestro = grupo[0];
                const nuevasVariantes = [];

                grupo.forEach(item => {
                    // Extraemos la talla si existe, o usamos la del campo sizes_available
                    const tallaDetectada = item.sizes_available?.[0] || 'Única';
                    
                    nuevasVariantes.push({
                        size: tallaDetectada,
                        sku: `${item.handle}-${tallaDetectada}-${Math.random().toString(36).substring(7)}`,
                        price: item.price_range?.min || 0,
                        inventory_quantity: 10
                    });
                });

                // 1. Asignamos las variantes al maestro
                maestro.variants = nuevasVariantes;
                
                // 2. Al usar .save(), se dispara tu función 'refreshDerived' 
                // que llenará automáticamente 'sizes_available' y 'price_range'
                await maestro.save(); 

                // 3. Borramos los duplicados
                const idsBorrar = grupo.slice(1).map(d => d._id);
                await Producto.deleteMany({ _id: { $in: idsBorrar } });
                eliminados += idsBorrar.length;
            }
        }

        res.json({ 
            msg: "Limpieza profunda completada", 
            productos_fusionados: Object.keys(mapaProductos).length,
            documentos_eliminados: eliminados 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};