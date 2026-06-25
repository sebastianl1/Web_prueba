/**
 * SpY — dashboard-manager.js  v7.0
 * Dashboard profesional con todos los tags y sus propiedades físico-químicas.
 * Diseño didáctico: cada tag se muestra como ficha técnica con iconografía,
 * tablas de propiedades y estado en vivo.
 */

// ═══ CONSTANTES ══════════════════════════════════════════════════
const CAT_COLORS = {
  'Tanques de Almacenamiento': '#3b82f6',
  'Equipos de Proceso':       '#f97316',
  'Instrumentación y Control':'#8b5cf6',
  'Corrientes de Proceso':    '#22c55e',
};

const CAT_ICONS = {
  'Tanques de Almacenamiento': 'droplet',
  'Equipos de Proceso':       'tool',
  'Instrumentación y Control':'cpu',
  'Corrientes de Proceso':    'arrow-right-circle',
};

const VAR_ICONS = {
  'ALCO-001':    'thermometer',
  'CLP-001':     'cpu',
  'E-003':       'tool',
  'E.W-003':     'bar-chart-2',
  'FIL-001':     'filter',
  'P-001':       'power',
  'SALACE-001':  'arrow-right',
  'TK-001':      'droplet',
  'TK-002':      'droplet',
  'TK-003':      'droplet',
  'TK-004':      'droplet',
  'EST-001':     'thermometer',
  'GLI-001':     'droplet',
  'PRO_DES-001': 'arrow-right',
  'SEP-001':     'wind',
  'SIS_BOM-001': 'power',
  'SIS_TRAN-001':'truck',
  'TRAN-001':    'arrow-right',
  'PRO_DES-003': 'arrow-right',
  'PRO_FIN-001': 'check-circle',
  'SEC-001':     'thermometer',
  'SEC_COND-001':'wind',
  'SIS_CIRC-001':'refresh-cw',
  'VIS-001':     'activity',
  TK_ACEITE:       'droplet',
  FILTRADO:        'filter',
  BOMBEO:          'power',
  CONTROL_1:       'cpu',
  TK_ACE_FILTRADO: 'droplet',
  TK_METANOL:      'droplet',
  TK_NAOH:         'droplet',
  INT_CALOR:       'thermometer',
  SIS_CIRCULACION: 'refresh-cw',
  SAL_ALCOXIDO:    'arrow-right',
  SAL_ACEITE:      'arrow-right',
};

// ═══ ESTADO ══════════════════════════════════════════════════════
let _liveInterval = null;

// ═══ UTILIDADES ═══════════════════════════════════════════════════
function _getLiveVal(id) {
  var pv = window.processVars && window.processVars[id];
  return pv && pv.val != null ? pv.val : null;
}

function _getDetectedVars() {
  return window._getPIDDetectedVars ? window._getPIDDetectedVars() : [];
}

// ─── Navegación a símbolo en P&ID ───────────────────────────────
function _navigateToPIDSymbol(varId) {
  // 1. Emitir tag:select para activar Tag Inspector + tag:focus en P&ID
  if (window.scadaBus) {
    var v = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[varId];
    window.scadaBus.emit('tag:select', { varId: varId, tag: (v && v.label) || varId, source: 'dashboard' });
  }
  // 2. Cambiar a la pestaña Process
  if (typeof window.showTab === 'function') {
    window.showTab('process');
  }
  // 3. Esperar a que el tab esté visible + layout, luego hacer zoom
  setTimeout(function() {
    if (window._pidView && typeof window._pidView.focusElement === 'function') {
      window._pidView.focusElement(varId);
    }
  }, 350);
}

// ═══ RENDER ══════════════════════════════════════════════════════
function _renderPropertyDashboard() {
  var container = document.getElementById('activeWidgetsGrid');
  if (!container) return;

  var db = window.TAG_PROPERTIES_DB || {};
  var allTags = Object.keys(db);
  var detected = _getDetectedVars();

  // Filtrar: solo mostrar tags detectados en el P&ID actual
  var visibleTags = detected.length > 0
    ? allTags.filter(function(v) { return detected.indexOf(v) !== -1; })
    : allTags;

  if (allTags.length === 0) {
    container.innerHTML = '<div class="dash-empty"><div class="dash-empty-icon">📋</div><h3>Base de datos vacía</h3><p>No hay propiedades registradas en TAG_PROPERTIES_DB.</p></div>';
    return;
  }

  if (visibleTags.length === 0 && detected.length > 0) {
    container.innerHTML = '<div class="dash-empty"><div class="dash-empty-icon">🔍</div><h3>Sin coincidencias</h3><p>Ningún tag del P&amp;ID tiene propiedades registradas en la base de datos.</p></div>';
    return;
  }

  // Agrupar por categoría (respetando el orden definido en CAT_COLORS)
  var groups = {};
  visibleTags.forEach(function(varId) {
    var props = db[varId];
    var cat = (props && props.category) || 'Sin categoría';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ varId: varId, props: props });
  });

  var html = '';

  // Barra de resumen
  var okCount = visibleTags.filter(function(v) { return _getLiveVal(v) != null; }).length;
  var pidCount = detected.length;
  html += '<div class="dash-bar">';
  html += '<div class="dash-bar-item"><span class="dash-bar-num">' + visibleTags.length + '</span> tags ' + (detected.length > 0 ? 'en P&amp;ID' : 'registrados') + '</div>';
  html += '<div class="dash-bar-item"><span class="dash-bar-num" style="color:var(--accent-green)">' + okCount + '</span> con datos</div>';
  html += '<div class="dash-bar-item"><span class="dash-bar-num" style="color:' + (pidCount > 0 ? 'var(--accent-green)' : 'var(--text-dim)') + '">' + pidCount + '</span> en P&amp;ID</div>';
  html += '</div>';

  // Secciones por categoría
  Object.keys(groups).forEach(function(cat) {
    var color = CAT_COLORS[cat] || 'var(--accent-cyan)';
    var icon = CAT_ICONS[cat] || 'circle';
    html += '<div class="dash-section">';
    html += '<div class="dash-section-head" style="border-left:3px solid ' + color + '">';
    html += '<i data-feather="' + icon + '" style="width:16px;height:16px;color:' + color + ';stroke-width:2"></i>';
    html += '<span>' + cat + '</span>';
    html += '<span class="dash-section-count">' + groups[cat].length + '</span>';
    html += '</div>';
    html += '<div class="dash-grid">';

    groups[cat].forEach(function(item) {
      html += _buildCard(item.varId, item.props, detected, color);
    });

    html += '</div></div>';
  });

  container.innerHTML = html;

  // Inicializar Feather icons (si está disponible)
  try { if (window.feather) feather.replace(); } catch(e) {}

  // Wire botones P&ID
  allTags.forEach(function(varId) {
    var btn = container.querySelector('[data-pid-btn="' + varId + '"]');
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _navigateToPIDSymbol(varId);
      });
    }
  });

  // Click en card → Tag Inspector flotante (tag:select)
  container.querySelectorAll('.dash-card').forEach(function(card) {
    card.addEventListener('click', function(e) {
      if (e.target.closest('[data-pid-btn]')) return;
      var vid = card.dataset.varId;
      if (vid && window.scadaBus) {
        var v = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[vid];
        window.scadaBus.emit('tag:select', { varId: vid, tag: (v && v.label) || vid, source: 'dashboard' });
      }
    });
  });

  window._dashboardDetectedVars = detected;
  _updateCards();
  _startLive();
}

window._theoCycleIndex = {};

function _isQuantitative(p) {
  if (!p || p.value == null) return false;
  const v = String(p.value).trim();
  if (!v || v === '--') return false;
  // Solo valores puramente numéricos (ej: "180", "60", "0.5", "5.05") o rangos simples sin texto
  // Excluir: "Listo para...", "Agua", "15 – 20", "4.8 → 7.5", "> 95", "< 0.05", "--"
  return /^[\d.,]+\s*$/.test(v) || /^[\d.,]+\s*[–-]\s*[\d.,]+\s*$/.test(v);
}

function _getAllPropsFlat(varId) {
  const db = window.TAG_PROPERTIES_DB || {};
  const props = db[varId];
  if (!props) return [];
  return [
    ...(props.physical || []),
    ...(props.chemical || []),
    ...(props.process || []),
  ].filter(_isQuantitative);
}

function _inferUnitFromLabel(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('temperatur')) return '°C';
  if (l.includes('presion') || l.includes('presión') || l.includes('delta') || l.includes('dp')) return 'bar';
  if (l.includes('caudal') || l.includes('flujo')) return 'L/min';
  if (l.includes('nivel')) return '%';
  if (l.includes('volumen') || l.includes('capacidad') || l.includes('salida') || l.includes('entrada')) return 'L';
  if (l.includes('concentracion') || l.includes('concentración') || l.includes('molar')) return 'M';
  if (l.includes('pureza') || l.includes('porcentaje') || l.includes('%')) return '%';
  if (l.includes('ph')) return 'pH';
  if (l.includes('densidad')) return 'kg/m³';
  if (l.includes('viscosidad')) return 'cP';
  if (l.includes('acidez') || l.includes('indice')) return 'mg KOH/g';
  if (l.includes('agua') || l.includes('humedad')) return '%';
  if (l.includes('energia') || l.includes('energía') || l.includes('calor')) return 'GJ';
  if (l.includes('potencia') || l.includes('kw') || l.includes('hp')) return 'kW';
  if (l.includes('velocidad')) return 'm/s';
  if (l.includes('corriente')) return 'A';
  if (l.includes('voltaje') || l.includes('tension') || l.includes('tensión')) return 'VDC';
  if (l.includes('tiempo')) return 'min';
  return '';
}

function _getTheoreticalDisplayValue(varId) {
  const all = _getAllPropsFlat(varId);
  if (!all.length) return { value: varId, unit: '' };
  if (window._theoCycleIndex[varId] == null) window._theoCycleIndex[varId] = 0;
  const idx = window._theoCycleIndex[varId] % all.length;
  const p = all[idx];
  const unit = (p.unit && p.unit.trim()) || _inferUnitFromLabel(p.label);
  return { value: p.value, unit: unit, label: p.label };
}

function _advanceCycleIndex() {
  const db = window.TAG_PROPERTIES_DB || {};
  Object.keys(db).forEach(function(varId) {
    if (window._theoCycleIndex[varId] == null) window._theoCycleIndex[varId] = 0;
    window._theoCycleIndex[varId]++;
  });
}

function _buildCard(varId, props, detected, catColor) {
  var theoretical = _getTheoreticalDisplayValue(varId);
  var isDetected = detected.indexOf(varId) !== -1;
  var name = (props && props.label) || varId;
  var desc = (props && props.description) || '';
  var unit = theoretical.unit || (props && props.unit) || '';
  var icon = VAR_ICONS[varId] || 'circle';

  var valDisplay = theoretical.value;
  var valUnit = theoretical.unit;

  var borderColor = isDetected ? '#22c55e' : 'transparent';
  var statusLabel = 'Teórico';
  var statusColor = 'var(--accent-cyan)';
  var dotColor = 'var(--accent-cyan)';

  var html = '<div class="dash-card" data-var-id="' + varId + '" style="border-top:2px solid ' + borderColor + '">';

  html += '<div class="dash-card-top">';
  html += '<i data-feather="' + icon + '" style="width:18px;height:18px;color:' + catColor + ';stroke-width:1.5;flex-shrink:0"></i>';
  html += '<div class="dash-card-id">' + varId + '</div>';
  if (isDetected) {
    html += '<span class="dash-pid-dot" title="Detectado en P&amp;ID"></span>';
  }
  html += '<div class="dash-card-val">';
  html += '<span class="dash-card-num" data-live="' + varId + '">' + valDisplay + '</span>';
  html += '<span class="dash-card-unit">' + valUnit + '</span>';
  html += '</div>';
  html += '</div>';

  // Nombre
  html += '<div class="dash-card-title">' + name + '</div>';

  // Descripción (colapsada)
  if (desc) {
    html += '<div class="dash-card-desc">' + desc + '</div>';
  }

  // Separador
  html += '<div class="dash-divider"></div>';

  // Tabla de propiedades físicas
  if (props && props.physical && props.physical.length) {
    html += '<div class="dash-prop-group"><span class="dash-prop-label">Físicas</span>';
    props.physical.forEach(function(p) {
      html += '<div class="dash-prop-row"><span>' + p.label + '</span><span class="dash-prop-val">' + p.value + ' ' + p.unit + '</span></div>';
    });
    html += '</div>';
  }

  // Tabla de propiedades químicas
  if (props && props.chemical && props.chemical.length) {
    html += '<div class="dash-prop-group"><span class="dash-prop-label" style="color:#a78bfa">Químicas</span>';
    props.chemical.forEach(function(p) {
      html += '<div class="dash-prop-row"><span>' + p.label + '</span><span class="dash-prop-val">' + p.value + ' ' + p.unit + '</span></div>';
    });
    html += '</div>';
  }

  // Tabla de magnitudes de proceso
  if (props && props.process && props.process.length) {
    html += '<div class="dash-prop-group"><span class="dash-prop-label" style="color:#fbbf24">Proceso</span>';
    props.process.forEach(function(p) {
      html += '<div class="dash-prop-row"><span>' + p.label + '</span><span class="dash-prop-val">' + p.value + ' ' + p.unit + '</span></div>';
    });
    html += '</div>';
  }

  // Footer
  html += '<div class="dash-card-bottom">';
  html += '<span class="dash-status" style="color:' + statusColor + '"><span class="dash-status-dot" style="background:' + dotColor + '"></span>' + statusLabel + '</span>';
  if (isDetected) {
    html += '<button class="dash-pid-btn" data-pid-btn="' + varId + '">🔍 P&amp;ID</button>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

// ═══ LIVE UPDATE ════════════════════════════════════════════════
function _updateCards() {
  _advanceCycleIndex();
  var detected = _getDetectedVars();
  window._dashboardDetectedVars = detected;

  document.querySelectorAll('.dash-card').forEach(function(card) {
    var varId = card.dataset.varId;
    if (!varId) return;
    var isDetected = detected.indexOf(varId) !== -1;
    var theoretical = _getTheoreticalDisplayValue(varId);
    var unit = theoretical.unit || '';

    // Borde superior
    card.style.borderTopColor = isDetected ? '#22c55e' : 'transparent';

    // Badge P&ID dot
    var dot = card.querySelector('.dash-pid-dot');
    if (isDetected && !dot) {
      var top = card.querySelector('.dash-card-top');
      if (top) {
        var d = document.createElement('span');
        d.className = 'dash-pid-dot';
        d.title = 'Detectado en P&ID';
        top.insertBefore(d, top.querySelector('.dash-card-val'));
      }
    } else if (!isDetected && dot) {
      dot.remove();
    }

    // Valor teórico
    var numEl = card.querySelector('[data-live]');
    if (numEl) {
      numEl.textContent = theoretical.value;
      var unitEl = card.querySelector('.dash-card-unit');
      if (unitEl) unitEl.textContent = unit;
    }

    // Descripción con la propiedad actual
    var descEl = card.querySelector('.dash-card-desc');
    if (descEl && theoretical.label) {
      descEl.textContent = theoretical.label;
    }

    // Estado - Teórico fijo
    var statusEl = card.querySelector('.dash-status');
    if (statusEl) {
      statusEl.innerHTML = '<span class="dash-status-dot" style="background:var(--accent-cyan)"></span>Teórico';
      statusEl.style.color = 'var(--accent-cyan)';
    }

    // Botón P&ID
    var bottom = card.querySelector('.dash-card-bottom');
    if (bottom) {
      var btn = bottom.querySelector('[data-pid-btn]');
      if (isDetected && !btn) {
        var b = document.createElement('button');
        b.className = 'dash-pid-btn';
        b.setAttribute('data-pid-btn', varId);
        b.textContent = '🔍 P&ID';
        b.addEventListener('click', function(e) {
          e.stopPropagation();
          _navigateToPIDSymbol(varId);
        });
        bottom.appendChild(b);
      } else if (!isDetected && btn) {
        btn.remove();
      }
    }
  });

  // Summary
  var totalOk = document.querySelectorAll('.dash-card-num[data-live]').length;
  var pidCount = detected.length;
  var bar = document.querySelector('.dash-bar');
  if (bar) {
    var items = bar.querySelectorAll('.dash-bar-item');
    if (items.length >= 3) {
      items[1].innerHTML = '<span class="dash-bar-num" style="color:var(--accent-cyan)">' + totalOk + '</span> valores teóricos';
      items[2].innerHTML = '<span class="dash-bar-num" style="color:' + (pidCount > 0 ? 'var(--accent-green)' : 'var(--text-dim)') + '">' + pidCount + '</span> en P&amp;ID';
    }
  }
}

function _startLive() {
  if (_liveInterval) clearInterval(_liveInterval);
  _liveInterval = setInterval(function() { try { _updateCards(); } catch(e) { console.error('[Dashboard] Error:', e); } }, 2000);
}

// ═══ INIT ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() { _renderPropertyDashboard(); _startLive(); }, 300);
});

window._renderPropertyDashboard = _renderPropertyDashboard;

// ═══ scadaBus ════════════════════════════════════════════════════
if (window.scadaBus) {
  // Inject pulse keyframes once
  if (!document.getElementById('_dashPulseStyle')) {
    var ps = document.createElement('style');
    ps.id = '_dashPulseStyle';
    ps.textContent = '@keyframes dashPulse {\
  0%, 100% { outline: 2px solid #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,0.15); }\
  50% { outline: 3px solid #22c55e; box-shadow: 0 0 0 8px rgba(34,197,94,0.3); }\
}';
    document.head.appendChild(ps);
  }

  window.scadaBus.on('tag:focus', function(e) {
    // Clear previous highlight
    if (window._dashHighlightedCard) {
      var prev = window._dashHighlightedCard;
      prev.style.animation = '';
      prev.style.outline = '';
      prev.style.boxShadow = '';
    }
    var card = document.querySelector('.dash-card[data-var-id="' + e.varId + '"]');
    if (!card) return;
    card.style.animation = 'dashPulse 1.2s ease-in-out infinite';
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window._dashHighlightedCard = card;
  });
}
