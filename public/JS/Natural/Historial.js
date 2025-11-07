// historial.js - HISTORIAL DE COMPRAS APARTADO USUARIO NATURAL
document.addEventListener('DOMContentLoaded', () => {
    const btnExcel = document.getElementById('btnExcel');
    const tabla = document.getElementById('tablaHistorial');
    const filtros = ['fechaInicio', 'fechaFin', 'tipoProducto', 'ordenPrecio'];

    const usuarioId = sessionStorage.getItem('usuarioId') || localStorage.getItem('usuarioId');

    if (!usuarioId) {
        console.error("❌ No se encontró usuario logueado.");
        tabla.innerHTML = `<tr><td colspan="8" class="text-center text-danger">No se encontró información del usuario</td></tr>`;
        return;
    }

    async function cargarHistorial() {
        const query = [
            `usuarioId=${encodeURIComponent(usuarioId)}`,
            ...filtros.map(id => {
                const value = document.getElementById(id).value;
                return value ? `${id}=${encodeURIComponent(value)}` : '';
            }).filter(Boolean)
        ].join('&');

        try {
            const res = await fetch(`/api/historial?${query}`);
            if (!res.ok) throw new Error('Error en la petición');
            const data = await res.json();

            tabla.innerHTML = data.length
                ? data.map((item, i) => {
                    const estado = (item.estado || '').toLowerCase();
                    let estadoHtml = '';
                    let accionesHtml = ''; // 🔹 Nueva variable para botones

                    if (['pago exitoso', 'finalizado', 'compra finalizada'].includes(estado)) {
                        estadoHtml = `<span class="badge bg-success">Finalizado</span>`;
                    } else if (['proceso pendiente', 'pendiente', 'en proceso'].includes(estado)) {
                        estadoHtml = `<span class="badge bg-warning text-dark">En Proceso</span>`;

                        // 🔹 Mostrar botones solo si está pendiente
                        accionesHtml = `
                            <button class="btn btn-sm btn-success btnRecibido" data-id="${item.idDetalleFactura}">Recibido</button>
                            <button class="btn btn-sm btn-danger btnCancelado" data-id="${item.idDetalleFactura}">Cancelado</button>
                        `;
                    } else if (['pago rechazado', 'cancelado'].includes(estado)) {
                        estadoHtml = `<span class="badge bg-danger">Cancelado</span>`;
                    } else {
                        estadoHtml = `<span class="badge bg-secondary">${item.estado || 'Desconocido'}</span>`;
                    }

                    // Fecha
                    let fechaTexto = '';
                    if (item.fecha) {
                        try {
                            const d = new Date(item.fecha);
                            fechaTexto = !isNaN(d) ? d.toISOString().split('T')[0] : String(item.fecha).split('T')[0];
                        } catch {
                            fechaTexto = String(item.fecha).split('T')[0];
                        }
                    }

                    return `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${item.producto || ''}</td>
                            <td>${item.categoria || ''}</td>
                            <td>${fechaTexto}</td>
                            <td>$${Number(item.precio || 0).toLocaleString('es-CO')}</td>
                            <td>${item.metodoPago || ''}</td>
                            <td>${estadoHtml}</td>
                            <td>${accionesHtml}</td>
                        </tr>
                    `;
                }).join('')
                : `<tr><td colspan="8" class="text-center text-muted py-4">No hay resultados para los filtros seleccionados</td></tr>`;

            // 🔹 Agregamos listeners para los botones
            document.querySelectorAll('.btnRecibido').forEach(btn => {
                btn.addEventListener('click', () => actualizarEstado(btn.dataset.id, 'Finalizado'));
            });
            document.querySelectorAll('.btnCancelado').forEach(btn => {
                btn.addEventListener('click', () => actualizarEstado(btn.dataset.id, 'Cancelado'));
            });

        } catch (error) {
            console.error('❌ Error al cargar historial:', error);
            tabla.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error cargando historial</td></tr>`;
        }
    }

    // 🔹 Función para actualizar estado en backend
    async function actualizarEstado(idDetalle, nuevoEstado) {
        if (!confirm(`¿Seguro que quieres marcar este pedido como ${nuevoEstado}?`)) return;

        try {
            const res = await fetch(`/api/historial/estado/${idDetalle}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            const result = await res.json();
            if (result.success) {
                alert(`✅ Estado actualizado a ${nuevoEstado}`);
                cargarHistorial(); // recarga la tabla
            } else {
                alert(`⚠️ Error: ${result.message || 'No se pudo actualizar el estado'}`);
            }
        } catch (err) {
            console.error('Error al actualizar estado:', err);
            alert('❌ Error al actualizar el estado');
        }
    }

    filtros.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', cargarHistorial);
    });

    cargarHistorial();

    btnExcel.addEventListener('click', (e) => {
        e.preventDefault();
        const query = [
            `usuarioId=${encodeURIComponent(usuarioId)}`,
            ...filtros.map(id => {
                const value = document.getElementById(id).value;
                return value ? `${id}=${encodeURIComponent(value)}` : '';
            }).filter(Boolean)
        ].join('&');
        const url = `/api/historial/excel?${query}`;
        window.open(url, '_blank');
    });
});
