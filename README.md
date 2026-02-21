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
   - `FRONTEND_TARGET=react`

## Ejecucion
1. Desarrollo con React:
   - Backend: `npm run dev:backend`
   - Frontend React (Vite): `npm run dev:frontend`
2. Produccion/local integrado:
   - `npm start` (compila React y lo sirve desde `backend/server.js`)
