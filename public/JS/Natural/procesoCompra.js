// public/JS/procesoCompra.js
document.addEventListener("DOMContentLoaded", async () => {
  const tabla = document.getElementById("tabla-productos");
  const totalGeneral = document.getElementById("total-general");
  const btnFinalizar = document.getElementById("btn-finalizar");
  const campoRecoger = document.getElementById("campoRecoger");
  const infoComercioDiv = document.getElementById("infoComercio");

  // Mostrar/ocultar campos adicionales
  document.querySelectorAll("input[name='metodoPago']").forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "recoger" && radio.checked) {
        campoRecoger.classList.remove("d-none");
      } else {
        campoRecoger.classList.add("d-none");
      }
    });
  });

  // Cargar productos del carrito desde la API
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
    const comercio = {
      nombre: carrito[0].NombreComercio || carrito[0].NombreUsuarioComercio || '',
      direccion: carrito[0].DireccionComercio || ''
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

    // Mostrar info del comercio real
    if (infoComercioDiv) {
      infoComercioDiv.innerHTML = `
        <strong>Comercio:</strong> ${comercio.nombre || 'No especificado'}<br>
        <small>Dirección: ${comercio.direccion || 'No especificado'}</small>
      `;
    }

  } catch (err) {
    console.error("❌ Error cargando proceso de compra:", err);
    tabla.innerHTML = `<tr><td colspan="4" class="text-center text-danger">⚠️ Error al cargar los productos. Intenta nuevamente.</td></tr>`;
    totalGeneral.textContent = "$0.00";
  }

  // Finalizar compra
  btnFinalizar.addEventListener("click", async (e) => {
    e.preventDefault();
    const metodoPago = document.querySelector("input[name='metodoPago']:checked")?.value;
    if (!metodoPago) return alert("Selecciona un método de pago.");

    const datos = {
      nombre: document.getElementById("nombreComprador").value,
      correo: document.getElementById("correoComprador").value,
      telefono: document.getElementById("telefonoComprador").value,
      direccion: document.getElementById("direccionComprador").value,
      metodoPago,
      fechaRecoger: document.getElementById("fechaRecoger")?.value || null,
      horaRecoger: document.getElementById("horaRecoger")?.value || null
    };

    try {
      const r = await fetch('/api/finalizar-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const result = await r.json();

      if (r.ok) {
        if (result.redirect) {
          window.location.href = result.redirect;
        } else {
          alert('✅ Compra registrada correctamente');
          window.location.href = '/index.html';
        }
      } else {
        alert('❌ ' + (result.msg || 'Error al registrar la compra'));
      }
    } catch (err) {
      console.error('Error finalizando compra:', err);
      alert('❌ Error de conexión al finalizar compra.');
    }
  });
});
