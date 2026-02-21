# Base del Proyecto

## Instalacion
1. Clonar el repositorio.
2. Ejecutar `npm install` en la raiz.
3. (Opcional) Ejecutar `npm --prefix frontend-react install` si quieres instalar frontend manualmente.
4. Crear o actualizar `.env` para tu entorno normal.
5. Para desarrollo local sin Mongo, usa `.env.development` (ya incluido).

## Desarrollo Local Sin MongoDB
Este modo usa React + datos mock + auth de desarrollo para evitar bloqueos por base de datos.

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
2. Si `FRONTEND_TARGET=react`, backend sirve `frontend-react/dist`.
3. El frontend legado sigue disponible en `/legacy`.
