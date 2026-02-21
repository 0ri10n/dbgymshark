# Base del Proyecto

## Instalacion
1. Clonar el repositorio.
2. Ejecutar `npm install` en la raiz.
3. Ejecutar `npm --prefix frontend-react install` para instalar el frontend React.
4. Crear o actualizar `.env` en la raiz con:
   - `PORT`
   - `MONGO_URI`
   - `JWT_SECRET`
   - `EXCHANGE_API_KEY`
   - `VITE_API_URL` (ejemplo local: `http://localhost:4000/api`)

## Ejecucion
1. Backend: `npm run dev:backend` (o `npm run dev`).
2. Frontend: `npm run dev:frontend`.
3. Compilar frontend: `npm run build:frontend`.
