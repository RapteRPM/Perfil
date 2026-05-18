(function () {
  const defaultApiUrl = 'https://backend-production-05b9.up.railway.app';
  const apiBaseCandidates = [
    window.API_URL,
    window.__RPM_API_BASE_URL__,
    localStorage.getItem('RPM_API_BASE_URL'),
    document.documentElement?.dataset?.rpmApiBase,
    defaultApiUrl,
    ''
  ].filter(Boolean);

  const apiBase = apiBaseCandidates[0] || '';
  const appBase = (() => {
    const pathname = window.location.pathname;
    const sections = ['General', 'Natural', 'Comerciante', 'PrestadorServicios', 'Administrador', 'JS', 'image'];

    for (const section of sections) {
      const marker = `/${section}/`;
      const index = pathname.indexOf(marker);
      if (index !== -1) {
        return pathname.slice(0, index + 1);
      }
    }

    return pathname.endsWith('/') ? pathname : pathname.replace(/[^/]*$/, '');
  })();

  function isExternalUrl(value) {
    return /^(https?:|data:|mailto:|tel:|blob:|#)/i.test(value);
  }

  function resolveAppUrl(path) {
    if (!path || typeof path !== 'string' || isExternalUrl(path)) {
      return path;
    }

    if (path.startsWith('/')) {
      return `${appBase}${path.slice(1)}`;
    }

    return new URL(path, window.location.href).href;
  }

  function resolveApiUrl(path) {
    if (!path || typeof path !== 'string' || isExternalUrl(path)) {
      return path;
    }

    if (!path.startsWith('/')) {
      return path;
    }

    if (!apiBase) {
      return new URL(path, window.location.origin).href;
    }

    return `${apiBase.replace(/\/$/, '')}${path}`;
  }

  function rewriteAttributeValue(element, attributeName, resolver) {
    const currentValue = element.getAttribute(attributeName);
    if (!currentValue || isExternalUrl(currentValue)) {
      return;
    }

    if (attributeName === 'href' && currentValue === '/logout') {
      return;
    }

    if (currentValue.startsWith('/')) {
      element.setAttribute(attributeName, resolver(currentValue));
    }
  }

  function rewriteDocumentPaths(root = document) {
    root.querySelectorAll('a[href], img[src], form[action], link[href]').forEach((element) => {
      if (element.tagName === 'A') {
        rewriteAttributeValue(element, 'href', resolveAppUrl);
      } else if (element.tagName === 'IMG') {
        rewriteAttributeValue(element, 'src', resolveAppUrl);
      } else if (element.tagName === 'FORM') {
        rewriteAttributeValue(element, 'action', resolveApiUrl);
      } else if (element.tagName === 'LINK') {
        rewriteAttributeValue(element, 'href', resolveAppUrl);
      }
    });
  }

  function ejecutarLogout(event) {
    const link = event.target.closest('a[href="/logout"]');
    if (!link) {
      return;
    }

    event.preventDefault();

    Promise.resolve(fetch(resolveApiUrl('/logout'), { method: 'GET' }))
      .catch(() => null)
      .finally(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = resolveAppUrl('/General/Ingreso.html');
      });
  }

  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init) => {
      if (typeof input === 'string' && (input.startsWith('/api/') || input === '/logout' || input === '/health')) {
        return originalFetch(resolveApiUrl(input), init);
      }

      if (input instanceof Request) {
        const requestUrl = input.url;
        if (requestUrl.startsWith(window.location.origin) && (requestUrl.includes('/api/') || requestUrl.endsWith('/logout') || requestUrl.endsWith('/health'))) {
          return originalFetch(resolveApiUrl(new URL(requestUrl).pathname), init || input);
        }
      }

      return originalFetch(input, init);
    };
  }

  window.RPM_PORTABLE_PATHS = {
    apiBase,
    appBase,
    resolveAppUrl,
    resolveApiUrl,
    rewriteDocumentPaths
  };

  window.API_URL = apiBase;
  console.log('✅ API_URL configurada:', window.API_URL);

  document.addEventListener('click', ejecutarLogout);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => rewriteDocumentPaths());
  } else {
    rewriteDocumentPaths();
  }
})();