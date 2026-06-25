/**
 * SpY — reporte-manager.js
 * Generación de reportes profesionales de producción (Éster Etílico)
 * Exportable a PDF vía html2pdf.js
 */
const ReporteManager = (function () {
  var _buffer = [];
  var _maxBuffer = 30;
  var _intervalId = null;

  // Unidades de proceso con sus variables
  var PU_TAGS = {
    'PU1 — Caracterización': ['TK-001', 'TK-002', 'TK-003', 'TK-004', 'FIL-001', 'P-001', 'E-003', 'E.W-003', 'CLP-001', 'SALACE-001', 'ALCO-001'],
    'PU2 — Transesterificación': ['EST-001', 'GLI-001', 'PRO_DES-001', 'SEP-001', 'SIS_BOM-001', 'SIS_TRAN-001', 'TRAN-001'],
    'PU3 — Purificación': ['PRO_DES-003', 'PRO_FIN-001', 'SEC-001', 'SEC_COND-001', 'SIS_CIRC-001', 'VIS-001'],
  };

  // Tiempos estimados por unidad de proceso
  var PU_TIMES = {
    'PU1 — Caracterización': { tiempo: '2.5 — 4.0 horas', desc: 'Recepción, filtrado y acondicionamiento de materia prima' },
    'PU2 — Transesterificación': { tiempo: '3.0 — 5.0 horas', desc: 'Reacción de transesterificación y separación de fases' },
    'PU3 — Purificación': { tiempo: '2.0 — 3.5 horas', desc: 'Lavado, secado y control de calidad del producto final' },
  };

  // Tiempos estimados por cada variable/tag
  var TAG_TIMES = {
    'TK-001': { proceso: 'Almacenamiento inicial', tiempo: '1.0 — 2.0 h', tipo: 'Retención' },
    'TK-002': { proceso: 'Aceite caracterizado', tiempo: '0.5 — 1.5 h', tipo: 'Amortiguamiento' },
    'TK-003': { proceso: 'Tanque intermedio', tiempo: '0.5 — 1.0 h', tipo: 'Amortiguamiento' },
    'TK-004': { proceso: 'Producto terminado', tiempo: '2.0 — 4.0 h', tipo: 'Retención' },
    'FIL-001': { proceso: 'Filtración de aceite', tiempo: '0.5 — 1.0 h', tipo: 'Batch' },
    'P-001': { proceso: 'Bombeo de materia prima', tiempo: '0.3 — 0.8 h', tipo: 'Continuo' },
    'E-003': { proceso: 'Reactor alcoxido', tiempo: '1.0 — 2.0 h', tipo: 'Batch' },
    'E.W-003': { proceso: 'Pesaje de reactivos', tiempo: '0.2 — 0.5 h', tipo: 'Discreto' },
    'CLP-001': { proceso: 'Panel de control', tiempo: 'Tiempo real', tipo: 'Monitoreo' },
    'SALACE-001': { proceso: 'Salida aceite caracterizado', tiempo: '0.5 — 1.0 h', tipo: 'Continuo' },
    'ALCO-001': { proceso: 'Preparación alcoxido', tiempo: '1.0 — 2.0 h', tipo: 'Batch' },
    'EST-001': { proceso: 'Esterificación', tiempo: '2.0 — 4.0 h', tipo: 'Batch' },
    'GLI-001': { proceso: 'Separación de glicerol', tiempo: '1.0 — 2.0 h', tipo: 'Sedimentación' },
    'PRO_DES-001': { proceso: 'Producto destino PU2', tiempo: '0.3 — 0.5 h', tipo: 'Transferencia' },
    'SEP-001': { proceso: 'Separador de fases', tiempo: '1.0 — 2.0 h', tipo: 'Continuo' },
    'SIS_BOM-001': { proceso: 'Sistema de bombas', tiempo: 'Tiempo real', tipo: 'Continuo' },
    'SIS_TRAN-001': { proceso: 'Transporte entre etapas', tiempo: '0.2 — 0.4 h', tipo: 'Transferencia' },
    'TRAN-001': { proceso: 'Transporte de producto', tiempo: '0.3 — 0.6 h', tipo: 'Transferencia' },
    'PRO_DES-003': { proceso: 'Producto destino PU3', tiempo: '0.3 — 0.5 h', tipo: 'Transferencia' },
    'PRO_FIN-001': { proceso: 'Producto final', tiempo: '0.5 — 1.0 h', tipo: 'Inspección' },
    'SEC-001': { proceso: 'Secado de éster', tiempo: '1.0 — 2.0 h', tipo: 'Térmico' },
    'SEC_COND-001': { proceso: 'Condensación de vapores', tiempo: '1.0 — 2.0 h', tipo: 'Térmico' },
    'SIS_CIRC-001': { proceso: 'Recirculación', tiempo: 'Tiempo real', tipo: 'Continuo' },
    'VIS-001': { proceso: 'Medición de viscosidad', tiempo: '0.1 — 0.3 h', tipo: 'Análisis' },
  };

  // ─── Iniciar buffer de datos ──────────────────────────────
  function start() {
    if (_intervalId) return;
    _pushSnapshot();
    _intervalId = setInterval(_pushSnapshot, 2000);
  }

  function _pushSnapshot() {
    if (!window.processVars) return;
    var snap = {};
    for (var id in window.processVars) {
      if (window.processVars.hasOwnProperty(id)) {
        var v = window.processVars[id];
        snap[id] = { val: v.val, unit: v.unit, name: v.name, time: v.time };
      }
    }
    snap._ts = Date.now();
    _buffer.push(snap);
    if (_buffer.length > _maxBuffer) _buffer.shift();
  }

  // ─── Capturar instantánea actual ──────────────────────────
  function captureSnapshot() {
    var vars = {};
    var alive = 0;
    for (var id in window.processVars) {
      if (window.processVars.hasOwnProperty(id)) {
        vars[id] = JSON.parse(JSON.stringify(window.processVars[id]));
        if (vars[id].val !== 0 && vars[id].val != null) alive++;
      }
    }

    // Alarmas activas
    var alarmas = [];
    if (window.alarmData && window.alarmData.length) {
      alarmas = JSON.parse(JSON.stringify(window.alarmData));
    }

    // Propiedades de tags
    var props = window.TAG_PROPERTIES_DB || {};
    var eng = window.ENGINEERING_PROPS || {};

    // Datos de balance si existen
    var balance = null;
    if (window.BalanceManager && typeof window.BalanceManager.getPUData === 'function') {
      try { balance = window.BalanceManager.getPUData(); } catch (e) {}
    }

    return {
      vars: vars,
      alarmas: alarmas,
      props: props,
      eng: eng,
      balance: balance,
      aliveVars: alive,
      totalVars: Object.keys(vars).length,
      timestamp: new Date(),
      reportId: 'RPT-' + _formatDate(new Date()) + '-' + String(Math.floor(Math.random() * 9000 + 1000)),
    };
  }

  // ─── Calcular eficiencia global estimada ───────────────────
  function calcEfficiency(snap) {
    var v = snap.vars;
    var score = 70;

    // Temperatura esterificador (ideal 60-70°C)
    if (v['EST-001'] && v['EST-001'].val > 0) {
      var t = v['EST-001'].val;
      if (t >= 55 && t <= 70) score += 15;
      else if ((t >= 50 && t < 55) || (t > 70 && t <= 75)) score += 5;
      else score -= 10;
    }

    // Presión filtro (ideal < 2 bar)
    if (v['FIL-001'] && v['FIL-001'].val > 0) {
      var p = v['FIL-001'].val;
      if (p < 2) score += 5;
      else if (p < 3.5) score += 2;
      else score -= 5;
    }

    // Viscosidad producto final (ideal 3.5-5 cSt)
    if (v['VIS-001'] && v['VIS-001'].val > 0) {
      var vis = v['VIS-001'].val;
      if (vis >= 3.5 && vis <= 5) score += 5;
      else score -= 5;
    }

    // Niveles de tanques (ideal 30-80%)
    var tankIds = ['TK-001', 'TK-002', 'TK-003', 'TK-004'];
    var tankOk = 0;
    tankIds.forEach(function (id) {
      if (v[id] && v[id].pct != null) {
        var pct = v[id].pct;
        if (pct >= 20 && pct <= 90) tankOk++;
      }
    });
    score += tankOk * 2;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  // ─── Determinar estado general ────────────────────────────
  function overallStatus(snap) {
    var eff = calcEfficiency(snap);
    var alarmCount = snap.alarmas.length;
    if (alarmCount > 5 || eff < 40) return { label: 'Crítico', color: '#ef4444', icon: '🔴' };
    if (alarmCount > 2 || eff < 65) return { label: 'Advertencia', color: '#f59e0b', icon: '🟡' };
    return { label: 'Óptimo', color: '#22c55e', icon: '🟢' };
  }

  // ─── Generar recomendaciones ──────────────────────────────
  function generateRecommendations(snap) {
    var recs = [];
    var v = snap.vars;

    if (v['EST-001']) {
      var t = v['EST-001'].val;
      if (t > 70) recs.push({ severity: 'alta', text: 'Temperatura del esterificador (' + t.toFixed(1) + '°C) supera el límite óptimo. Reducir calentamiento o verificar sistema de enfriamiento.' });
      else if (t < 50) recs.push({ severity: 'media', text: 'Temperatura del esterificador (' + t.toFixed(1) + '°C) por debajo del rango. Aumentar suministro térmico para mantener cinética de reacción.' });
      else recs.push({ severity: 'buena', text: 'Temperatura del esterificador en rango óptimo (' + t.toFixed(1) + '°C). Continuar monitoreo.' });
    }

    if (v['FIL-001']) {
      var p = v['FIL-001'].val;
      if (p > 3) recs.push({ severity: 'alta', text: 'Presión de filtro elevada (' + p.toFixed(2) + ' bar). Posible obstrucción del medio filtrante. Programar mantenimiento.' });
      else if (p > 2) recs.push({ severity: 'media', text: 'Presión de filtro (' + p.toFixed(2) + ' bar) en aumento. Monitorear tendencia.' });
    }

    if (v['VIS-001']) {
      var vis = v['VIS-001'].val;
      if (vis > 6) recs.push({ severity: 'alta', text: 'Viscosidad del producto (' + vis.toFixed(1) + ' cSt) fuera de especificación. Verificar eficiencia de purificación.' });
      else if (vis < 2.5) recs.push({ severity: 'media', text: 'Viscosidad baja (' + vis.toFixed(1) + ' cSt). Posible contaminación con metanol residual.' });
      else recs.push({ severity: 'buena', text: 'Viscosidad dentro de norma ASTM D6751 (' + vis.toFixed(1) + ' cSt).' });
    }

    [['TK-001', 'Tanque de materia prima'], ['TK-002', 'Tanque de aceite caracterizado'], ['TK-003', 'Tanque intermedio'], ['TK-004', 'Tanque de producto']].forEach(function (pair) {
      var id = pair[0];
      var label = pair[1];
      if (v[id] && v[id].pct != null) {
        var pct = v[id].pct;
        if (pct < 15) recs.push({ severity: 'alta', text: label + ' al ' + pct.toFixed(0) + '% de capacidad. Programar reposición urgente.' });
        else if (pct < 30) recs.push({ severity: 'media', text: label + ' al ' + pct.toFixed(0) + '%. Preparar reaprovisionamiento.' });
        else if (pct > 90) recs.push({ severity: 'media', text: label + ' al ' + pct.toFixed(0) + '%. Evaluar desvío a tanque de respaldo.' });
      }
    });

    if (snap.alarmas.length > 0) {
      recs.push({ severity: 'alta', text: 'Existen ' + snap.alarmas.length + ' alarma(s) activa(s). Revisar la sección de alarmas para acciones correctivas inmediatas.' });
    }

    return recs;
  }

  // ─── Construir HTML del reporte ───────────────────────────
  function buildReportHTML(snap) {
    var eff = calcEfficiency(snap);
    var status = overallStatus(snap);
    var recs = generateRecommendations(snap);
    var dateStr = _formatDateTime(snap.timestamp);
    var totalVars = snap.totalVars;
    var aliveVars = snap.aliveVars;

    // Sección de tiempos por proceso
    var timesHTML = '<div class="r-section"><h2 class="r-section-title">⏱ Tiempos de Proceso</h2>' +
      '<table class="r-table"><thead><tr><th>Unidad</th><th>Tiempo Estimado</th><th>Descripción</th></tr></thead><tbody>';
    for (var puName2 in PU_TIMES) {
      if (PU_TIMES.hasOwnProperty(puName2)) {
        var pt = PU_TIMES[puName2];
        timesHTML += '<tr><td class="r-tag">' + puName2 + '</td><td class="r-val">' + pt.tiempo + '</td><td>' + pt.desc + '</td></tr>';
      }
    }
    timesHTML += '</tbody></table></div>';

    // Variables por unidad de proceso
    var puHTML = '';
    for (var puName in PU_TAGS) {
      if (PU_TAGS.hasOwnProperty(puName)) {
        var tags = PU_TAGS[puName];
        var pt2 = PU_TIMES[puName];
        if (pt2) {
          puHTML += '<div class="r-pu-header"><span class="r-pu-badge">⏱ ' + pt2.tiempo + '</span></div>';
        }
        var rows = '';
        tags.forEach(function (tagId) {
          var v = snap.vars[tagId];
          var prop = snap.props[tagId];
          if (!v) return;
          var valDisplay = v.val != null && v.val !== 0 ? Number(v.val).toFixed(1) : '—';
          var unit = v.unit || (prop ? prop.unit : '') || '';
          var label = prop ? prop.label : (v.name || tagId);
          var pct = v.pct != null ? v.pct : null;
          var engProp = snap.eng[tagId];
          var lawStr = engProp ? engProp.law.split('—')[0].trim() : '';
          var tagTime = TAG_TIMES[tagId];
          var timeStr = tagTime ? tagTime.tiempo : '—';
          var procStr = tagTime ? tagTime.proceso : '—';
          rows += '<tr>' +
            '<td class="r-tag">' + tagId + '</td>' +
            '<td class="r-label">' + label + '</td>' +
            '<td class="r-val">' + valDisplay + '</td>' +
            '<td class="r-unit">' + unit + '</td>' +
            (pct !== null ? '<td class="r-bar"><div class="r-bar-track"><div class="r-bar-fill" style="width:' + pct + '%"></div></div><span class="r-pct">' + pct.toFixed(0) + '%</span></td>' : '<td class="r-bar">—</td>') +
            '<td class="r-time">' + timeStr + '</td>' +
            '<td class="r-law">' + lawStr + '</td>' +
            '</tr>';
        });
        if (rows) {
          puHTML += '<div class="r-pu-block">' +
            '<h3 class="r-pu-title">' + puName + '</h3>' +
            '<table class="r-table">' +
            '<thead><tr><th>TAG</th><th>Variable</th><th>Valor</th><th>Unidad</th><th>Nivel</th><th>Tiempo</th><th>Ley</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table></div>';
        }
      }
    }

    // Tabla de alarmas
    var alarmHTML = '';
    if (snap.alarmas.length > 0) {
      var alarmRows = '';
      snap.alarmas.forEach(function (a) {
        var sev = a.severity || a.priority || 'media';
        var sevColor = sev === 'critical' || sev === 'crítica' ? '#ef4444' : sev === 'high' || sev === 'alta' ? '#f59e0b' : '#3b82f6';
        var sevLabel = sev.charAt(0).toUpperCase() + sev.slice(1);
        var tag = a.tag || a.varId || '—';
        var val = a.val != null ? Number(a.val).toFixed(1) : '—';
        var limit = a.limit || a.threshold || '—';
        var time = a.time || a.timestamp || '—';
        alarmRows += '<tr>' +
          '<td><span class="r-sev-dot" style="background:' + sevColor + '"></span>' + sevLabel + '</td>' +
          '<td class="r-tag">' + tag + '</td>' +
          '<td>' + val + '</td>' +
          '<td>' + limit + '</td>' +
          '<td class="r-time">' + time + '</td></tr>';
      });
      alarmHTML = '<div class="r-section"><h2 class="r-section-title">⚠ Resumen de Alarmas</h2>' +
        '<table class="r-table"><thead><tr><th>Severidad</th><th>TAG</th><th>Valor</th><th>Límite</th><th>Hora</th></tr></thead>' +
        '<tbody>' + alarmRows + '</tbody></table></div>';
    } else {
      alarmHTML = '<div class="r-section"><h2 class="r-section-title">⚠ Resumen de Alarmas</h2><p class="r-ok">No hay alarmas activas en este momento.</p></div>';
    }

    // KPIs
    var kpiHTML = '<div class="r-kpi-row">' +
      '<div class="r-kpi-card"><div class="r-kpi-label">Eficiencia Global</div><div class="r-kpi-num" style="color:' + (eff < 50 ? '#ef4444' : eff < 75 ? '#f59e0b' : '#22c55e') + '">' + eff + '%</div></div>' +
      '<div class="r-kpi-card"><div class="r-kpi-label">Estado General</div><div class="r-kpi-num" style="color:' + status.color + '">' + status.icon + ' ' + status.label + '</div></div>' +
      '<div class="r-kpi-card"><div class="r-kpi-label">Alarmas Activas</div><div class="r-kpi-num" style="color:' + (snap.alarmas.length > 0 ? '#ef4444' : '#22c55e') + '">' + snap.alarmas.length + '</div></div>' +
      '<div class="r-kpi-card"><div class="r-kpi-label">Variables en Línea</div><div class="r-kpi-num" style="color:#3b82f6">' + aliveVars + '/' + totalVars + '</div></div>' +
      '</div>';

    // Donut de eficiencia
    var donutAngle = (eff / 100) * 360;
    var donutColor = eff < 50 ? '#ef4444' : eff < 75 ? '#f59e0b' : '#22c55e';

    // Recomendaciones
    var recHTML = '<div class="r-section"><h2 class="r-section-title">📋 Recomendaciones</h2><div class="r-recs">';
    if (recs.length === 0) {
      recHTML += '<p class="r-ok">No hay recomendaciones pendientes.</p>';
    } else {
      recs.forEach(function (r) {
        var sevColor = r.severity === 'alta' ? '#ef4444' : r.severity === 'media' ? '#f59e0b' : '#22c55e';
        var icon = r.severity === 'alta' ? '🔴' : r.severity === 'media' ? '🟡' : '🟢';
        recHTML += '<div class="r-rec-item"><span class="r-rec-icon">' + icon + '</span><span>' + r.text + '</span></div>';
      });
    }
    recHTML += '</div></div>';

    // Balance de materia y energía (si hay datos)
    var balanceHTML = '';
    if (snap.balance) {
      balanceHTML = '<div class="r-section"><h2 class="r-section-title">⚖ Balance de Materia y Energía</h2><p class="r-text-muted">Datos de balance disponibles desde el módulo de balances.</p></div>';
    }

    // Gráficos (sparklines se dibujan con canvas después del render)
    var chartsHTML = '<div class="r-section"><h2 class="r-section-title">📈 Tendencias (último minuto)</h2>' +
      '<div class="r-chart-row">' +
      '<div class="r-chart-box"><div class="r-chart-label">Temperatura EST-001 (°C)</div><canvas class="r-sparkline" id="rSparkTemp" width="280" height="70"></canvas></div>' +
      '<div class="r-chart-box"><div class="r-chart-label">Presión FIL-001 (bar)</div><canvas class="r-sparkline" id="rSparkPres" width="280" height="70"></canvas></div>' +
      '<div class="r-chart-box"><div class="r-chart-label">Eficiencia Global</div><canvas class="r-sparkline" id="rSparkEff" width="280" height="70"></canvas></div>' +
      '</div></div>';

    return '<div class="r-paper">' +
      // Header
      '<div class="r-header">' +
      '<div class="r-header-left"><div class="r-logo">S</div><div class="r-plant">SPY SENA · Grupo 3</div></div>' +
      '<div class="r-header-right"><div class="r-doc-title">Reporte de Producción</div><div class="r-doc-sub">Éster Monoalquílico - Proceso de Esterificación</div></div>' +
      '</div>' +
      '<div class="r-meta"><span>ID: ' + snap.reportId + '</span><span>Fecha: ' + dateStr + '</span><span>Generado por: Grupo 3</span></div>' +
      '<div class="r-divider"></div>' +
      // Executive summary
      '<div class="r-section"><h2 class="r-section-title">📊 Resumen Ejecutivo</h2>' + kpiHTML + '</div>' +
      // Efficiency donut
      '<div class="r-section"><div class="r-donut-wrap"><canvas id="rDonutEff" width="120" height="120"></canvas><div class="r-donut-label">' + eff + '%</div></div></div>' +
      // Process times
      timesHTML +
      // Process units
      '<div class="r-section"><h2 class="r-section-title">🏭 Estado por Unidad de Proceso</h2>' + puHTML + '</div>' +
      // Charts
      chartsHTML +
      // Balance
      balanceHTML +
      // Alarms
      alarmHTML +
      // Recommendations
      recHTML +
      // Footer
      '<div class="r-footer">' +
      '<div class="r-footer-left">Confidencial — Solo para uso interno</div>' +
      '<div class="r-footer-right">Generado por Grupo 3 · Página <span class="r-page-num">1</span></div>' +
      '</div>' +
      '</div>';
  }

  // ─── Dibujar sparkline en canvas ──────────────────────────
  function drawSparkline(canvasId, data, color) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !data || data.length < 2) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var min = Infinity, max = -Infinity;
    data.forEach(function (v) {
      if (v < min) min = v;
      if (v > max) max = v;
    });
    var range = max - min || 1;
    var pad = 4;
    var drawW = w - pad * 2;
    var drawH = h - pad * 2;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i < 4; i++) {
      var y = pad + (drawH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = color || '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    data.forEach(function (v, i) {
      var x = pad + (i / (data.length - 1)) * drawW;
      var y = pad + drawH - ((v - min) / range) * drawH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area
    var lastIdx = data.length - 1;
    ctx.lineTo(pad + drawW, pad + drawH);
    ctx.lineTo(pad, pad + drawH);
    ctx.closePath();
    ctx.fillStyle = (color || '#3b82f6') + '18';
    ctx.fill();

    // End dot
    var lastX = pad + drawW;
    var lastY = pad + drawH - ((data[data.length - 1] - min) / range) * drawH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color || '#3b82f6';
    ctx.fill();
  }

  // ─── Dibujar donut chart ──────────────────────────────────
  function drawDonut(canvasId, pct, color) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    var cx = w / 2, cy = h / 2;
    var outerR = Math.min(cx, cy) - 4;
    var innerR = outerR * 0.65;

    ctx.clearRect(0, 0, w, h);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();

    // Value arc
    var startAngle = -Math.PI / 2;
    var endAngle = startAngle + (pct / 100) * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color || '#22c55e';
    ctx.fill();

    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // ─── Dibujar todos los gráficos ────────────────────────────
  function renderCharts(snap) {
    // Extraer datos del buffer para sparklines
    var tempData = [];
    var presData = [];
    var effData = [];

    _buffer.forEach(function (snapItem) {
      if (snapItem['EST-001']) tempData.push(snapItem['EST-001'].val);
      if (snapItem['FIL-001']) presData.push(snapItem['FIL-001'].val);
      if (snapItem['EST-001'] && snapItem['VIS-001']) {
        // Simulate efficiency from historical data
        var e = 65;
        var t = snapItem['EST-001'].val;
        if (t >= 55 && t <= 70) e += 15;
        else if ((t >= 50 && t < 55) || (t > 70 && t <= 75)) e += 5;
        else e -= 10;
        e = Math.min(100, Math.max(30, e));
        effData.push(e);
      }
    });

    if (tempData.length > 1) drawSparkline('rSparkTemp', tempData, '#ef4444');
    if (presData.length > 1) drawSparkline('rSparkPres', presData, '#f59e0b');
    if (effData.length > 1) drawSparkline('rSparkEff', effData, '#22c55e');
  }

  // ─── Mostrar modal ────────────────────────────────────────
  function showModal(html) {
    // Remover modal existente si hay
    var existing = document.getElementById('reporteModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'reporteModal';
    modal.className = 'reporte-modal';
    modal.innerHTML =
      '<div class="reporte-modal-backdrop"></div>' +
      '<div class="reporte-modal-container">' +
      '<div class="reporte-modal-header">' +
      '<h2 class="reporte-modal-title">📄 Reporte de Producción</h2>' +
      '<div class="reporte-modal-actions">' +
      '<button class="reporte-btn reporte-btn-pdf" onclick="ReporteManager.descargarPDF()"><i data-feather="file-text"></i> Descargar PDF</button>' +
      '<button class="reporte-btn reporte-btn-print" onclick="ReporteManager.imprimir()"><i data-feather="printer"></i> Imprimir</button>' +
      '<button class="reporte-btn reporte-btn-close" onclick="ReporteManager.cerrar()">✕</button>' +
      '</div></div>' +
      '<div class="reporte-modal-body">' + html + '</div>' +
      '</div>';

    document.body.appendChild(modal);

    // Force reflow then show
    modal.offsetHeight;
    modal.classList.add('open');

    // Reemplazar iconos Feather si está disponible
    if (typeof feather !== 'undefined') feather.replace();

    // Dibujar gráficos después de que el DOM esté listo
    var snap = captureSnapshot();
    setTimeout(function () {
      renderCharts(snap);
      // Calcular eficiencia para donut
      var eff = calcEfficiency(snap);
      var donutColor = eff < 50 ? '#ef4444' : eff < 75 ? '#f59e0b' : '#22c55e';
      drawDonut('rDonutEff', eff, donutColor);
    }, 100);
  }

  // ─── Generar reporte completo ─────────────────────────────
  function generar() {
    var snap = captureSnapshot();
    var html = buildReportHTML(snap);
    showModal(html);
    if (typeof window.showNotif === 'function') {
      window.showNotif('Reporte generado exitosamente', 'success');
    }
  }

  // ─── Descargar PDF ────────────────────────────────────────
  function descargarPDF() {
    var paper = document.querySelector('.r-paper');
    if (!paper) {
      if (typeof window.showNotif === 'function') {
        window.showNotif('Error: No se encontró el contenido del reporte', 'danger');
      }
      return;
    }

    // Mostrar estado
    var btn = document.querySelector('.reporte-btn-pdf');
    if (btn) {
      btn.innerHTML = '⏳ Generando PDF...';
      btn.disabled = true;
    }

    var dateStr = _formatDate(new Date());
    var opt = {
      margin: [8, 8, 8, 8],
      filename: 'reporte-produccion-' + dateStr + '.pdf',
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        width: paper.scrollWidth,
        height: paper.scrollHeight,
        windowWidth: paper.scrollWidth,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(paper).save().then(function () {
        if (btn) {
          btn.innerHTML = '<i data-feather="file-text"></i> Descargar PDF';
          btn.disabled = false;
          if (typeof feather !== 'undefined') feather.replace();
        }
        if (typeof window.showNotif === 'function') {
          window.showNotif('PDF descargado correctamente', 'success');
        }
      }).catch(function (err) {
        console.error('PDF error:', err);
        if (btn) {
          btn.innerHTML = '<i data-feather="file-text"></i> Descargar PDF';
          btn.disabled = false;
          if (typeof feather !== 'undefined') feather.replace();
        }
        if (typeof window.showNotif === 'function') {
          window.showNotif('Error al generar PDF: ' + err.message, 'danger');
        }
      });
    } else {
      if (typeof window.showNotif === 'function') {
        window.showNotif('La librería html2pdf no está cargada. Usa npm run dev o incluye el CDN.', 'danger');
      }
      if (btn) {
        btn.innerHTML = '<i data-feather="file-text"></i> Descargar PDF';
        btn.disabled = false;
      }
    }
  }

  // ─── Imprimir ─────────────────────────────────────────────
  function imprimir() {
    window.print();
  }

  // ─── Cerrar modal ─────────────────────────────────────────
  function cerrar() {
    var modal = document.getElementById('reporteModal');
    if (modal) {
      modal.classList.remove('open');
      setTimeout(function () { modal.remove(); }, 300);
    }
  }

  // ─── Utilidades ───────────────────────────────────────────
  function _formatDate(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function _formatDateTime(d) {
    var date = _formatDate(d);
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    var s = String(d.getSeconds()).padStart(2, '0');
    return date + ' ' + h + ':' + m + ':' + s;
  }

  // ─── API pública ──────────────────────────────────────────
  return {
    start: start,
    generar: generar,
    descargarPDF: descargarPDF,
    imprimir: imprimir,
    cerrar: cerrar,
    captureSnapshot: captureSnapshot,
    calcEfficiency: calcEfficiency,
  };
})();

window.ReporteManager = ReporteManager;

// Iniciar automáticamente cuando el DOM esté listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  ReporteManager.start();
} else {
  document.addEventListener('DOMContentLoaded', function () {
    ReporteManager.start();
  });
}
