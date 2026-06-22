(function() {
  if (window._ghPagesAdapter) return;
  window._ghPagesAdapter = true;

  var host = location.hostname;
  // Solo interceptar en GitHub Pages o file://
  if (!host.endsWith('.github.io') && location.protocol !== 'file:') return;

  console.log('[GH Pages] Modo estático — API de archivos no disponible');

  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input.url || '');
    if (url.includes('/api/')) {
      return Promise.resolve(new Response(null, { status: 404 }));
    }
    return origFetch.call(this, input, init);
  };

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (typeof window.showNotif === 'function') {
        window.showNotif('Demo estática — la gestión de archivos requiere servidor', 'info');
      }
    }, 3000);
  });
})();
