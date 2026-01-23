#!/bin/bash

# Script para actualizar masivamente las llamadas fetch en archivos JS
# Este script busca y reemplaza patrones de fetch por el nuevo sistema de API

echo "🔄 Actualizando archivos JS para usar api-config.js..."

# Función para agregar el import si no existe
add_import_if_needed() {
    local file=$1
    if ! grep -q "import.*api-config.js" "$file"; then
        # Agregar import al inicio del archivo
        sed -i '1i import { API_CONFIG, fetchAPI, postAPI, putAPI, deleteAPI, getAPI } from '\''../api-config.js'\'';' "$file"
        echo "✅ Import agregado a $file"
    fi
}

# Archivos a procesar
FILES=(
    "public/JS/RecuperarContraseña.js"
    "public/JS/cambiarcontraseña.js"
    "public/JS/market_gruas.js"
    "public/JS/Visualizacion_publicaciones.js"
    "public/JS/Comerciante/publicacion.js"
    "public/JS/Comerciante/registro_publicacion.js"
    "public/JS/Comerciante/historialVentas.js"
    "public/JS/Comerciante/editar_publicacion.js"
    "public/JS/Comerciante/ControlAgenda.js"
    "public/JS/Comerciante/editar_perfilComerciante.js"
    "public/JS/Comerciante/dashboard_comerciante.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Procesando $file..."
        add_import_if_needed "$file"
    else
        echo "⚠️  Archivo no encontrado: $file"
    fi
done

echo "✅ Actualización completada"
echo "⚠️  NOTA: Aún necesitas revisar manualmente cada archivo y actualizar las llamadas fetch"
echo "   para usar fetchAPI, getAPI, postAPI, etc."
