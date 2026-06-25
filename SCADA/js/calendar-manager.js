/**
 * SpY — calendar-manager.js
 * Plan Maestro de Mantenimiento integrado con P&ID/HMI/Dashboard
 * Persistencia en localStorage · CRUD · Health Score · Reportes · scadaBus
 */

const CalendarManager = (function () {

  const STORAGE_KEY = 'scada_calendar_events';

  // ─── Registro de equipos del P&ID ────────────────────────────────
  const EQUIPMENT_REGISTRY = {
    'TK-01': { label: 'Tanque de Aceite Crudo',         tags: ['LT-001'], vars: ['TK_ACEITE'] },
    'FL-01': { label: 'Filtro de Aceite',               tags: ['PT-001'], vars: ['FILTRADO'] },
    'B-01':  { label: 'Bomba de Transferencia',         tags: ['ST-001'], vars: ['BOMBEO'] },
    'PLC-1': { label: 'Panel de Control',               tags: ['XT-001'], vars: ['CONTROL_1'] },
    'TK-02': { label: 'Tanque de Aceite Filtrado',      tags: ['LT-002'], vars: ['TK_ACE_FILTRADO'] },
    'TK-03': { label: 'Tanque de Metanol',              tags: ['LT-003'], vars: ['TK_METANOL'] },
    'TK-04': { label: 'Tanque de NaOH',                 tags: ['LT-004'], vars: ['TK_NAOH'] },
    'HX-01': { label: 'Intercambiador de Calor',        tags: ['TT-001'], vars: ['INT_CALOR'] },
    'SC-01': { label: 'Sistema de Circulación',         tags: ['PT-002'], vars: ['SIS_CIRCULACION'] },
    'SL-01': { label: 'Línea de Salida de Alcoxido',    tags: ['FT-001'], vars: ['SAL_ALCOXIDO'] },
    'SL-02': { label: 'Línea de Salida de Aceite',      tags: ['FT-002'], vars: ['SAL_ACEITE'] },
  };
  window.EQUIPMENT_REGISTRY = EQUIPMENT_REGISTRY;

  function _defDate(day) {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  const TECH_NAMES = { SEB: 'Sebastian', PAO: 'Paola', YEN: 'Yenevid' };

  const defaultEvents = [
    { id: 'e1', date: _defDate(7),  title: 'Revisión Tanque Aceite Crudo',  type: 'danger',  time: '',      desc: 'Nivel crítico detectado por alarma en TK-01', tech: 'SEB', status: 'pending', equipment: 'TK-01' },
    { id: 'e2', date: _defDate(8),  title: 'Limpieza Filtro Aceite',        type: 'primary', time: '08:00', desc: 'Mantenimiento preventivo programado',          tech: 'PAO', status: 'pending', equipment: 'FL-01' },
    { id: 'e3', date: _defDate(12), title: 'Calibración Bomba B-01',        type: 'warning', time: '14:00', desc: 'Revisión trimestral de bomba de transferencia', tech: 'YEN', status: 'pending', equipment: 'B-01'  },
    { id: 'e4', date: _defDate(18), title: 'Inspección Intercambiador',     type: 'warning', time: '09:00', desc: 'Limpieza química de intercambiador de calor',   tech: 'SEB', status: 'pending', equipment: 'HX-01' },
    { id: 'e5', date: _defDate(4),  title: 'Verificación Panel Control',    type: 'success', time: '',      desc: 'Calibración de sensores del PLC-1 realizada',  tech: 'PAO', status: 'done',    equipment: 'PLC-1'},
    { id: 'e6', date: _defDate(1),  title: 'Revisión Sistema Circulación',  type: 'danger',  time: '10:00', desc: 'Presión anormal detectada en SC-01',            tech: 'YEN', status: 'done',    equipment: 'SC-01' },
  ];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultEvents;
    } catch { return defaultEvents; }
  }

  function save(events) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch {}
  }

  // ─── Health Score ────────────────────────────────────────────────
  function _calcHealthScore(equipId) {
    const equip = EQUIPMENT_REGISTRY[equipId];
    if (!equip || !equip.vars.length) return null;
    const pv = window.processVars || {};
    const ad = window.alarmData || [];
    let score = 0;
    let count = 0;
    equip.vars.forEach(varId => {
      const v = pv[varId];
      if (!v || typeof v.val !== 'number') return;
      count++;
      const val = v.val;
      const min = typeof v.min === 'number' ? v.min : 0;
      const max = typeof v.max === 'number' ? v.max : 100;
      const range = max - min || 1;
      // Check alarm
      const inAlarm = ad.some(a => a.id === varId || a.tag === varId);
      if (inAlarm) { score += 0; return; }
      // Position in range: 0% at min, 100% at max, ideal at 50%
      const pct = (val - min) / range;
      // Score based on distance from ideal midpoint
      const midpoint = 0.5;
      const dist = Math.abs(pct - midpoint);
      const varScore = Math.max(0, 100 - dist * 200); // 0 at edges, 100 at midpoint
      score += varScore;
    });
    return count > 0 ? Math.round(score / count) : null;
  }

  // ─── Reporte ─────────────────────────────────────────────────────
  function generateReport() {
    const events = load();
    const pv = window.processVars || {};
    const ad = window.alarmData || [];
    const now = new Date();

    const rows = Object.entries(EQUIPMENT_REGISTRY).map(([id, equip]) => {
      const pending = events.filter(e => e.equipment === id && e.status !== 'done');
      const lastDone = events.filter(e => e.equipment === id && e.status === 'done')
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      const next = pending.sort((a, b) => a.date.localeCompare(b.date))[0];
      const score = _calcHealthScore(id);
      const inAlarm = equip.vars.some(function (varId) {
        return ad.some(function (a) {
          if (a.id === varId || a.tag === varId) return true;
          if (a.id.indexOf('|') > -1) return a.id.split('|')[0] === varId;
          return false;
        });
      });

      // Live values
      const liveVals = equip.vars.map(varId => {
        const v = pv[varId];
        if (!v || typeof v.val !== 'number') return null;
        const inA = ad.some(function (a) {
          if (a.id === varId || a.tag === varId) return true;
          if (a.id.indexOf('|') > -1) return a.id.split('|')[0] === varId;
          return false;
        });
        return { varId, val: v.val, unit: v.unit || '', inAlarm: inA };
      }).filter(Boolean);

      return { id, equip, pending, lastDone, next, score, inAlarm, liveVals };
    });

    return {
      generatedAt: now,
      totalEvents: events.length,
      pendingCount: events.filter(e => e.status !== 'done').length,
      doneCount: events.filter(e => e.status === 'done').length,
      overdueCount: events.filter(e => { const d = new Date(e.date + 'T12:00:00'); return d < now && e.status !== 'done'; }).length,
      overallHealth: rows.filter(r => r.score !== null).length > 0
        ? Math.round(rows.filter(r => r.score !== null).reduce((s, r) => s + r.score, 0) / rows.filter(r => r.score !== null).length)
        : null,
      rows,
    };
  }

  function renderReport() {
    const report = generateReport();
    let existing = document.getElementById('calReportModal');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'calReportModal';
      existing.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:none;align-items:center;justify-content:center;z-index:9000';
      document.body.appendChild(existing);
    }

    const colorDot = (ok) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${ok ? 'var(--success)' : 'var(--danger)'};flex-shrink:0"></span>`;

    const rowsHtml = report.rows.map(r => {
      const scoreColor = r.score === null ? 'var(--text-muted)' : r.score >= 80 ? 'var(--success)' : r.score >= 50 ? 'var(--accent-amber)' : 'var(--danger)';
      const scoreBar = r.score !== null
        ? `<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden"><div style="width:${r.score}%;height:100%;background:${scoreColor};border-radius:3px;transition:width 0.5s"></div></div><span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${scoreColor};font-weight:600;min-width:32px;text-align:right">${r.score}%</span></div>`
        : `<span style="font-size:11px;color:var(--text-muted)">—</span>`;

      const liveStr = r.liveVals.length > 0
        ? r.liveVals.map(lv =>
            `<span style="font-size:11px;color:${lv.inAlarm ? 'var(--danger)' : 'var(--text-secondary)'};font-family:'JetBrains Mono',monospace">${lv.varId}: ${lv.val.toFixed(1)} ${lv.unit}</span>`
          ).join(' · ')
        : '<span style="font-size:11px;color:var(--text-muted)">sin datos</span>';

      const lastStr = r.lastDone
        ? `<span style="font-size:11px;color:var(--text-muted)">Último: ${new Date(r.lastDone.date + 'T12:00:00').toLocaleDateString('es-CO')}</span>`
        : '<span style="font-size:11px;color:var(--text-muted)">Sin historial</span>';

      const nextStr = r.next
        ? `<span style="font-size:11px;color:${r.inAlarm ? 'var(--danger)' : 'var(--text-secondary)'};font-family:'JetBrains Mono',monospace">Próximo: ${new Date(r.next.date + 'T12:00:00').toLocaleDateString('es-CO')} — ${r.next.title}</span>`
        : '<span style="font-size:11px;color:var(--success)">Sin pendientes</span>';

      const alarmBadge = r.inAlarm
        ? '<span style="font-size:9px;padding:2px 7px;background:rgba(239,68,68,0.15);color:var(--danger);border-radius:4px;font-weight:600;font-family:\'JetBrains Mono\',monospace;margin-left:8px">🔴 ALARMA</span>'
        : '';

      return `
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:180px 1fr 120px;gap:12px;align-items:center">
          <div>
            <div style="font-weight:600;font-size:13px;color:var(--text-primary)">${r.id} — ${r.equip.label}${alarmBadge}</div>
            <div style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${r.equip.tags.join(', ')}</div>
          </div>
          <div>
            <div style="display:flex;flex-wrap:wrap;gap:4px 12px">${liveStr}</div>
            <div style="display:flex;gap:12px;margin-top:4px">${lastStr} · ${nextStr}</div>
          </div>
          <div style="text-align:right">${scoreBar}</div>
        </div>`;
    }).join('');

    const overallColor = report.overallHealth === null ? 'var(--text-muted)' : report.overallHealth >= 80 ? 'var(--success)' : report.overallHealth >= 50 ? 'var(--accent-amber)' : 'var(--danger)';

    existing.innerHTML = `
      <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:16px;width:95%;max-width:860px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(0,0,0,0.5)">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px 16px;border-bottom:1px solid var(--border);flex-shrink:0">
          <div>
            <h4 style="margin:0;font-size:16px;font-weight:700;color:var(--text-primary)">Reporte de Mantenimiento</h4>
            <div style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;margin-top:2px">${report.generatedAt.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <div style="text-align:right">
              <div style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">SALUD GENERAL</div>
              <div style="font-size:22px;font-weight:700;color:${overallColor};font-family:'Rajdhani',sans-serif">${report.overallHealth !== null ? report.overallHealth + '%' : '—'}</div>
            </div>
            <button onclick="this.closest('#calReportModal').style.display='none'"
              style="background:none;border:none;color:var(--text-muted);font-size:22px;cursor:pointer;line-height:1;padding:4px">×</button>
          </div>
        </div>
        <div style="display:flex;gap:16px;padding:14px 24px;border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap">
          <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:10px;color:var(--accent-amber);font-family:'JetBrains Mono',monospace">PENDIENTES</div><div style="font-size:18px;font-weight:700;color:var(--accent-amber)">${report.pendingCount}</div></div>
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:10px;color:var(--danger);font-family:'JetBrains Mono',monospace">VENCIDOS</div><div style="font-size:18px;font-weight:700;color:var(--danger)">${report.overdueCount}</div></div>
          <div style="background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:10px;color:var(--success);font-family:'JetBrains Mono',monospace">COMPLETADOS</div><div style="font-size:18px;font-weight:700;color:var(--success)">${report.doneCount}</div></div>
          <div style="background:rgba(99,139,255,0.1);border:1px solid rgba(99,139,255,0.2);border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:10px;color:var(--primary);font-family:'JetBrains Mono',monospace">TOTAL EVENTOS</div><div style="font-size:18px;font-weight:700;color:var(--primary)">${report.totalEvents}</div></div>
        </div>
        <div style="overflow-y:auto;flex:1">${rowsHtml}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end;padding:14px 24px;border-top:1px solid var(--border);flex-shrink:0">
          <button onclick="window.print()"
            style="background:none;border:1px solid var(--border);color:var(--text-secondary);border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer">🖨 Imprimir</button>
          <button onclick="this.closest('#calReportModal').style.display='none'"
            style="background:var(--primary);border:none;color:#fff;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer">Cerrar</button>
        </div>
      </div>`;
    existing.style.display = 'flex';
  }

  // ─── Public API ──────────────────────────────────────────────────
  const api = {
    getEquipmentList() { return EQUIPMENT_REGISTRY; },
    getEquipmentByCode(code) { return EQUIPMENT_REGISTRY[code] || null; },
    getHealthScore: _calcHealthScore,
    generateReport,
    renderReport,

    getAll() { return load(); },

    getByDate(dateStr) {
      return load().filter(e => e.date === dateStr);
    },

    getByMonth(year, month) {
      const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
      return load().filter(e => e.date.startsWith(prefix));
    },

    add(event) {
      const events = load();
      event.id = 'e' + Date.now();
      event.status = event.status || 'pending';
      event.equipment = event.equipment || '';
      events.push(event);
      save(events);
      api.refresh();
      if (typeof window.showNotif === 'function') {
        window.showNotif('Evento "' + event.title + '" agregado', 'success');
      }
      return event;
    },

    update(id, changes) {
      const events = load();
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) return null;
      events[idx] = Object.assign({}, events[idx], changes);
      save(events);
      api.refresh();
      if (typeof window.showNotif === 'function') {
        window.showNotif('Evento actualizado', 'info');
      }
      return events[idx];
    },

    delete(id) {
      const events = load().filter(e => e.id !== id);
      save(events);
      api.refresh();
      if (typeof window.showNotif === 'function') {
        window.showNotif('Evento eliminado', 'info');
      }
    },

    markDone(id) {
      api.update(id, { status: 'done' });
      if (typeof window.showNotif === 'function') {
        window.showNotif('Evento marcado como completado ✓', 'success');
      }
    },

    refresh() {
      if (typeof window.renderCalWithManager === 'function') {
        window.renderCalWithManager();
      }
      api.renderEventList();
    },

    renderEventList() {
      const container = document.getElementById('calEventList');
      if (!container) return;

      const events = load()
        .sort((a, b) => {
          if (a.status === 'done' && b.status !== 'done') return 1;
          if (a.status !== 'done' && b.status === 'done') return -1;
          return new Date(a.date) - new Date(b.date);
        });

      const typeColors = {
        danger:  'var(--accent-red)',
        warning: 'var(--accent-amber)',
        primary: 'var(--primary)',
        success: 'var(--accent-green)',
      };

      const typeLabels = {
        danger: 'URGENTE', warning: 'PREVENTIVO',
        primary: 'INSPECCIÓN', success: 'COMPLETADO',
      };

      const ad = window.alarmData || [];

      container.innerHTML = events.map(e => {
        const color = typeColors[e.type] || 'var(--primary)';
        const label = typeLabels[e.type] || e.type.toUpperCase();
        const date = new Date(e.date + 'T12:00:00');
        const dayStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).toUpperCase();
        const isDone = e.status === 'done';
        const equip = e.equipment ? EQUIPMENT_REGISTRY[e.equipment] : null;

        // Health score for this equipment
        const score = e.equipment ? _calcHealthScore(e.equipment) : null;
        const scoreColor = score === null ? null : score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--accent-amber)' : 'var(--danger)';

        // Check if equipment has active alarms
        const hasAlarm = equip ? equip.vars.some(function (varId) {
          return ad.some(function (a) {
            if (a.id === varId || a.tag === varId) return true;
            if (a.id.indexOf('|') > -1) return a.id.split('|')[0] === varId;
            return false;
          });
        }) : false;

        return `
          <div class="cal-event-row" data-equipment="${e.equipment || ''}"
            style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start;${isDone ? 'opacity:0.55' : ''};cursor:${e.equipment ? 'pointer' : 'default'}"
            ${e.equipment ? `onclick="CalendarManager.selectEquipment('${e.equipment}')"` : ''}>
            <div style="width:3px;border-radius:2px;background:${color};align-self:stretch;flex-shrink:0"></div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${e.title}</span>
                ${hasAlarm ? '<span style="font-size:9px;padding:1px 6px;background:rgba(239,68,68,0.15);color:var(--danger);border-radius:3px;font-weight:600">🔴 ALARMA</span>' : ''}
                ${score !== null ? `<span style="font-size:9px;padding:1px 6px;background:${scoreColor}22;color:${scoreColor};border-radius:3px;font-weight:600;font-family:'JetBrains Mono',monospace">${score}%</span>` : ''}
              </div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${color}">${isDone ? '✓ COMPLETADO' : (e.time ? e.date.slice(5).split('-').reverse().join(' ') + ' · ' + e.time : dayStr)}</div>
              ${e.desc ? `<div style="font-size:11px;color:var(--text-muted);margin-top:3px">${e.desc}</div>` : ''}
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px;font-family:'JetBrains Mono',monospace">${e.equipment ? e.equipment + ' — ' + EQUIPMENT_REGISTRY[e.equipment]?.tags.join(', ') + ' · ' : ''}Téc: ${TECH_NAMES[e.tech] || e.tech || '—'}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0;align-items:flex-end">
              <span style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--text-muted)">${dayStr}</span>
              ${!isDone ? `<button onclick="event.stopPropagation();CalendarManager.markDone('${e.id}')" title="Marcar completado"
                style="background:var(--accent-green);border:none;color:#fff;border-radius:4px;padding:2px 7px;font-size:10px;cursor:pointer;font-weight:600">✓</button>` : ''}
              <button onclick="event.stopPropagation();CalendarManager.openEdit('${e.id}')" title="Editar"
                style="background:none;border:1px solid var(--border);color:var(--text-secondary);border-radius:4px;padding:2px 7px;font-size:10px;cursor:pointer">✎</button>
              <button onclick="event.stopPropagation();CalendarManager.delete('${e.id}')" title="Eliminar"
                style="background:none;border:1px solid rgba(239,68,68,0.3);color:var(--accent-red);border-radius:4px;padding:2px 7px;font-size:10px;cursor:pointer">✕</button>
            </div>
          </div>`;
      }).join('');
    },

    // ─── scadaBus integration ───────────────────────────────────────
    selectEquipment(code) {
      const equip = EQUIPMENT_REGISTRY[code];
      if (!equip) return;
      if (typeof scadaBus !== 'undefined') {
        scadaBus.emit('tag:select', { tag: equip.tags[0], source: 'calendar' });
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Equipo ${code} — ${equip.label} seleccionado`, 'info');
        }
      }
      // Switch to P&ID tab if available
      if (typeof showTab === 'function') showTab('process');
    },

    openEdit(id) {
      const events = load();
      const e = id ? events.find(ev => ev.id === id) : null;
      let modal = document.getElementById('calEventModal');
      if (!modal) { api.createModal(); modal = document.getElementById('calEventModal'); }
      if (!modal) return;

      document.getElementById('calEvId').value        = e ? e.id    : '';
      document.getElementById('calEvTitle').value     = e ? e.title : '';
      document.getElementById('calEvDate').value      = e ? e.date  : new Date().toISOString().slice(0, 10);
      document.getElementById('calEvTime').value      = e ? (e.time || '') : '';
      document.getElementById('calEvType').value      = e ? e.type  : 'warning';
      document.getElementById('calEvDesc').value      = e ? (e.desc || '') : '';
      document.getElementById('calEvTech').value      = e ? (e.tech || '') : 'SEB';
      if (document.getElementById('calEvEquip')) {
        document.getElementById('calEvEquip').value   = e ? (e.equipment || '') : '';
      }
      modal.style.display = 'flex';
    },

    openAdd() { api.openEdit(null); },

    saveModal() {
      const id    = document.getElementById('calEvId').value;
      const data  = {
        title:     document.getElementById('calEvTitle').value.trim(),
        date:      document.getElementById('calEvDate').value,
        time:      document.getElementById('calEvTime').value,
        type:      document.getElementById('calEvType').value,
        desc:      document.getElementById('calEvDesc').value.trim(),
        tech:      document.getElementById('calEvTech').value,
        equipment: document.getElementById('calEvEquip') ? document.getElementById('calEvEquip').value : '',
      };
      if (!data.title || !data.date) {
        if (typeof window.showNotif === 'function') window.showNotif('Título y fecha son obligatorios', 'danger');
        return;
      }
      if (id) { api.update(id, data); } else { api.add(data); }
      document.getElementById('calEventModal').style.display = 'none';
    },

    createModal() {
      if (document.getElementById('calEventModal')) return;
      const equipOptions = Object.entries(EQUIPMENT_REGISTRY)
        .map(([code, eq]) => `<option value="${code}">${code} — ${eq.label}</option>`)
        .join('');

      const modal = document.createElement('div');
      modal.id = 'calEventModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;z-index:8000';
      modal.innerHTML = `
        <div style="background:var(--bg-card2);border:1px solid var(--border);border-radius:16px;padding:28px;width:100%;max-width:460px;box-shadow:0 16px 48px rgba(0,0,0,0.5)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h5 style="margin:0;font-size:16px;font-weight:700;color:var(--text-primary)">Evento de Mantenimiento</h5>
            <button onclick="document.getElementById('calEventModal').style.display='none'"
              style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;line-height:1">×</button>
          </div>
          <input type="hidden" id="calEvId">
          <div style="display:flex;flex-direction:column;gap:14px">
            <div>
              <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;color:var(--text-muted);display:block;margin-bottom:5px">TÍTULO *</label>
              <input id="calEvTitle" class="form-control" placeholder="Ej: Revisión Bomba B-204"
                style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);font-size:13px">
            </div>
            <div>
              <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;color:var(--text-muted);display:block;margin-bottom:5px">EQUIPO ASOCIADO</label>
              <select id="calEvEquip" class="form-select"
                style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);font-size:13px">
                <option value="">— Sin equipo —</option>
                ${equipOptions}
              </select>
              <div style="font-size:10px;color:var(--text-muted);margin-top:3px">Al seleccionar un equipo, el evento se vincula al P&amp;ID y scadaBus</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;color:var(--text-muted);display:block;margin-bottom:5px">FECHA *</label>
                <input id="calEvDate" type="date" class="form-control"
                  style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);font-size:13px">
              </div>
              <div>
                <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;color:var(--text-muted);display:block;margin-bottom:5px">HORA</label>
                <input id="calEvTime" type="time" class="form-control"
                  style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);font-size:13px">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div>
                <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;color:var(--text-muted);display:block;margin-bottom:5px">TIPO</label>
                <select id="calEvType" class="form-select"
                  style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);font-size:13px">
                  <option value="warning">Preventivo</option>
                  <option value="danger">Urgente</option>
                  <option value="primary">Inspección</option>
                  <option value="success">Completado</option>
                </select>
              </div>
              <div>
                <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;color:var(--text-muted);display:block;margin-bottom:5px">TÉCNICO</label>
                <select id="calEvTech" class="form-select"
                  style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);font-size:13px">
                  <option value="SEB">Sebastian</option>
                  <option value="PAO">Paola</option>
                  <option value="YEN">Yenevid</option>
                </select>
              </div>
            </div>
            <div>
              <label style="font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;color:var(--text-muted);display:block;margin-bottom:5px">DESCRIPCIÓN</label>
              <textarea id="calEvDesc" class="form-control" rows="2" placeholder="Detalles del evento..."
                style="background:var(--bg-card);border-color:var(--border);color:var(--text-primary);font-size:13px;resize:none"></textarea>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
            <button onclick="document.getElementById('calEventModal').style.display='none'"
              style="background:none;border:1px solid var(--border);color:var(--text-secondary);border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer">Cancelar</button>
            <button onclick="CalendarManager.saveModal()"
              style="background:var(--primary);border:none;color:#fff;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer">Guardar</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    },

    getDotsForMonth(year, month) {
      const events = api.getByMonth(year, month);
      const dots = {};
      const ad = window.alarmData || [];
      events.forEach(e => {
        const day = parseInt(e.date.split('-')[2]);
        // Upgrade dot to danger if equipment has active alarm
        let type = e.type;
        if (e.equipment && EQUIPMENT_REGISTRY[e.equipment]) {
          const hasAlarm = EQUIPMENT_REGISTRY[e.equipment].vars.some(function (varId) {
            return ad.some(function (a) {
              if (a.id === varId || a.tag === varId) return true;
              // Match sub-var alarms by tagId prefix
              if (a.id.indexOf('|') > -1) {
                var parts = a.id.split('|');
                return parts[0] === varId;
              }
              return false;
            });
          });
          if (hasAlarm) type = 'danger';
        }
        if (!dots[day] || type === 'danger') dots[day] = type;
      });
      return dots;
    },

  init() {
    api.createModal();
    api.renderEventList();
    window.CalendarManager = api;

    // Listen for alarm events to auto-schedule maintenance
    if (typeof window.scadaBus !== 'undefined') {
      window.scadaBus.on('alarm:triggered', (detail) => {
        // Extract tagId (supports both main vars and sub-var overrides)
        var tagId = detail.varId;
        if (tagId.indexOf('|') > -1) tagId = tagId.split('|')[0];

        // Find equipment associated with the tag
        let equipId = null;
        Object.entries(EQUIPMENT_REGISTRY).forEach(([code, equip]) => {
          if (equip.tags.includes(detail.tag) || equip.vars.includes(tagId) || equip.vars.includes(detail.varId)) {
            equipId = code;
          }
        });
        if (!equipId) return;

        const equip = EQUIPMENT_REGISTRY[equipId];
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDate = nextDay.toISOString().slice(0, 10);

        const event = {
          id: 'auto_' + Date.now(),
          date: detail.priority === 'critical' ? nextDate : today,
          title: `⚠ Mantenimiento Urgente: ${tagId} — ${equip.label}`,
          type: detail.priority === 'critical' ? 'danger' : 'warning',
          desc: detail.desc,
          tech: 'SEB',
          status: 'pending',
          equipment: equipId,
          autoGenerated: true,
          sourceTag: tagId
        };

        api.add(event);
        api.renderEventList();
        if (typeof window.showNotif === 'function') {
          window.showNotif(`Mantenimiento programado automáticamente para ${equip.label}`, 'info');
        }
      });
    }
  }
  };

  return api;
})();

document.addEventListener('DOMContentLoaded', () => {
  CalendarManager.init();
});