// historial.js - HISTORIAL DE COMPRAS APARTADO USUARIO NATURAL
document.addEventListener('DOMContentLoaded', () => {
    const btnExcel = document.getElementById('btnExcel');
    const tabla = document.getElementById('tablaHistorial');
    const filtros = ['fechaInicio', 'fechaFin', 'tipoProducto', 'ordenPrecio'];

    async function cargarHistorial() {
        const query = filtros
            .map(id => {
                const value = document.getElementById(id).value;
                return value ? `${id}=${encodeURIComponent(value)}` : '';
            })
            .filter(Boolean)
            .join('&');

        try {
            const res = await fetch(`/api/historial?${query}`);
            if (!res.ok) throw new Error('Error en la petición');
            const data = await res.json();

            tabla.innerHTML = data.length
                ? data.map((item, i) => {
                    // Badge según el estado real de la factura
                    let estadoHtml = '';
                    const estado = (item.estado || '').toLowerCase();

                    if (estado === 'pago exitoso' || estado === 'finalizado' || estado === 'compra finalizada') {
                        estadoHtml = `<span class="badge bg-success">Finalizado</span>`;
                    } else if (estado === 'proceso pendiente' || estado === 'pendiente' || estado === 'en proceso') {
                        estadoHtml = `<span class="badge bg-warning text-dark">En Proceso</span>`;
                    } else if (estado === 'pago rechazado' || estado === 'cancelado') {
                        estadoHtml = `<span class="badge bg-danger">Cancelado</span>`;
                    } else {
                        estadoHtml = `<span class="badge bg-secondary">${item.estado || 'Desconocido'}</span>`;
                    }

                    // Formato fecha seguro
                    let fechaTexto = '';
                    if (item.fecha) {
                        // si viene como string 'YYYY-MM-DD...' o Date
                        try {
                            const d = new Date(item.fecha);
                            if (!isNaN(d)) fechaTexto = d.toISOString().split('T')[0];
                            else fechaTexto = String(item.fecha).split('T')[0];
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
                        </tr>
                    `;
                }).join('')
                : `<tr><td colspan="7" class="text-center">No hay resultados para los filtros seleccionados</td></tr>`;
        } catch (error) {
            console.error('Error al cargar historial:', error);
            tabla.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error cargando historial</td></tr>`;
        }
    }

    filtros.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', cargarHistorial);
    });

    cargarHistorial();

    // Descargar Excel con filtros aplicados
    btnExcel.addEventListener('click', (e) => {
        e.preventDefault();
        const query = filtros
            .map(id => {
                const value = document.getElementById(id).value;
                return value ? `${id}=${encodeURIComponent(value)}` : '';
            })
            .filter(Boolean)
            .join('&');

        const url = `/api/historial/excel${query ? '?' + query : ''}`;
        window.open(url, '_blank');
    });
});
