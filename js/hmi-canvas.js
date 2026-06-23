(function () {
  if (window._hmiCanvasV3) return;
  window._hmiCanvasV3 = true;

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (r > w / 2) r = w / 2;
      if (r > h / 2) r = h / 2;
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
    };
  }

  // ─── P&ID LAYOUT — grid positions (row, col) for each PU ───────
  var LAYOUT = {
    pu1: [
      { id: 'TK-001',    row: 0, col: 0 },
      { id: 'FIL-001',   row: 0, col: 1 },
      { id: 'P-001',     row: 0, col: 2 },
      { id: 'TK-002',    row: 0, col: 3 },
      { id: 'E.W-003',   row: 0, col: 4 },
      { id: 'E-003',     row: 0, col: 5 },
      { id: 'TK-003',    row: 1, col: 5 },
      { id: 'TK-004',    row: 1, col: 4 },
      { id: 'CLP-001',   row: 1, col: 3 },
      { id: 'SALACE-001',row: 1, col: 2 },
      { id: 'ALCO-001',  row: 1, col: 1 },
    ],
    pu2: [
      { id: 'EST-001',   row: 0, col: 0 },
      { id: 'TRAN-001',  row: 0, col: 1 },
      { id: 'SEP-001',   row: 0, col: 2 },
      { id: 'GLI-001',   row: 0, col: 3 },
      { id: 'PRO_DES-001',row:0, col: 4 },
      { id: 'SIS_TRAN-001',row:1, col:1 },
      { id: 'SIS_BOM-001',row: 1, col: 3 },
    ],
    pu3: [
      { id: 'SEC-001',   row: 0, col: 0 },
      { id: 'SEC_COND-001',row:0, col: 1 },
      { id: 'VIS-001',   row: 0, col: 2 },
      { id: 'PRO_FIN-001',row: 0, col: 3 },
      { id: 'PRO_DES-003',row: 0, col: 4 },
      { id: 'SIS_CIRC-001',row:1, col: 2 },
    ],
  };

  // ─── PIPE CONNECTIONS ──────────────────────────────────────────
  var PIPES = {
    pu1: [
      { from: 'TK-001', to: 'FIL-001' },
      { from: 'FIL-001', to: 'P-001' },
      { from: 'P-001', to: 'TK-002' },
      { from: 'TK-002', to: 'E.W-003' },
      { from: 'E.W-003', to: 'E-003' },
      { from: 'E-003', to: 'TK-003', via: 'down' },
      { from: 'TK-003', to: 'TK-004' },
      { from: 'TK-004', to: 'CLP-001' },
      { from: 'CLP-001', to: 'SALACE-001' },
      { from: 'SALACE-001', to: 'ALCO-001' },
    ],
    pu2: [
      { from: 'EST-001', to: 'TRAN-001' },
      { from: 'TRAN-001', to: 'SEP-001' },
      { from: 'SEP-001', to: 'GLI-001' },
      { from: 'GLI-001', to: 'PRO_DES-001' },
      { from: 'PRO_DES-001', to: 'SIS_TRAN-001', via: 'down' },
      { from: 'SIS_TRAN-001', to: 'SIS_BOM-001' },
    ],
    pu3: [
      { from: 'SEC-001', to: 'SEC_COND-001' },
      { from: 'SEC_COND-001', to: 'VIS-001' },
      { from: 'VIS-001', to: 'PRO_FIN-001' },
      { from: 'PRO_FIN-001', to: 'PRO_DES-003' },
      { from: 'PRO_DES-003', to: 'SIS_CIRC-001', via: 'down' },
    ],
  };

  var PREFIX_MAP = {
    'E.W': 'hex', 'SEC_COND': 'column', 'SALACE': 'valve',
    'PRO_DES': 'waste', 'PRO_FIN': 'product',
    'SIS_CIRC': 'system', 'SIS_BOM': 'system', 'SIS_TRAN': 'system', 'SIS': 'system',
    'TK': 'tank', 'FIL': 'filter', 'P': 'pump', 'CLP': 'panel',
    'E': 'reactor', 'SEP': 'separator', 'VIS': 'gauge', 'SEC': 'column',
    'ALCO': 'valve', 'GLI': 'tank', 'TRAN': 'reactor', 'EST': 'reactor',
  };

  var EXACT_MAP = {
    'TK_ACEITE': 'tank', 'TK_ACE_FILTRADO': 'tank', 'TK_METANOL': 'tank', 'TK_NAOH': 'tank',
    'FILTRADO': 'filter', 'BOMBEO': 'pump', 'CONTROL_1': 'panel',
    'INT_CALOR': 'hex', 'SIS_CIRCULACION': 'system',
    'SAL_ALCOXIDO': 'valve', 'SAL_ACEITE': 'valve',
  };

  var C = {
    pipe: 'rgba(100,116,139,0.55)',
    pipeArrow: 'rgba(148,163,184,0.5)',
    viewLabel: '#64748b',
    tagText: '#e2e8f0',
    labelText: '#94a3b8',
    valueText: '#e2e8f0',
    badgeBg: 'rgba(0,0,0,0.65)',
    normal: { fill: '#1a2744', stroke: '#3b5286', badge: '#60a5fa' },
    manual: { fill: '#064e3b', stroke: '#22c55e', badge: '#4ade80' },
    warning: { fill: '#451a03', stroke: '#f59e0b', badge: '#fbbf24' },
    critical: { fill: '#450a0a', stroke: '#ef4444', badge: '#f87171' },
    selected: { fill: '#1e3a5f', stroke: '#60a5fa', badge: '#93c5fd' },
    hoverGlow: 'rgba(96,165,250,0.18)',
  };

  function _getShape(tagId) {
    if (EXACT_MAP[tagId]) return EXACT_MAP[tagId];
    var prefixes = Object.keys(PREFIX_MAP).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < prefixes.length; i++)
      if (tagId.startsWith(prefixes[i])) return PREFIX_MAP[prefixes[i]];
    return 'default';
  }

  function _isQ(v) {
    return v != null && v !== '--' && v !== '' && /^[\d<>\-–.\s]+$/.test(String(v).trim());
  }

  function _getDV(tagId) {
    var st = window.HMIStore && window.HMIStore.get(tagId);
    if (st && st.value != null) return { value: st.value, unit: st.unit || '', source: 'manual' };
    var db = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[tagId];
    if (!db) return { value: '--', unit: '', source: 'none' };
    for (var ci = 0; ci < 3; ci++) {
      var cat = ['physical', 'chemical', 'process'][ci];
      var arr = db[cat];
      if (!arr) continue;
      for (var pi = 0; pi < arr.length; pi++)
        if (_isQ(arr[pi].value)) return { value: arr[pi].value, unit: arr[pi].unit || db.unit || '', source: cat };
    }
    var fb = db.physical && db.physical[0];
    return { value: fb ? fb.value : '--', unit: fb ? (fb.unit || db.unit || '') : (db.unit || ''), source: 'fallback' };
  }

  function _getStatus(tagId) {
    if (window.HMIStore && window.HMIStore.get(tagId)) return 'manual';
    var p = window.TAG_PROPERTIES_DB && window.TAG_PROPERTIES_DB[tagId];
    if (!p || !p.alarms) return 'normal';
    var v = parseFloat(p.physical && p.physical[0] && p.physical[0].value);
    if (isNaN(v)) return 'normal';
    var a = p.alarms;
    if ((a.crit_max != null && v >= a.crit_max) || (a.crit_min != null && v <= a.crit_min)) return 'critical';
    if ((a.max != null && v >= a.max) || (a.min != null && v <= a.min)) return 'warning';
    return 'normal';
  }

  function _sc(s) {
    switch (s) {
      case 'manual': return C.manual;
      case 'warning': return C.warning;
      case 'critical': return C.critical;
      case 'selected': return C.selected;
      default: return C.normal;
    }
  }

  // ─── DIMENSIONS PER SHAPE ──────────────────────────────────────
  var SHAPE_SIZE = {
    tank:    { w: 78, h: 92 },
    pump:    { w: 54, h: 54 },
    reactor: { w: 76, h: 100 },
    filter:  { w: 56, h: 56 },
    column:  { w: 46, h: 104 },
    separator: { w: 90, h: 52 },
    gauge:   { w: 50, h: 50 },
    panel:   { w: 64, h: 50 },
    system:  { w: 68, h: 48 },
    hex:     { w: 56, h: 44 },
    valve:   { w: 30, h: 38 },
    waste:   { w: 52, h: 58 },
    product: { w: 52, h: 58 },
    default: { w: 44, h: 44 },
  };

  var GRID = {
    colW: 170,
    rowH: 150,
    startX: 80,
    startY: 90,
  };

  // ─── CLASS ─────────────────────────────────────────────────────
  class HMI_CANVAS {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) throw new Error('Container #' + containerId + ' not found');
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.style.display = 'block';
      this.canvas.style.background = 'transparent';
      this.container.style.overflow = 'hidden';
      this.container.prepend(this.canvas);
      this._views = {};
      this._currentView = 'pu1';
      this.nodes = [];
      this.connections = [];
      this.hoveredNode = null;
      this.selectedNode = null;
      this.scale = 0.55;
      this.offset = { x: 30, y: 40 };
      this.isPanning = false;
      this.lastMouse = { x: 0, y: 0 };
      this._onNodeClick = null;
      this._shapeFilter = null;
      this._setupEvents();
      this._resize();
      window.addEventListener('resize', function () { this._resize(); }.bind(this));
      this._animate();
    }

    _setupEvents() {
      var self = this;
      this.canvas.addEventListener('mousedown', function (e) { self._onMouseDown(e); });
      this.canvas.addEventListener('mousemove', function (e) { self._onMouseMove(e); });
      this.canvas.addEventListener('mouseleave', function () { self.hoveredNode = null; });
      window.addEventListener('mouseup', function () { self.isPanning = false; });
      this.canvas.addEventListener('wheel', function (e) { self._onWheel(e); }, { passive: false });
    }

    _resize() {
      var rect = this.container.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      this._dpr = dpr;
      this._autoScale();
    }

    onNodeClick(cb) { this._onNodeClick = cb; }

    setShapeFilter(type) {
      this._shapeFilter = type;
    }

    clearShapeFilter() {
      this._shapeFilter = null;
    }

    // ─── BUILD VIEWS FROM LAYOUT ────────────────────────────────
    init(allTags) {
      var db = window.TAG_PROPERTIES_DB || {};
      var keys = ['pu1', 'pu2', 'pu3'];
      var self = this;

      keys.forEach(function (vk) {
        var layout = LAYOUT[vk] || [];
        var pipes = PIPES[vk] || [];
        var tagList = layout.filter(function (e) { return db[e.id]; });
        if (tagList.length === 0) { self._views[vk] = { nodes: [], connections: [] }; return; }

        // Compute grid dimensions
        var maxRow = 0, maxCol = 0;
        tagList.forEach(function (e) {
          if (e.row > maxRow) maxRow = e.row;
          if (e.col > maxCol) maxCol = e.col;
        });

        var g = GRID;
        var cw = g.colW, rh = g.rowH;
        var sx = g.startX, sy = g.startY;

        var lookup = {};
        var nodes = tagList.map(function (e) {
          var p = db[e.id];
          var shape = _getShape(e.id);
          var sz = SHAPE_SIZE[shape] || SHAPE_SIZE.default;
          var dv = _getDV(e.id);
          var nx = sx + e.col * cw;
          var ny = sy + e.row * rh;
          var node = {
            id: e.id, label: p ? p.label : e.id, shape: shape,
            x: nx, y: ny,
            sw: sz.w, sh: sz.h,
            hw: sz.w / 2, hh: sz.h / 2,
            // hit area (slightly larger than shape)
            hitW: Math.max(sz.w + 24, 60),
            hitH: Math.max(sz.h + 24, 60),
            displayValue: dv.value, displayUnit: dv.unit, displaySource: dv.source,
          };
          lookup[e.id] = node;
          return node;
        });

        var connections = pipes.map(function (p) {
          var fn = lookup[p.from], tn = lookup[p.to];
          if (!fn || !tn) return null;
          return { from: fn, to: tn, via: p.via || 'straight' };
        }).filter(function (c) { return c; });

        self._views[vk] = { nodes: nodes, connections: connections };
      });

      this.switchView('pu1');
    }

    // ─── SWITCH VIEW ─────────────────────────────────────────────
    switchView(view) {
      if (!this._views[view]) return;
      this._currentView = view;
      this.nodes = this._views[view].nodes || [];
      this.connections = this._views[view].connections || [];
      this.selectedNode = null;
      this.hoveredNode = null;
      this._autoScale();
      // Center
      if (this.nodes.length > 0) {
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        this.nodes.forEach(function (n) {
          var l = n.x - n.hitW / 2, r = n.x + n.hitW / 2;
          var t = n.y - n.hitH / 2, b = n.y + n.hitH / 2;
          if (l < minX) minX = l; if (r > maxX) maxX = r;
          if (t < minY) minY = t; if (b > maxY) maxY = b;
        });
        var totalW = maxX - minX + 60;
        var totalH = maxY - minY + 40;
        var cw = this.canvas.width / (this._dpr || 1);
        this.offset.x = Math.max(20, (cw - totalW * this.scale) / 2 + 20);
        this.offset.y = 40;
      }
    }

    _autoScale() {
      if (this.nodes.length === 0) return;
      var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      this.nodes.forEach(function (n) {
        var l = n.x - n.hitW / 2, r = n.x + n.hitW / 2;
        var t = n.y - n.hitH / 2, b = n.y + n.hitH / 2;
        if (l < minX) minX = l; if (r > maxX) maxX = r;
        if (t < minY) minY = t; if (b > maxY) maxY = b;
      });
      var totalW = maxX - minX + 80;
      var cw = this.canvas.width / (this._dpr || 1);
      if (cw <= 0) return;
      this.scale = Math.max(0.3, Math.min(1.0, (cw - 40) / totalW));
    }

    // ─── HIT TEST ────────────────────────────────────────────────
    _screenToWorld(cx, cy) {
      return { x: (cx - this.offset.x) / this.scale, y: (cy - this.offset.y) / this.scale };
    }

    _hitTest(mx, my) {
      var nds = this.nodes;
      for (var i = nds.length - 1; i >= 0; i--) {
        var n = nds[i];
        var l = n.x - n.hitW / 2, t = n.y - n.hitH / 2;
        var r = n.x + n.hitW / 2, b = n.y + n.hitH / 2;
        if (mx >= l && mx <= r && my >= t && my <= b) return n;
      }
      return null;
    }

    // ─── EVENTS ──────────────────────────────────────────────────
    _onMouseDown(e) {
      var rect = this.canvas.getBoundingClientRect();
      var w = this._screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      var hit = this._hitTest(w.x, w.y);
      if (hit) {
        this.selectedNode = hit;
        if (this._onNodeClick) this._onNodeClick(hit.id);
        if (window.scadaBus) window.scadaBus.emit('hmi:tag:click', { varId: hit.id, tag: hit.id, source: 'hmi' });
      } else {
        this.isPanning = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        this.selectedNode = null;
      }
    }

    _onMouseMove(e) {
      if (this.isPanning) {
        this.offset.x += e.clientX - this.lastMouse.x;
        this.offset.y += e.clientY - this.lastMouse.y;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        return;
      }
      var rect = this.canvas.getBoundingClientRect();
      var w = this._screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      this.hoveredNode = this._hitTest(w.x, w.y);
      this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
    }

    _onWheel(e) {
      e.preventDefault();
      var rect = this.canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) / 100, 2);
      var factor = Math.pow(1.08, -delta);
      var old = this.scale;
      this.scale = Math.max(0.15, Math.min(3.0, this.scale * factor));
      var r = this.scale / old;
      this.offset.x = mx - (mx - this.offset.x) * r;
      this.offset.y = my - (my - this.offset.y) * r;
    }

    _animate() {
      this._draw();
      window.requestAnimationFrame(function () { this._animate(); }.bind(this));
    }

    // ════════════════════ RENDER ══════════════════════════════════
    _draw() {
      var ctx = this.ctx, cvs = this.canvas, scale = this.scale, off = this.offset;
      var dpr = this._dpr || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cw = cvs.width / dpr, ch = cvs.height / dpr;
      ctx.clearRect(0, 0, cw, ch);

      // Subtle grid
      ctx.strokeStyle = 'rgba(48,54,61,0.2)';
      ctx.lineWidth = 0.5;
      for (var gx = 0; gx < cw; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke(); }
      for (var gy = 0; gy < ch; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }

      ctx.save();
      ctx.translate(off.x, off.y);
      ctx.scale(scale, scale);

      this._drawConnections();
      this._drawNodes();

      ctx.restore();

      // Info overlays
      ctx.fillStyle = 'rgba(11,17,33,0.75)';
      ctx.beginPath();
      ctx.roundRect(cw - 80, 10, 70, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(this.scale * 100) + '%', cw - 45, 22);

      ctx.fillStyle = 'rgba(11,17,33,0.75)';
      ctx.beginPath();
      ctx.roundRect(10, ch - 34, 110, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u2699 ' + this.nodes.length + ' equipos', 65, ch - 22);
    }

    // ─── CONNECTIONS ──────────────────────────────────────────────
    _drawConnections() {
      var ctx = this.ctx;
      var conns = this.connections;
      if (!conns) return;

      for (var i = 0; i < conns.length; i++) {
        var f = conns[i].from, t = conns[i].to, via = conns[i].via;
        if (!f || !t) continue;

        ctx.strokeStyle = C.pipe;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        if (via === 'down') {
          var mx = (f.x + t.x) / 2;
          var midY = Math.max(f.y + f.sh / 2 + 20, t.y - t.sh / 2 - 20);
          ctx.moveTo(f.x, f.y + f.sh / 2);
          ctx.lineTo(f.x, midY);
          ctx.lineTo(t.x, midY);
          ctx.lineTo(t.x, t.y - t.sh / 2);
        } else {
          // straight right-to-left or left-to-right
          var dir = t.x >= f.x ? 1 : -1;
          var fx = f.x + dir * f.sw / 2;
          var tx = t.x - dir * t.sw / 2;
          var fy = f.y;
          var ty = t.y;

          if (Math.abs(fy - ty) < 15) {
            ctx.moveTo(fx, fy);
            ctx.lineTo(tx, ty);
          } else {
            var my2 = (fy + ty) / 2;
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx + dir * 30, fy);
            ctx.lineTo(fx + dir * 30, my2);
            ctx.lineTo(tx - dir * 30, my2);
            ctx.lineTo(tx - dir * 30, ty);
            ctx.lineTo(tx, ty);
          }
        }

        ctx.stroke();

        // Arrowhead
        this._drawArrowhead(ctx, t, f);
      }
    }

    _drawArrowhead(ctx, t, f) {
      var as = 8;
      var dir = t.x >= f.x ? -1 : 1;
      var tipX = t.x - dir * (t.sw / 2 + 2);
      var tipY = t.y;
      ctx.fillStyle = C.pipeArrow;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + dir * as, tipY - as / 2);
      ctx.lineTo(tipX + dir * as, tipY + as / 2);
      ctx.closePath();
      ctx.fill();
    }

    // ─── DRAW ALL NODES ───────────────────────────────────────────
    _drawNodes() {
      var nds = this.nodes;
      for (var i = 0; i < nds.length; i++) this._drawNode(nds[i]);
    }

    _drawNode(n) {
      var ctx = this.ctx;
      var isHov = this.hoveredNode === n;
      var isSel = this.selectedNode === n;
      var status = isSel ? 'selected' : _getStatus(n.id);
      var pal = _sc(status);
      var isFiltered = this._shapeFilter && n.shape !== this._shapeFilter;

      ctx.save();

      // Dim non-matching when filter active
      if (isFiltered) ctx.globalAlpha = 0.2;

      // Hover glow (only if not filtered)
      if (isHov && !isFiltered) {
        ctx.shadowColor = C.hoverGlow;
        ctx.shadowBlur = 22;
      }

      // Background pad (subtle card behind the symbol)
      var padW = n.hitW, padH = n.hitH;
      ctx.fillStyle = isFiltered ? 'transparent' : 'rgba(15,23,42,0.45)';
      ctx.strokeStyle = isFiltered ? 'transparent' : (isHov ? pal.stroke + '44' : 'rgba(71,85,105,0.2)');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(n.x - padW / 2, n.y - padH / 2, padW, padH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Value badge (top-right of pad)
      var dv = _getDV(n.id);
      if (dv.value && dv.value !== '--') {
        var vtxt = dv.value + (dv.unit ? ' ' + dv.unit : '');
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        var tw = ctx.measureText(vtxt).width;
        var bw = Math.min(tw + 12, 90);
        var bh = 18;
        var bx = n.x + padW / 2 - bw - 4;
        var by = n.y - padH / 2 + 4;
        ctx.fillStyle = C.badgeBg;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 4);
        ctx.fill();
        ctx.fillStyle = pal.badge;
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vtxt, bx + bw / 2, by + bh / 2);
      }

      // Manual indicator
      if (dv.source === 'manual') {
        ctx.fillStyle = C.manual.badge;
        ctx.font = '8px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('\uD83D\uDD90 M', n.x - padW / 2 + 4, n.y - padH / 2 + 14);
      }

      // Draw the P&ID symbol
      this._drawShape(n.shape, n.x, n.y, n.sw, n.sh, pal);

      // Filter highlight ring on matching nodes
      if (this._shapeFilter && n.shape === this._shapeFilter) {
        ctx.strokeStyle = 'rgba(34,211,238,0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.roundRect(n.x - padW / 2 - 3, n.y - padH / 2 - 3, padW + 6, padH + 6, 10);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Tag ID below symbol
      ctx.fillStyle = C.tagText;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(n.id, n.x, n.y + n.sh / 2 + 6);

      // Label
      ctx.fillStyle = C.labelText;
      ctx.font = '9px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';
      var lbl = n.label.length > 24 ? n.label.substring(0, 22) + '\u2026' : n.label;
      ctx.fillText(lbl, n.x, n.y + n.sh / 2 + 20);

      ctx.restore();
    }

    // ════════════════════ P&ID SHAPES ════════════════════════════════

    _drawShape(type, cx, cy, w, h, pal) {
      switch (type) {
        case 'tank':    this._tank(cx, cy, w, h, pal); break;
        case 'pump':    this._pump(cx, cy, w, pal); break;
        case 'reactor': this._reactor(cx, cy, w, h, pal); break;
        case 'filter':  this._filter(cx, cy, w, pal); break;
        case 'column':  this._column(cx, cy, w, h, pal); break;
        case 'separator': this._separator(cx, cy, w, h, pal); break;
        case 'gauge':   this._gauge(cx, cy, w, pal); break;
        case 'panel':   this._panel(cx, cy, w, h, pal); break;
        case 'system':  this._system(cx, cy, w, h, pal); break;
        case 'hex':     this._hex(cx, cy, w, h, pal); break;
        case 'valve':   this._valve(cx, cy, w, h, pal); break;
        case 'waste':   this._waste(cx, cy, w, h, pal); break;
        case 'product': this._product(cx, cy, w, h, pal); break;
        default:        this._default(cx, cy, w, pal);
      }
    }

    // ─── TANK — vertical cylinder with domed top, flat cone bottom ──
    _tank(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var hw = w / 2, hh = h / 2;
      var domeR = hw * 0.55;
      var bodyT = cy - hh + domeR * 0.6;
      var bodyB = cy + hh - h * 0.2;
      var coneH = h * 0.18;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Dome
      ctx.beginPath();
      ctx.ellipse(cx, bodyT, domeR, domeR * 0.4, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Body
      ctx.fillRect(cx - hw * 0.5, bodyT, w * 0.5, bodyB - bodyT);
      ctx.strokeRect(cx - hw * 0.5, bodyT, w * 0.5, bodyB - bodyT);

      // Bottom cone
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.5, bodyB);
      ctx.lineTo(cx, bodyB + coneH);
      ctx.lineTo(cx + hw * 0.5, bodyB);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Level line
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.35, bodyT + (bodyB - bodyT) * 0.5);
      ctx.lineTo(cx + hw * 0.35, bodyT + (bodyB - bodyT) * 0.5);
      ctx.stroke();

      // Nozzle top
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, bodyT - domeR * 0.4);
      ctx.lineTo(cx - 5, bodyT - domeR * 0.4 - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 5, bodyT - domeR * 0.4 - 12, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = pal.fill;
      ctx.fill();
      ctx.stroke();
    }

    // ─── PUMP — circle with impeller triangle ──────────────────────
    _pump(cx, cy, w, pal) {
      var ctx = this.ctx;
      var r = w * 0.42;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Casing
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Impeller triangle
      ctx.fillStyle = pal.badge;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.4);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.35);
      ctx.lineTo(cx + r * 0.5, cy + r * 0.35);
      ctx.closePath();
      ctx.fill();

      // Suction pipe (left)
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r - 12, cy);
      ctx.lineTo(cx - r, cy);
      ctx.stroke();

      // Discharge pipe (right)
      ctx.beginPath();
      ctx.moveTo(cx + r, cy);
      ctx.lineTo(cx + r + 12, cy);
      ctx.stroke();

      // Base
      ctx.fillStyle = pal.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy + r + 3);
      ctx.lineTo(cx + r * 0.5, cy + r + 3);
      ctx.stroke();
    }

    // ─── REACTOR — vessel with agitator ────────────────────────────
    _reactor(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var hw = w * 0.38, hh = h / 2;
      var dishR = hw * 0.35;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Body
      ctx.fillRect(cx - hw, cy - hh + dishR, hw * 2, hh * 2 - dishR * 2);
      ctx.strokeRect(cx - hw, cy - hh + dishR, hw * 2, hh * 2 - dishR * 2);

      // Top dish
      ctx.beginPath();
      ctx.ellipse(cx, cy - hh + dishR, hw, dishR, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bottom dish
      ctx.beginPath();
      ctx.ellipse(cx, cy + hh - dishR, hw, dishR, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Agitator shaft
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - hh);
      ctx.lineTo(cx, cy + hh * 0.6);
      ctx.stroke();

      // Motor
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 8, cy - hh - 14, 16, 12, 2);
      ctx.fill();
      ctx.stroke();

      // Impeller blades
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.5, cy + hh * 0.4);
      ctx.lineTo(cx, cy + hh * 0.15);
      ctx.lineTo(cx + hw * 0.5, cy + hh * 0.4);
      ctx.stroke();

      // Jacket lines
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - hw - 5, cy - hh + dishR + 8);
      ctx.lineTo(cx - hw - 5, cy + hh - dishR - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + hw + 5, cy - hh + dishR + 8);
      ctx.lineTo(cx + hw + 5, cy + hh - dishR - 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ─── FILTER — diamond with screen lines ────────────────────────
    _filter(cx, cy, w, pal) {
      var ctx = this.ctx;
      var s = w * 0.44;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Diamond
      ctx.beginPath();
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Screen lines
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1;
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.3, cy + i * s * 0.25);
        ctx.lineTo(cx + s * 0.3, cy + i * s * 0.25);
        ctx.stroke();
      }

      // Inlet/outlet
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - s - 8, cy);
      ctx.lineTo(cx - s, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + s, cy);
      ctx.lineTo(cx + s + 8, cy);
      ctx.stroke();
    }

    // ─── COLUMN — tall vessel with trays ───────────────────────────
    _column(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var hw = w * 0.38, hh = h / 2;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Shell
      ctx.fillRect(cx - hw, cy - hh, hw * 2, hh * 2);
      ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);

      // Top cap
      ctx.beginPath();
      ctx.ellipse(cx, cy - hh, hw, 5, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bottom cap
      ctx.beginPath();
      ctx.ellipse(cx, cy + hh, hw, 5, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Trays
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1;
      var trayCount = Math.min(5, Math.floor(h / 18));
      for (var i = 1; i < trayCount; i++) {
        var yy = cy - hh + (i / (trayCount)) * (hh * 2);
        ctx.beginPath();
        ctx.moveTo(cx - hw + 4, yy);
        ctx.lineTo(cx + hw - 4, yy);
        ctx.stroke();
        // downcomer
        ctx.beginPath();
        ctx.moveTo(cx + hw - 4, yy);
        ctx.lineTo(cx + hw - 4, yy + 6);
        ctx.stroke();
      }

      // Nozzle
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + hh + 3);
      ctx.lineTo(cx, cy + hh + 12);
      ctx.stroke();
    }

    // ─── SEPARATOR — horizontal drum ───────────────────────────────
    _separator(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var hw = w * 0.46, hh = h * 0.42;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Body
      ctx.fillRect(cx - hw, cy - hh, hw * 2, hh * 2);
      ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);

      // Left end
      ctx.beginPath();
      ctx.ellipse(cx - hw, cy, 6, hh, 0, Math.PI / 2, -Math.PI / 2);
      ctx.fill();
      ctx.stroke();

      // Right end
      ctx.beginPath();
      ctx.ellipse(cx + hw, cy, 6, hh, 0, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
      ctx.stroke();

      // Support legs
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.4, cy + hh);
      ctx.lineTo(cx - hw * 0.4, cy + hh + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + hw * 0.4, cy + hh);
      ctx.lineTo(cx + hw * 0.4, cy + hh + 10);
      ctx.stroke();

      // Interface level
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - hw + 6, cy);
      ctx.lineTo(cx + hw - 6, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ─── GAUGE / METER ─────────────────────────────────────────────
    _gauge(cx, cy, w, pal) {
      var ctx = this.ctx;
      var r = w * 0.44;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Face
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
      ctx.stroke();

      // Tick marks
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1;
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        var ir = r * 0.55, or2 = r * 0.75;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * ir, cy + Math.sin(a) * ir);
        ctx.lineTo(cx + Math.cos(a) * or2, cy + Math.sin(a) * or2);
        ctx.stroke();
      }

      // Needle
      var na = Math.PI * 0.35;
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(na) * r * 0.5, cy + Math.sin(na) * r * 0.5);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = pal.badge;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Connection pipe
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + r + 3);
      ctx.lineTo(cx, cy + r + 12);
      ctx.stroke();
    }

    // ─── PANEL / CONTROL ───────────────────────────────────────────
    _panel(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var pw = w * 0.7, ph = h * 0.7;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Cabinet
      ctx.beginPath();
      ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 3);
      ctx.fill();
      ctx.stroke();

      // Screen
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.roundRect(cx - pw * 0.28, cy - ph * 0.25, pw * 0.56, ph * 0.4, 2);
      ctx.fill();

      // LEDs
      for (var i = 0; i < 3; i++) {
        ctx.fillStyle = pal.badge;
        ctx.beginPath();
        ctx.arc(cx - pw * 0.2 + i * pw * 0.22, cy + ph * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Buttons
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1;
      for (var j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.roundRect(cx - pw * 0.15 + j * pw * 0.3, cy + ph * 0.02, 6, 4, 1);
        ctx.stroke();
      }
    }

    // ─── SYSTEM / UTILITY ──────────────────────────────────────────
    _system(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var sw = w * 0.7, sh = h * 0.7;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      ctx.roundRect(cx - sw / 2, cy - sh / 2, sw, sh, 5);
      ctx.fill();
      ctx.stroke();

      // Arrow
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - sw * 0.25, cy);
      ctx.lineTo(cx + sw * 0.25, cy);
      ctx.stroke();

      ctx.fillStyle = pal.badge;
      ctx.beginPath();
      ctx.moveTo(cx + sw * 0.25, cy);
      ctx.lineTo(cx + sw * 0.15, cy - 4);
      ctx.lineTo(cx + sw * 0.15, cy + 4);
      ctx.closePath();
      ctx.fill();

      // Flow lines
      ctx.strokeStyle = 'rgba(148,163,184,0.2)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx - sw * 0.15, cy - sh * 0.15);
      ctx.lineTo(cx + sw * 0.15, cy - sh * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - sw * 0.15, cy + sh * 0.15);
      ctx.lineTo(cx + sw * 0.15, cy + sh * 0.15);
      ctx.stroke();
    }

    // ─── HEAT EXCHANGER ────────────────────────────────────────────
    _hex(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var hw = w * 0.42, hh = h * 0.4;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Shell
      ctx.beginPath();
      ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, 3);
      ctx.fill();
      ctx.stroke();

      // Tubes
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1;
      var tubeY = cy - hh + 6;
      while (tubeY < cy + hh - 5) {
        ctx.beginPath();
        ctx.moveTo(cx - hw + 3, tubeY);
        ctx.lineTo(cx + hw - 3, tubeY);
        ctx.stroke();
        tubeY += 7;
      }

      // Nozzles
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - hw - 6, cy);
      ctx.lineTo(cx - hw, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + hw, cy);
      ctx.lineTo(cx + hw + 6, cy);
      ctx.stroke();
    }

    // ─── VALVE ─────────────────────────────────────────────────────
    _valve(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var vw = w * 0.4, vh = h * 0.45;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Body (bowtie)
      ctx.beginPath();
      ctx.moveTo(cx - vw, cy);
      ctx.lineTo(cx, cy - vh);
      ctx.lineTo(cx + vw, cy);
      ctx.lineTo(cx, cy + vh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Stem
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - vh);
      ctx.lineTo(cx, cy - vh - 10);
      ctx.stroke();

      // Handwheel
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy - vh - 13, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pipe extensions
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - vw - 5, cy);
      ctx.lineTo(cx - vw, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + vw, cy);
      ctx.lineTo(cx + vw + 5, cy);
      ctx.stroke();
    }

    // ─── WASTE / DRUM ──────────────────────────────────────────────
    _waste(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var dw = w * 0.48, dh = h * 0.46;
      var rim = 4;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Drum body
      ctx.fillRect(cx - dw, cy - dh + rim, dw * 2, dh * 2 - rim);
      ctx.strokeRect(cx - dw, cy - dh + rim, dw * 2, dh * 2 - rim);

      // Top rim
      ctx.beginPath();
      ctx.ellipse(cx, cy - dh + rim, dw, 4, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bottom rim
      ctx.beginPath();
      ctx.ellipse(cx, cy + dh, dw, 4, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // X marks
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - dw * 0.35, cy - dh * 0.35 + rim);
      ctx.lineTo(cx + dw * 0.35, cy + dh * 0.35 - rim);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + dw * 0.35, cy - dh * 0.35 + rim);
      ctx.lineTo(cx - dw * 0.35, cy + dh * 0.35 - rim);
      ctx.stroke();
    }

    // ─── PRODUCT ───────────────────────────────────────────────────
    _product(cx, cy, w, h, pal) {
      var ctx = this.ctx;
      var pw = w * 0.48, ph = h * 0.46;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;

      // Box
      ctx.beginPath();
      ctx.roundRect(cx - pw, cy - ph, pw * 2, ph * 2, 4);
      ctx.fill();
      ctx.stroke();

      // Lid line
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - pw + 3, cy - ph + 6);
      ctx.lineTo(cx + pw - 3, cy - ph + 6);
      ctx.stroke();

      // Check mark
      ctx.strokeStyle = pal.badge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - pw * 0.22, cy + 2);
      ctx.lineTo(cx - pw * 0.05, cy + ph * 0.25);
      ctx.lineTo(cx + pw * 0.28, cy - ph * 0.2);
      ctx.stroke();

      // Label
      ctx.fillStyle = pal.badge;
      ctx.font = '6px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRODUCTO', cx, cy + ph * 0.5);
    }

    // ─── DEFAULT / UNKNOWN ─────────────────────────────────────────
    _default(cx, cy, w, pal) {
      var ctx = this.ctx;
      var r = w * 0.4;

      ctx.fillStyle = pal.fill;
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pal.badge;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', cx, cy);
    }
  }

  window.HMI_CANVAS = HMI_CANVAS;
})();
