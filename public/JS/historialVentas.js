// historialVentas.js

document.addEventListener('DOMContentLoaded', () => {
    const tabla = document.getElementById('tablaVentas');
    const btnExcel = document.getElementById('btnExcel');

    // Cargar ventas automáticamente al abrir la página
    cargarHistorialVentas();

    // Botón para descargar Excel
    if (btnExcel) {
        btnExcel.addEventListener('click', () => {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            const tipoProducto = document.getElementById('tipoProducto').value;

            const queryParams = new URLSearchParams({
                fechaInicio,
                fechaFin,
                tipoProducto
            }).toString();

            window.open(`/api/historial-ventas/excel?${queryParams}`, '_blank');
        });
    }

    // Función para cargar historial de ventas
    function cargarHistorialVentas() {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const tipoProducto = document.getElementById('tipoProducto').value;

        const queryParams = new URLSearchParams({
            fechaInicio,
            fechaFin,
            tipoProducto
        }).toString();

        fetch(`/api/historial-ventas?${queryParams}`)
            .then(res => res.json())
            .then(data => {
                tabla.innerHTML = ''; // Limpia tabla antes de rellenar
                if (data.length === 0) {
                    tabla.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center">No se encontraron ventas</td>
                        </tr>
                    `;
                    return;
                }

                data.forEach((venta, index) => {
                    const row = `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${venta.IdFactura}</td>
                            <td>${venta.NombreProducto}</td>
                            <td>${venta.NombreCategoria}</td>
                            <td>${new Date(venta.RegistroCompra).toISOString().split('T')[0]}</td>
                            <td>${venta.Cantidad}</td>
                            <td>$${venta.TotalCompra.toLocaleString()}</td>
                        </tr>
                    `;
                    tabla.insertAdjacentHTML('beforeend', row);
                });
            })
            .catch(err => {
                console.error('Error cargando historial de ventas:', err);
                tabla.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-danger text-center">Error al cargar ventas</td>
                    </tr>
                `;
            });
    }
});
