document.getElementById('btn').addEventListener('click', async function(event) {
    event.preventDefault(); // Evita el envío del formulario

    const username = document.getElementById('user-name').value.trim();
    const password = document.getElementById('input-pass').value.trim();
    const mensajeError = document.getElementById('mensaje-error');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = 'perfil_usuario.html';
        } else {
            mensajeError.textContent = 'Usuario y/o contraseña errada.';
        }
    } catch (error) {
        console.error('❌ Error al conectar con el servidor:', error);
        mensajeError.textContent = 'Error en el servidor. Intenta más tarde.';
    }
});
