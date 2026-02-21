const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const csv = require('csv-parser');
const mongoose = require('mongoose');

const Producto = require('../models/Productos');

function parseArgs(argv) {
    const args = {
        file: 'frontend-react/src/assets/db/gymshark_products.csv',
        reset: true,
        batch: 1000,
        format: '',
    };

    for (let i = 0; i < argv.length; i += 1) {
        const current = argv[i];
        if (current === '--file' && argv[i + 1]) {
            args.file = argv[i + 1];
            i += 1;
            continue;
        }
        if (current === '--no-reset') {
            args.reset = false;
            continue;
        }
        if (current === '--batch' && argv[i + 1]) {
            args.batch = Math.max(parseInt(argv[i + 1], 10) || 1000, 100);
            i += 1;
        }
        if (current === '--format' && argv[i + 1]) {
            args.format = String(argv[i + 1]).trim().toLowerCase();
            i += 1;
        }
    }

    return args;
}

function loadEnv() {
    const root = path.resolve(__dirname, '../../');
    const rootEnvPath = path.join(root, '.env');
    const devEnvPath = path.join(root, '.env.development');

    if (fs.existsSync(rootEnvPath)) {
        dotenv.config({ path: rootEnvPath });
    }

    if (process.env.NODE_ENV === 'development' && fs.existsSync(devEnvPath)) {
        dotenv.config({ path: devEnvPath, override: true });
    }
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeString(value) {
    return String(value || '').trim();
}

function resolveFormat(filePath, explicitFormat) {
    if (explicitFormat === 'csv' || explicitFormat === 'json') {
        return explicitFormat;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.json') return 'json';

    throw new Error(`Formato no soportado para ${filePath}. Usa --format csv o --format json.`);
}

function parseTags(rawTags) {
    const text = normalizeString(rawTags);
    if (!text) return [];
    return text
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function getFirstImage(rawImageSrc) {
    const text = normalizeString(rawImageSrc);
    if (!text) return '';
    return text
        .split(',')
        .map((item) => item.trim())
        .find(Boolean) || '';
}

function parseVariantTitle(rawVariantTitle) {
    const variantTitle = normalizeString(rawVariantTitle);
    if (!variantTitle) return { size: '', color: '' };

    const slashParts = variantTitle.split('/').map((part) => part.trim()).filter(Boolean);
    if (slashParts.length >= 2) {
        return {
            size: slashParts[0],
            color: slashParts.slice(1).join(' / '),
        };
    }

    return {
        size: variantTitle,
        color: '',
    };
}

function buildVariant(row) {
    const sku = normalizeString(row.sku);
    const { size, color } = parseVariantTitle(row.variant_title);
    const price = toNumber(row.price, 0);
    const inventoryQuantity = toNumber(row.inventory_quantity, 0);

    return {
        size,
        color,
        sku,
        price,
        inventory_quantity: inventoryQuantity,
        variant_id: sku,
    };
}

function buildUpdateOperation(row) {
    const title = normalizeString(row.title);
    const handle = normalizeString(row.handle);
    const sku = normalizeString(row.sku);

    if (!title || !handle || !sku) return null;

    const tags = parseTags(row.tags);
    const firstImage = getFirstImage(row.image_src);
    const variant = buildVariant(row);

    return {
        updateOne: {
            filter: { handle },
            update: {
                $set: {
                    title,
                    handle,
                    vendor: normalizeString(row.vendor),
                    product_type: normalizeString(row.product_type),
                    tags,
                    image_principal: firstImage,
                },
                $addToSet: {
                    variants: variant,
                },
            },
            upsert: true,
        },
    };
}

async function recomputeDerivedFields(batchSize = 1000) {
    const cursor = Producto.find({}, { variants: 1 }).lean().cursor();
    let operations = [];
    let updated = 0;

    for await (const product of cursor) {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const sizes = [...new Set(variants.map((v) => normalizeString(v.size)).filter(Boolean))];
        const colors = [...new Set(variants.map((v) => normalizeString(v.color)).filter(Boolean))];
        const prices = variants
            .map((v) => toNumber(v.price, NaN))
            .filter((p) => Number.isFinite(p));

        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        operations.push({
            updateOne: {
                filter: { _id: product._id },
                update: {
                    $set: {
                        sizes_available: sizes,
                        colors_available: colors,
                        price_range: {
                            min: minPrice,
                            max: maxPrice,
                        },
                    },
                },
            },
        });

        if (operations.length >= batchSize) {
            await Producto.bulkWrite(operations, { ordered: false });
            updated += operations.length;
            operations = [];
        }
    }

    if (operations.length > 0) {
        await Producto.bulkWrite(operations, { ordered: false });
        updated += operations.length;
    }

    return updated;
}

async function runImport() {
    loadEnv();
    const args = parseArgs(process.argv.slice(2));

    const sourcePath = path.resolve(process.cwd(), args.file);
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`No se encontro el archivo de datos: ${sourcePath}`);
    }

    const format = resolveFormat(sourcePath, args.format);

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI no esta definido en el entorno actual.');
    }

    const dbName = normalizeString(process.env.PRODUCT_DB);
    const connectionOptions = {
        serverSelectionTimeoutMS: 10000,
    };

    if (dbName) {
        connectionOptions.dbName = dbName;
    }

    await mongoose.connect(mongoUri, connectionOptions);

    if (args.reset) {
        await Producto.deleteMany({});
        console.log('Coleccion de productos reiniciada antes de importar.');
    }

    let totalRows = 0;
    let skippedRows = 0;
    let operations = [];

    const flushOperations = async () => {
        if (operations.length === 0) return;
        await Producto.bulkWrite(operations, { ordered: false });
        operations = [];
    };

    if (format === 'csv') {
        await new Promise((resolve, reject) => {
            const parser = fs
                .createReadStream(sourcePath)
                .pipe(
                    csv({
                        mapHeaders: ({ header }) => String(header || '').replace(/^\uFEFF/, '').trim(),
                        skipLines: 0,
                    }),
                );

            parser
                .on('data', (row) => {
                    totalRows += 1;
                    const operation = buildUpdateOperation(row);
                    if (!operation) {
                        skippedRows += 1;
                        return;
                    }

                    operations.push(operation);

                    if (operations.length >= args.batch) {
                        parser.pause();
                        flushOperations()
                            .then(() => parser.resume())
                            .catch(reject);
                    }
                })
                .on('error', reject)
                .on('end', async () => {
                    try {
                        await flushOperations();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
        });
    } else {
        const rawData = fs.readFileSync(sourcePath, 'utf8');
        const parsed = JSON.parse(rawData);
        const rows = Array.isArray(parsed) ? parsed : parsed?.data;

        if (!Array.isArray(rows)) {
            throw new Error('JSON invalido. Debe ser un array de objetos o { data: [] }.');
        }

        for (const row of rows) {
            totalRows += 1;
            const operation = buildUpdateOperation(row || {});
            if (!operation) {
                skippedRows += 1;
                continue;
            }

            operations.push(operation);

            if (operations.length >= args.batch) {
                await flushOperations();
            }
        }

        await flushOperations();
    }

    const derivedUpdated = await recomputeDerivedFields(args.batch);
    const totalProducts = await Producto.countDocuments();

    console.log('Importacion completada.');
    console.log(`Archivo: ${sourcePath}`);
    console.log(`Formato: ${format.toUpperCase()}`);
    console.log(`Filas procesadas: ${totalRows}`);
    console.log(`Filas omitidas por datos incompletos: ${skippedRows}`);
    console.log(`Productos en MongoDB: ${totalProducts}`);
    console.log(`Productos con campos derivados recalculados: ${derivedUpdated}`);
}

runImport()
    .catch((error) => {
        console.error('Error importando datos:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
