//  EDITAR PUBLICACIÓN COMERCIANTE
document.addEventListener("DOMContentLoaded", async () => {
  const inputImagen = document.getElementById("imagenProducto");
  const previewContainer = document.getElementById("previewImagenes");
  const tituloInput = document.getElementById("tituloProducto");
  const precioInput = document.getElementById("precioProducto");
  const categoriaSelect = document.getElementById("categoriaProducto");
  const descripcionInput = document.getElementById("descripcionProducto");
  const form = document.querySelector("form");

  // 🔹 Obtener ID de la publicación desde la URL
  const params = new URLSearchParams(window.location.search);
  const idPublicacion = params.get("id");

  if (!idPublicacion) {
    alert("No se especificó una publicación para editar.");
    return;
  }

  let imagenesActuales = [];
  let categoriaActualId = null;

  // 🔹 Cargar la publicación existente
  try {
    const response = await fetch(`http://localhost:3000/api/publicaciones/${idPublicacion}`, {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    // 🧩 Rellenar campos con datos reales del backend
    tituloInput.value = data.NombreProducto || "";
    precioInput.value = data.Precio || "";
    descripcionInput.value = data.Descripcion || "";
    categoriaActualId = String(data.IdCategoria); // 👈 guardar como string

    // 🔹 Guardar imágenes actuales
    imagenesActuales = Array.isArray(data.ImagenProducto)
      ? data.ImagenProducto
      : JSON.parse(data.ImagenProducto || "[]");

    // Mostrar imágenes actuales
    previewContainer.innerHTML = "";
    imagenesActuales.forEach((ruta, index) => {
      const div = document.createElement("div");
      div.classList.add("preview-container");

      const img = document.createElement("img");
      img.src = `/${ruta}`;

      const btn = document.createElement("button");
      btn.innerHTML = "✕";
      btn.classList.add("remove-btn");
      btn.addEventListener("click", () => {
        imagenesActuales.splice(index, 1);
        div.remove();
      });

      div.appendChild(img);
      div.appendChild(btn);
      previewContainer.appendChild(div);
    });

    // 🔹 Ahora que tenemos la categoría actual, cargamos las categorías
    await cargarCategorias(categoriaActualId);

  } catch (error) {
    console.error("Error al cargar publicación:", error);
    alert("No se pudo cargar la publicación.");
  }

  // 🔹 Mostrar previsualización de nuevas imágenes
  inputImagen.addEventListener("change", function () {
    Array.from(this.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const div = document.createElement("div");
        div.classList.add("preview-container");

        const img = document.createElement("img");
        img.src = e.target.result;

        const btn = document.createElement("button");
        btn.innerHTML = "✕";
        btn.classList.add("remove-btn");
        btn.addEventListener("click", () => div.remove());

        div.appendChild(img);
        div.appendChild(btn);
        previewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  // 🔹 Función para cargar categorías (ocultando “Servicio de grúa”)
  async function cargarCategorias(categoriaActualId) {
    try {
      const res = await fetch("http://localhost:3000/api/categorias", {
        credentials: 'include'
      });
      const categorias = await res.json();

      categoriaSelect.innerHTML = '<option value="">Seleccione una categoría</option>';

      categorias.forEach((c) => {
        if (c.NombreCategoria.toLowerCase() === "servicio de grúa") return; // 🚫 omitimos esta

        const option = document.createElement("option");
        option.value = String(c.IdCategoria);
        option.textContent = c.NombreCategoria;

        // 👇 comparar como string para evitar error de tipo
        if (String(c.IdCategoria) === String(categoriaActualId)) {
          option.selected = true;
        }

        categoriaSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  }

  // 🔹 Guardar cambios (submit)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("titulo", tituloInput.value.trim());
    formData.append("precio", precioInput.value.trim());
    formData.append("categoria", categoriaSelect.value);
    formData.append("descripcion", descripcionInput.value.trim());
    formData.append("imagenesActuales", JSON.stringify(imagenesActuales));

    // Adjuntar nuevas imágenes si existen
    Array.from(inputImagen.files).forEach((file) => {
      formData.append("imagenesNuevas", file);
    });

    try {
      const res = await fetch(`http://localhost:3000/api/publicaciones/${idPublicacion}`, {
        method: "PUT",
        credentials: 'include',
        body: formData,
      });

      const result = await res.json();

      if (result.error) throw new Error(result.error);

      alert("✅ Publicación actualizada correctamente.");
      window.location.href = "registro_publicacion.html"; // 👈 vuelve al historial
    } catch (err) {
      console.error("Error al actualizar publicación:", err);
      alert("❌ Error al actualizar la publicación.");
    }
  });
});
