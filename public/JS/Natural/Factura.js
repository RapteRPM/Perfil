document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const facturaId = params.get('factura');

  if (!facturaId) {
    document.querySelector('.factura-container').innerHTML = '<p>No se encontró ID de factura</p>';
    return;
  }

  try {
    const res = await fetch(`/api/factura/${facturaId}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.msg || 'Error al obtener factura');

    const { factura, detalles } = data;

    document.querySelector('.factura-container').innerHTML = `
      <div class="factura-header">
        <h2>Factura de Compra</h2>
        <p class="text-muted">Transacción confirmada</p>
      </div>
      <div>
        <h5>Datos del Comprador</h5>
        <p><strong>Nombre:</strong> ${factura.NombreUsuario} ${factura.ApellidoUsuario}</p>
        <p><strong>Correo:</strong> ${factura.Correo}</p>
        <p><strong>Dirección:</strong> ${factura.Direccion || 'No registrada'}</p>
      </div>
      <div class="mt-4">
        <h5>Detalles de la Factura</h5>
        <p><strong>N°:</strong> #FAC-${factura.IdFactura}</p>
        <p><strong>Fecha:</strong> ${new Date(factura.FechaCompra).toLocaleString()}</p>
        <p><strong>Método:</strong> ${factura.MetodoPago.toUpperCase()}</p>
        <p><strong>Estado:</strong> ✅ ${factura.Estado}</p>
      </div>
      <div class="mt-4">
        <h5>Productos Comprados</h5>
        <table class="table table-striped text-center align-middle">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${detalles.map(d => `
              <tr>
                <td><img src="../image/${d.ImagenProducto}" class="product-img me-2"> ${d.NombreProducto}</td>
                <td>${d.Cantidad}</td>
                <td>$${Number(d.PrecioUnitario).toLocaleString()}</td>
                <td>$${Number(d.Total).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="fw-bold text-end mt-3">Total Pagado: <span class="text-primary">$${Number(factura.TotalPago).toLocaleString()}</span></p>
      </div>
    `;
  } catch (error) {
    console.error('Error cargando factura:', error);
    document.querySelector('.factura-container').innerHTML = '<p>No se pudo cargar la factura</p>';
  }
});
