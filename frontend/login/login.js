document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const btn = document.querySelector('.btn-login');
    const textoOriginal = btn.innerText;
    btn.innerText = 'Cargando...';

    try {
        const respuesta = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            localStorage.setItem('token', data.token);
            
            alert('¡Login Exitoso! Token guardado.');
            // window.location.href = 'dashboard.html'; // Descomentar esto cuando tengas el dashboard
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