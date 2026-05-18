# PAGINA_RPM

Frontend estático de RPM Market.

Este repositorio ya no incluye el backend Node/Express; las páginas usan `public/JS/portablePaths.js` para resolver rutas internas y para apuntar a un backend externo configurado con `window.__RPM_API_BASE_URL__` o `localStorage.RPM_API_BASE_URL`.