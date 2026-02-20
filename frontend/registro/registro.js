document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("¡Las contraseñas no coinciden! Inténtalo de nuevo.");
        return; 
    }

    const btn = document.querySelector('.btn-listo');
    btn.innerText = 'Creando...';

    try {
        const respuesta = await fetch('/api/auth/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                apellido,
                email,
                password
            })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            alert('¡Cuenta creada con éxito!');
            localStorage.setItem('token', data.token);
            window.location.href = '../login/login.html';
        } else {
            alert(data.msg || 'Error al registrar usuario');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor.');
    } finally {
        btn.innerText = 'Listo';
    }
});
