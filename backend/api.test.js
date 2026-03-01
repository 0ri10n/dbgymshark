const request = require('supertest');
const API_URL = 'http://127.0.0.1:4000/api';

describe(' Suite de Pruebas QA: Login y CRUD (MAKIA)', () => {

    test('1. Debería rechazar un inicio de sesión con contraseña incorrecta', async () => {
        const respuesta = await request(API_URL)
            .post('/auth/login')
            .send({
                email: 'diegoabdyx99@gmail.com',
                password: 'clave_falsa_123'
            });

        expect(respuesta.status).toBeGreaterThanOrEqual(400);
    });

    test('2. Debería poder leer el catálogo de productos (CRUD: Read)', async () => {
        const respuesta = await request(API_URL).get('/productos');

        expect(respuesta.status).toBe(200);
        expect(Array.isArray(respuesta.body.productos || respuesta.body)).toBe(true);
    });

    test('3. Debería bloquear la creación de un producto si no hay token', async () => {
        const respuesta = await request(API_URL)
            .post('/productos')
            .send({
                title: 'Playera Test QA',
                price: 500
            });

        expect(respuesta.status).toBeGreaterThanOrEqual(401);
    });

});