// public/JS/procesoCompra.js
document.addEventListener("DOMContentLoaded", async () => {
  const tabla = document.getElementById("tabla-productos");
  const totalGeneral = document.getElementById("total-general");
  const btnFinalizar = document.getElementById("btn-finalizar");
  const campoRecoger = document.getElementById("campoRecoger");
  const infoComercioDiv = document.getElementById("infoComercio");

  // Mostrar/ocultar campos adicionales para recoger en comercio
  document.querySelectorAll("input[name='metodoPago']").forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "recoger" && radio.checked) {
        campoRecoger.classList.remove("d-none");
      } else {
        campoRecoger.classList.add("d-none");
      }
    });
  });

  // 🛒 Cargar productos del carrito desde la API
  let comercio = { nombre: '', direccion: '' };
  try {
    const resp = await fetch("/api/proceso-compra");
    if (!resp.ok) throw new Error("Error al obtener productos del carrito");

    const carrito = await resp.json();
    tabla.innerHTML = "";
    let total = 0;

    if (!Array.isArray(carrito) || carrito.length === 0) {
      tabla.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay productos en el carrito.</td></tr>`;
      totalGeneral.textContent = "$0.00";
      return;
    }

    // Usamos el primer registro para extraer datos del comercio
    comercio = {
      nombre: carrito[0].NombreComercio || carrito[0].NombreUsuarioComercio || "No especificado",
      direccion: carrito[0].DireccionComercio || "No especificada"
    };

    carrito.forEach(item => {
      const subtotal = Number(item.Subtotal);
      total += subtotal;

      tabla.innerHTML += `
        <tr>
          <td>${item.Producto}</td>
          <td class="text-center">${item.Cantidad}</td>
          <td>$${Number(item.Precio).toLocaleString()}</td>
          <td>$${subtotal.toLocaleString()}</td>
        </tr>
      `;
    });

    totalGeneral.textContent = `$${total.toLocaleString()}`;

    // Mostrar información del comercio
    if (infoComercioDiv) {
      infoComercioDiv.innerHTML = `
        <strong>Comercio:</strong> ${comercio.nombre}<br>
        <small>Dirección: ${comercio.direccion}</small>
      `;
    }
  } catch (err) {
    console.error("❌ Error cargando proceso de compra:", err);
    tabla.innerHTML = `<tr><td colspan="4" class="text-center text-danger">⚠️ Error al cargar los productos.</td></tr>`;
    totalGeneral.textContent = "$0.00";
  }

  // 💳 Finalizar compra
  btnFinalizar.addEventListener("click", async (e) => {
    e.preventDefault();

    const metodoPago = document.querySelector("input[name='metodoPago']:checked")?.value;
    if (!metodoPago) return alert("Selecciona un método de pago.");

    // Obtiene el usuario desde localStorage o sesión
    const usuarioId = localStorage.getItem("usuarioId") || null;

    const datos = {
      usuarioId,
      nombre: document.getElementById("nombreComprador").value.trim(),
      correo: document.getElementById("correoComprador").value.trim(),
      telefono: document.getElementById("telefonoComprador").value.trim(),
      direccion: document.getElementById("direccionComprador").value.trim(),
      metodoPago,
      fechaRecoger: document.getElementById("fechaRecoger")?.value || null,
      horaRecoger: document.getElementById("horaRecoger")?.value || null,
      comentariosRecoger: document.getElementById("comentariosRecoger")?.value || null
    };

    // Validaciones básicas
    if (!datos.nombre || !datos.correo || !datos.telefono || !datos.direccion) {
      return alert("Por favor completa todos los datos personales antes de finalizar la compra.");
    }

    if (metodoPago === "recoger" && (!datos.fechaRecoger || !datos.horaRecoger)) {
      return alert("Debes seleccionar fecha y hora para recoger en comercio.");
    }

    try {
      // 🔄 Enviar datos al backend
      const response = await fetch("/api/finalizar-compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.redirect) {
          // 🔁 Redirigir a la factura (caso PSE)
          alert(result.message);
          window.location.href = result.redirect;
        } else {
          // Mostrar mensaje en la misma página
          const mensajeDiv = document.createElement("div");
          mensajeDiv.className = "alert alert-success mt-4 text-center";
          mensajeDiv.textContent = result.message;
          document.querySelector("main.container").appendChild(mensajeDiv);

          // Limpiar productos del carrito en la tabla
          tabla.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay productos en el carrito.</td></tr>`;
          totalGeneral.textContent = "$0.00";

          // Ocultar botón para evitar reenvíos
          btnFinalizar.disabled = true;
          btnFinalizar.textContent = "Compra registrada";
        }
      } else {
        alert("❌ " + (result.message || "Error al registrar la compra."));
      }
    } catch (err) {
      console.error("❌ Error al finalizar compra:", err);
      alert("Error de conexión con el servidor.");
    }
  });
});
