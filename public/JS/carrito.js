
    // Simulación de productos en el carrito (esto normalmente viene del backend o localStorage)
    const carrito = [
        {
            id: 1,
            nombre: "Guantes",
            precio: 30000,
            cantidad: 2,
            imagen: "image/Guantes1.jpg"
        },
        {
            id: 2,
            nombre: "Chaqueta",
            precio: 50000,
            cantidad: 1,
            imagen: "image/chaqueta2.jpg"
        }
    ];

    function cargarCarrito() {
        const tbody = document.querySelector("#tabla-carrito tbody");
        tbody.innerHTML = "";

        let total = 0;
        carrito.forEach(producto => {
            const subtotal = producto.precio * producto.cantidad;
            total += subtotal;

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><img src="${producto.imagen}" alt="${producto.nombre}" style="width: 80px; height: 80px; object-fit: cover;"></td>
                <td>${producto.nombre}</td>
                <td>$${producto.precio.toLocaleString()}</td>
                <td>
                    <input type="number" min="1" value="${producto.cantidad}" onchange="cambiarCantidad(${producto.id}, this.value)">
                </td>
                <td>$${subtotal.toLocaleString()}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${producto.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });

        document.getElementById("total-general").textContent = `$${total.toLocaleString()}`;
    }

    function cambiarCantidad(id, nuevaCantidad) {
        const producto = carrito.find(p => p.id === id);
        if (producto) {
            producto.cantidad = parseInt(nuevaCantidad);
            cargarCarrito();
        }
    }

    function eliminarProducto(id) {
        const indice = carrito.findIndex(p => p.id === id);
        if (indice !== -1) {
            carrito.splice(indice, 1);
            cargarCarrito();
        }
    }

    function finalizarCompra() {
        alert("Redirigiendo al proceso de pago...");
        // Aquí puedes redirigir a una página de pago o enviar los datos al backend
    }

    // Cargar carrito al inicio
    window.onload = cargarCarrito;

