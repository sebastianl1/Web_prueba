/**
 * NexSCADA — integration-bus.js
 * Bus de eventos compartido entre P&ID, HMI 3D y Dashboard.
 *
 * Eventos:
 *   - 'tag:select'  → un módulo informa que el usuario seleccionó un tag/variable.
 *                     detail: { varId?, tag?, source: 'pid'|'hmi'|'dashboard' }
 *   - 'tag:focus'   → solicitar a los otros módulos resaltar ese tag.
 *                     detail: { varId, tag, source }
 *
 * También expone un panel flotante "Tag Inspector" que aparece al seleccionar
 * un tag y permite saltar entre las pestañas P&ID, HMI y Dashboard manteniendo
 * el contexto del tag activo.
 */
(function () {
  if (window.scadaBus) return;

  // ───── Bus ─────────────────────────────────────────────────────
  const bus = new EventTarget();
  bus.emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
  bus.on   = (type, cb)     => bus.addEventListener(type, e => cb(e.detail || {}));
  window.scadaBus = bus;

  // ───── Resolver: dado un varId o tag arbitrario, devolver la variable ─────
  function resolveVariable({ varId, tag }) {
    const vars = (window.variableManager && window.variableManager.variables) || [];
    if (varId) {
      const v = vars.find(x => x.id === varId);
      if (v) return v;
    }
    if (tag) {
      const norm = String(tag).trim().toLowerCase();
      const v = vars.find(x =>
        (x.id  && x.id.toLowerCase()  === norm) ||
        (x.tag && x.tag.toLowerCase() === norm) ||
        (x.tag && x.tag.toLowerCase().includes(norm))
      );
      if (v) return v;
    }
    return varId ? { id: varId, tag: varId, unit: '' } : null;
  }
  window.scadaResolveVar = resolveVariable;

  // ───── Estado del tag activo ────────────────────────────────────
  let activeVar = null;

  // ───── Tag Inspector (panel flotante) ───────────────────────────
  function ensurePanel() {
    let p = document.getElementById('tagInspector');
    if (p) return p;
    p = document.createElement('div');
    p.id = 'tagInspector';
    p.style.cssText = `
      position:fixed; right:18px; bottom:18px; z-index:9999;
      min-width:280px; max-width:340px;
      background:var(--bg-panel,#161b22); color:var(--text-primary,#e6edf3);
      border:1px solid var(--border-subtle,#30363d); border-radius:12px;
      box-shadow:0 12px 32px rgba(0,0,0,0.45);
      font-family:'Inter',system-ui,sans-serif; font-size:13px;
      display:none; overflow:hidden; cursor:grab; user-select:none;
    `;
    p.innerHTML = `
      <div id="tiDragHandle" style="display:flex;align-items:center;justify-content:space-between;
                  padding:10px 12px;border-bottom:1px solid var(--border-subtle,#30363d);
                  background:rgba(255,255,255,0.03);cursor:grab">
        <div style="display:flex;align-items:center;gap:8px;font-weight:600;letter-spacing:.04em;font-size:11px;color:var(--text-muted,#8b949e);text-transform:uppercase">
          <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e"></span>
          Tag activo
        </div>
        <div style="display:flex;gap:4px">
          <button data-go="process" class="ti-btn ti-btn-icon" title="Ir al símbolo en P&amp;ID">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </button>
          <button data-go="hmi" class="ti-btn ti-btn-icon" title="Ir al panel HMI">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
          </button>
          <button data-go="dashboard" class="ti-btn ti-btn-icon" title="Ir al Dashboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
          <button id="tiMinimize" style="background:none;border:none;color:var(--text-muted,#8b949e);cursor:pointer;font-size:14px;line-height:1;padding:2px 5px;border-radius:4px" title="Minimizar">─</button>
          <button id="tagInspectorClose" style="background:none;border:none;color:var(--text-muted,#8b949e);cursor:pointer;font-size:16px;line-height:1;padding:2px 6px;border-radius:4px;margin-left:2px">×</button>
        </div>
      </div>
      <div id="tiBody" style="padding:12px">
        <div id="tagInspectorTag"  style="font-weight:600;font-size:14px;margin-bottom:2px"></div>
        <div id="tagInspectorDesc" style="font-size:11px;color:var(--text-muted,#8b949e);margin-bottom:6px"></div>
        <div id="tagInspectorLaw"  style="font-size:10px;color:var(--accent-cyan,#00d4ff);margin-bottom:8px;font-family:'JetBrains Mono',monospace"></div>
        <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:4px">
          <div id="tagInspectorVal" style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:600;color:#22c55e">--</div>
          <div id="tagInspectorUnit" style="font-size:11px;color:var(--text-muted,#8b949e)"></div>
          <div id="tagInspectorSrc"  style="margin-left:auto;font-size:9px;letter-spacing:.1em;color:var(--text-muted,#8b949e);text-transform:uppercase"></div>
        </div>
        <div id="tagInspectorRange" style="font-size:10px;color:var(--text-muted,#8b949e);margin-bottom:8px;font-family:'JetBrains Mono',monospace"></div>
        <div id="tagInspectorTime" style="font-size:9px;color:var(--text-dim,#484f58);margin-bottom:6px;text-align:right"></div>
        <div style="display:flex;gap:6px;padding-top:8px;border-top:1px solid rgba(48,54,61,0.4)">
          <button data-go="process" class="ti-btn" style="flex:1">🔍 P&amp;ID</button>
          <button data-go="hmi" class="ti-btn" style="flex:1">🖥 HMI</button>
          <button data-go="dashboard" class="ti-btn" style="flex:1">📊 Dashboard</button>
        </div>
        <div style="font-size:9px;color:var(--text-dim,#484f58);text-align:center;margin-top:6px">Click para navegar → el símbolo se resalta automáticamente</div>
      </div>
    `;
    document.body.appendChild(p);

    // ── Drag to move ──
    (function() {
      var dragHandle = p.querySelector('#tiDragHandle');
      var isDragging = false, startX, startY, origX, origY;
      dragHandle.addEventListener('mousedown', function(e) {
        isDragging = true;
        p.style.cursor = 'grabbing';
        startX = e.clientX; startY = e.clientY;
        var rect = p.getBoundingClientRect();
        origX = rect.left; origY = rect.top;
        // Fix position to explicit coords
        p.style.right = ''; p.style.bottom = '';
        p.style.left = origX + 'px'; p.style.top = origY + 'px';
        e.preventDefault();
      });
      document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        p.style.left = (origX + e.clientX - startX) + 'px';
        p.style.top = (origY + e.clientY - startY) + 'px';
      });
      document.addEventListener('mouseup', function() {
        if (isDragging) { isDragging = false; p.style.cursor = 'grab'; }
      });
      // Touch support
      dragHandle.addEventListener('touchstart', function(e) {
        var t = e.touches[0];
        isDragging = true;
        startX = t.clientX; startY = t.clientY;
        var rect = p.getBoundingClientRect();
        origX = rect.left; origY = rect.top;
        p.style.right = ''; p.style.bottom = '';
        p.style.left = origX + 'px'; p.style.top = origY + 'px';
      }, {passive:true});
      document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        var t = e.touches[0];
        p.style.left = (origX + t.clientX - startX) + 'px';
        p.style.top = (origY + t.clientY - startY) + 'px';
      }, {passive:true});
      document.addEventListener('touchend', function() { isDragging = false; });
    })();

    // ── Minimize ──
    p.querySelector('#tiMinimize').addEventListener('click', function() {
      var body = p.querySelector('#tiBody');
      var btn = this;
      if (body.style.display === 'none') {
        body.style.display = '';
        btn.textContent = '─';
        btn.title = 'Minimizar';
        p.style.maxWidth = '';
      } else {
        body.style.display = 'none';
        btn.textContent = '□';
        btn.title = 'Expandir';
        p.style.maxWidth = '180px';
      }
    });

    // Estilo de los botones
    const style = document.createElement('style');
    style.textContent = `
      #tagInspector .ti-btn {
        background:rgba(34,197,94,0.10); color:#22c55e;
        border:1px solid rgba(34,197,94,0.35); border-radius:8px;
        padding:7px 6px; font-size:11px; font-weight:600; letter-spacing:.04em;
        cursor:pointer; transition:all .15s;
      }
      #tagInspector .ti-btn:hover {
        background:rgba(34,197,94,0.18); transform:translateY(-1px);
      }
      #tagInspector .ti-btn-icon {
        width:30px; height:26px; padding:0;
        display:inline-flex; align-items:center; justify-content:center;
        background:rgba(255,255,255,0.04); border-color:rgba(48,54,61,0.4);
        color:var(--text-muted,#8b949e); border-radius:6px;
      }
      #tagInspector .ti-btn-icon:hover {
        background:rgba(34,197,94,0.12); border-color:#22c55e; color:#22c55e;
        transform:translateY(-1px);
      }
    `;
    document.head.appendChild(style);

    p.querySelector('#tagInspectorClose').addEventListener('click', () => {
      p.style.display = 'none';
      activeVar = null;
    });

    p.querySelectorAll('button[data-go]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!activeVar) return;
        const tab = btn.getAttribute('data-go');
        if (typeof window.showTab === 'function') window.showTab(tab);
        // Pequeño delay para que la pestaña esté visible antes de pedir focus
        setTimeout(() => {
          bus.emit('tag:focus', { varId: activeVar.id, tag: activeVar.tag, source: 'inspector' });
        }, 80);
      });
    });

    return p;
  }

  function _getInspectorDisplayValue(varId) {
    const db = window.TAG_PROPERTIES_DB || {};
    const props = db[varId];
    if (!props) return { value: varId, unit: '' };
    const priority = ['physical', 'process', 'chemical'];
    for (const cat of priority) {
      if (props[cat] && props[cat].length > 0) {
        const p = props[cat][0];
        return { value: p.value, unit: p.unit };
      }
    }
    return { value: varId, unit: '' };
  }

  function renderInspector(v, source) {
    const p = ensurePanel();
    p.style.display = 'block';
    p.querySelector('#tagInspectorTag').textContent  = v.tag || v.id;
    p.querySelector('#tagInspectorDesc').textContent = v.desc || v.id || '';

    // Engineering property / transport law from theoretical framework
    const db = window.TAG_PROPERTIES_DB || {};
    const props = db[v.id];
    const lawEl = document.getElementById('tagInspectorLaw');
    if (lawEl) {
      const firstProp = props && (props.physical && props.physical[0] || props.process && props.process[0] || props.chemical && props.chemical[0]);
      lawEl.textContent = firstProp ? `${firstProp.value} ${firstProp.unit}` : '';
    }

    const tv = _getInspectorDisplayValue(v.id);
    p.querySelector('#tagInspectorUnit').textContent = tv.unit;
    p.querySelector('#tagInspectorSrc').textContent  = source ? 'desde ' + source : '';

    const rangeEl = document.getElementById('tagInspectorRange');
    if (rangeEl) {
      rangeEl.textContent = '';
    }

    updateInspectorValue();
  }

  function updateInspectorValue() {
    if (!activeVar) return;
    const valEl = document.getElementById('tagInspectorVal');
    const timeEl = document.getElementById('tagInspectorTime');
    if (!valEl) return;
    const tv = _getInspectorDisplayValue(activeVar.id);
    valEl.textContent = tv.value;
    if (timeEl) {
      timeEl.textContent = '📋 Marco teórico';
    }
  }
  // Sin refresco en vivo — valor estático del marco teórico
  // setInterval(updateInspectorValue, 1500);

  // ───── Listener principal ──────────────────────────────────────
  bus.on('tag:select', (detail) => {
    const v = resolveVariable(detail);
    if (!v) return;
    activeVar = v;
    renderInspector(v, detail.source);
    // Reemitir focus para que todas las vistas resalten
    bus.emit('tag:focus', { varId: v.id, tag: v.tag, source: detail.source });
  });

  // API conveniente
  window.scadaSelectTag = (varOrTag, source = 'api') => {
    if (typeof varOrTag === 'string') {
      bus.emit('tag:select', { varId: varOrTag, tag: varOrTag, source });
    } else {
      bus.emit('tag:select', { ...varOrTag, source });
    }
  };

  // ═══ INTEGRACIÓN P&ID ↔ HMI ↔ DASHBOARD ══════════════════════════
  window._getPIDTags = function() {
    const c = document.getElementById('pidContainer');
    if (!c) return [];
    const svg = c.querySelector('svg');
    if (!svg) return [];
    const tags = new Set();
    svg.querySelectorAll('[data-tag]').forEach(el => tags.add(el.getAttribute('data-tag')));
    svg.querySelectorAll('[data-scada-var]').forEach(el => {
      const varId = el.getAttribute('data-scada-var');
      // No añadimos varId directamente porque necesitamos el tag original
      // Buscar en variableManager para resolver varId -> tag
    });
    return Array.from(tags).filter(Boolean);
  };

  window._getHMITags = function() {
    const c = document.getElementById('hmiContainer');
    if (!c) return [];
    const svg = c.querySelector('svg');
    if (!svg) return [];
    const tags = new Set();
    svg.querySelectorAll('[data-tag]').forEach(el => tags.add(el.getAttribute('data-tag')));
    svg.querySelectorAll('[data-scada-var]').forEach(el => {
      // The variable tag is already captured via data-tag if original had it.
      // data-scada-var is added by _wireSVGHotspots and stores the varId.
    });
    return Array.from(tags).filter(Boolean);
  };

  window._getDashboardTags = function() {
    try {
      const secs = window.PROPERTY_SECTIONS;
      if (secs && Array.isArray(secs)) {
        const tags = [];
        secs.forEach(s => { if (s.vars) s.vars.forEach(v => tags.push(v)); });
        return tags;
      }
    } catch(e) {}
    return [];
  };

  window._normalizeTag = function(t) {
    return String(t).trim().toLowerCase().replace(/\s+/g, '_');
  };

  // Resolver cualquier tag/varId a su ID canónico
  function _resolveTagId(raw) {
    const norm = window._normalizeTag(raw);
    const vm = window.variableManager;
    if (vm && vm.variables) {
      for (const v of vm.variables) {
        if (window._normalizeTag(v.id) === norm) return window._normalizeTag(v.id);
        if (window._normalizeTag(v.tag) === norm) return window._normalizeTag(v.id);
      }
    }
    return norm;
  }

  window._checkIntegration = function() {
    const pidRaw  = window._getPIDTags()   || [];
    const hmiRaw  = window._getHMITags()   || [];
    const dashRaw = window._getDashboardTags() || [];

    const pidTags  = pidRaw.map(t => _resolveTagId(t));
    const hmiTags  = hmiRaw.map(t => _resolveTagId(t));
    const dashTags = dashRaw.map(t => _resolveTagId(t));

    const pidSet = new Set(pidTags);
    const hmiSet = new Set(hmiTags);
    const dashSet = new Set(dashTags);

    const pidHmiCommon = pidTags.filter(t => hmiSet.has(t));
    const allCommon = pidHmiCommon.filter(t => dashSet.has(t));

    const connected = pidHmiCommon.length > 0;

    // Actualizar badges LIVE
    const pidBadge  = document.getElementById('pidLiveBadge');
    const hmiBadge  = document.getElementById('hmiLiveBadge');
    const dashBadge = document.getElementById('dashLiveBadge');

    [pidBadge, hmiBadge, dashBadge].forEach(b => {
      if (!b) return;
      if (connected && allCommon.length > 0) {
        b.style.display = 'inline-flex';
        b.classList.add('connected');
        b.innerHTML = `● INTEGRADO (${allCommon.length})`;
        b.title = `Tags compartidos: ${allCommon.join(', ')}`;
      } else if (connected) {
        b.style.display = 'inline-flex';
        b.classList.remove('connected');
        b.innerHTML = `● EN LÍNEA (${pidHmiCommon.length})`;
        b.title = `Tags P&ID+HMI: ${pidHmiCommon.join(', ')}`;
      } else {
        b.style.display = 'none';
        b.title = '';
      }
    });

    // El sidebar badge "LIVE" junto a Dashboard
    const sidebarLive = document.querySelector('.sidebar-item[data-tab="dashboard"] .sidebar-badge');
    if (sidebarLive) {
      sidebarLive.style.display = connected && allCommon.length > 0 ? '' : 'none';
      if (connected && allCommon.length > 0) {
        sidebarLive.title = `INTEGRADO: ${allCommon.length} tag(s) común(es)`;
      }
    }

    return { connected, commonPidHmi: pidHmiCommon, commonAll: allCommon };
  };

  // Revisar integración cada vez que se selecciona un tag
  bus.on('tag:select', () => setTimeout(window._checkIntegration, 100));

  window._checkIntegration();

  // ═══ PANTALLA COMPLETA COMPARTIDA (P&ID / HMI) ════════════════════
  // Crea un overlay fijo que llena toda la pantalla con el SVG
  window._enterFullscreenViewer = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) { window.showNotif?.('Carga un diagrama primero', 'warning'); return; }

    // Si ya hay overlay, salir
    const existing = document.getElementById('fs_overlay');
    if (existing) { existing.remove(); return; }

    // Crear overlay fullscreen
    const overlay = document.createElement('div');
    overlay.id = 'fs_overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;display:flex;align-items:center;justify-content:center';

    // Contenedor interno del SVG
    const viewer = document.createElement('div');
    viewer.style.cssText = 'width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden';

    // Mover el SVG al overlay (conserva eventos, listeners, transform)
    const parent = svg.parentNode;
    const nextSib = svg.nextSibling;
    svg._fsParent = parent;
    svg._fsNextSib = nextSib;
    // Guardar estilos originales
    svg._fsOrigW = svg.style.width;
    svg._fsOrigH = svg.style.height;
    svg._fsOrigMaxH = svg.style.maxHeight;
    svg._fsOrigPos = svg.style.position;
    // Ajustar para pantalla completa
    svg.style.width = '100vw';
    svg.style.height = '100vh';
    svg.style.maxHeight = 'none';
    svg.style.position = 'static';

    viewer.appendChild(svg);
    overlay.appendChild(viewer);

    // Botón de salida
    const exitBtn = document.createElement('button');
    exitBtn.textContent = '×';
    exitBtn.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:10;width:48px;height:48px;' +
      'border-radius:50%;border:1px solid rgba(255,255,255,0.25);' +
      'background:rgba(0,0,0,0.55);color:#fff;font-size:28px;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;' +
      'transition:background .15s;line-height:1';
    exitBtn.onmouseenter = () => { exitBtn.style.background = 'rgba(255,255,255,0.15)'; };
    exitBtn.onmouseleave = () => { exitBtn.style.background = 'rgba(0,0,0,0.55)'; };
    exitBtn.onclick = () => overlay.remove();
    overlay.appendChild(exitBtn);

    document.body.appendChild(overlay);

    // Restaurar al quitar el overlay
    const observer = new MutationObserver(() => {
      if (!document.body.contains(overlay)) {
        observer.disconnect();
        _restoreSVG(svg);
        document.removeEventListener('keydown', escHandler);
      }
    });
    observer.observe(document.body, { childList: true });

    // Escape → salir
    const escHandler = (e) => {
      if (e.key === 'Escape') { overlay.remove(); }
    };
    document.addEventListener('keydown', escHandler);
  };

  function _restoreSVG(svg) {
    if (!svg || !svg._fsParent) return;
    svg.style.width = svg._fsOrigW || '100%';
    svg.style.height = svg._fsOrigH || '100%';
    svg.style.maxHeight = svg._fsOrigMaxH || '';
    svg.style.position = svg._fsOrigPos || '';
    if (svg._fsNextSib) {
      svg._fsParent.insertBefore(svg, svg._fsNextSib);
    } else {
      svg._fsParent.appendChild(svg);
    }
    delete svg._fsParent;
    delete svg._fsNextSib;
    delete svg._fsOrigW;
    delete svg._fsOrigH;
    delete svg._fsOrigMaxH;
    delete svg._fsOrigPos;
  }
})();
