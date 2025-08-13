// ARCHIVO DE LA UBICACION DE LOS TALLERES EN BOGOTA
// Crear mapa centrado en Bogotá
const map = L.map('map').setView([4.60971, -74.08175], 12);

// Capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Cargar ubicaciones desde el servidor
fetch('/api/talleres')
    .then(res => res.json())
    .then(data => {
        console.log("Ubicaciones recibidas:", data); // para debug
        data.forEach(item => {
            if (item.Latitud && item.Longitud) {
                L.marker([item.Latitud, item.Longitud])
                    .addTo(map)
                    .bindPopup(`
                        <b>Vendedor ID:</b> ${item.Nombre || "No disponible"}<br>
                        <b>Horarios:</b> ${item.Horarios || "No especificado"}<br>
                        <b>Días de atención:</b> ${item.DiasAtencion || "No especificado"}
                    `);
            }
        });
    })
    .catch(err => console.error("Error cargando ubicaciones:", err));