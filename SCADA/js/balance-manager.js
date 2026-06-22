/**
 * NexSCADA — balance-manager.js
 * Balance de Materia y Energía por Proceso Unitario
 * Organizado en PU1/PU2/PU3 · Cada PU muestra Fick, Fourier y Newton
 * Render inicial con KaTeX · Actualización solo de valores vivos cada 2s
 */
const BalanceManager = (function () {

  var _intervalId = null;
  var _rendered = false;
  var _currentPU = 'pu1';

  // ─── Constantes físicas ─────────────────────────────────────
  var PHYS = {
    RHO_ACEITE: 920, RHO_BIODIESEL: 880, RHO_METANOL: 791,
    CP_ACEITE: 2.1, CP_BIODIESEL: 1.8,
    K_ACEITE: 0.17, K_BIODIESEL: 0.15,
    D_AB: 1.2e-9, MU_ACEITE: 0.035, MU_BIODIESEL: 0.004,
    G: 9.81, R: 8.314, EA: 45000, A_FACTOR: 1.5e6,
    U_HX: 1.2, A_HX: 45,
  };

  // ─── Configuración por Proceso Unitario ──────────────────────
  var PU_INFO = {
    pu1: { label: 'Caracterización de Materia Prima', icon: '🛥️', short: 'PU1',
      desc: 'Recepción, almacenamiento, filtrado y acondicionamiento del aceite vegetal crudo antes de la reacción.' },
    pu2: { label: 'Esterificación y Transesterificación', icon: '⚗️', short: 'PU2',
      desc: 'Reacción de transesterificación de triglicéridos con metanol para producir ésteres metílicos (biodiesel) y glicerina.' },
    pu3: { label: 'Purificación y Producto Final', icon: '🛠️', short: 'PU3',
      desc: 'Lavado, secado y control de calidad del biodiesel para cumplir con la norma ASTM D6751.' },
  };

  // Tags de cada PU
  var PU_TAGS = {
    pu1: ['TK-001','FIL-001','P-001','TK-002','E.W-003','E-003','TK-003','TK-004','CLP-001','SALACE-001','ALCO-001'],
    pu2: ['EST-001','TRAN-001','SEP-001','GLI-001','PRO_DES-001','SIS_TRAN-001','SIS_BOM-001'],
    pu3: ['PRO_DES-003','PRO_FIN-001','SEC-001','SEC_COND-001','SIS_CIRC-001','VIS-001'],
  };

  // Leyes aplicables por PU: { ley: { desc, parametros por tag } }
  // Cada entrada de tag: [ tagId, valorKey, unidad ]
  var PU_LAWS = {
    pu1: {
      fick: {
        title: '⚖ 1.ª Ley de Fick — Transferencia de Masa',
        equation: '\\frac{\\partial C_A}{\\partial t} = D_{AB} \\nabla^2 C_A + R_A',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Difusión de alcohol en matriz oleosa y balances de materia en tanques, filtros y corrientes de entrada/salida.',
        tags: [
          ['ALCO-001', 'Concentración de alcohol', 'concentración', 'chemical', 'pureza', '%'],
          ['TK-001', 'Balance de masa en tanque de materia prima', 'nivel', 'physical', 'nivel_actual', '%'],
          ['TK-002', 'Balance de masa en tanque de aceite caracterizado', 'nivel', 'physical', 'nivel_actual', '%'],
          ['FIL-001', 'Flujo a través de medio poroso (Darcy)', 'presión dif.', 'physical', 'presion_diferencial', 'bar'],
          ['SALACE-001', 'Flujo de aceite caracterizado en tubería (Bernoulli)', 'caudal', 'physical', 'caudal_nominal', 'L/h'],
        ],
      },
      fourier: {
        title: '🔥 2.ª Ley de Fourier — Transferencia de Energía',
        equation: '\\rho c_p \\frac{\\partial T}{\\partial t} = k \\nabla^2 T + \\dot{q}',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Precalentamiento del aceite y acondicionamiento térmico para optimizar la filtración y reducir la viscosidad.',
        tags: [
          ['E-003', 'Acondicionamiento térmico del aceite', 'temperatura', 'physical', 'temp_operacion', '°C'],
        ],
      },
      newton: {
        title: '💨 3.ª Ley de Newton — Transferencia de Momentum',
        equation: '\\rho \\frac{D\\mathbf{v}}{Dt} = -\\nabla P + \\mu \\nabla^2 \\mathbf{v} + \\rho \\mathbf{g}',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Potencia hidráulica de la bomba centrífuga para transporte de aceite filtrado hacia el reactor.',
        tags: [
          ['P-001', 'Potencia hidráulica de bomba centrífuga', 'velocidad', 'physical', 'velocidad', 'm/s'],
        ],
      },
    },
    pu2: {
      fick: {
        title: '⚖ 1.ª Ley de Fick — Transferencia de Masa',
        equation: '\\frac{\\partial C_A}{\\partial t} = D_{AB} \\nabla^2 C_A + R_A',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Balance de reactivos en la transesterificación, separación de fases (glicerina/éster) y flujo de producto.',
        tags: [
          ['TRAN-001', 'Flujo de transporte de producto (Hagen-Poiseuille)', 'caudal', 'physical', 'capacidad', 'L'],
          ['SEP-001', 'Separación de fases por diferencia de densidad (Stokes)', 'capacidad', 'physical', 'capacidad', 'L'],
          ['GLI-001', 'Sedimentación de glicerol en separador de fases (Stokes)', 'capacidad', 'physical', 'capacidad', 'L'],
          ['PRO_DES-001', 'Balance de masa — Flujo de producto hacia destino', 'capacidad', 'physical', 'capacidad', 'L'],
        ],
      },
      fourier: {
        title: '🔥 2.ª Ley de Fourier — Transferencia de Energía',
        equation: '\\rho c_p \\frac{\\partial T}{\\partial t} = k \\nabla^2 T + \\dot{q}',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Cinética de transesterificación gobernada por la temperatura (Arrhenius). El reactor requiere control térmico para mantener la conversión >96%.',
        tags: [
          ['EST-001', 'Cinética de transesterificación dependiente de T (Arrhenius)', 'temperatura', 'physical', 'temp_operacion', '°C'],
        ],
      },
      newton: {
        title: '💨 3.ª Ley de Newton — Transferencia de Momentum',
        equation: '\\rho \\frac{D\\mathbf{v}}{Dt} = -\\nabla P + \\mu \\nabla^2 \\mathbf{v} + \\rho \\mathbf{g}',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Sistema de bombas que recircula la mezcla de reacción y transporta fluidos entre etapas del proceso.',
        tags: [
          ['SIS_BOM-001', 'Potencia hidráulica del sistema de bombas', 'caudal', 'physical', 'caudal_nominal', 'L/h'],
          ['SIS_TRAN-001', 'Transporte de fluido en tuberías entre etapas (Bernoulli)', 'caudal', 'physical', 'caudal_nominal', 'L/h'],
        ],
      },
    },
    pu3: {
      fick: {
        title: '⚖ 1.ª Ley de Fick — Transferencia de Masa',
        equation: '\\frac{\\partial C_A}{\\partial t} = D_{AB} \\nabla^2 C_A + R_A',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Balance de masa en la purificación: condensación de vapores de metanol y control de calidad del producto final.',
        tags: [
          ['PRO_FIN-001', 'Balance de masa — Producto final purificado', 'densidad', 'physical', 'densidad', 'g/cm³'],
          ['PRO_DES-003', 'Balance de masa — Producto destino en purificación', 'capacidad', 'physical', 'capacidad', 'L'],
          ['SEC_COND-001', 'Condensación de vapores de metanol (Clausius-Clapeyron)', 'temperatura', 'physical', 'temp_operacion', '°C'],
        ],
      },
      fourier: {
        title: '🔥 2.ª Ley de Fourier — Transferencia de Energía',
        equation: '\\rho c_p \\frac{\\partial T}{\\partial t} = k \\nabla^2 T + \\dot{q}',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Transferencia de calor en el secador para eliminar el metanol residual del biodiesel. La temperatura de operación determina la eficiencia del secado.',
        tags: [
          ['SEC-001', 'Transferencia de calor en secador de biodiesel', 'temperatura', 'physical', 'temp_operacion', '°C'],
        ],
      },
      newton: {
        title: '💨 3.ª Ley de Newton — Transferencia de Momentum',
        equation: '\\rho \\frac{D\\mathbf{v}}{Dt} = -\\nabla P + \\mu \\nabla^2 \\mathbf{v} + \\rho \\mathbf{g}',
        laplacian: '\\nabla^2 = \\frac{\\partial^2}{\\partial x^2} + \\frac{\\partial^2}{\\partial y^2} + \\frac{\\partial^2}{\\partial z^2}',
        desc: 'Reología del biodiesel: la viscosidad cinemática (ASTM D445) determina la calidad del combustible. La recirculación mantiene la homogeneidad del producto.',
        tags: [
          ['VIS-001', 'Viscosidad cinemática del biodiesel (ASTM D445)', 'viscosidad', 'physical', 'viscosidad_esperada', 'cSt'],
          ['SIS_CIRC-001', 'Recirculación en sistema de purificación (Bernoulli)', 'caudal', 'physical', 'caudal_nominal', 'L/h'],
        ],
      },
    },
  };

  // ─── Acceso a datos vivos ───────────────────────────────────
  function _getTag(tagId) {
    return window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[tagId];
  }

  function _getVal(tagId, cat, key, fallback) {
    var tag = _getTag(tagId);
    if (!tag || !tag[cat]) return fallback;
    for (var i = 0; i < tag[cat].length; i++) {
      if (tag[cat][i].key === key) {
        var v = parseFloat(tag[cat][i].value);
        return isFinite(v) ? v : fallback;
      }
    }
    return fallback;
  }

  function _getLabel(tagId) {
    var tag = _getTag(tagId);
    return tag ? tag.label : tagId;
  }

  function _getEngProp(tagId) {
    return (window.ENGINEERING_PROPS && window.ENGINEERING_PROPS[tagId])
      || (window._engProp && window._engProp(tagId))
      || { law: '—', lawKey: '' };
  }

  // ─── KaTeX helper ───────────────────────────────────────────
  function _katex(latex) {
    if (typeof katex !== 'undefined') {
      try { return katex.renderToString(latex, { displayMode: true, throwOnError: false }); } catch (e) {}
    }
    return '<div style="color:var(--accent-cyan);font-family:JetBrains Mono,monospace;font-size:14px;padding:8px;background:rgba(0,0,0,0.3);border-radius:6px;text-align:center">' + latex + '</div>';
  }

  // ─── Render de una tarjeta de ley para un PU ────────────────
  function _buildLawCard(puId, lawKey) {
    var cfg = PU_LAWS[puId][lawKey];
    if (!cfg) return '';

    var prefix = puId + '-' + lawKey;

    var tagRows = cfg.tags.map(function (t, i) {
      var tagId = t[0], desc = t[1], prop = t[2], cat = t[3], key = t[4], unit = t[5];
      var ep = _getEngProp(tagId);
      return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;border-bottom:1px solid rgba(48,54,61,0.08)">' +
        '<div style="min-width:80px;font-weight:600;color:var(--accent-cyan);font-family:JetBrains Mono,monospace">' + tagId + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="color:var(--text-primary);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + desc + '</div>' +
          '<div style="color:var(--text-muted);font-size:9px">' + ep.law + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div><span id="' + prefix + '-tv' + i + '" style="font-family:JetBrains Mono,monospace;color:var(--text-primary);font-weight:500">—</span>' +
          '<span style="color:var(--text-muted);font-size:10px;margin-left:2px">' + unit + '</span></div>' +
          '<div style="color:var(--text-muted);font-size:9px">' + prop + '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    var eqHtml = _katex(cfg.equation);
    var lapHtml = _katex(cfg.laplacian);

    return '<div class="panel fade-in" style="display:flex;flex-direction:column;margin-bottom:0">' +
      '<div class="panel-header" style="padding:10px 14px">' +
        '<div class="panel-title" style="font-size:13px">' + cfg.title + '</div>' +
      '</div>' +
      '<div class="panel-body" style="padding:12px 14px;flex:1;display:flex;flex-direction:column;gap:6px">' +
        '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;border:1px solid rgba(99,139,255,0.15);overflow-x:auto">' +
          eqHtml +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);text-align:center;border-bottom:1px solid rgba(48,54,61,0.1);padding-bottom:4px">' +
          lapHtml +
        '</div>' +
        '<div style="font-size:10px;color:var(--text-secondary);padding:4px 0;font-style:italic;border-bottom:1px solid rgba(48,54,61,0.1)">' +
          cfg.desc +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:1px;flex:1">' +
          tagRows +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ─── Render de selector de PU ───────────────────────────────
  function _buildSelector(currentPU) {
    var btns = Object.keys(PU_INFO).map(function (id) {
      var info = PU_INFO[id];
      var active = id === currentPU ? 'active' : '';
      return '<button class="pu-selector-btn ' + active + '" data-pu="' + id + '">' +
        info.icon + ' ' + info.short + ' — ' + info.label +
        '</button>';
    }).join('');
    return '<div class="pu-selector" style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">' + btns + '</div>';
  }

  // ─── Api pública ────────────────────────────────────────────
  var api = {

    renderBalances: function (puId) {
      if (puId) _currentPU = puId;
      var container = document.getElementById('balanceContent');
      if (!container) return;

      var selHtml = _buildSelector(_currentPU);
      var cardsHtml = _buildLawCard(_currentPU, 'fick')
        + _buildLawCard(_currentPU, 'fourier')
        + _buildLawCard(_currentPU, 'newton');

      container.innerHTML = selHtml + '<div id="puCards" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;min-height:400px">' + cardsHtml + '</div>';

      // Wire selector
      container.querySelectorAll('.pu-selector-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-pu');
          api.renderBalances(id);
          api.updateData();
        });
      });

      // Primera carga de datos
      api.updateData();
      _rendered = true;
    },

    updateData: function () {
      if (!_rendered) return;
      var puId = _currentPU;

      Object.keys(PU_LAWS[puId]).forEach(function (lawKey) {
        var cfg = PU_LAWS[puId][lawKey];
        cfg.tags.forEach(function (t, i) {
          var tagId = t[0], cat = t[3], key = t[4];
          var el = document.getElementById(puId + '-' + lawKey + '-tv' + i);
          if (el) {
            var val = _getVal(tagId, cat, key, null);
            if (val !== null) {
              el.textContent = key === 'densidad' ? val.toFixed(3) : val.toFixed(1);
            }
          }
        });
      });

      var ts = document.getElementById('balanceTimestamp');
      if (ts) ts.textContent = new Date().toLocaleTimeString();
    },

    startUpdates: function () {
      if (_intervalId) return;
      if (!_rendered) api.renderBalances(_currentPU);
      api.updateData();
      _intervalId = setInterval(api.updateData, 2000);
      var cycle = document.getElementById('balanceCycle');
      if (cycle) cycle.textContent = '2s';
    },

    stopUpdates: function () {
      if (_intervalId) {
        clearInterval(_intervalId);
        _intervalId = null;
      }
      var cycle = document.getElementById('balanceCycle');
      if (cycle) cycle.textContent = 'detenida';
    },

    isRunning: function () {
      return _intervalId !== null;
    },
  };

  return api;
})();

window.BalanceManager = BalanceManager;
