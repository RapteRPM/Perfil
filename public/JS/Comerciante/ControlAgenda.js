// DISEÑO, ESTILO Y FUNCIONAMIENTO DE LA AGENDA COMERCIANTE

// Eventos simulados (puedes reemplazarlos más adelante con los de la BD)
const eventosSimulados = [
  {
    id: '1',
    title: 'Entrega: Kit de frenos',
    start: '2025-09-30',
    descripcion: 'Cliente solicita entrega de kit de frenos en taller principal.',
  },
  {
    id: '2',
    title: 'Taller: Revisión general',
    start: '2025-10-02',
    descripcion: 'Cita en taller para revisión completa de vehículo.',
  },
  {
    id: '3',
    title: 'Domicilio: Cambio de batería',
    start: '2025-10-04',
    descripcion: 'Cliente solicita mecánico a domicilio para cambio de batería.',
  },
];

let calendar;
let eventoActual;

document.addEventListener('DOMContentLoaded', function () {
  // Inicializar calendario con colores adaptados al tema RPM
  calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    initialView: 'dayGridMonth',
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek',
    },
    events: eventosSimulados.map(evento => ({
      ...evento,
      backgroundColor: 'rgb(236, 11, 11)', // naranja RPM
      borderColor: 'rgb(236, 11, 11)',
      textColor: '#fff',
    })),
    eventClick: function (info) {
      resaltarEvento(info.event);
      mostrarModal(info.event);
    },
  });

  calendar.render();

  // Cargar lista lateral
  cargarListaCitas();
});

// Cargar lista lateral de citas
function cargarListaCitas() {
  const lista = document.getElementById('lista-citas');
  lista.innerHTML = '';
  eventosSimulados.forEach(evento => {
    const item = document.createElement('div');
    item.className = 'cita-item';
    item.style.backgroundColor = '#2c2c2c';
    item.style.color = '#fff';
    item.style.border = '1px solid rgb(236, 11, 11)';
    item.style.transition = '0.3s';
    item.innerText = `${evento.title} - ${evento.start}`;
    item.onmouseenter = () => (item.style.backgroundColor = 'rgb(236, 11, 11)');
    item.onmouseleave = () => (item.style.backgroundColor = '#2c2c2c');
    item.onclick = () => {
      const eventoCalendario = calendar.getEventById(evento.id);
      resaltarEvento(eventoCalendario);
      mostrarModal(eventoCalendario);
    };
    lista.appendChild(item);
  });
}

// Resalta el evento seleccionado en el calendario
function resaltarEvento(evento) {
  calendar.getEvents().forEach(e => {
    e.setProp('backgroundColor', 'rgb(236, 11, 11)');
    e.setProp('borderColor', 'rgb(236, 11, 11)');
  });
  evento.setProp('backgroundColor', '#00cc88');
  evento.setProp('borderColor', '#00aa77');
}

// Muestra modal con la información de la cita
function mostrarModal(evento) {
  eventoActual = evento;
  document.getElementById('modal-title').innerText = evento.title;
  document.getElementById('modal-desc').innerText = evento.extendedProps.descripcion;
  document.getElementById('modal-date').innerText = evento.startStr;
  document.getElementById('overlay').style.display = 'block';
  document.getElementById('modal').style.display = 'block';
}

// Cierra el modal
function cerrarModal() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('modal').style.display = 'none';
  document.getElementById('nuevaFecha').value = '';
}

// Aceptar fecha
function aceptarFecha() {
  mostrarAlerta("✅ Fecha aceptada para: " + eventoActual.title, "success");
  cerrarModal();
}

// Proponer nueva fecha
function proponerFecha() {
  const nueva = document.getElementById('nuevaFecha').value;
  if (nueva) {
    eventoActual.setStart(nueva);
    mostrarAlerta("📆 Nueva fecha propuesta: " + nueva, "info");
    cerrarModal();
  } else {
    mostrarAlerta("⚠️ Por favor selecciona una nueva fecha", "warning");
  }
}

// Función de alerta moderna
function mostrarAlerta(mensaje, tipo) {
  const alertBox = document.createElement('div');
  alertBox.className = `alert alert-${tipo} position-fixed bottom-0 end-0 m-4 shadow`;
  alertBox.style.zIndex = 2000;
  alertBox.textContent = mensaje;
  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 3000);
}
