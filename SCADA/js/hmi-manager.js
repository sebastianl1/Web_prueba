(function () {
  if (window._hmiInitialized) return;
  window._hmiInitialized = true;

  var _canvas = null;
  var _currentView = 'pu1';
  var _selectedTag = null;

  var PU_INFO = {
    pu1: { label: 'Caracterización de Materia Prima', icon: '\uD83D\uDEE5\uFE0F', short: 'PU1' },
    pu2: { label: 'Esterificación y Transesterificación', icon: '\u2697\uFE0F', short: 'PU2' },
    pu3: { label: 'Purificación y Producto Final', icon: '\uD83D\uDEE0\uFE0F', short: 'PU3' },
  };

  var SHAPE_ICONS = {
    tank: '\uD83D\uDEE5\uFE0F', pump: '\uD83D\uDD04', reactor: '\u2697\uFE0F',
    filter: '\uD83D\uDD0D', column: '\uD83C\uDFF3\uFE0F', separator: '\uD83D\uDEEB\uFE0F',
    gauge: '\uD83D\uDD2C', panel: '\uD83D\uDCF1', system: '\u2699\uFE0F',
    hex: '\uD83D\uDD25', valve: '\uD83D\uDD07', waste: '\uD83D\uDDD1\uFE0F',
    product: '\uD83D\uDCE6', default: '\u2753',
  };

  function getContainer() { return document.getElementById('hmiContainer'); }
  window.listHMISVGs = async function () { return ['Process Diagram']; };

  // ─── HELPERS ──────────────────────────────────────────────────────
  function _isQ(v) { return v != null && v !== '--' && v !== '' && /^[\d<>\-–.\s]+$/.test(String(v).trim()); }

  function _getDisplayValue(varId) {
    var st = window.HMIStore && window.HMIStore.get(varId);
    if (st && st.value != null) return { value: st.value, unit: st.unit || '', source: 'manual' };
    var db = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[varId];
    if (!db) return { value: '--', unit: '', source: 'none' };
    for (var ci = 0; ci < 3; ci++) {
      var cat = ['physical', 'chemical', 'process'][ci], arr = db[cat];
      if (!arr) continue;
      for (var pi = 0; pi < arr.length; pi++) { if (_isQ(arr[pi].value)) return { value: arr[pi].value, unit: arr[pi].unit || db.unit || '', source: cat }; }
    }
    var fb = db.physical && db.physical[0];
    return { value: fb ? fb.value : '--', unit: fb ? (fb.unit || db.unit || '') : (db.unit || ''), source: 'fallback' };
  }

  function _getStatus(varId) {
    if (window.HMIStore && window.HMIStore.get(varId)) return 'manual';
    var p = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[varId];
    if (!p || !p.alarms) return 'normal';
    var v = parseFloat(p.physical && p.physical[0] && p.physical[0].value);
    if (isNaN(v)) return 'normal';
    var a = p.alarms;
    if ((a.crit_max != null && v >= a.crit_max) || (a.crit_min != null && v <= a.crit_min)) return 'critical';
    if ((a.max != null && v >= a.max) || (a.min != null && v <= a.min)) return 'warning';
    return 'normal';
  }

  function _getShape(tagId) {
    var EXACT = { TK_ACEITE:'tank',FILTRADO:'filter',BOMBEO:'pump',CONTROL_1:'panel',TK_ACE_FILTRADO:'tank',INT_CALOR:'hex',SIS_CIRCULACION:'system',SAL_ALCOXIDO:'valve',SAL_ACEITE:'valve' };
    if (EXACT[tagId]) return EXACT[tagId];
    var PREFIX = { 'E.W':'hex','SEC_COND':'column','SALACE':'valve','PRO_DES':'waste','PRO_FIN':'product','SIS_CIRC':'system','SIS_BOM':'system','SIS_TRAN':'system','SIS':'system','TK':'tank','FIL':'filter','P':'pump','CLP':'panel','E':'reactor','SEP':'separator','VIS':'gauge','SEC':'column','ALCO':'valve','GLI':'tank','TRAN':'reactor','EST':'reactor' };
    var pkeys = Object.keys(PREFIX).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < pkeys.length; i++) if (tagId.startsWith(pkeys[i])) return PREFIX[pkeys[i]];
    return 'default';
  }

  // ─── SUB-VARIABLE OVERRIDE STORE ──────────────────────────────
  var _subVarOverrides = {};
  var _originalValues = {};
  var _revertTimers = {};
  var REVERT_DELAY = 60000; // 60 seconds — values auto-revert after this

  function _loadSubVarOverrides() {
    try { var raw = localStorage.getItem('scada_hmi_subvars'); if (raw) _subVarOverrides = JSON.parse(raw); } catch (e) {}
  }

  function _saveSubVarOverrides() {
    try { localStorage.setItem('scada_hmi_subvars', JSON.stringify(_subVarOverrides)); } catch (e) {}
  }

  function _getSubVar(tagId, cat, key) {
    var k = tagId + '|' + cat + '|' + key;
    return _subVarOverrides[k] !== undefined ? _subVarOverrides[k] : null;
  }

  function _setSubVar(tagId, cat, key, value) {
    var k = tagId + '|' + cat + '|' + key;

    // Save original value first time only
    if (!(k in _originalValues)) {
      var p = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[tagId];
      if (p && p[cat]) {
        for (var i = 0; i < p[cat].length; i++) {
          if (p[cat][i].key === key) { _originalValues[k] = p[cat][i].value; break; }
        }
      }
    }

    _subVarOverrides[k] = String(value);
    _saveSubVarOverrides();

    // Update TAG_PROPERTIES_DB in memory immediately
    var p2 = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[tagId];
    if (p2 && p2[cat]) {
      for (var j = 0; j < p2[cat].length; j++) {
        if (p2[cat][j].key === key) { p2[cat][j].value = String(value); break; }
      }
    }

    // Update HMIStore so alarm system picks up the change
    if (cat === 'physical' && key === (p2 && p2.physical && p2.physical[0] && p2.physical[0].key)) {
      if (window.HMIStore) {
        window.HMIStore.set(tagId, value, (p2 && p2.physical && p2.physical[0] && p2.physical[0].unit) || '');
      }
    }

    // Schedule auto-revert for this tag (resets existing timer)
    _scheduleRevert(tagId);
  }

  function _scheduleRevert(tagId) {
    if (_revertTimers[tagId]) clearTimeout(_revertTimers[tagId]);
    _revertTimers[tagId] = setTimeout(function () {
      _revertTag(tagId);
    }, REVERT_DELAY);
  }

  function _revertTag(tagId) {
    delete _revertTimers[tagId];

    // Remove all overrides for this tag
    var keysToRemove = [];
    for (var k in _subVarOverrides) {
      if (k.startsWith(tagId + '|')) keysToRemove.push(k);
    }
    var self = this;
    keysToRemove.forEach(function (k) { delete _subVarOverrides[k]; });
    _saveSubVarOverrides();

    // Restore original values in TAG_PROPERTIES_DB
    var db = window.TAG_PROPERTIES_DB;
    if (db && db[tagId]) {
      for (var ok in _originalValues) {
        if (ok.startsWith(tagId + '|')) {
          var parts = ok.split('|');
          var cat = parts[1], subKey = parts[2];
          var p = db[tagId];
          if (p && p[cat]) {
            for (var i = 0; i < p[cat].length; i++) {
              if (p[cat][i].key === subKey) {
                p[cat][i].value = _originalValues[ok];
                break;
              }
            }
          }
          delete _originalValues[ok];
        }
      }
    }

    // Clear HMIStore for this tag so alarm system sees original values
    if (window.HMIStore) window.HMIStore.clear(tagId);

    // Update UI
    _updateStatusBar();
    if (window.showNotif) window.showNotif(tagId + ' ha vuelto a valores normales', 'info');

    // Force alarm re-evaluation within 1s
    setTimeout(function () {
      if (window.AlarmManager && typeof window.AlarmManager.evaluateAlarms === 'function') {
        window.AlarmManager.evaluateAlarms();
      }
    }, 500);
  }

  function _clearAllSubVars() {
    // Clear all pending revert timers
    for (var tid in _revertTimers) { clearTimeout(_revertTimers[tid]); }
    _revertTimers = {};
    _subVarOverrides = {};
    _originalValues = {};
    try { localStorage.removeItem('scada_hmi_subvars'); } catch (e) {}
  }

  _loadSubVarOverrides();

  // ─── GET EQUIPMENT TAGS PER PU ──────────────────────────────────
  function _getEquipTags(view) {
    var map = {
      pu1: ['TK-001','FIL-001','P-001','TK-002','E.W-003','E-003','TK-003','TK-004','CLP-001','SALACE-001','ALCO-001'],
      pu2: ['EST-001','TRAN-001','SEP-001','GLI-001','PRO_DES-001','SIS_TRAN-001','SIS_BOM-001'],
      pu3: ['PRO_DES-003','PRO_FIN-001','SEC-001','SEC_COND-001','SIS_CIRC-001','VIS-001'],
    };
    return map[view] || [];
  }

  function _getEquipCount(view) {
    var db = window.TAG_PROPERTIES_DB || {};
    return _getEquipTags(view).filter(function (t) { return db[t]; }).length;
  }

  // ══════════════════════════════════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════════════════════════════════
  function _injectStyles() {
    if (document.getElementById('hmiVizStyle')) return;
    var s = document.createElement('style');
    s.id = 'hmiVizStyle';
    s.textContent = [
      /* ── WRAPPER ── */
      '#hmiVizWrapper{display:flex;flex-direction:column;flex:1;min-height:0;width:100%;background:var(--bg-deep,#0b1121);font-family:Inter,system-ui,sans-serif;color:var(--text-primary,#e2e8f0);overflow:hidden}',
      /* ── TOP BAR ── */
      '#hmiTopBar{display:flex;align-items:center;gap:12px;padding:8px 16px;background:rgba(22,27,34,0.85);border-bottom:1px solid rgba(48,54,61,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:10;min-height:44px}',
      '#hmiTopBar .hmi-bread{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted,#94a3b8)}',
      '#hmiTopBar .hmi-bread .sep{color:rgba(148,163,184,0.3)}',
      '#hmiTopBar .hmi-bread .cur{color:var(--accent-cyan,#22d3ee);font-weight:600}',
      '#hmiTopBar .hmi-status{display:flex;align-items:center;gap:5px;margin-left:auto;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px}',
      '#hmiTopBar .hmi-status .dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,0.5);animation:pulse-dot 2s infinite}',
      '@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}',
      '#hmiTopBar .hmi-zoom-group{display:flex;align-items:center;gap:3px;margin-left:12px}',
      '#hmiTopBar .hmi-zoom-btn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(48,54,61,0.3);border:1px solid rgba(48,54,61,0.5);border-radius:5px;color:var(--text-secondary);font-size:13px;cursor:pointer;transition:all 0.15s;user-select:none}',
      '#hmiTopBar .hmi-zoom-btn:hover{background:rgba(48,54,61,0.6);color:var(--accent-cyan);border-color:rgba(34,211,238,0.3)}',
      '#hmiTopBar .hmi-zoom-pct{font-size:11px;color:var(--text-muted);min-width:36px;text-align:center;font-family:JetBrains Mono,monospace}',
      '#hmiTopBar .hmi-count-badge{font-size:10px;color:var(--text-muted);background:rgba(48,54,61,0.3);padding:2px 10px;border-radius:10px;white-space:nowrap}',
      '#hmiTopBar .hmi-menu-btn{background:none;border:none;color:var(--text-secondary);font-size:16px;cursor:pointer;padding:4px;display:none}',
      /* ── BODY ── */
      '#hmiBody{display:flex;flex:1;min-height:0;position:relative;overflow:hidden}',
      /* ── SIDEBAR ── */
      '#hmiSidebar{width:160px;min-width:160px;display:flex;flex-direction:column;background:rgba(15,23,42,0.5);border-right:1px solid rgba(48,54,61,0.3);padding:8px 0;overflow-y:auto;z-index:5}',
      '#hmiSidebar .hmi-nav-label{font-size:9px;text-transform:uppercase;letter-spacing:0.8px;color:var(--text-muted);padding:6px 14px 4px}',
      '#hmiSidebar .hmi-nav-btn{display:flex;align-items:center;gap:8px;padding:8px 14px;margin:1px 6px;border-radius:6px;font-size:11px;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all 0.12s;border:none;background:transparent;text-align:left;width:calc(100% - 12px)}',
      '#hmiSidebar .hmi-nav-btn:hover{background:rgba(34,211,238,0.08);color:var(--text-primary)}',
      '#hmiSidebar .hmi-nav-btn.active{background:rgba(34,211,238,0.12);color:var(--accent-cyan);border-left:2px solid var(--accent-cyan)}',
      '#hmiSidebar .hmi-nav-btn .badge{font-size:9px;color:var(--text-muted);margin-left:auto;background:rgba(48,54,61,0.3);padding:1px 6px;border-radius:8px}',
      '#hmiSidebar .hmi-divider{height:1px;background:rgba(48,54,61,0.3);margin:8px 14px}',
      '#hmiSidebar .hmi-legend{display:flex;flex-direction:column;gap:2px;padding:0 14px}',
      '#hmiSidebar .hmi-legend-item{display:flex;align-items:center;gap:6px;font-size:9px;color:var(--text-muted);padding:3px 6px;border-radius:4px;cursor:pointer;transition:all 0.12s}',
      '#hmiSidebar .hmi-legend-item:hover{background:rgba(34,211,238,0.08);color:var(--text-primary)}',
      '#hmiSidebar .hmi-legend-item.active{background:rgba(34,211,238,0.15);color:var(--accent-cyan)}',
      '#hmiSidebar .hmi-legend-item .swatch{width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:10px;border-radius:3px;background:rgba(48,54,61,0.2)}',
      /* ── CANVAS WRAP ── */
      '#hmiCanvasWrap{flex:1;min-height:0;position:relative;overflow:hidden;background:var(--bg-deep,#0b1121)}',
      '#hmiCanvasWrap canvas{cursor:grab}',
      '#hmiCanvasWrap canvas:active{cursor:grabbing}',
      /* ── RIGHT PANEL ── */
      '#hmiPanel{width:360px;min-width:360px;display:none;flex-direction:column;background:rgba(15,23,42,0.85);border-left:1px solid rgba(48,54,61,0.3);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:5;overflow-y:auto;animation:slideIn 0.2s ease}',
      '#hmiPanel.open{display:flex}',
      '@keyframes slideIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}',
      '#hmiPanel .hmi-phead{display:flex;align-items:center;gap:8px;padding:12px 14px 8px;border-bottom:1px solid rgba(48,54,61,0.3)}',
      '#hmiPanel .hmi-phead .tag{font-size:13px;font-weight:700;color:var(--text-primary);font-family:JetBrains Mono,monospace}',
      '#hmiPanel .hmi-phead .plabel{font-size:10px;color:var(--text-muted);flex:1}',
      '#hmiPanel .hmi-phead .pclose{background:none;border:none;color:var(--text-muted);font-size:16px;cursor:pointer;padding:2px 4px}',
      '#hmiPanel .hmi-phead .pclose:hover{color:var(--text-primary)}',
      '#hmiPanel .hmi-pbody{padding:10px 14px;flex:1}',
      '#hmiPanel .hmi-pbody .hmi-pval{font-size:28px;font-weight:700;color:var(--accent-cyan);font-family:JetBrains Mono,monospace;line-height:1.2}',
      '#hmiPanel .hmi-pbody .hmi-punit{font-size:12px;color:var(--text-muted);margin-left:4px}',
      '#hmiPanel .hmi-pbody .hmi-pstatus{display:inline-flex;align-items:center;gap:4px;font-size:9px;text-transform:uppercase;letter-spacing:0.3px;padding:2px 8px;border-radius:3px;margin-top:4px}',
      '#hmiPanel .hmi-pbody .hmi-pstatus.normal{color:#64748b;background:rgba(100,116,139,0.15)}',
      '#hmiPanel .hmi-pbody .hmi-pstatus.manual{color:#22c55e;background:rgba(34,197,94,0.15)}',
      '#hmiPanel .hmi-pbody .hmi-pstatus.warning{color:#f59e0b;background:rgba(245,158,11,0.15)}',
      '#hmiPanel .hmi-pbody .hmi-pstatus.critical{color:#ef4444;background:rgba(239,68,68,0.15)}',
      '#hmiPanel .hmi-pbody .hmi-pcat{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--accent-cyan);margin:10px 0 4px}',
      '#hmiPanel .hmi-pbody .hmi-prow{display:flex;justify-content:space-between;padding:3px 0;font-size:11px;border-bottom:1px solid rgba(48,54,61,0.15)}',
      '#hmiPanel .hmi-pbody .hmi-prow .l{color:var(--text-muted)}',
      '#hmiPanel .hmi-pbody .hmi-prow .r{color:var(--text-primary);font-family:JetBrains Mono,monospace}',
      '#hmiPanel .hmi-pbody .hmi-pman{margin-top:10px;padding-top:8px;border-top:1px solid rgba(48,54,61,0.3)}',
      '#hmiPanel .hmi-pbody .hmi-pman label{font-size:9px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted)}',
      '#hmiPanel .hmi-pbody .hmi-pman .row{display:flex;align-items:center;gap:6px;margin-top:4px}',
      '#hmiPanel .hmi-pbody .hmi-pman input{flex:1;background:rgba(15,23,42,0.6);border:1px solid rgba(48,54,61,0.5);border-radius:4px;padding:6px 8px;color:var(--text-primary);font-family:JetBrains Mono,monospace;font-size:13px}',
      '#hmiPanel .hmi-pbody .hmi-pman input:focus{border-color:var(--accent-cyan);outline:none}',
      '#hmiPanel .hmi-pbody .hmi-pman .unit{font-size:11px;color:var(--text-muted);min-width:24px}',
      '#hmiPanel .hmi-pbody .hmi-pman button{padding:5px 14px;background:var(--accent-cyan);border:none;border-radius:4px;color:#0b1121;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.12s}',
      '#hmiPanel .hmi-pbody .hmi-pman button:hover{opacity:0.85}',
      '#hmiPanel .hmi-pbody .hmi-pempty{color:var(--text-muted);font-size:11px;text-align:center;padding:30px 0}',
      '#hmiPanel .hmi-pbody .hmi-pempty .icon{font-size:32px;margin-bottom:8px}',
      /* ── STATUS BAR ── */
      '#hmiStatusBar{display:flex;align-items:center;gap:16px;padding:5px 16px;background:rgba(11,17,33,0.8);border-top:1px solid rgba(48,54,61,0.3);font-size:10px;color:var(--text-muted);min-height:28px}',
      '#hmiStatusBar .hmi-sb-item{display:flex;align-items:center;gap:4px}',
      '#hmiStatusBar .hmi-sb-item .sb-dot{width:5px;height:5px;border-radius:50%}',
      '#hmiStatusBar .hmi-sb-right{margin-left:auto;display:flex;align-items:center;gap:12px}',
      /* ── RESPONSIVE ── */
      '@media(max-width:992px){#hmiSidebar{width:44px;min-width:44px}#hmiSidebar .hmi-nav-label,#hmiSidebar .hmi-legend,#hmiSidebar .hmi-nav-btn .badge,#hmiSidebar .hmi-nav-btn span{display:none}#hmiPanel{position:absolute;right:0;top:0;bottom:0;z-index:20;box-shadow:-4px 0 20px rgba(0,0,0,0.4)}#hmiTopBar .hmi-menu-btn{display:block}}',
      '@media(max-width:768px){#hmiSidebar{display:none}#hmiPanel{width:100%;min-width:auto}}',
    ].join('');
    document.head.appendChild(s);
  }

  // ══════════════════════════════════════════════════════════════════
  //  BUILD VISUALIZER
  // ══════════════════════════════════════════════════════════════════
  function _buildVisualizer() {
    _injectStyles();

    var tab = document.getElementById('tab-hmi');
    if (!tab) return;
    tab.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden';

    var existing = document.getElementById('hmiVizWrapper');
    if (existing) existing.remove();

    // Hide old panels
    tab.querySelectorAll('.panel.fade-in, #hmiTabBar, #hmiInfoPanel, #hmiLiveBadge, .section-label')
      .forEach(function (el) { if (el) el.style.display = 'none'; });
    var uploadBtn = document.getElementById('hmiLocalUploadBtn');
    var catalogBtn = document.getElementById('hmiCatalogBtn');
    if (uploadBtn) uploadBtn.style.display = 'none';
    if (catalogBtn) catalogBtn.style.display = 'none';

    // Create wrapper (detached)
    var wrapper = document.createElement('div');
    wrapper.id = 'hmiVizWrapper';

    var pu = PU_INFO[_currentView];
    var puCount = _getEquipCount(_currentView);

    wrapper.innerHTML =
      /* ── TOP BAR ── */
      '<div id="hmiTopBar">' +
        '<button class="hmi-menu-btn" id="hmiMenuBtn">\u2630</button>' +
        '<div class="hmi-bread">' +
          '<span>\uD83C\uDFE0</span>' +
          '<span class="sep">/</span>' +
          '<span class="cur" id="hmiBreadcrumb">' + pu.icon + ' ' + pu.label + '</span>' +
        '</div>' +
        '<span class="hmi-count-badge">' + puCount + ' equipos</span>' +
        '<div class="hmi-status">' +
          '<span class="dot"></span><span>Online</span>' +
        '</div>' +
        '<div class="hmi-zoom-group">' +
          '<button class="hmi-zoom-btn" id="hmiZoomIn" title="Acercar">+</button>' +
          '<button class="hmi-zoom-btn" id="hmiZoomOut" title="Alejar">\u2212</button>' +
          '<button class="hmi-zoom-btn" id="hmiZoomReset" title="Restablecer">\u21BA</button>' +
          '<span class="hmi-zoom-pct" id="hmiZoomPct">55%</span>' +
        '</div>' +
      '</div>' +
      /* ── BODY ── */
      '<div id="hmiBody">' +
        /* ── SIDEBAR ── */
        '<div id="hmiSidebar">' +
          '<div class="hmi-nav-label">Procesos</div>' +
          Object.keys(PU_INFO).map(function (k) {
            var act = k === _currentView ? ' active' : '';
            var ic = PU_INFO[k].icon;
            var lb = PU_INFO[k].short + ' ' + PU_INFO[k].label;
            var cnt = _getEquipCount(k);
            return '<button class="hmi-nav-btn' + act + '" data-view="' + k + '"><span>' + ic + '</span><span>' + PU_INFO[k].short + '</span><span class="badge">' + cnt + '</span></button>';
          }).join('') +
          '<div class="hmi-divider"></div>' +
          '<div class="hmi-nav-label">Leyenda</div>' +
          '<div class="hmi-legend" id="hmiLegend">' +
            Object.keys(SHAPE_ICONS).map(function (k) {
              var label = { tank:'Tanque',pump:'Bomba',reactor:'Reactor',filter:'Filtro',column:'Columna',separator:'Separador',gauge:'Medidor',panel:'Panel',system:'Sistema',hex:'Intercambiador',valve:'V\u00E1lvula',waste:'Residuo',product:'Producto',default:'Otro' }[k] || k;
              return '<div class="hmi-legend-item" data-shape="' + k + '"><span class="swatch">' + SHAPE_ICONS[k] + '</span>' + label + '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
        /* ── CANVAS ── */
        '<div id="hmiCanvasWrap"></div>' +
        /* ── RIGHT PANEL ── */
        '<div id="hmiPanel">' +
          '<div class="hmi-pbody">' +
            '<div class="hmi-pempty">' +
              '<div class="icon">\uD83D\uDCCD</div>' +
              '<div>Selecciona un equipo<br>en el diagrama</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      /* ── STATUS BAR ── */
      '<div id="hmiStatusBar">' +
        '<span class="hmi-sb-item">\u2699 <span id="hmiSbCount">' + puCount + '</span> equipos</span>' +
        '<span class="hmi-sb-item" id="hmiSbManual" style="display:none">\uD83D\uDD90 <span id="hmiSbManualCount">0</span> manual</span>' +
        '<span class="hmi-sb-item" id="hmiSbAlert" style="display:none">\u26A0 <span id="hmiSbAlertCount">0</span> alertas</span>' +
        '<span class="hmi-sb-right hmi-sb-item"><span class="sb-dot" style="background:#22c55e"></span> Sistema activo</span>' +
      '</div>';

    // Insert into tab
    var mainPanel = tab.querySelector('.panel.fade-in');
    if (mainPanel) mainPanel.parentNode.insertBefore(wrapper, mainPanel.nextSibling);
    else tab.appendChild(wrapper);

    // Move #hmiContainer into canvas wrap
    var origContainer = document.getElementById('hmiContainer');
    var canvasWrap = document.getElementById('hmiCanvasWrap');
    if (origContainer && canvasWrap) {
      origContainer.style.cssText = 'width:100%;height:100%;padding:0;background:transparent;position:relative';
      origContainer.innerHTML = '';
      canvasWrap.appendChild(origContainer);
    } else if (!origContainer && canvasWrap) {
      var newCont = document.createElement('div');
      newCont.id = 'hmiContainer';
      newCont.style.cssText = 'width:100%;height:100%;padding:0;background:transparent;position:relative';
      canvasWrap.appendChild(newCont);
    }

    // Wire sidebar nav
    document.querySelectorAll('.hmi-nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var view = btn.getAttribute('data-view');
        if (view && view !== _currentView) _switchView(view);
      });
    });

    // Wire zoom buttons
    document.getElementById('hmiZoomIn').onclick = function () {
      if (_canvas) { _canvas.scale = Math.min(3.0, _canvas.scale * 1.25); _updateZoomPct(); }
    };
    document.getElementById('hmiZoomOut').onclick = function () {
      if (_canvas) { _canvas.scale = Math.max(0.15, _canvas.scale / 1.25); _updateZoomPct(); }
    };
    document.getElementById('hmiZoomReset').onclick = function () {
      if (_canvas) { _canvas.switchView(_currentView); _updateZoomPct(); }
    };

    // Mobile menu toggle
    var menuBtn = document.getElementById('hmiMenuBtn');
    var sidebar = document.getElementById('hmiSidebar');
    if (menuBtn && sidebar) {
      menuBtn.onclick = function () {
        var vis = sidebar.style.display;
        sidebar.style.display = vis === 'block' ? '' : 'block';
      };
    }

    // Wire legend filter
    document.querySelectorAll('.hmi-legend-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var shape = item.getAttribute('data-shape');
        if (!shape || !_canvas) return;
        if (_canvas._shapeFilter === shape) {
          _canvas.clearShapeFilter();
          item.classList.remove('active');
        } else {
          document.querySelectorAll('.hmi-legend-item').forEach(function (x) { x.classList.remove('active'); });
          _canvas.setShapeFilter(shape);
          item.classList.add('active');
        }
      });
    });

    // Ensure no scroll — force canvas resize
    setTimeout(function () {
      if (_canvas && _canvas._resize) _canvas._resize();
    }, 50);
  }

  // ══════════════════════════════════════════════════════════════════
  //  UPDATE FUNCTIONS
  // ══════════════════════════════════════════════════════════════════

  function _updateZoomPct() {
    var el = document.getElementById('hmiZoomPct');
    if (el && _canvas) el.textContent = Math.round(_canvas.scale * 100) + '%';
  }

  function _updateTopBar(view) {
    var bc = document.getElementById('hmiBreadcrumb');
    if (bc) {
      var pu = PU_INFO[view];
      bc.innerHTML = (pu ? pu.icon + ' ' + pu.label : view);
    }
    var cnt = document.getElementById('hmiSbCount');
    if (cnt) cnt.textContent = _getEquipCount(view);
    var badge = document.querySelector('.hmi-count-badge');
    if (badge) badge.textContent = _getEquipCount(view) + ' equipos';
  }

  function _updateSidebar(view) {
    document.querySelectorAll('.hmi-nav-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
  }

  function _updateStatusBar() {
    var db = window.TAG_PROPERTIES_DB || {};
    var tags = _getEquipTags(_currentView);
    var manualCount = 0, alertCount = 0;
    tags.forEach(function (t) {
      var s = _getStatus(t);
      if (s === 'manual') manualCount++;
      if (s === 'warning' || s === 'critical') alertCount++;
    });
    var manualEl = document.getElementById('hmiSbManual');
    var manualCnt = document.getElementById('hmiSbManualCount');
    if (manualEl && manualCnt) {
      manualCnt.textContent = manualCount;
      manualEl.style.display = manualCount > 0 ? 'inline-flex' : 'none';
    }
    var alertEl = document.getElementById('hmiSbAlert');
    var alertCnt = document.getElementById('hmiSbAlertCount');
    if (alertEl && alertCnt) {
      alertCnt.textContent = alertCount;
      alertEl.style.display = alertCount > 0 ? 'inline-flex' : 'none';
    }
  }

  function _clearLegendFilter() {
    if (_canvas && _canvas.clearShapeFilter) _canvas.clearShapeFilter();
    document.querySelectorAll('.hmi-legend-item').forEach(function (x) { x.classList.remove('active'); });
  }

  // ══════════════════════════════════════════════════════════════════
  //  SWITCH VIEW
  // ══════════════════════════════════════════════════════════════════
  function _switchView(view) {
    _currentView = view;
    _selectedTag = null;
    _clearLegendFilter();
    _updateTopBar(view);
    _updateSidebar(view);
    _updateStatusBar();
    if (_canvas && _canvas.switchView) _canvas.switchView(view);
    _updateZoomPct();
    _closePanel();
  }

  // ══════════════════════════════════════════════════════════════════
  //  RIGHT PANEL
  // ══════════════════════════════════════════════════════════════════
  function _closePanel() {
    var panel = document.getElementById('hmiPanel');
    if (panel) {
      panel.classList.remove('open');
      panel.innerHTML =
        '<div class="hmi-pbody">' +
          '<div class="hmi-pempty">' +
            '<div class="icon">\uD83D\uDCCD</div>' +
            '<div>Selecciona un equipo<br>en el diagrama</div>' +
          '</div>' +
        '</div>';
    }
  }

  function _openPanel(varId) {
    var panel = document.getElementById('hmiPanel');
    if (!panel) return;

    var props = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[varId];
    if (!props) { _closePanel(); return; }

    var dv = _getDisplayValue(varId);
    var status = _getStatus(varId);
    var sc = { manual:'#22c55e',warning:'#f59e0b',critical:'#ef4444',normal:'#64748b' }[status] || '#64748b';
    var sl = { manual:'Manual',warning:'Alerta',critical:'Cr\u00EDtico',normal:'Normal' }[status] || 'Normal';
    var shape = _getShape(varId);
    var icon = SHAPE_ICONS[shape] || '\u2753';

    var html = '';

    // Header
    html += '<div class="hmi-phead">';
    html += '  <span style="font-size:18px">' + icon + '</span>';
    html += '  <span class="tag">' + varId + '</span>';
    html += '  <span class="plabel">' + props.label + '</span>';
    html += '  <button class="pclose" id="hmiPClose">\u2715</button>';
    html += '</div>';

    // Body
    html += '<div class="hmi-pbody">';

    // Value + status
    html += '  <div class="hmi-pval">' + dv.value + '<span class="hmi-punit">' + dv.unit + '</span></div>';
    html += '  <div class="hmi-pstatus ' + status + '">';
    if (dv.source === 'manual') html += '\uD83D\uDD90 ';
    html += sl + '</div>';

    // Editable sub-variables by category
    var catIdx = 0;
    ['physical', 'chemical', 'process'].forEach(function (cat) {
      var arr = props[cat];
      if (!arr || arr.length === 0) return;
      var cl = { physical:'\u2699 F\u00EDsicas', chemical:'\uD83E\uDDEA Qu\u00EDmicas', process:'\uD83D\uDD04 Proceso' };
      html += '  <div class="hmi-pcat">' + (cl[cat] || cat) + '</div>';
      arr.forEach(function (p) {
        var overrideVal = _getSubVar(varId, cat, p.key);
        var val = overrideVal !== null ? overrideVal : (p.value || '');
        html += '  <div class="hmi-prow" style="display:flex;align-items:center;gap:8px"><span class="l" style="flex-shrink:0;min-width:80px;font-size:14px;color:var(--text-muted)">' + p.label + '</span>';
        html += '<input type="text" id="hmi_inp_' + catIdx + '" value="' + val + '" data-tag="' + varId + '" data-cat="' + cat + '" data-key="' + p.key + '" data-unit="' + (p.unit || '') + '" style="flex:1;min-width:0;background:rgba(15,23,42,0.6);border:1px solid rgba(48,54,61,0.5);border-radius:5px;padding:8px 12px;color:var(--text-primary);font-family:JetBrains Mono,monospace;font-size:15px;text-align:right;width:auto;height:36px">';
        html += '<span style="font-size:13px;color:var(--text-muted);min-width:32px;text-align:left">' + (p.unit || '') + '</span>';
        html += '</div>';
        catIdx++;
      });
    });

    // Save all button
    html += '  <div class="hmi-pman">';
    html += '    <label>Todas las variables</label>';
    html += '    <div class="row" style="margin-top:4px">';
    html += '      <button id="hmiPSaveAll" style="flex:1;padding:6px;background:var(--accent-cyan);border:none;border-radius:4px;color:#0b1121;font-size:11px;font-weight:700;cursor:pointer">\uD83D\uDCBE Guardar todo</button>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    panel.innerHTML = html;
    panel.classList.add('open');

    document.getElementById('hmiPClose').onclick = _closePanel;

    document.getElementById('hmiPSaveAll').onclick = function () {
      var count = 0;
      var firstVal = null, firstUnit = null;
      for (var i = 0; document.getElementById('hmi_inp_' + i); i++) {
        var inp = document.getElementById('hmi_inp_' + i);
        var v = inp.value.trim();
        var tagId2 = inp.getAttribute('data-tag');
        var cat2 = inp.getAttribute('data-cat');
        var key2 = inp.getAttribute('data-key');
        var unit2 = inp.getAttribute('data-unit') || '';
        if (v !== '' && tagId2 && cat2 && key2) {
          _setSubVar(tagId2, cat2, key2, v);
          if (firstVal === null) { firstVal = v; firstUnit = unit2; }
          count++;
        }
      }
      if (count > 0 && firstVal !== null && firstUnit !== null) {
        if (window.HMIStore) window.HMIStore.set(varId, firstVal, firstUnit);
      }
      if (window.showNotif) window.showNotif(count + ' variable(s) guardada(s) para ' + varId, 'success');
      _updateStatusBar();
      // Re-open to reflect changes
      _openPanel(varId);
    };
  }

  // ══════════════════════════════════════════════════════════════════
  //  MODAL (alternative to panel for full detail)
  // ══════════════════════════════════════════════════════════════════
  function _openModal(varId) {
    var props = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[varId];
    if (!props) return;

    if (!document.getElementById('hmiModalStyle')) {
      var st = document.createElement('style');
      st.id = 'hmiModalStyle';
      st.textContent =
        '#hmiModalOverlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:20px;animation:fadeIn 0.15s ease}' +
        '@keyframes fadeIn{from{opacity:0}to{opacity:1}}' +
        '#hmiModalOverlay .hmiModal{background:var(--bg-panel,#161b22);border:1px solid rgba(48,54,61,0.5);border-radius:12px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;animation:modalIn 0.2s ease}' +
        '@keyframes modalIn{from{transform:scale(0.95);opacity:0}to{transform:scale(1);opacity:1}}' +
        '#hmiModalOverlay .hmiMhead{padding:16px 20px 4px}' +
        '#hmiModalOverlay .hmiMhead h3{margin:0;font-size:15px;color:var(--text-primary);font-family:JetBrains Mono,monospace}' +
        '#hmiModalOverlay .hmiMhead .mlabel{font-size:11px;color:var(--text-muted)}' +
        '#hmiModalOverlay .hmiMtabs{display:flex;gap:2px;padding:8px 20px 0;border-bottom:1px solid rgba(48,54,61,0.2)}' +
        '#hmiModalOverlay .hmiMtab{padding:7px 14px;font-size:11px;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.12s;margin-bottom:-1px}' +
        '#hmiModalOverlay .hmiMtab.active{color:var(--accent-cyan);border-bottom-color:var(--accent-cyan)}' +
        '#hmiModalOverlay .hmiMpane{display:none;padding:10px 20px;max-height:300px;overflow-y:auto}' +
        '#hmiModalOverlay .hmiMpane.active{display:block}' +
        '#hmiModalOverlay .hmiMrow{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:14px;border-bottom:1px solid rgba(48,54,61,0.08)}' +
        '#hmiModalOverlay .hmiMrow .ml{color:var(--text-muted);width:140px;flex-shrink:0;font-size:14px}' +
        '#hmiModalOverlay .hmiMrow input{flex:1;background:rgba(15,23,42,0.6);border:1px solid rgba(48,54,61,0.5);border-radius:5px;padding:8px 12px;color:var(--text-primary);font-family:JetBrains Mono,monospace;font-size:16px;text-align:right;height:38px}' +
        '#hmiModalOverlay .hmiMrow input:focus{border-color:var(--accent-cyan);outline:none}' +
        '#hmiModalOverlay .hmiMrow .mu{font-size:14px;color:var(--text-muted);min-width:32px}' +
        '#hmiModalOverlay .hmiMfoot{padding:10px 20px 16px;border-top:1px solid rgba(48,54,61,0.3);display:flex;gap:8px}' +
        '#hmiModalOverlay .hmiMfoot button{flex:1;padding:7px;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.12s}' +
        '#hmiModalOverlay .hmiMfoot .cancel{background:transparent;border:1px solid rgba(48,54,61,0.5);color:var(--text-primary)}' +
        '#hmiModalOverlay .hmiMfoot .cancel:hover{background:rgba(48,54,61,0.2)}' +
        '#hmiModalOverlay .hmiMfoot .save{background:var(--accent-cyan);border:none;color:#0b1121}' +
        '#hmiModalOverlay .hmiMfoot .save:hover{opacity:0.85}';
      document.head.appendChild(st);
    }

    var overlay = document.createElement('div');
    overlay.id = 'hmiModalOverlay';

    var tabsHtml = '', panesHtml = '', first = true;
    var catMap = { physical: '\u2699 F\u00EDsicas', chemical: '\uD83E\uDDEA Qu\u00EDmicas', process: '\uD83D\uDD04 Proceso' };
    var flatIdx = 0;
    ['physical', 'chemical', 'process'].forEach(function (cat) {
      var arr = props[cat];
      if (!arr || arr.length === 0) return;
      var act = first ? ' active' : '';
      tabsHtml += '<div class="hmiMtab' + act + '" data-cat="' + cat + '">' + (catMap[cat] || cat) + '</div>';
      var rows = '';
      arr.forEach(function (p) {
        var overrideVal = _getSubVar(varId, cat, p.key);
        var val = overrideVal !== null ? overrideVal : (p.value || '');
        rows += '<div class="hmiMrow">' +
          '<span class="ml">' + p.label + '</span>' +
          '<input type="text" id="hm_' + flatIdx + '" value="' + val + '" data-tag="' + varId + '" data-cat="' + cat + '" data-key="' + p.key + '">' +
          '<span class="mu">' + (p.unit || '') + '</span>' +
          '</div>';
        flatIdx++;
      });
      panesHtml += '<div class="hmiMpane' + act + '" data-cat="' + cat + '">' + rows + '</div>';
      first = false;
    });

    overlay.innerHTML =
      '<div class="hmiModal">' +
        '<div class="hmiMhead"><h3>' + varId + '</h3><span class="mlabel">' + props.label + '</span></div>' +
        '<div class="hmiMtabs">' + tabsHtml + '</div>' +
        '<div>' + panesHtml + '</div>' +
        '<div class="hmiMfoot">' +
          '<button class="cancel" id="hmiMCancel">Cancelar</button>' +
          '<button class="save" id="hmiMSave">\uD83D\uDCBE Guardar</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.hmiMtab').forEach(function (t) {
      t.addEventListener('click', function () {
        overlay.querySelectorAll('.hmiMtab').forEach(function (x) { x.classList.remove('active'); });
        overlay.querySelectorAll('.hmiMpane').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var p = overlay.querySelector('.hmiMpane[data-cat="' + t.getAttribute('data-cat') + '"]');
        if (p) p.classList.add('active');
      });
    });

    var firstInp = overlay.querySelector('input');
    if (firstInp) firstInp.focus();

    overlay.querySelector('#hmiMCancel').onclick = function () { overlay.remove(); };
    overlay.querySelector('#hmiMSave').onclick = function () {
      var count = 0, firstVal = null, firstUnit = null;
      overlay.querySelectorAll('.hmiMrow input').forEach(function (inp) {
        var v = inp.value.trim();
        var tagId2 = inp.getAttribute('data-tag');
        var cat2 = inp.getAttribute('data-cat');
        var key2 = inp.getAttribute('data-key');
        if (v !== '' && tagId2 && cat2 && key2) {
          _setSubVar(tagId2, cat2, key2, v);
          if (firstVal === null) firstVal = v;
          count++;
        }
      });
      if (count > 0 && firstVal !== null) {
        var db = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[varId];
        var unit = (db && db.physical && db.physical[0] && db.physical[0].unit) || '';
        if (window.HMIStore) window.HMIStore.set(varId, firstVal, unit);
      }
      if (window.showNotif) window.showNotif(count + ' variable(s) guardada(s) para ' + varId, 'success');
      _updateStatusBar();
      overlay.remove();
    };
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
  }

  // ══════════════════════════════════════════════════════════════════
  //  MAIN LOAD
  // ══════════════════════════════════════════════════════════════════
  window.loadHMISVG = async function (filename) {
    var container = getContainer();
    if (!container) return;

    _buildVisualizer();

    var canvasContainer = document.getElementById('hmiContainer');
    if (!canvasContainer) return;
    canvasContainer.innerHTML = '';

    if (!window.HMI_CANVAS) {
      canvasContainer.innerHTML = '<div style="color:var(--danger);padding:20px">Error: HMI_CANVAS no cargado.</div>';
      return;
    }

    try {
      _canvas = new window.HMI_CANVAS('hmiContainer');

      var tags = Object.keys(window.TAG_PROPERTIES_DB || {});
      _canvas.init(tags);
      _canvas.switchView(_currentView);
      _updateZoomPct();

      _canvas.onNodeClick(function (varId) {
        _selectedTag = varId;
        _openPanel(varId);
      });
    } catch (e) {
      canvasContainer.innerHTML = '<div style="color:var(--danger);padding:20px">Error: ' + e.message + '</div>';
      return;
    }

    var label = document.getElementById('hmiLabel');
    if (label) label.textContent = 'Process Diagram';
    _updateStatusBar();
    if (typeof window._checkIntegration === 'function') setTimeout(window._checkIntegration, 200);
    // Expose refresh for status bar updates
    window._hmiRefreshStatus = _updateStatusBar;
  };

  window.listHMISVGs = window.listHMISVGs;
  window.loadHMISVG = window.loadHMISVG;
  window.onHmiTagSelect = _openModal;

  // ══════════════════════════════════════════════════════════════════
  //  STARTUP: clear alarms/schedules + generate random alarms
  // ══════════════════════════════════════════════════════════════════
  function _startup() {
    // Clear existing alarm history and acks
    try {
      localStorage.removeItem('scada_alarm_history');
      localStorage.removeItem('scada_alarm_acks');
    } catch (e) {}
    // Clear calendar events
    try {
      localStorage.removeItem('scada_calendar_events');
    } catch (e) {}
    // Reset in-memory alarm data
    if (window.alarmData) window.alarmData = [];
    if (window.AlarmManager && window.AlarmManager._reset) window.AlarmManager._reset();

    // Generate 2-3 random alarms
    setTimeout(function () {
      var db = window.TAG_PROPERTIES_DB;
      if (!db) return;

      var candidates = [];
      Object.keys(db).forEach(function (id) {
        var p = db[id];
        if (p && p.alarms && (p.alarms.crit_max != null)) candidates.push(id);
      });

      if (candidates.length === 0) {
        Object.keys(db).forEach(function (id) {
          var p = db[id];
          if (p && p.alarms && (p.alarms.max != null)) candidates.push(id);
        });
      }

      if (candidates.length === 0) return;

      var count = Math.min(2 + Math.floor(Math.random() * 2), candidates.length); // 2 or 3

      // Shuffle
      for (var si = candidates.length - 1; si > 0; si--) {
        var sj = Math.floor(Math.random() * (si + 1));
        var tmp = candidates[si]; candidates[si] = candidates[sj]; candidates[sj] = tmp;
      }

      var triggered = [];
      for (var ri = 0; ri < count; ri++) {
        var tagId = candidates[ri];
        var p = db[tagId];
        if (!p || !p.alarms) continue;

        var targetVal = null;
        var threshold = null;
        var unit = (p.physical && p.physical[0] && p.physical[0].unit) || p.unit || '';

        // Prefer exceeding the critical max
        if (p.alarms.crit_max != null) {
          targetVal = p.alarms.crit_max + (Math.random() * 10 + 1);
          threshold = 'crit_max=' + p.alarms.crit_max;
        } else if (p.alarms.max != null) {
          targetVal = p.alarms.max + (Math.random() * 5 + 1);
          threshold = 'max=' + p.alarms.max;
        } else if (p.alarms.crit_min != null) {
          targetVal = p.alarms.crit_min - (Math.random() * 10 + 1);
          threshold = 'crit_min=' + p.alarms.crit_min;
        } else if (p.alarms.min != null) {
          targetVal = p.alarms.min - (Math.random() * 5 + 1);
          threshold = 'min=' + p.alarms.min;
        }

        if (targetVal !== null) {
          targetVal = Math.round(targetVal * 100) / 100;
          // Set via HMIStore so the alarm evaluator picks it up
          if (window.HMIStore) {
            window.HMIStore.set(tagId, String(targetVal), unit);
            // Also update TAG_PROPERTIES_DB physical[0] value
            if (p.physical && p.physical[0]) {
              p.physical[0].value = String(targetVal);
            }
          }
          triggered.push(tagId + '=' + targetVal + ' (' + threshold + ')');
        }
      }

      if (triggered.length > 0) {
        console.log('[HMI] Alarms aleatorias generadas:', triggered.join(', '));
        window._hmiRandomAlarms = triggered;
        // Force alarm evaluation
        if (window.AlarmManager && typeof window.AlarmManager.evaluateNow === 'function') {
          window.AlarmManager.evaluateNow();
        }
      }
    }, 1000);
  }

  // Run startup after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _startup);
  } else {
    _startup();
  }

})();
