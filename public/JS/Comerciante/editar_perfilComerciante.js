// eliminar/evitar cualquier línea que use "data" antes de definirla
// localStorage.setItem("usuarioId", data.idUsuario); // <-- BORRAR

const form = document.getElementById("perfilForm");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId) {
      console.warn("⚠️ No hay usuario en sesión");
      return;
    }

    // ✅ Hacer fetch solo para llenar el formulario
    const res = await fetch(`/api/perfilComerciante/${usuarioId}`);
    if (!res.ok) {
      console.error("Fetch perfil falló:", res.status, res.statusText);
      return;
    }

    const data = await res.json();
    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    console.log("✅ Perfil del comerciante:", data);

    // 🧩 Llenar el formulario con los datos correctos
    document.getElementById("Nombre").value = data.Nombre || "";
    document.getElementById("Apellido").value = data.Apellido || "";
    document.getElementById("NombreComercio").value = data.NombreComercio || "";
    document.getElementById("NitComercio").value = data.NitComercio || "";
    document.getElementById("Correo").value = data.Correo || "";
    document.getElementById("Telefono").value = data.Telefono || "";
    document.getElementById("Direccion").value = data.Direccion || "";
    document.getElementById("Barrio").value = data.Barrio || "";
    document.getElementById("DiasAtencion").value = data.DiasAtencion || "";
    document.getElementById("HoraInicio").value = data.HoraInicio || "";
    document.getElementById("HoraFin").value = data.HoraFin || "";
    document.getElementById("RedesSociales").value = data.RedesSociales || "";

    const previewImg = document.getElementById("previewImg");
    if (data.FotoPerfil && previewImg) {
      previewImg.src = `/${data.FotoPerfil}`;
      document.getElementById("previewContainer").classList.remove("hidden");
    }

  } catch (err) {
    console.error("❌ Error cargando el perfil:", err);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuarioId = localStorage.getItem("usuarioId");
  if (!usuarioId) return alert("No hay usuario logueado");

  const formData = new FormData(form);
  try {
    const res = await fetch(`/api/actualizarPerfilComerciante/${usuarioId}`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      alert("❌ " + (data.error || "Error al actualizar"));
      return;
    }

    alert(data.mensaje || "Perfil actualizado correctamente ✅");

  } catch (err) {
    console.error("❌ Error al enviar formulario:", err);
    alert("Error de conexión");
  }
});


const imagenPerfil = document.getElementById("imagenPerfil");
const previewContainer = document.getElementById("previewContainer");
const previewImg = document.getElementById("previewImg");
const removeBtn = document.getElementById("removeImg");

// Cuando selecciona una nueva imagen
imagenPerfil.addEventListener("change", () => {
  const file = imagenPerfil.files[0];
  if (file) {
    previewImg.src = URL.createObjectURL(file);
    previewContainer.classList.remove("hidden");
  }
});

// Botón X para eliminar la foto seleccionada
removeBtn.addEventListener("click", () => {
  imagenPerfil.value = "";        // Quitar la selección
  previewImg.src = "";             // Quitar preview
  previewContainer.classList.add("hidden");  // Ocultar contenedor
});
