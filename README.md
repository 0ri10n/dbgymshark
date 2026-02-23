# Base del Proyecto

## Instalacion
1. Clonar el repositorio.
2. Ejecutar `npm install` en la raiz.
3. (Opcional) Ejecutar `npm --prefix frontend-react install` si quieres instalar frontend manualmente.
4. Crear o actualizar `.env` para tu entorno normal.
5. Para desarrollo local, usa `.env.development` (ya incluido).

## Desarrollo Local (Mongo real + React)
Este modo usa React + Mongo local + auth de desarrollo.

1. Backend local (con `.env.development`):
   - `npm run dev:backend:local`
2. Frontend React local:
   - `npm run dev:frontend:local`
3. Abrir `http://localhost:5173`.

Credenciales de desarrollo:
- Admin: `admin@makia.local` / `admin12345`
- Cliente: `cliente@makia.local` / `cliente12345`

## Produccion/Integrado
1. `npm start` para compilar React y servirlo desde backend.
2. Backend sirve `frontend-react/dist` como unica capa de vistas.

## Cargar CSV en Mongo Local
1. Levantar Mongo local con Docker:
   - `npm run db:up`
2. Importar CSV del catalogo (agrupa variantes por `handle`):
   - `npm run import:catalog:local`
3. Levantar backend y frontend en modo local:
   - `npm run dev:backend:local`
   - `npm run dev:frontend:local`
4. Verificar en navegador:
   - `http://localhost:5173` o `http://localhost:4000`

## Importar nuevas tablas (CSV o JSON)
El importador `backend/scripts/importCatalogCsv.js` soporta:
- CSV (auto por extension o `--format csv`)
- JSON (array de objetos o `{ "data": [] }`, con `--format json`)

Ejemplos:
- `npm run import:catalog:local`
- `npm run import:data:local -- --file "ruta\\archivo.json" --format json --no-reset`
