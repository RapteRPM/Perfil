// Crear mapa centrado en Bogotá
const map = L.map('map').setView([4.60971, -74.08175], 12);

// Capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);

let talleres = [];          // todos los talleres desde la BD
let talleresFiltrados = []; // talleres filtrados
let paginaActual = 1;
const porPagina = 10;

// Función para renderizar lista con paginación
function renderLista() {
    const lista = document.getElementById("lista-talleres");
    const paginacion = document.getElementById("paginacion");
    lista.innerHTML = "";
    paginacion.innerHTML = "";

    const inicio = (paginaActual - 1) * porPagina;
    const fin = inicio + porPagina;
    const paginaData = talleresFiltrados.slice(inicio, fin);

    // Renderizar elementos de la lista
    paginaData.forEach(item => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.innerHTML = `<b>${item.Nombre}</b> - ${item.Barrio || ""}`;
        li.addEventListener("click", () => {
            document.getElementById("modal-body").innerHTML = `
                <b>${item.Nombre}</b><br>
                <b>Barrio:</b> ${item.Barrio || "No especificado"}<br>
                <b>Días:</b> ${item.DiasAtencion || "No especificado"}<br>
                <b>Horario:</b> ${item.HoraInicio || ""} - ${item.HoraFin || ""}
            `;
            const modal = new bootstrap.Modal(document.getElementById("detalleModal"));
            modal.show();
        });
        lista.appendChild(li);
    });

    // Número total de páginas
    const totalPaginas = Math.ceil(talleresFiltrados.length / porPagina);
    if (totalPaginas <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination justify-content-center";

    // Botón anterior
    const prev = document.createElement("li");
    prev.className = `page-item ${paginaActual === 1 ? "disabled" : ""}`;
    prev.innerHTML = `<a class="page-link" href="#">«</a>`;
    prev.addEventListener("click", (e) => {
        e.preventDefault();
        if (paginaActual > 1) {
            paginaActual--;
            renderLista();
        }
    });
    ul.appendChild(prev);

    // Botones numéricos
    for (let i = 1; i <= totalPaginas; i++) {
        const liBtn = document.createElement("li");
        liBtn.className = `page-item ${i === paginaActual ? "active" : ""}`;
        liBtn.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        liBtn.addEventListener("click", (e) => {
            e.preventDefault();
            paginaActual = i;
            renderLista();
        });
        ul.appendChild(liBtn);
    }

    // Botón siguiente
    const next = document.createElement("li");
    next.className = `page-item ${paginaActual === totalPaginas ? "disabled" : ""}`;
    next.innerHTML = `<a class="page-link" href="#">»</a>`;
    next.addEventListener("click", (e) => {
        e.preventDefault();
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderLista();
        }
    });
    ul.appendChild(next);

    paginacion.appendChild(ul);
}

// Función para filtrar talleres
function buscarTaller() {
    const texto = document.getElementById("busquedaTaller").value.toLowerCase();
    talleresFiltrados = talleres.filter(t => 
        (t.Nombre && t.Nombre.toLowerCase().includes(texto)) ||
        (t.Barrio && t.Barrio.toLowerCase().includes(texto)) || 
        (t.DiasAtencion && t.DiasAtencion.toLowerCase().includes(texto))
    );
    paginaActual = 1;
    renderLista();
}

function filtrarTalleres() {
    const texto = document.getElementById("busquedaTaller").value.toLowerCase();
    const horaInicioFiltro = document.getElementById("horaInicioFiltro").value;
    const horaFinFiltro = document.getElementById("horaFinFiltro").value;
    const filtroDia = document.getElementById("filtroDia").value.toLowerCase();

    talleresFiltrados = talleres.filter(t => {
        let coincideBusqueda = true;
        let coincideHora = true;
        let coincideDia = true;

        // Filtro de texto (nombre o barrio)
        if (texto) {
            coincideBusqueda =
                (t.Nombre && t.Nombre.toLowerCase().includes(texto)) ||
                (t.Barrio && t.Barrio.toLowerCase().includes(texto));
        }

        // Filtro de rango de horas
        if (horaInicioFiltro && horaFinFiltro && t.HoraInicio && t.HoraFin) {
            const inicioTaller = t.HoraInicio;
            const finTaller = t.HoraFin;
            coincideHora = (horaInicioFiltro >= inicioTaller && horaFinFiltro <= finTaller);
        }

        return coincideBusqueda && coincideHora;
    });

    paginaActual = 1;
    renderLista();
}


// Activar búsqueda mientras se escribe
document.getElementById("busquedaTaller").addEventListener("input", buscarTaller);

// Cargar datos desde la API
fetch('/api/talleres')
    .then(res => res.json())
    .then(data => {
        talleres = data;
        talleresFiltrados = [...talleres]; // al inicio no hay filtro
        renderLista();

        // Pintar marcadores en el mapa
        data.forEach(item => {
            if (item.Latitud && item.Longitud) {
                L.marker([item.Latitud, item.Longitud])
                    .addTo(map)
                    .bindPopup(`
                        <b>${item.Nombre || "Sin nombre"}</b><br>
                        <b>Barrio:</b> ${item.Barrio || "No especificado"}<br>
                        <b>Días:</b> ${item.DiasAtencion || "No especificado"}<br>
                        <b>Horario:</b> ${item.HoraInicio || ""} - ${item.HoraFin || ""}
                    `);
            }
        });
    })
    .catch(err => console.error("Error cargando ubicaciones:", err));
