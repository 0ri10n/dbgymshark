const request = require('supertest');
const API_URL = 'http://127.0.0.1:4000/api';

describe(' Suite de Pruebas QA: Login y CRUD (MAKIA)', () => {

    // ESCENARIO 1: Login con credenciales incorrectas (Seguridad)
    test('1. Debería rechazar un inicio de sesión con contraseña incorrecta', async () => {
        const respuesta = await request(API_URL)
            .post('/auth/login')
            .send({
                email: 'diegoabdyx99@gmail.com',
                password: 'clave_falsa_123'
            });

        // Solo verificamos que el servidor nos haya bateado (Status 400 o 401)
        expect(respuesta.status).toBeGreaterThanOrEqual(400);
    });

    // ESCENARIO 2: CRUD (Leer) - Obtener productos públicos
    test('2. Debería poder leer el catálogo de productos (CRUD: Read)', async () => {
        const respuesta = await request(API_URL).get('/productos');

        expect(respuesta.status).toBe(200);
        expect(Array.isArray(respuesta.body.productos || respuesta.body)).toBe(true);
    });

    // ESCENARIO 3: CRUD (Crear) - Bloqueado por falta de Token Admin
    test('3. Debería bloquear la creación de un producto si no hay token', async () => {
        const respuesta = await request(API_URL)
            .post('/productos')
            .send({
                title: 'Playera Test QA',
                price: 500
            });

        // Solo verificamos que nos bloquee el acceso por no tener token (Status 401 o 403)
        expect(respuesta.status).toBeGreaterThanOrEqual(401);
    });

});