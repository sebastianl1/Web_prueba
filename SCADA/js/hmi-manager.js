(function () {
  if (window._hmiInitialized) return;
  window._hmiInitialized = true;

  let _currentFile = null;
  let _liveInterval = null;
  let _overlays = [];

  function getContainer() { return document.getElementById('hmiContainer'); }
  function getLabelEl()   { return document.getElementById('hmiLabel'); }

  // ─── LISTAR SVGs ──────────────────────────────────────────────────
  window.listHMISVGs = async function() {
    try {
      const res = await fetch('/api/files/list?path=/hmi');
      if (!res.ok) return [];
      const files = await res.json();
      return files.filter(f => f.name && f.name.toLowerCase().endsWith('.svg'));
    } catch { return []; }
  };

  // ─── CARGAR SVG ───────────────────────────────────────────────────
  window.loadHMISVG = async function(filename) {
    const container = getContainer();
    if (!container) return;

    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary)">
      <div class="spinner-border spinner-border-sm text-primary me-2"></div>
      Cargando HMI: ${filename}...
    </div>`;

    try {
      const res = await fetch(`/api/files/raw?path=/hmi&name=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const svgText = await res.text();

      container.innerHTML = svgText;
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        svgEl.style.width  = '100%';
        svgEl.style.height = '100%';
        svgEl.style.maxHeight = 'calc(100vh - 200px)';
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        if (typeof window._normalizeSVGColors === 'function') window._normalizeSVGColors(svgEl);
        _addHMIPanZoom(svgEl);
        if (typeof window._wireSVGHotspots === 'function') window._wireSVGHotspots(svgEl);
        _wireLiveValues(svgEl);
      }

    _currentFile = filename;
    const label = getLabelEl();
    if (label) label.textContent = filename;
    _updateTagCount();
    _updateHMITagInfo();
    _renderHMIFileList();
    if (typeof window._checkIntegration === 'function') setTimeout(window._checkIntegration, 200);
    if (typeof window.showNotif === 'function') window.showNotif(`HMI "${filename}" cargado`, 'success');

  } catch (err) {
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);padding:24px">
        No se pudo cargar el archivo. (${err.message})</div>`;
      if (typeof window.showNotif === 'function') window.showNotif(`Error: ${err.message}`, 'warning');
    }
  };

  // ─── VALORES EN VIVO SOBRE SVG ───────────────────────────────────
  function _wireLiveValues(svgEl) {
    if (!svgEl) return;
    _overlays = [];

    const elList = svgEl.querySelectorAll('[data-tag]');
    elList.forEach(el => {
      const tag = el.getAttribute('data-tag');
      if (!tag) return;

      // Intentar resolver el tag a su ID canónico para mejor matching en processVars
      const varId = el.getAttribute('data-scada-var') || tag;
      el.setAttribute('data-scada-var', varId);

      const bbox = el.getBBox ? el.getBBox() : null;
      if (!bbox) return;

      const ns = 'http://www.w3.org/2000/svg';
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', bbox.x + bbox.width / 2);
      text.setAttribute('y', bbox.y - 6);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', "'JetBrains Mono',monospace");
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#22c55e');
      text.setAttribute('data-live-tag', tag);
      text.setAttribute('data-live-var', varId);
      text.setAttribute('filter', 'drop-shadow(0 0 4px rgba(0,0,0,0.8))');
      text.textContent = tag + ': ' + _getHMITheoreticalValue(varId);

      if (el.parentNode) {
        el.parentNode.insertBefore(text, el.nextSibling);
      }
      _overlays.push(text);
    });

    _updateLiveOverlays();

    if (_liveInterval) clearInterval(_liveInterval);
    _liveInterval = setInterval(_updateLiveOverlays, 2000);

    const count = _overlays.length;
    const el = document.getElementById('hmiTagCount');
    if (el) el.textContent = String(count);
  }

  function _getHMITheoreticalValue(varId) {
    const db = window.TAG_PROPERTIES_DB || {};
    const props = db[varId];
    if (!props) return '--';
    const priority = ['physical', 'process', 'chemical'];
    for (const cat of priority) {
      if (props[cat] && props[cat].length > 0) {
        return props[cat][0].value + ' ' + props[cat][0].unit;
      }
    }
    return '--';
  }

  function _updateLiveOverlays() {
    _overlays.forEach(text => {
      const tag = text.getAttribute('data-live-tag');
      const varId = text.getAttribute('data-live-var');
      if (!tag && !varId) return;
      const display = _getHMITheoreticalValue(varId || tag);
      text.textContent = (varId || tag) + ': ' + display;
    });

    // Colorear elementos SVG (sin alarmas — valores teóricos)
    const container = getContainer();
    if (!container) return;
    container.querySelectorAll('[data-scada-var]').forEach(el => {
      el.style.stroke = '';
      el.style.strokeWidth = '';
    });

      if (!el.hasAttribute('data-orig-fill') && el.getAttribute('fill')) {
        el.setAttribute('data-orig-fill', el.getAttribute('fill'));
      }
      if (!el.hasAttribute('data-orig-stroke') && el.getAttribute('stroke')) {
        el.setAttribute('data-orig-stroke', el.getAttribute('stroke'));
      }

      if (inAlarm) {
        el.setAttribute('stroke', 'rgba(239,68,68,0.6)');
        el.setAttribute('stroke-width', '2');
        el.setAttribute('data-alarm', '1');
      } else {
        const origS = el.getAttribute('data-orig-stroke');
        if (origS) el.setAttribute('stroke', origS);
        else el.removeAttribute('stroke');
        el.setAttribute('stroke-width', '');
        el.setAttribute('data-alarm', '0');
        el.removeAttribute('data-alarm');
      }
    });
  }

  window._wireHMILiveValues = _wireLiveValues;

  // ─── PAN/ZOOM PARA SVG ──────────────────────────────────────────
  function _addHMIPanZoom(svg) {
    const state = { scale: 1, panX: 0, panY: 0, rotation: 0 };
    let isDragging = false, lastX = 0, lastY = 0;

    svg.style.cursor = 'grab';
    svg.style.transition = 'transform 0.08s ease';
    svg.style.transformOrigin = 'center center';

    function apply() {
      svg.style.transform =
        `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotation}deg) scale(${state.scale})`;
    }

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      state.scale = Math.max(0.2, Math.min(8, state.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
      apply();
    }, { passive: false });

    svg.addEventListener('mousedown', e => {
      isDragging = true; lastX = e.clientX; lastY = e.clientY;
      svg.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => { isDragging = false; svg.style.cursor = 'grab'; });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      state.panX += e.clientX - lastX; state.panY += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      apply();
    });

    window._hmiView = {
      state, apply,
      reset() { state.scale = 1; state.panX = 0; state.panY = 0; state.rotation = 0; apply(); },
      zoom(factor) { state.scale = Math.max(0.2, Math.min(8, state.scale * factor)); apply(); },
      rotate(deg)  { state.rotation = (state.rotation + deg) % 360; apply(); },
      setRotation(deg) { state.rotation = deg % 360; apply(); },
    };

    const resetBtn = document.getElementById('hmiResetZoom');
    if (resetBtn) resetBtn.onclick = () => window._hmiView.reset();
  }

  // ─── CONTADOR DE TAGS ───────────────────────────────────────────
  function _updateTagCount() {
    const container = getContainer();
    if (!container) return;
    const svg = container.querySelector('svg');
    if (!svg) return;
    const count = svg.querySelectorAll('[data-tag]').length;
    const el = document.getElementById('hmiTagCount');
    if (el) el.textContent = String(count);
  }

  // ─── ACTUALIZAR ÚLTIMO VALOR DESDE TAG INSPECTOR ────────────────
  if (window.scadaBus) {
    window.scadaBus.on('tag:select', (detail) => {
      const v = typeof window.scadaResolveVar === 'function' ? window.scadaResolveVar(detail) : null;
      if (v && v.id) {
        const pv = window.processVars && window.processVars[v.id];
        const valEl = document.getElementById('hmiLastValue');
        if (valEl) {
          if (pv && pv.val != null) {
            const n = Number(pv.val);
            valEl.textContent = (isNaN(n) ? pv.val : n.toFixed(2)) + (pv.unit ? ' ' + pv.unit : '');
          } else {
            valEl.textContent = '--';
          }
        }
      }
    });

    window.scadaBus.on('tag:focus', ({ varId }) => {
      const container = getContainer();
      if (!container) return;
      const el = container.querySelector(`[data-scada-var="${varId}"]`);
      if (!el) return;
      const prev = el.style.filter;
      el.style.transition = 'filter .3s';
      el.style.filter = 'drop-shadow(0 0 6px #22c55e) drop-shadow(0 0 12px #22c55e)';
      setTimeout(() => { el.style.filter = prev || ''; }, 1800);
    });
  }

  // ─── BOTONES Y TOOLBAR ──────────────────────────────────────────
  window._setupHMITools = function() {
    const toolbar = document.getElementById('hmiToolbar');
    if (!toolbar) return;

    const needView = () => {
      if (!window._hmiView) { window.showNotif?.('Carga primero un archivo HMI', 'warning'); return false; }
      return true;
    };

    // Wire existing HTML buttons — only once
    if (document.getElementById('hmiToolsGroup')?.getAttribute('data-wired')) return;

    const wire = (id, handler) => {
      const el = document.getElementById(id);
      if (el) el.onclick = handler;
    };

    wire('hmiZoomIn',    () => needView() && window._hmiView.zoom(1.2));
    wire('hmiZoomOut',   () => needView() && window._hmiView.zoom(1/1.2));
    wire('hmiResetView', () => needView() && window._hmiView.reset());
    wire('hmiRotateCCW', () => needView() && window._hmiView.rotate(-90));
    wire('hmiRotateCW',  () => needView() && window._hmiView.rotate(90));
    wire('hmiOrientH',   () => needView() && window._hmiView.setRotation(0));
    wire('hmiOrientV',   () => needView() && window._hmiView.setRotation(90));
    wire('hmiFullscreen', () => {
      if (typeof window._enterFullscreenViewer === 'function') {
        window._enterFullscreenViewer('hmiContainer');
      }
    });

    const group = document.getElementById('hmiToolsGroup');
    if (group) group.setAttribute('data-wired', '1');
  };

  // ─── MODAL DE SELECCIÓN ──────────────────────────────────────────
  window.openHMIModal = async function() {
    const svgs = await window.listHMISVGs();

    let modalEl = document.getElementById('hmiModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'hmiModal';
      modalEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1050;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
      document.body.appendChild(modalEl);
    }

    if (svgs.length === 0) {
      modalEl.innerHTML = `
      <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:16px;padding:28px;width:440px;max-width:95vw">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <h5 style="margin:0;font-size:16px;color:var(--text-heading)">Cargar HMI (.svg)</h5>
          <button onclick="document.getElementById('hmiModal').remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:18px">×</button>
        </div>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">No hay archivos .svg en la carpeta <code>hmi/</code> del servidor.</p>
        <p style="color:var(--text-disabled);font-size:12px">Sube archivos SVG de paneles HMI a través del File Manager en la carpeta <code>hmi/</code>.</p>
        <div style="margin-top:20px;text-align:right"><button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('hmiModal').remove()">Cerrar</button></div>
      </div>`;
      modalEl.style.display = 'flex';
      return;
    }

    modalEl.innerHTML = `
    <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:16px;padding:28px;width:480px;max-width:95vw">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h5 style="margin:0;font-size:16px;color:var(--text-heading)">Seleccionar HMI</h5>
        <button onclick="document.getElementById('hmiModal').remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:18px">×</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto">
        ${svgs.map(f => `
        <div onclick="window.loadHMISVG('${f.name}');document.getElementById('hmiModal').remove()"
          style="padding:12px 16px;border:1px solid var(--border-subtle);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.15s"
          onmouseenter="this.style.borderColor='var(--primary)';this.style.background='rgba(16,185,129,0.05)'"
          onmouseleave="this.style.borderColor='var(--border-subtle)';this.style.background=''">
          <span style="font-size:20px">🖥️</span>
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${f.name}</div>
            <div style="font-size:11px;color:var(--text-disabled)">${f.size ? (f.size/1024).toFixed(1) + ' KB SVG' : 'Panel HMI'}</div>
          </div>
          ${f.name === _currentFile ? '<span style="margin-left:auto;font-size:11px;color:var(--accent-green)">✓ actual</span>' : ''}
        </div>`).join('')}
      </div>
      <div style="margin-top:16px;text-align:right"><button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('hmiModal').remove()">Cancelar</button></div>
    </div>`;
    modalEl.style.display = 'flex';
  };

  // ─── CARGA LOCAL ──────────────────────────────────────────────────
  window.loadHMILocalFile = function(file) {
    if (!file) return;
    const container = getContainer();
    if (!container) return;
    const name = file.name || 'archivo';

    if (name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = e => {
        container.innerHTML = e.target.result;
        const svgEl = container.querySelector('svg');
        if (svgEl) {
          svgEl.style.width = '100%';
          svgEl.style.height = '100%';
          svgEl.style.maxHeight = 'calc(100vh - 200px)';
          svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          if (typeof window._normalizeSVGColors === 'function') window._normalizeSVGColors(svgEl);
          _addHMIPanZoom(svgEl);
          if (typeof window._wireSVGHotspots === 'function') window._wireSVGHotspots(svgEl);
          _wireLiveValues(svgEl);
        } else {
          container.innerHTML = `<div style="padding:24px;color:var(--danger,#dc3545)">El archivo no contiene un &lt;svg&gt; válido.</div>`;
        }
        _currentFile = name;
        const label = getLabelEl();
        if (label) label.textContent = name;
        _updateTagCount();
        _updateHMITagInfo();
        _renderHMIFileList();
        if (typeof window._checkIntegration === 'function') setTimeout(window._checkIntegration, 200);
        if (typeof window.showNotif === 'function') window.showNotif(`HMI "${name}" cargado`, 'success');
      };
      reader.readAsText(file);
    } else {
      if (typeof window.showNotif === 'function') window.showNotif(`Formato no soportado. Usa .svg`, 'danger');
    }
  };

  // ─── INIT ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const tab = document.getElementById('tab-hmi');
    if (!tab) return;

    // File input (hidden, shared between upload button and drag-drop)
    const fileInput = document.getElementById('hmiLocalFileInput') || document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.svg,image/svg+xml';
    fileInput.style.display = 'none';
    fileInput.id = 'hmiLocalFileInput';
    fileInput.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (f) window.loadHMILocalFile(f);
      e.target.value = '';
    });
    if (!fileInput.parentElement) document.body.appendChild(fileInput);

    // Wire existing HTML buttons
    const uploadBtn = document.getElementById('hmiLocalUploadBtn');
    if (uploadBtn) uploadBtn.onclick = () => fileInput.click();

    const catalogBtn = document.getElementById('hmiCatalogBtn');
    if (catalogBtn) catalogBtn.onclick = () => window.openHMIModal();

    // Drag-drop
    const container = getContainer();
    if (container) {
      container.addEventListener('dragover', e => {
        e.preventDefault();
        container.style.outline = '2px dashed var(--primary,#10b981)';
      });
      container.addEventListener('dragleave', () => { container.style.outline = ''; });
      container.addEventListener('drop', e => {
        e.preventDefault();
        container.style.outline = '';
        const f = e.dataTransfer?.files?.[0];
        if (f) window.loadHMILocalFile(f);
      });
    }

    window._setupHMITools();
  });

  // ─── TAG INFO ─────────────────────────────────────────────────────
  function _updateHMITagInfo() {
    const tags = (window._getHMITags && window._getHMITags()) || [];
    const tagListEl = document.getElementById('hmiTagListPanel');
    const tagCountEl = document.getElementById('hmiTagCount');
    if (tagCountEl) tagCountEl.textContent = String(tags.length);

    if (tagListEl) {
      if (tags.length === 0) {
        tagListEl.innerHTML = '<span style="color:var(--text-muted);font-size:12px">Carga un HMI para ver sus tags.</span>';
      } else {
        tagListEl.innerHTML = tags.map(t =>
          `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:6px;font-size:11px;font-family:'JetBrains Mono',monospace;color:#22c55e;cursor:pointer"
             onclick="window.scadaSelectTag('${t}','hmi')">🏷️ ${t}</span>`
        ).join('');
      }
    }

    // Shared tags
    const sharedEl = document.getElementById('hmiSharedCount');
    if (sharedEl && typeof window._checkIntegration === 'function') {
      const result = window._checkIntegration();
      sharedEl.textContent = String(result.commonPidHmi.length);
    }
  }

  // ─── FILE LIST ────────────────────────────────────────────────────
  async function _renderHMIFileList() {
    const listEl = document.getElementById('hmiFileList');
    const emptyEl = document.getElementById('hmiFileListEmpty');
    const countEl = document.getElementById('hmiFileCount');
    const countEl2 = document.getElementById('hmiFileCount2');
    if (!listEl) return;

    try {
      const res = await fetch('/api/files/list?path=/hmi');
      if (!res.ok) throw new Error('fetch fail');
      const files = await res.json();
      const svgs = files.filter(f => f.name && f.name.toLowerCase().endsWith('.svg'));

      if (countEl) countEl.textContent = String(svgs.length);
      if (countEl2) countEl2.textContent = String(svgs.length);

      if (svgs.length === 0) {
        if (emptyEl) emptyEl.style.display = '';
        listEl.querySelectorAll('[data-hmi-file]').forEach(el => el.remove());
        return;
      }

      if (emptyEl) emptyEl.style.display = 'none';
      listEl.querySelectorAll('[data-hmi-file]').forEach(el => el.remove());

      svgs.forEach(f => {
        const chip = document.createElement('span');
        chip.setAttribute('data-hmi-file', '1');
        const active = f.name === _currentFile;
        chip.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:8px;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.15s;font-family:'JetBrains Mono',monospace;${active ? 'background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#22c55e;font-weight:600' : 'background:var(--bg-deep);border:1px solid var(--border-subtle);color:var(--text-secondary)'}`;
        chip.textContent = active ? '✓ ' + f.name : f.name;
        chip.title = f.name + (f.size ? ' (' + (f.size/1024).toFixed(1) + ' KB)' : '');
        chip.onmouseenter = () => { if (!active) { chip.style.borderColor = 'var(--primary)'; chip.style.color = 'var(--primary)'; } };
        chip.onmouseleave = () => { if (!active) { chip.style.borderColor = 'var(--border-subtle)'; chip.style.color = 'var(--text-secondary)'; } };
        chip.onclick = () => { if (!active) window.loadHMISVG(f.name); };
        listEl.appendChild(chip);
      });
    } catch (e) {
      if (countEl) countEl.textContent = '0';
    }
  }
  window._renderHMIFileList = _renderHMIFileList;
})();