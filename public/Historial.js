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
            const data = await res.json();

            tabla.innerHTML = data.length
                ? data.map((item, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${item.producto}</td>
                        <td>${item.categoria}</td>
                        <td>${item.fecha.split('T')[0]}</td>
                        <td>$${Number(item.precio).toLocaleString('es-CO')}</td>
                    </tr>
                `).join('')
                : `<tr><td colspan="5" class="text-center">No hay resultados para los filtros seleccionados</td></tr>`;
        } catch (error) {
            console.error('Error al cargar historial:', error);
        }
    }

    filtros.forEach(id => {
        document.getElementById(id).addEventListener('change', cargarHistorial);
    });

    cargarHistorial();
});
    // Descargar Excel con filtros aplicados

btnExcel.addEventListener('click', () => {
    const query = filtros
        .map(id => {
            const value = document.getElementById(id).value;
            return value ? `${id}=${encodeURIComponent(value)}` : '';
        })
        .filter(Boolean)
        .join('&');

    // Descargar Excel con filtros aplicados
    const url = `/api/historial/excel?${query}`;
    window.open(url, '_blank');
});
