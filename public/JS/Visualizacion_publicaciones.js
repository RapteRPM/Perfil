// ===============================
// 📦 Visualizacion_publicaciones.js
// ===============================

let publicacionesGlobal = [];
let categoriaSeleccionada = null;

/**
 * Carga publicaciones desde la API
 * @param {string|null} categoria - Nombre de la categoría ("Todos", "Accesorios", etc.)
 * @param {number|null} limite - Límite de resultados
 */
async function cargarPublicaciones(categoria = null, limite = null) {
    try {
        let url = '/api/publicaciones_publicas';
        const params = [];
        if (categoria && categoria.toLowerCase() !== 'todos') {
            params.push(`categoria=${categoria}`);
        }
        if (limite) {
            params.push(`limite=${limite}`);
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        const res = await fetch(url);
        let productos = await res.json();

        // 🔹 Normalizar rutas de imágenes
        productos = productos.map(p => {
            let imagenes = [];

            if (Array.isArray(p.imagenes)) {
                imagenes = p.imagenes.map(img => img.replace(/\\/g, '/').trim());
            } else if (typeof p.imagenes === 'string' && p.imagenes.length > 0) {
                imagenes = p.imagenes.split(',').map(img => img.replace(/\\/g, '/').trim());
            } else {
                imagenes = ['Imagen/placeholder.png'];
            }

            imagenes = imagenes.map(img => img.startsWith('/') ? img.slice(1) : img);

            return { ...p, imagenes };
        });

        if (!categoria || categoria.toLowerCase() === 'todos') {
            shuffleArray(productos);
        }

        publicacionesGlobal = productos;
        renderizarProductos(productos.slice(0, limite || productos.length));

    } catch (err) {
        console.error("Error al cargar publicaciones:", err);
    }
}

/**
 * Renderiza productos en el contenedor
 */
function renderizarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = `<p class="text-center text-gray-500 col-span-full">No se encontraron productos.</p>`;
        return;
    }

    lista.forEach(p => {
        const carouselId = `carousel-${p.idPublicacion}`;

        // 🖼️ Crear carrusel con imágenes
        const imagenesHTML = p.imagenes
            .map((img, index) => `
                <div class="carousel-item ${index === 0 ? "active" : ""}">
                    <img src="/${img}" class="d-block w-100 producto-imagen rounded" alt="Imagen ${index + 1}">
                </div>
            `).join("");

        // 🧩 Tarjeta del producto
const card = `
  <div class="card card-bootstrap shadow-lg border-0">
      <div id="${carouselId}" class="carousel slide">
          <div class="carousel-inner">
              ${imagenesHTML}
          </div>
          ${p.imagenes.length > 1 ? `
              <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon"></span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                  <span class="carousel-control-next-icon"></span>
              </button>
          ` : ""}
      </div>
      <div class="card-body">
          <h5 class="card-title font-bold">${p.nombreProducto}</h5>
          <p class="text-gray-600">$${p.precio.toLocaleString()}</p>
          <a href="/Natural/Detalle_producto.html?id=${p.idPublicacion}" class="btn btn-danger">Ver Más</a>
      </div>
  </div>
`;
        contenedor.insertAdjacentHTML("beforeend", card);
    });
}

/**
 * Mezcla aleatoriamente un array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Filtra publicaciones por categoría (máx 6 sugerencias)
 */
function filtrarCategoria(nombre) {
    const limite = 6;
    categoriaSeleccionada = nombre;
    cargarPublicaciones(nombre, limite);
}

/**
 * Carga categorías y genera botones
 */
async function cargarCategorias() {
    try {
        const res = await fetch('/api/categorias');
        const categorias = await res.json();

        const contenedor = document.getElementById("contenedor-categorias");
        if (!contenedor) return;

        // Botón "Todos" por defecto
        const btnTodos = document.createElement("button");
        btnTodos.textContent = "Todos";
        btnTodos.className = "categoria-boton bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700";
        btnTodos.addEventListener("click", () => filtrarCategoria("Todos"));
        contenedor.appendChild(btnTodos);

        // Botones por categoría
        categorias.forEach(cat => {
            const btn = document.createElement("button");
            btn.textContent = cat.NombreCategoria;
            btn.className = "categoria-boton bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700";
            btn.addEventListener("click", () => filtrarCategoria(cat.NombreCategoria));
            contenedor.appendChild(btn);
        });
    } catch (err) {
        console.error("Error al cargar categorías:", err);
    }
}

/**
 * Inicialización al cargar la página
 */
document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    cargarPublicaciones(null, 6);

    const inputBusqueda = document.getElementById("busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", () => {
            const texto = inputBusqueda.value.toLowerCase();
            const filtrados = publicacionesGlobal.filter(p =>
                p.nombreProducto.toLowerCase().includes(texto)
            );
            renderizarProductos(filtrados.slice(0, 6));
        });
    }
});
