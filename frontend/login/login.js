document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const btn = document.querySelector('.btn-login');
    const textoOriginal = btn.innerText;
    btn.innerText = 'Cargando...';

    try {
        const respuesta = await fetch('https://dbgymshark.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            localStorage.setItem('token', data.token);

            if (data.role === 'admin') {
                window.location.href = '../adminview/admin.html';
            } else if (data.role === 'cliente') {
                window.location.href = '../clientview/client.html';
            } else {
                alert('Rol de usuario no reconocido. Contacta al administrador.');
                localStorage.removeItem('token');
            }
        } else {
            alert(data.msg || 'Error al iniciar sesión');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo conectar con el servidor. Revisa si el backend está corriendo.');
    } finally {
        btn.innerText = textoOriginal;
    }
});

const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye-slash');
});

const showLoginBtn = document.getElementById('show-login-btn');
const loginWrapper = document.getElementById('login-wrapper');

showLoginBtn.addEventListener('click', () => {
    loginWrapper.classList.remove('hidden');
    showLoginBtn.style.opacity = '0';
    showLoginBtn.style.pointerEvents = 'none';
});

loginWrapper.addEventListener('click', (e) => {
    if (e.target === loginWrapper) {
        loginWrapper.classList.add('hidden');
        showLoginBtn.style.opacity = '1';
        showLoginBtn.style.pointerEvents = 'all';
    }
});
