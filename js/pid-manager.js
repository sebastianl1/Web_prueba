/**
 * pid-manager.js — P&ID con carga de archivos SVG
 * NexSCADA v5 — Módulo independiente
 *
 * - Si hay archivos .svg en /pid/, los carga en el contenedor pidContainer
 * - SVG se incrusta directamente para permitir interactividad
 * - Fallback: dibuja el P&ID procedimental en canvas (drawPID de scada-core.js)
 * - Botón "Cargar P&ID..." abre modal de selección
 */

window._pidCurrentFile = null;

// Lista estatica de SVGs conocidos (fallback para GitHub Pages)
window._STATIC_PID_SVGS = [
  { name: 'CARACTERIZACION_MATERIA_PRIMA.svg',        size: 0 },
  { name: 'CARACTERIZACION_PRODUCTO_FINAL.svg',       size: 0 },
  { name: 'ESTERIFICACION_TRANSESTERIFICACION.svg',   size: 0 },
];

// ─── LISTAR SVGs ──────────────────────────────────────────────────
window.listPIDSVGs = async function() {
  try {
    const res = await fetch('/api/files/list?path=/pid');
    if (!res.ok) throw new Error('API not available');
    const files = await res.json();
    return files.filter(f => f.name && f.name.toLowerCase().endsWith('.svg'));
  } catch {
    return window._STATIC_PID_SVGS;
  }
};

// ─── CARGAR SVG ───────────────────────────────────────────────────
window.loadPIDSVG = async function(filename) {
  const container = document.getElementById('pidContainer');
  if (!container) return;

  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary)">
    <div class="spinner-border spinner-border-sm text-primary me-2"></div>
    Cargando P&ID: ${filename}...
  </div>`;

  let svgText;
  try {
    const res = await fetch(`/api/files/raw?path=/pid&name=${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    svgText = await res.text();
  } catch {
    // Fallback: carga directa desde ruta estatica (GitHub Pages, Vite preview)
    const res = await fetch(`Acceso_seguro/pid/${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    svgText = await res.text();
  }

  try {
    // Insertar SVG directamente para interactividad
    container.innerHTML = svgText;
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.style.width  = '100%';
      svgEl.style.height = '100%';
      svgEl.style.maxHeight = 'calc(100vh - 200px)';
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      _normalizeSVGColors(svgEl);
      _addSVGPanZoom(svgEl);
      _wireSVGHotspots(svgEl);
      _wirePIDLiveValues(svgEl);
    }

    window._pidCurrentFile = filename;
    const label = document.getElementById('pidLabel');
    if (label) label.textContent = filename;
    _updatePIDTagInfo();
    _renderPIDFileList();
    if (typeof window._renderPropertyDashboard === 'function') setTimeout(window._renderPropertyDashboard, 150);
    if (typeof window._checkIntegration === 'function') setTimeout(window._checkIntegration, 200);
    window.showNotif(`P&ID "${filename}" cargado`, 'success');
  } catch (err) {
    // Fallback al canvas procedimental
    container.innerHTML = `<canvas id="pidCanvas" style="width:100%;height:100%"></canvas>`;
    if (typeof drawPID === 'function') {
      const canvas = document.getElementById('pidCanvas');
      if (canvas) {
        canvas.width  = canvas.offsetWidth  || 900;
        canvas.height = canvas.offsetHeight || 450;
        drawPID();
      }
    }
    window.showNotif(`No se pudo cargar SVG. Mostrando P&ID procedimental. (${err.message})`, 'warning');
  }
};

// ─── NORMALIZAR COLORES DEL SVG (negros → blanco para fondo oscuro) ──
function _normalizeSVGColors(svg) {
  if (!svg) return;
  const BLACKS = new Set(['#000','#000000','black','rgb(0,0,0)','rgb(0, 0, 0)']);
  const isBlack = (v) => v && BLACKS.has(String(v).trim().toLowerCase());

  // Atributos directos stroke/fill
  svg.querySelectorAll('[stroke],[fill]').forEach(el => {
    const s = el.getAttribute('stroke');
    if (isBlack(s)) el.setAttribute('stroke', '#ffffff');
    const f = el.getAttribute('fill');
    if (isBlack(f)) el.setAttribute('fill', '#ffffff');
  });

  // Estilos inline style="stroke:#000;fill:#000"
  svg.querySelectorAll('[style]').forEach(el => {
    let st = el.getAttribute('style');
    if (!st) return;
    st = st.replace(/(stroke|fill)\s*:\s*(#000(?:000)?|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi, '$1:#ffffff');
    el.setAttribute('style', st);
  });

  // Elementos sin stroke/fill explícito heredan negro por defecto en muchos exports.
  // Forzamos color por defecto del SVG raíz a blanco.
  const rootStroke = svg.getAttribute('stroke');
  if (!rootStroke || isBlack(rootStroke)) svg.setAttribute('stroke', '#ffffff');
  // Mantener fill="none" como por defecto para no rellenar áreas (estilo plano P&ID)
  if (!svg.getAttribute('fill')) svg.setAttribute('fill', 'none');

  // Bloques <style> internos: reemplazar negros también
  svg.querySelectorAll('style').forEach(tag => {
    tag.textContent = tag.textContent.replace(
      /(stroke|fill)\s*:\s*(#000(?:000)?|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/gi,
      '$1:#ffffff'
    );
  });
}
window._normalizeSVGColors = _normalizeSVGColors;



// ─── PAN/ZOOM/ROTACIÓN PARA SVG ──────────────────────────────────
function _addSVGPanZoom(svg) {
  const state = { scale: 1, panX: 0, panY: 0, rotation: 0 };
  let isDragging = false, lastX = 0, lastY = 0;

  svg.style.cursor = 'grab';
  svg.style.transition = 'transform 0.08s ease';
  svg.style.transformOrigin = 'center center';
  svg.style.userSelect = 'none';
  svg.style.webkitUserSelect = 'none';

  function apply() {
    svg.style.transform =
      `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotation}deg) scale(${state.scale})`;
  }

  svg.addEventListener('wheel', e => {
    if (window._pidDrawMode) return;
    e.preventDefault();
    state.scale = Math.max(0.2, Math.min(8, state.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    apply();
  }, { passive: false });

  svg.addEventListener('mousedown', e => {
    if (window._pidDrawMode) return;
    e.preventDefault();
    isDragging = true; lastX = e.clientX; lastY = e.clientY;
    svg.style.cursor = 'grabbing';
  });
  // Limpiar listeners previos de ventana para evitar duplicados
  if (window._pidMouseUp) window.removeEventListener('mouseup', window._pidMouseUp);
  if (window._pidMouseMove) window.removeEventListener('mousemove', window._pidMouseMove);

  window._pidMouseUp = () => { isDragging = false; svg.style.cursor = 'grab'; };
  window._pidMouseMove = e => {
    if (!isDragging) return;
    state.panX += e.clientX - lastX; state.panY += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    apply();
  };
  window.addEventListener('mouseup', window._pidMouseUp);
  window.addEventListener('mousemove', window._pidMouseMove);

  // Exponer estado para que la toolbar pueda manipularlo
  window._pidView = {
    state,
    apply,
    reset() { state.scale = 1; state.panX = 0; state.panY = 0; state.rotation = 0; apply(); },
    zoom(factor) { state.scale = Math.max(0.2, Math.min(8, state.scale * factor)); apply(); },
    rotate(deg)  { state.rotation = (state.rotation + deg) % 360; apply(); },
    setRotation(deg) { state.rotation = deg % 360; apply(); },
    focusElement(varId) {
      const container = document.getElementById('pidContainer');
      if (!container) return;
      const el = svg.querySelector(`[data-scada-var="${varId}"]`);
      if (!el) {
        if (typeof window.showNotif === 'function') {
          window.showNotif(
            `⚠️ El SVG no tiene un elemento con data-tag="${varId}". ` +
            'Agrega ese atributo al símbolo correspondiente en el archivo SVG para que el zoom funcione.',
            'warning'
          );
        }
        return;
      }

      // 1. Guardar transición CSS y resetear a identidad
      const origTrans = svg.style.transition;
      svg.style.transition = 'none';
      state.scale = 1; state.panX = 0; state.panY = 0;
      apply();

      // 2. Obtener posiciones en píxeles CSS (después de reset)
      const sr = svg.getBoundingClientRect();
      const cr = container.getBoundingClientRect();
      const er = el.getBoundingClientRect();

      // Centro del elemento relativo al SVG
      const elCx = er.left + er.width / 2 - sr.left;
      const elCy = er.top + er.height / 2 - sr.top;

      // Centro del SVG (origen del transform)
      const svgCx = sr.width / 2;
      const svgCy = sr.height / 2;

      // Centro del contenedor
      const contCx = cr.width / 2;
      const contCy = cr.height / 2;

      // Desplazamiento SVG → contenedor
      const offX = cr.left - sr.left;
      const offY = cr.top - sr.top;

      // Escala fija suave — solo un leve acercamiento para contextualizar
      const clamped = 2.5;

      // Fórmula: screenX = (elX - svgCx)*scale + svgCx + panX + sr.left
      // Queremos screenX = cr.left + contCx
      // → panX = offX + contCx - svgCx + (svgCx - elX)*scale
      const nX = offX + contCx - svgCx + (svgCx - elCx) * clamped;
      const nY = offY + contCy - svgCy + (svgCy - elCy) * clamped;

      // 3. Animar desde el estado actual al destino
      const sX = state.panX, sY = state.panY, sS = state.scale;
      const start = performance.now(), dur = 400;
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        state.panX = sX + (nX - sX) * e;
        state.panY = sY + (nY - sY) * e;
        state.scale = sS + (clamped - sS) * e;
        apply();
        if (t < 1) requestAnimationFrame(step);
        else svg.style.transition = origTrans;
      };
      requestAnimationFrame(step);

      // 4. Resalte pulsante verde alrededor del símbolo
      if (window._pidLastHighlighted && window._pidLastHighlighted !== el) {
        const prev = window._pidLastHighlighted;
        prev.style.animation = '';
        prev.style.filter = prev._pidSavedFilter || '';
        prev.style.outline = prev._pidSavedOutline || '';
      }
      // Guardar estilos originales y limpiar animación previa en este mismo elemento
      if (el._pidPulseActive) {
        el.style.animation = '';
        el.style.filter = el._pidSavedFilter || '';
        el.style.outline = el._pidSavedOutline || '';
      }
      const styleId = '_pidPulseKeyframes';
      if (!document.getElementById(styleId)) {
        const s = document.createElement('style');
        s.id = styleId;
        s.textContent = `@keyframes pidPulse {\
  0%, 100% { filter: drop-shadow(0 0 12px #ef4444) drop-shadow(0 0 30px #ef4444) drop-shadow(0 0 60px #ef4444) brightness(1.15); outline: 5px solid #ef4444; outline-offset: 5px; }\
  50% { filter: drop-shadow(0 0 20px #ef4444) drop-shadow(0 0 50px #ef4444) drop-shadow(0 0 90px #ef4444) brightness(1.3); outline: 7px solid #ef4444; outline-offset: 7px; }\
}`;
        document.head.appendChild(s);
      }
      el._pidSavedFilter = el.style.filter;
      el._pidSavedOutline = el.style.outline;
      el._pidPulseActive = true;
      el.style.animation = 'pidPulse 1s ease-in-out infinite';
      window._pidLastHighlighted = el;
    },
  };

  const resetBtn = document.getElementById('pidResetZoom');
  if (resetBtn) resetBtn.onclick = () => window._pidView.reset();
}
window._addSVGPanZoom = _addSVGPanZoom;

// ─── CAPA DE ANOTACIÓN (dibujo libre sobre el P&ID) ──────────────
function _ensureAnnotationLayer() {
  const container = document.getElementById('pidContainer');
  if (!container) return null;
  let layer = container.querySelector('#pidAnnotationLayer');
  if (layer) return layer;
  layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.id = 'pidAnnotationLayer';
  layer.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  Object.assign(layer.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '5'
  });
  container.appendChild(layer);

  let drawing = false, currentPath = null, points = [];
  const getXY = (e) => {
    const r = layer.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  layer.addEventListener('pointerdown', e => {
    if (!window._pidDrawMode) return;
    e.preventDefault();
    drawing = true;
    points = [getXY(e)];
    currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    currentPath.setAttribute('fill', 'none');
    currentPath.setAttribute('stroke', window._pidDrawColor || '#22d3ee');
    currentPath.setAttribute('stroke-width', String(window._pidDrawWidth || 2.5));
    currentPath.setAttribute('stroke-linecap', 'round');
    currentPath.setAttribute('stroke-linejoin', 'round');
    currentPath.setAttribute('data-annotation', '1');
    currentPath.setAttribute('d', `M ${points[0].x} ${points[0].y}`);
    layer.appendChild(currentPath);
    layer.setPointerCapture(e.pointerId);
  });
  layer.addEventListener('pointermove', e => {
    if (!drawing || !currentPath) return;
    const p = getXY(e);
    points.push(p);
    currentPath.setAttribute('d', currentPath.getAttribute('d') + ` L ${p.x} ${p.y}`);
  });
  const endStroke = () => { drawing = false; currentPath = null; };
  layer.addEventListener('pointerup', endStroke);
  layer.addEventListener('pointercancel', endStroke);
  layer.addEventListener('pointerleave', endStroke);

  return layer;
}

// ─── TOOLBAR DE HERRAMIENTAS ─────────────────────────────────────
function _setupPIDTools() {
  const toolbar = document.getElementById('pidToolbar');
  if (!toolbar || document.getElementById('pidToolsGroup')) return;

  window._pidDrawMode  = false;
  window._pidDrawColor = '#22d3ee';
  window._pidDrawWidth = 2.5;

  const group = document.createElement('div');
  group.id = 'pidToolsGroup';
  group.style.cssText = 'display:flex;align-items:center;gap:4px;margin-right:8px;padding:2px 6px;border:1px solid var(--border-default);border-radius:6px;background:rgba(255,255,255,0.02)';

  const mkBtn = (title, html, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-sm';
    b.title = title;
    b.innerHTML = html;
    b.style.cssText = 'border:none;background:transparent;color:var(--text-secondary);font-size:13px;padding:4px 8px;line-height:1;cursor:pointer;border-radius:4px';
    b.onmouseenter = () => b.style.background = 'rgba(255,255,255,0.06)';
    b.onmouseleave = () => { if (!b.dataset.active) b.style.background = 'transparent'; };
    b.onclick = onClick;
    return b;
  };

  const needView = () => {
    if (!window._pidView) {
      window.showNotif?.('Carga primero un archivo P&ID', 'warning');
      return false;
    }
    return true;
  };

  // Zoom
  group.appendChild(mkBtn('Acercar (zoom +)', '🔍+', () => needView() && window._pidView.zoom(1.2)));
  group.appendChild(mkBtn('Alejar (zoom -)', '🔍−', () => needView() && window._pidView.zoom(1/1.2)));
  group.appendChild(mkBtn('Ajustar (reset zoom y rotación)', '⛶', () => needView() && window._pidView.reset()));

  // Rotación
  group.appendChild(mkBtn('Rotar 90° antihorario', '⟲', () => needView() && window._pidView.rotate(-90)));
  group.appendChild(mkBtn('Rotar 90° horario',     '⟳', () => needView() && window._pidView.rotate(90)));
  group.appendChild(mkBtn('Orientación horizontal', '▭', () => needView() && window._pidView.setRotation(0)));
  group.appendChild(mkBtn('Orientación vertical',   '▯', () => needView() && window._pidView.setRotation(90)));

  // Separador
  const sep = document.createElement('span');
  sep.style.cssText = 'width:1px;height:18px;background:var(--border-default);margin:0 4px';
  group.appendChild(sep);

  // Dibujo / Rayado
  const drawBtn = mkBtn('Modo dibujo (rayar sobre el plano)', '✏️', () => {
    window._pidDrawMode = !window._pidDrawMode;
    const layer = _ensureAnnotationLayer();
    if (layer) layer.style.pointerEvents = window._pidDrawMode ? 'auto' : 'none';
    if (window._pidDrawMode) {
      drawBtn.dataset.active = '1';
      drawBtn.style.background = 'rgba(34,211,238,0.18)';
      drawBtn.style.color = 'var(--primary,#10b981)';
    } else {
      delete drawBtn.dataset.active;
      drawBtn.style.background = 'transparent';
      drawBtn.style.color = 'var(--text-secondary)';
    }
  });
  group.appendChild(drawBtn);

  // Selector de color
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = window._pidDrawColor;
  colorInput.title = 'Color del trazo';
  colorInput.style.cssText = 'width:24px;height:24px;border:1px solid var(--border-default);border-radius:4px;background:transparent;cursor:pointer;padding:0';
  colorInput.oninput = e => { window._pidDrawColor = e.target.value; };
  group.appendChild(colorInput);

  // Grosor del trazo
  const widthInput = document.createElement('input');
  widthInput.type = 'range'; widthInput.min = '1'; widthInput.max = '12'; widthInput.step = '0.5';
  widthInput.value = String(window._pidDrawWidth);
  widthInput.title = 'Grosor del trazo';
  widthInput.style.cssText = 'width:64px;cursor:pointer';
  widthInput.oninput = e => { window._pidDrawWidth = parseFloat(e.target.value); };
  group.appendChild(widthInput);

  // Deshacer último trazo
  group.appendChild(mkBtn('Deshacer último trazo', '↶', () => {
    const layer = document.getElementById('pidAnnotationLayer');
    if (!layer) return;
    const last = layer.querySelector('path[data-annotation]:last-of-type');
    if (last) last.remove();
  }));

  // Borrar todo
  group.appendChild(mkBtn('Borrar todas las anotaciones', '🗑', () => {
    const layer = document.getElementById('pidAnnotationLayer');
    if (layer) layer.innerHTML = '';
  }));

  // Descargar SVG con anotaciones
  group.appendChild(mkBtn('Descargar SVG con anotaciones', '⬇', () => {
    const container = document.getElementById('pidContainer');
    const baseSvg = container?.querySelector('svg:not(#pidAnnotationLayer)');
    if (!baseSvg) { window.showNotif?.('No hay P&ID cargado', 'warning'); return; }
    const clone = baseSvg.cloneNode(true);
    clone.style.transform = '';
    const layer = document.getElementById('pidAnnotationLayer');
    if (layer && layer.children.length) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-annotations', '1');
      Array.from(layer.children).forEach(c => g.appendChild(c.cloneNode(true)));
      clone.appendChild(g);
    }
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (window._pidCurrentFile || 'pid') + '-anotado.svg';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }));

  // Pantalla completa (nativa, toolbar incluido)
  group.appendChild(mkBtn('Pantalla completa', '⛶⛶', () => {
    var panel = document.querySelector('#tab-process > .panel.fade-in');
    if (!panel) return;
    if (!document.fullscreenElement) {
      panel.requestFullscreen().catch(function() {});
    } else {
      document.exitFullscreen().catch(function() {});
    }
  }));

  toolbar.insertBefore(group, document.getElementById('pidResetZoom') || toolbar.lastElementChild);
}
window._setupPIDTools = _setupPIDTools;


// ─── MODAL DE SELECCIÓN ──────────────────────────────────────────
window.openPIDModal = async function() {
  const svgs = await window.listPIDSVGs();

  let modalEl = document.getElementById('pidModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'pidModal';
    modalEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1050;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    document.body.appendChild(modalEl);
  }

  if (svgs.length === 0) {
    modalEl.innerHTML = `
    <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:16px;padding:28px;width:440px;max-width:95vw">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h5 style="margin:0;font-size:16px;color:var(--text-heading)">Cargar P&ID (.svg)</h5>
        <button onclick="document.getElementById('pidModal').remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:18px">×</button>
      </div>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">No hay archivos .svg en la carpeta <code>pid/</code> del servidor.</p>
      <p style="color:var(--text-disabled);font-size:12px">Sube archivos SVG de planos P&ID a través del File Manager en la carpeta <code>pid/</code>.</p>
      <div style="margin-top:20px;text-align:right"><button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('pidModal').remove()">Cerrar</button></div>
    </div>`;
    modalEl.style.display = 'flex';
    return;
  }

  modalEl.innerHTML = `
  <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:16px;padding:28px;width:480px;max-width:95vw">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h5 style="margin:0;font-size:16px;color:var(--text-heading)">Seleccionar P&ID</h5>
      <button onclick="document.getElementById('pidModal').remove()" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:18px">×</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto">
      ${svgs.map(f => `
      <div onclick="window.loadPIDSVG('${f.name}');document.getElementById('pidModal').remove()"
        style="padding:12px 16px;border:1px solid var(--border-subtle);border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all 0.15s"
        onmouseenter="this.style.borderColor='var(--primary)';this.style.background='rgba(16,185,129,0.05)'"
        onmouseleave="this.style.borderColor='var(--border-subtle)';this.style.background=''">
        <span style="font-size:20px">📐</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${f.name}</div>
          <div style="font-size:11px;color:var(--text-disabled)">${f.size ? (f.size/1024).toFixed(1) + ' KB SVG' : 'Diagrama P&ID'}</div>
        </div>
        ${f.name === window._pidCurrentFile ? '<span style="margin-left:auto;font-size:11px;color:var(--accent-green)">✓ actual</span>' : ''}
      </div>`).join('')}
    </div>
    <div style="margin-top:16px;text-align:right"><button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('pidModal').remove()">Cancelar</button></div>
  </div>`;
  modalEl.style.display = 'flex';
};

// ─── CARGA LOCAL DE ARCHIVO (cliente, sin backend) ──────────────
window.loadPIDFromLocalFile = function(file) {
  if (!file) return;
  const container = document.getElementById('pidContainer');
  if (!container) return;

  const name = file.name || 'archivo';
  const ext  = name.split('.').pop().toLowerCase();
  const label = document.getElementById('pidLabel');

  if (ext === 'svg') {
    const reader = new FileReader();
    reader.onload = e => {
      container.innerHTML = e.target.result;
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.maxHeight = 'calc(100vh - 200px)';
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        _normalizeSVGColors(svgEl);
        _addSVGPanZoom(svgEl);
        _wireSVGHotspots(svgEl);
        _wirePIDLiveValues(svgEl);
      } else {
        container.innerHTML = `<div style="padding:24px;color:var(--danger,#dc3545)">El archivo no contiene un &lt;svg&gt; válido.</div>`;
      }
      window._pidCurrentFile = name;
      if (label) label.textContent = name;
      _updatePIDTagInfo();
      _renderPIDFileList();
      if (typeof window._renderPropertyDashboard === 'function') setTimeout(window._renderPropertyDashboard, 150);
      if (typeof window._checkIntegration === 'function') setTimeout(window._checkIntegration, 200);
      if (typeof window.showNotif === 'function') window.showNotif(`P&ID "${name}" cargado`, 'success');
    };
    reader.onerror = () => window.showNotif?.('Error leyendo el archivo', 'danger');
    reader.readAsText(file);

  } else if (ext === 'dwg' || ext === 'dxf') {
    // Los navegadores no pueden renderizar DWG/DXF de forma nativa.
    const sizeKB = (file.size / 1024).toFixed(1);
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:340px;padding:32px;text-align:center;color:var(--text-secondary)">
        <div style="font-size:48px;margin-bottom:12px">📐</div>
        <div style="font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:6px">${name}</div>
        <div style="font-size:12px;margin-bottom:16px">Archivo ${ext.toUpperCase()} · ${sizeKB} KB</div>
        <div style="font-size:13px;max-width:480px;line-height:1.5">
          Los archivos <b>${ext.toUpperCase()}</b> no se pueden previsualizar directamente en el navegador.
          Conviértelo a <b>SVG</b> (desde AutoCAD: <i>Exportar → SVG</i>, o usa un convertidor online)
          y vuelve a cargarlo aquí.
        </div>
      </div>`;
    window._pidCurrentFile = name;
    if (label) label.textContent = name + ' (DWG)';
    if (typeof window.showNotif === 'function') {
      window.showNotif(`DWG cargado: previsualización no disponible. Convierte a SVG.`, 'warning');
    }

  } else {
    if (typeof window.showNotif === 'function') {
      window.showNotif(`Formato .${ext} no soportado. Usa .svg o .dwg`, 'danger');
    }
  }
};

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const tab = document.getElementById('tab-process');
  if (!tab) return;

  const toolbar = document.getElementById('pidToolbar');
  if (toolbar) {
    // Input file oculto (acepta SVG y DWG/DXF)
    const fileInput = document.getElementById('pidLocalFileInput') || document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.svg,.dwg,.dxf,image/svg+xml';
    fileInput.style.display = 'none';
    fileInput.id = 'pidLocalFileInput';
    fileInput.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (f) window.loadPIDFromLocalFile(f);
      e.target.value = '';
    });
    if (!fileInput.parentElement) document.body.appendChild(fileInput);

    // Botón "Subir P&ID" (carga local desde el equipo del usuario)
    const uploadBtn = document.getElementById('pidLocalUploadBtn') || document.createElement('button');
    uploadBtn.className = 'btn btn-sm';
    uploadBtn.style.cssText = 'border:1px solid var(--primary,#10b981);color:var(--primary,#10b981);background:transparent;font-size:12px;display:flex;align-items:center;gap:6px;margin-right:6px';
    uploadBtn.innerHTML = '📤 Subir SVG';
    uploadBtn.onclick = () => fileInput.click();
    if (!uploadBtn.parentElement) toolbar.prepend(uploadBtn);

    // Botón "PROCESOS UNITARIOS" — gestiona archivos .svg de unidades
    if (!document.getElementById('pidOpUnitBtn')) {
      const opBtn = document.createElement('button');
      opBtn.id = 'pidOpUnitBtn';
      opBtn.className = 'btn btn-sm';
      opBtn.style.cssText = 'border:1px solid var(--border);color:var(--text-secondary);background:transparent;font-size:12px;display:flex;align-items:center;gap:6px;margin-right:6px';
      opBtn.innerHTML = '📂 PROCESOS UNITARIOS';
      opBtn.title = 'Seleccionar / cargar diagrama de proceso unitario';
      opBtn.onclick = () => window.openOpUnitModal && window.openOpUnitModal();
      toolbar.prepend(opBtn);
    }

    // Drag & drop sobre el contenedor del P&ID
    const container = document.getElementById('pidContainer');
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
        if (f) window.loadPIDFromLocalFile(f);
      });
    }
  }

  // Fullscreen toggle para visor P&ID
  const fsBtn = document.getElementById('pidFullscreenBtn');
  const pidPanel = document.querySelector('#tab-process > .panel.fade-in');
  if (fsBtn && pidPanel) {
    fsBtn.addEventListener('click', function() {
      if (!document.fullscreenElement) {
        pidPanel.requestFullscreen().catch(function(err) {
          console.warn('Fullscreen error:', err);
        });
      } else {
        document.exitFullscreen().catch(function(err) {
          console.warn('Exit fullscreen error:', err);
        });
      }
    });
    document.addEventListener('fullscreenchange', function() {
      if (document.fullscreenElement) {
        fsBtn.textContent = '✕';
        fsBtn.style.color = '#ef4444';
        fsBtn.style.borderColor = 'rgba(239,68,68,0.3)';
      } else {
        fsBtn.textContent = '⛶';
        fsBtn.style.color = '';
        fsBtn.style.borderColor = '';
      }
    });
  }

  // Botón toggle dropdown de tags
  var tagsBtn = document.getElementById('pidTagsToggleBtn');
  if (tagsBtn) {
    tagsBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      _showPIDTagsDropdown();
    });
  }

  // Herramientas del visualizador (zoom, rotar, dibujar, descargar, etc.)
  _setupPIDTools();

  // Visualizador inicia vacío — el usuario sube su propio archivo manualmente.
});

// ─── VALORES EN VIVO SOBRE SVG ────────────────────────────────────
let _pidLiveInterval = null;
function _getRelevantDisplayValue(tag) {
  const db = window.TAG_PROPERTIES_DB || {};
  const props = db[tag];
  if (!props) return tag;
  const priority = ['physical', 'process', 'chemical'];
  for (const cat of priority) {
    if (props[cat] && props[cat].length > 0) {
      const p = props[cat][0];
      return p.value + ' ' + p.unit;
    }
  }
  return tag;
}

function _wirePIDLiveValues(svgEl) {
  if (!svgEl) return;
  if (_pidLiveInterval) { clearInterval(_pidLiveInterval); _pidLiveInterval = null; }

  const ns = 'http://www.w3.org/2000/svg';
  svgEl.querySelectorAll('[data-tag]').forEach(el => {
    const tag = el.getAttribute('data-tag');
    if (!tag) return;
    const varId = el.getAttribute('data-scada-var') || tag;
    el.setAttribute('data-scada-var', varId);

    const bbox = el.getBBox ? el.getBBox() : null;
    if (!bbox) return;

    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', bbox.x + bbox.width / 2);
    text.setAttribute('y', bbox.y - 6);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', "'JetBrains Mono',monospace");
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', '600');
    text.setAttribute('fill', 'rgba(34,197,94,0.55)');
    text.setAttribute('data-live-tag', tag);
    text.setAttribute('data-live-var', varId);
    text.setAttribute('filter', 'drop-shadow(0 0 2px rgba(0,0,0,0.6))');
    text.textContent = _getRelevantDisplayValue(tag);
    text.style.display = 'none';

    if (el.parentNode) el.parentNode.insertBefore(text, el.nextSibling);
  });

  _updatePIDLiveValues();

  _pidLiveInterval = setInterval(_updatePIDLiveValues, 2000);
}

function _updatePIDLiveValues() {
  const container = document.getElementById('pidContainer');
  if (!container) return;
  const pv = window.processVars || {};
  const displayValues = {
    'TK-001': '891 L',
    'FIL-001': '846 L',
    'P-001': '3 HP',
    'CLP-001': '24 VDC',
    'TK-002': '834 L',
    'SALACE-001': '834 L',
    'TK-003': '180 L',
    'TK-004': '5.05 kg',
    'E-003': '180 L (0.5 M)',
    'E.W-003': '10 L',
    'ALCO-001': '180 L',
    // Esterificación Transesterificación
    'EST-001': '834 L',
    'GLI-001': '218 L',
    'PRO_DES-001': '14 L',
    'SEP-001': '770 L',
    'SIS_BOM-001': '15 kW',
    'SIS_TRAN-001': '776 L',
    'TRAN-001': '1014 L',
    // Caracterización Producto Final
    'VIS-001': '770 L',
    'SEC-001': '765 L',
    'SEC_COND-001': '760 L',
    'PRO_FIN-001': '760 L',
    'PRO_DES-003': '10 L',
    'SIS_CIRC-001': '500 – 800 L/h'
  };
  container.querySelectorAll('[data-live-tag]').forEach(text => {
    const tag = text.getAttribute('data-live-tag');
    if (!tag) return;
    const displayValue = displayValues[tag];
    if (displayValue) {
      text.textContent = tag + ': ' + displayValue;
      text.style.display = '';
    } else {
      text.style.display = 'none';
    }
  });

  // Actualizar info de tags en la barra de herramientas
  _updatePIDTagInfo();

  // Colorear elementos SVG según estado de alarma
  container.querySelectorAll('[data-scada-var]').forEach(el => {
    const varId = el.getAttribute('data-scada-var');
    const info = pv[varId];
    if (!info || info.val == null) return;
    const val = Number(info.val);
    if (isNaN(val)) return;
    const max = info.max != null ? info.max : 100;
    const min = info.min != null ? info.min : 0;
    const inAlarm = val > max || val < min;

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

// ─── HOTSPOTS: vincular elementos SVG con variables ───────────────
function _wireSVGHotspots(svg) {
  if (!svg || !window.scadaBus) return;
  const vars = (window.variableManager && window.variableManager.variables) || [];
  const equip = window.EQUIPMENT_REGISTRY || {};

  // Indexar variables por id y por tag normalizado
  const byKey = new Map();
  vars.forEach(v => {
    if (v.id)  byKey.set(v.id.toLowerCase(), v);
    if (v.tag) byKey.set(v.tag.toLowerCase().replace(/\s+/g, '_'), v);
    if (v.tag) byKey.set(v.tag.toLowerCase(), v);
  });
  // Indexar equipos por código y label
  Object.entries(equip).forEach(([code, info]) => {
    byKey.set(code.toLowerCase(), { id: code, tag: info.label, equipment: true });
    byKey.set(info.label.toLowerCase(), { id: code, tag: info.label, equipment: true });
  });

  const matched = [];
  const all = svg.querySelectorAll('*');
  all.forEach(el => {
    const candidates = [
      el.getAttribute('data-tag'),
      el.getAttribute('data-var'),
      el.id,
      el.getAttribute('inkscape:label'),
    ].filter(Boolean);
    for (const c of candidates) {
      const norm = String(c).toLowerCase().replace(/\s+/g, '_');
      const v = byKey.get(norm) || byKey.get(String(c).toLowerCase());
      if (v) {
        el.setAttribute('data-scada-var', v.id);
        el.style.cursor = 'pointer';
        el.addEventListener('mouseenter', () => {
          el.dataset._prevStroke = el.style.stroke;
          el.dataset._prevSW = el.style.strokeWidth;
          el.style.stroke = 'rgba(34,197,94,0.55)';
          el.style.strokeWidth = '2';
        });
        el.addEventListener('mouseleave', () => {
          el.style.stroke = el.dataset._prevStroke || '';
          el.style.strokeWidth = el.dataset._prevSW || '';
        });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          window.scadaBus.emit('tag:select', { varId: v.id, tag: v.tag, source: 'pid' });
        });
        matched.push(v.id);
        break;
      }
    }
  });

  if (matched.length && typeof window.showNotif === 'function') {
    window.showNotif(`P&ID: ${matched.length} tag(s) interactivo(s) detectado(s)`, 'info');
  }
}
window._wireSVGHotspots = _wireSVGHotspots;

// Resaltado por bus
if (window.scadaBus) {
  window.scadaBus.on('tag:focus', ({ varId }) => {
    const container = document.getElementById('pidContainer');
    if (!container) return;
    const el = container.querySelector(`[data-scada-var="${varId}"]`);
    if (!el) return;
    // Resaltar también el chip correspondiente en el panel de tags
    const chip = container.querySelector(`#pidTagList [data-var-id="${varId}"]`);
    if (chip) {
      chip.classList.add('tag-chip-active');
      setTimeout(() => chip.classList.remove('tag-chip-active'), 1500);
    }
    // Resalte en el elemento SVG
    const prev = el.style.filter;
    const prevOutline = el.style.outline;
    el.style.transition = 'filter .25s, outline .25s';
    el.style.filter = 'drop-shadow(0 0 8px rgba(34,197,94,0.7)) drop-shadow(0 0 20px rgba(34,197,94,0.35))';
    el.style.outline = '2px solid rgba(34,197,94,0.6)';
    el.style.outlineOffset = '2px';
    setTimeout(() => {
      el.style.filter = prev || '';
      el.style.outline = prevOutline || '';
    }, 1500);
  });
}

// ─── PROCESOS UNITARIOS (archivos .svg) ─────────────────────────
window.listOpUnitSVGs = async function() {
  // Intenta listar primero /operaciones_unitarias y como fallback /pid
  const paths = ['/operaciones_unitarias', '/op_units', '/pid'];
  for (const p of paths) {
    try {
      const res = await fetch('/api/files/list?path=' + encodeURIComponent(p));
      if (!res.ok) continue;
      const files = await res.json();
      const svgs = (files || []).filter(f => f.name && f.name.toLowerCase().endsWith('.svg'));
      if (svgs.length) return { path: p, files: svgs };
    } catch {}
  }
  // Fallback: lista estatica para despliegues estaticos (GitHub Pages)
  return { path: '/pid', files: window._STATIC_PID_SVGS };
};

window.loadOpUnitSVG = async function(path, filename) {
  let svgText;
  try {
    const res = await fetch(`/api/files/raw?path=${encodeURIComponent(path)}&name=${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    svgText = await res.text();
  } catch {
    // Fallback: carga directa desde ruta estatica
    const res = await fetch(`Acceso_seguro/pid/${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    svgText = await res.text();
  }
  try {
    const container = document.getElementById('pidContainer');
    if (!container) return;
    // Reemplazar completamente el contenido (no fusionar)
    container.innerHTML = svgText;
    const svgEl = container.querySelector('svg');
    if (svgEl) {
      svgEl.style.width  = '100%';
      svgEl.style.height = '100%';
      svgEl.style.maxHeight = 'calc(100vh - 200px)';
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      window._normalizeSVGColors && window._normalizeSVGColors(svgEl);
      window._addSVGPanZoom && window._addSVGPanZoom(svgEl);
      window._wireSVGHotspots && window._wireSVGHotspots(svgEl);
      window._wirePIDLiveValues && window._wirePIDLiveValues(svgEl);
    }
    window._pidCurrentFile = filename;
    const label = document.getElementById('pidLabel');
    if (label) label.textContent = filename;
    window._updatePIDTagInfo && window._updatePIDTagInfo();
    window._renderPIDFileList && window._renderPIDFileList();
    if (typeof window._renderPropertyDashboard === 'function') setTimeout(window._renderPropertyDashboard, 150);
    if (typeof window._checkIntegration === 'function') setTimeout(window._checkIntegration, 200);
    window.showNotif?.(`Proceso unitario "${filename}" cargado`, 'success');
  } catch (err) {
    window.showNotif?.('Error: ' + (err.message || err), 'danger');
  }
};

window.uploadOpUnitFile = async function(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.svg')) {
    window.showNotif?.('Solo se permiten archivos .svg', 'warning');
    return;
  }
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch('/api/files/upload?path=/operaciones_unitarias', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(await res.text());
    window.showNotif?.(`"${file.name}" guardado`, 'success');
    window.openOpUnitModal();
  } catch (err) {
    window.showNotif?.('Error al subir: ' + (err.message || err), 'danger');
  }
};

window.deleteOpUnitSVG = async function(path, filename) {
  if (!confirm(`¿Eliminar "${filename}"?`)) return;
  try {
    const res = await fetch(`/api/files/delete?path=${encodeURIComponent(path)}&name=${encodeURIComponent(filename)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    window.showNotif?.(`"${filename}" eliminado`, 'success');
    window.openOpUnitModal();
  } catch (err) {
    window.showNotif?.('Error: ' + (err.message || err), 'danger');
  }
};

window.openOpUnitModal = async function() {
  // Cerrar si ya está abierto
  let existing = document.getElementById('opUnitDropdown');
  if (existing) { existing.remove(); return; }

  const { path, files } = await window.listOpUnitSVGs();
  // Orden personalizado: Caracterización MP → Esterificación → Producto Final
  const ORDER = ['CARACTERIZACION_MATERIA_PRIMA', 'ESTERIFICACION_TRANSESTERIFICACION', 'CARACTERIZACION_PRODUCTO_FINAL'];
  files.sort((a, b) => {
    const ai = ORDER.findIndex(o => a.name.toUpperCase().startsWith(o));
    const bi = ORDER.findIndex(o => b.name.toUpperCase().startsWith(o));
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  const btn = document.getElementById('pidOpUnitBtn');
  if (!btn) return;

  const dropdown = document.createElement('div');
  dropdown.id = 'opUnitDropdown';
  Object.assign(dropdown.style, {
    position:'absolute', zIndex:2000,
    background:'rgba(28,28,38,0.97)',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'12px', padding:'8px',
    boxShadow:'0 8px 32px rgba(0,0,0,0.6)',
    backdropFilter:'blur(12px)',
    minWidth:'280px', maxWidth:'360px',
    display:'flex', flexDirection:'column', gap:'4px'
  });

  const listHTML = files.length === 0
    ? `<div style="padding:16px 10px;text-align:center;color:var(--text-secondary);font-size:12px">No hay diagramas de proceso unitario. Sube uno.</div>`
    : `<div style="display:flex;flex-direction:column;gap:3px;max-height:280px;overflow-y:auto">${files.map((f, i) => `
        <div style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;cursor:pointer;transition:all 0.12s;background:${i%2===0?'rgba(255,255,255,0.02)':'transparent'}"
             onmouseenter="this.style.background='rgba(59,130,246,0.12)'"
             onmouseleave="this.style.background='${i%2===0?'rgba(255,255,255,0.02)':'transparent'}'"
             onclick="window.loadOpUnitSVG('${path}','${f.name.replace(/'/g,"\\'")}');document.getElementById('opUnitDropdown').remove()">
          <span style="font-size:16px;flex-shrink:0">📐</span>
          <span style="flex:1;font-size:12px;font-family:'JetBrains Mono',monospace;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</span>
          <span style="font-size:10px;color:var(--text-disabled);flex-shrink:0">${f.size ? (f.size/1024).toFixed(0)+'KB' : ''}</span>
        </div>`).join('')}</div>`;

  dropdown.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px 8px 6px;border-bottom:1px solid rgba(255,255,255,0.06)">
      <span style="font-size:12px;font-weight:600;color:var(--text-heading)">📂 Procesos Unitarios</span>
      <span style="font-size:11px;color:var(--text-disabled)">${files.length} archivos</span>
    </div>
    ${listHTML}
    <div style="margin-top:4px;padding:6px 4px 0 4px;border-top:1px solid rgba(255,255,255,0.06)">
      <button id="opUnitUploadBtn" style="width:100%;background:rgba(59,130,246,0.1);color:#60a5fa;border:1px dashed rgba(59,130,246,0.3);border-radius:8px;padding:6px;font-size:11px;cursor:pointer;transition:all 0.12s"
              onmouseenter="this.style.background='rgba(59,130,246,0.2)'"
              onmouseleave="this.style.background='rgba(59,130,246,0.1)'">+ Subir nuevo SVG</button>
      <input type="file" id="opUnitUploadInput" accept=".svg,image/svg+xml" style="display:none" />
    </div>`;

  // Posicionar debajo del botón
  const toolbar = document.getElementById('pidToolbar');
  if (toolbar && toolbar.contains(btn)) {
    toolbar.style.position = 'relative';
    toolbar.appendChild(dropdown);
  } else {
    dropdown.style.position = 'fixed';
    document.body.appendChild(dropdown);
  }

  const br = btn.getBoundingClientRect();
  const pr = (toolbar || document.body).getBoundingClientRect();
  dropdown.style.left = (br.left - pr.left) + 'px';
  dropdown.style.top = (br.bottom - pr.top + 4) + 'px';

  const inp = document.getElementById('opUnitUploadInput');
  const upBtn = document.getElementById('opUnitUploadBtn');
  if (upBtn && inp) {
    upBtn.onclick = () => inp.click();
    inp.onchange = e => { const f = e.target.files?.[0]; if (f) { window.uploadOpUnitFile(f); } e.target.value=''; };
  }

  // Cerrar al hacer clic fuera
  setTimeout(function() {
    document.addEventListener('click', function _close(e) {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.remove();
        document.removeEventListener('click', _close);
      }
    });
  }, 0);
};

// ─── TAG INFO ─────────────────────────────────────────────────────
const PID_TAG_ORDER = [
  // Proceso Unitario 1: Caracterización de Materia Prima
  'TK-001', 'FIL-001', 'P-001', 'CLP-001', 'TK-002', 'SALACE-001',
  // Proceso Unitario 2: Esterificación y Transesterificación
  'EST-001', 'TRAN-001', 'SEP-001', 'SIS_TRAN-001', 'GLI-001', 'PRO_DES-001', 'SIS_BOM-001',
  // Proceso Unitario 3: Caracterización del Producto Terminado
  'VIS-001', 'SEC-001', 'SEC_COND-001', 'PRO_FIN-001', 'PRO_DES-003', 'SIS_CIRC-001'
];

function _getPIDDetectedVars() {
  const container = document.getElementById('pidContainer');
  const svg = container ? container.querySelector('svg:not(#pidAnnotationLayer)') : null;
  const detected = svg ? [...new Set(
    Array.from(svg.querySelectorAll('[data-scada-var]'))
      .map(el => el.getAttribute('data-scada-var'))
      .filter(Boolean)
  )] : [];
  
  // Ordenar según el orden definido en PID_TAG_ORDER
  return detected.sort((a, b) => {
    const idxA = PID_TAG_ORDER.indexOf(a);
    const idxB = PID_TAG_ORDER.indexOf(b);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
}
window._getPIDDetectedVars = _getPIDDetectedVars;

function _updatePIDTagInfo() {
  const varIds = _getPIDDetectedVars();
  const btn = document.getElementById('pidTagsToggleBtn');
  const countEl = document.getElementById('pidTagsToggleCount');
  if (btn) btn.style.display = varIds.length > 0 ? 'inline-flex' : 'none';
  if (countEl) countEl.textContent = String(varIds.length);
}

function _showPIDTagsDropdown() {
  var dropdown = document.getElementById('pidTagsDropdown');
  if (dropdown) { dropdown.remove(); return; }

  const varIds = _getPIDDetectedVars();
  if (varIds.length === 0) return;

  const vm = window.variableManager;
  const labelMap = {};
  if (vm && vm.variables) {
    vm.variables.forEach(v => { if (v.id) labelMap[v.id] = v.tag || v.id; });
  }

  dropdown = document.createElement('div');
  dropdown.id = 'pidTagsDropdown';
  Object.assign(dropdown.style, {
    position:'absolute', zIndex:2000,
    background:'rgba(30,30,40,0.96)',
    border:'1px solid rgba(34,197,94,0.3)',
    borderRadius:'10px', padding:'10px 12px',
    boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter:'blur(12px)',
    maxHeight:'60vh', overflowY:'auto',
    minWidth:'180px',
    display:'flex', flexDirection:'column', gap:'4px'
  });

  dropdown.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:rgba(34,197,94,0.7);padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px">Tags detectados (${varIds.length})</div>
    ${varIds.map(id => {
      const safe = id.replace(/'/g, "\\'");
      const label = labelMap[id] || id;
      return `<span data-var-id="${safe}" style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;font-size:11px;font-family:'JetBrains Mono',monospace;color:rgba(34,197,94,0.75);cursor:pointer;transition:all 0.12s;background:rgba(34,197,94,0.04);border:1px solid transparent"
           onmouseenter="this.style.background='rgba(34,197,94,0.12)';this.style.borderColor='rgba(34,197,94,0.2)'"
           onmouseleave="this.style.background='rgba(34,197,94,0.04)';this.style.borderColor='transparent'"
           onclick="var d=document.getElementById('pidTagsDropdown');if(d)d.remove();window.scadaSelectTag('${safe}','pid');window._pidView&&setTimeout(function(){window._pidView.focusElement('${safe}')},120)"
           title="${label}">🏷️ ${id}</span>`;
    }).join('')}
  `;

  // Insertar dentro del panel (funciona en fullscreen)
  var panel = document.querySelector('#tab-process > .panel.fade-in');
  if (!panel) { dropdown.style.position = 'fixed'; document.body.appendChild(dropdown); return; }
  panel.style.position = 'relative';
  panel.appendChild(dropdown);

  var btn = document.getElementById('pidTagsToggleBtn');
  if (btn) {
    var br = btn.getBoundingClientRect();
    var pr = panel.getBoundingClientRect();
    dropdown.style.right = (pr.right - br.right) + 'px';
    dropdown.style.top  = (br.bottom - pr.top + 4) + 'px';
  }

  // Cerrar al hacer clic fuera
  setTimeout(function() {
    document.addEventListener('click', function _close(e) {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.remove();
        document.removeEventListener('click', _close);
      }
    });
  }, 0);
}

// ─── FILE LIST ────────────────────────────────────────────────────
async function _renderPIDFileList() {
  const listEl = document.getElementById('pidFileList');
  const emptyEl = document.getElementById('pidFileListEmpty');
  const countEl = document.getElementById('pidFileCount');
  const countEl2 = document.getElementById('pidFileCount2');
  if (!listEl) return;

  try {
    const svgs = await window.listPIDSVGs();

    if (countEl) countEl.textContent = String(svgs.length);
    if (countEl2) countEl2.textContent = String(svgs.length);

    if (svgs.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
      listEl.querySelectorAll('[data-pid-file]').forEach(el => el.remove());
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    listEl.querySelectorAll('[data-pid-file]').forEach(el => el.remove());

    svgs.forEach(f => {
      const chip = document.createElement('span');
      chip.setAttribute('data-pid-file', '1');
      const active = f.name === window._pidCurrentFile;
      chip.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:8px;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.15s;font-family:'JetBrains Mono',monospace;${active ? 'background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#22c55e;font-weight:600' : 'background:var(--bg-deep);border:1px solid var(--border-subtle);color:var(--text-secondary)'}`;
      chip.textContent = active ? '✓ ' + f.name : f.name;
      chip.title = f.name + (f.size ? ' (' + (f.size/1024).toFixed(1) + ' KB)' : '');
      chip.onmouseenter = () => { if (!active) { chip.style.borderColor = 'var(--accent-cyan)'; chip.style.color = 'var(--accent-cyan)'; } };
      chip.onmouseleave = () => { if (!active) { chip.style.borderColor = 'var(--border-subtle)'; chip.style.color = 'var(--text-secondary)'; } };
      chip.onclick = () => { if (!active) window.loadPIDSVG(f.name); };
      listEl.appendChild(chip);
    });
  } catch (e) {
    if (countEl) countEl.textContent = '0';
  }
}

// Auto-render file list on tab show
document.addEventListener('DOMContentLoaded', () => {
  const tab = document.getElementById('tab-process');
  if (!tab) return;
  const observer = new MutationObserver(() => {
    if (tab.classList.contains('active') || tab.style.display !== 'none') {
      _renderPIDFileList();
    }
  });
  if (window.showTab) {
    const orig = window.showTab;
    window.showTab = function(tabId) {
      orig.call(this, tabId);
      if (tabId === 'process') setTimeout(_renderPIDFileList, 300);
      if (tabId === 'hmi' && typeof window._renderHMIFileList === 'function') setTimeout(window._renderHMIFileList, 300);
      // Cerrar dropdown de tags al cambiar de tab
      var d = document.getElementById('pidTagsDropdown');
      if (d) d.remove();
    };
  }
});
