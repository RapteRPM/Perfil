document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const idPublicacion = params.get('id');

  if (!idPublicacion) return console.error('No se proporcionó id de publicación');

  fetch(`/api/detallePublicacion/${idPublicacion}`)
    .then(res => res.json())
    .then(data => {
      const p = data.publicacion;
      const opiniones = data.opiniones;

      // ===============================
      // 🧾 Datos generales del producto
      // ===============================
      document.querySelector('.titulo-producto').textContent = p.NombreProducto;
      document.querySelector('.precio-producto').textContent = `$${Number(p.Precio).toLocaleString()}`;
      document.querySelector('.descripcion-producto').textContent = p.Descripcion;
      document.querySelector('.info-extra small').innerHTML = `Taller: <strong>${p.NombreComercio}</strong>`;

      // ===============================
      // 🖼️ Carrusel de imágenes
      // ===============================
      const imgContainer = document.querySelector('.product-img');
      let imagenes = [];

      if (Array.isArray(p.ImagenProducto)) {
        imagenes = p.ImagenProducto.map(img => img.replace(/\\/g, '/').trim());
      } else if (typeof p.ImagenProducto === 'string') {
        imagenes = p.ImagenProducto.split(',').map(img => img.replace(/\\/g, '/').trim());
      }

      // Si no hay imágenes válidas, usar una por defecto
      if (!imagenes || imagenes.length === 0) {
        imagenes = ['imagen/placeholder.png'];
      }

          // Normalizar rutas y asegurar que sean absolutas
          imagenes = imagenes.map(img => {
            if (!img) return '/imagen/placeholder.png';
            let ruta = img.replace(/\\/g, '/').trim();
            ruta = ruta.replace(/^\/?(Imagen|image|Natural)\//i, ''); // elimina prefijos incorrectos
            return '/imagen/' + ruta;
          });

          // Verificar si hay contenedor de imagen
          if (imgContainer) {
            if (imagenes.length > 1) {
              const carouselHTML = `
                <div id="carouselProducto" class="carousel slide" data-bs-ride="carousel">
                  <div class="carousel-inner">
                    ${imagenes.map((src, i) => `
                      <div class="carousel-item ${i === 0 ? 'active' : ''}">
                        <img src="${src}" class="d-block w-100 producto-imagen" alt="Imagen ${i + 1}" onerror="this.src='/imagen/placeholder.png'">
                      </div>
                    `).join('')}
                  </div>
                  <button class="carousel-control-prev" type="button" data-bs-target="#carouselProducto" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon"></span>
                  </button>
                  <button class="carousel-control-next" type="button" data-bs-target="#carouselProducto" data-bs-slide="next">
                    <span class="carousel-control-next-icon"></span>
                  </button>
                </div>
              `;
              imgContainer.parentNode.innerHTML = carouselHTML;
            } else {
              imgContainer.src = imagenes[0];
              imgContainer.classList.add('producto-imagen');
              imgContainer.onerror = () => {
                imgContainer.src = '/imagen/placeholder.png';
              };
            }
          }

      // ===============================
      // ⭐ Calificación promedio
      // ===============================
      const starContainer = document.querySelector('.star-rating');
      const calificacion = Math.round(p.CalificacionPromedio || 0);
      starContainer.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        starContainer.innerHTML += `<i class="bi bi-star${i <= calificacion ? '-fill' : ''} text-warning"></i>`;
      }

      // ===============================
      // 💬 Opiniones existentes
      // ===============================
      const opinionesContainer = document.getElementById('opiniones-container');
      const comentariosHTML = opiniones.map(op => `
        <div class="comment-box border p-3 mb-3 rounded bg-light">
          <strong>${op.Nombre} ${op.Apellido}</strong>
          <div class="star-rating mb-1">
            ${[...Array(5)].map((_, i) => `<i class="bi bi-star${i < op.Calificacion ? '-fill' : ''} text-warning"></i>`).join('')}
          </div>
          <p>${op.Comentario}</p>
          <small class="text-muted">${new Date(op.FechaOpinion).toLocaleString()}</small>
        </div>
      `).join('');
      opinionesContainer.innerHTML = comentariosHTML || '<p class="text-gray-500">No hay comentarios aún.</p>';

      // ===============================
      // 🛒 Botones de acción
      // ===============================
      const btnAgregar = document.querySelector('.btn-primary');
      if (btnAgregar) {
        btnAgregar.addEventListener('click', async () => {
          try {
            const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));
            if (!usuarioActivo) {
              alert('⚠️ Debes iniciar sesión para agregar productos al carrito.');
              return;
            }

            const response = await fetch('http://localhost:3000/api/carrito', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idUsuario: usuarioActivo.id,
                idPublicacion: p.IdPublicacion,
                cantidad: 1
              })
            });

            const result = await response.json();
            if (response.ok) {
              alert('🛒 ' + result.msg);
            } else {
              alert(`❌ Error: ${result.msg}`);
            }
          } catch (err) {
            console.error('Error agregando al carrito:', err);
            alert('❌ Ocurrió un error al agregar el producto al carrito.');
          }
        });
      }

const btnComprar = document.querySelector('#btn-comprar-ahora');
if (btnComprar) {
  btnComprar.addEventListener('click', () => {
    const producto = {
      id: p.IdPublicacion,
      nombre: p.NombreProducto,
      precio: p.Precio,
      imagen: imagenes[0] || '/imagen/placeholder.png'
    };

    localStorage.setItem('productoCompra', JSON.stringify(producto));
    window.location.href = '/Natural/Proceso_compra.html';
  });
}
      // ===============================
      // ✍️ Enviar nueva opinión
      // ===============================
      const formComentario = document.getElementById('form-comentario');
      if (formComentario) {
        formComentario.addEventListener('submit', async (e) => {
          e.preventDefault();

          const comentario = document.getElementById('comentario').value.trim();
          const calificacion = document.getElementById('calificacion').value;
          const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));

          if (!usuarioActivo) {
            alert('⚠️ Debes iniciar sesión para poder comentar.');
            return;
          }

          if (!comentario || !calificacion) {
            alert('Por favor, escribe un comentario y selecciona una calificación.');
            return;
          }

          try {
            const res = await fetch('http://localhost:3000/api/opiniones', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                usuarioId: usuarioActivo.id,
                idPublicacion,
                nombreUsuario: usuarioActivo.nombre,
                comentario,
                calificacion
              })
            });

            const data = await res.json();
            if (res.ok) {
              alert('✅ Comentario guardado correctamente.');
              location.reload();
            } else {
              console.error(data.error);
              alert('❌ No se pudo guardar tu comentario.');
            }
          } catch (err) {
            console.error('Error al enviar comentario:', err);
            alert('❌ Error de conexión con el servidor.');
          }
        });
      }
    })
    .catch(err => console.error('Error cargando detalle de publicación:', err));
});