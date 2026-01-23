// 📦 Variables de imagen múltiple
const inputImagenes = document.getElementById('imagenesGrua');
const preview = document.getElementById('previewGrua');
let archivosSeleccionados = [];

// 🎯 Vista previa de imágenes seleccionadas
inputImagenes.addEventListener('change', function (event) {
  archivosSeleccionados = Array.from(event.target.files).slice(0, 5); // máximo 5
  actualizarInput();
  mostrarVistaPrevia();
});

function mostrarVistaPrevia() {
  preview.innerHTML = '';

  archivosSeleccionados.forEach((archivo, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const contenedor = document.createElement('div');
      contenedor.classList.add('position-relative', 'shadow-lg', 'rounded');
      contenedor.style.width = '130px';
      contenedor.style.height = '130px';
      contenedor.style.overflow = 'hidden';
      contenedor.style.marginRight = '10px';
      contenedor.style.display = 'inline-block';

      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add('rounded');
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';

      const botonEliminar = document.createElement('button');
      botonEliminar.innerHTML = '<i class="fas fa-times"></i>';
      botonEliminar.classList.add('btn', 'btn-sm', 'position-absolute');
      botonEliminar.style.top = '6px';
      botonEliminar.style.right = '6px';
      botonEliminar.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
      botonEliminar.style.color = 'white';
      botonEliminar.style.border = 'none';
      botonEliminar.style.borderRadius = '50%';
      botonEliminar.style.width = '26px';
      botonEliminar.style.height = '26px';
      botonEliminar.style.cursor = 'pointer';

      botonEliminar.onclick = function () {
        archivosSeleccionados.splice(index, 1);
        actualizarInput();
        mostrarVistaPrevia();
      };

      contenedor.appendChild(img);
      contenedor.appendChild(botonEliminar);
      preview.appendChild(contenedor);
    };
    reader.readAsDataURL(archivo);
  });
}

function actualizarInput() {
  const dataTransfer = new DataTransfer();
  archivosSeleccionados.forEach(file => dataTransfer.items.add(file));
  inputImagenes.files = dataTransfer.files;
}

// 🚀 Envío del formulario
document.getElementById("formPublicarGrua").addEventListener("submit", async function (e) {
  e.preventDefault();

  const usuario = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (!usuario || usuario.tipo !== "PrestadorServicio") {
    alert("⚠️ Debes iniciar sesión como prestador para publicar.");
    return;
  }

  const titulo = document.getElementById("titulo").value.trim();
  const zona = document.getElementById("zona").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const tarifa = document.getElementById("tarifa").value.trim();
  const imagenes = inputImagenes.files;

  if (!titulo || !zona || !descripcion || !tarifa || imagenes.length === 0) {
    alert("⚠️ Completa todos los campos y selecciona al menos una imagen.");
    return;
  }

  const formData = new FormData();
  formData.append("titulo", titulo);
  formData.append("zona", zona);
  formData.append("descripcion", descripcion);
  formData.append("tarifa", tarifa);

  for (let i = 0; i < imagenes.length; i++) {
    formData.append("imagenesGrua", imagenes[i]);
  }

  try {
    const res = await fetch("http://localhost:3000/api/publicar-grua", {
      method: "POST",
      credentials: 'include',
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.mensaje);
      this.reset();
      preview.innerHTML = '';
      archivosSeleccionados = [];
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (err) {
    console.error("❌ Error al enviar publicación:", err);
    alert("Error al conectar con el servidor.");
  }
});