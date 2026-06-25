/**
 * SpY — historicos-manager.js  v3.0
 * Bitácora de eventos de alarma con integración scadaBus.
 * Lee el historial de localStorage (misma clave que alarm-manager.js).
 */

const HistManager = {
  STORAGE_KEY: 'scada_alarm_history',

  init() {
    this.render();
    setInterval(() => this.render(), 3000);
    window.HistManager = this;
  },

  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch { return []; }
  },

  clearHistory() {
    if (!confirm('¿Limpiar todo el historial de alarmas?')) return;
    try { localStorage.removeItem(this.STORAGE_KEY); } catch {}
    this.render();
    if (typeof window.showNotif === 'function') {
      window.showNotif('Historial de alarmas limpiado', 'info');
    }
  },

  selectTag(tag) {
    if (tag && window.scadaBus) {
      window.scadaBus.emit('tag:select', { tag, source: 'history' });
    }
  },

  render() {
    const container = document.getElementById('historicosContainer');
    if (!container) return;

    const entries = this.getHistory();
    const total = entries.length;

    // Resumen
    const alarmCount = entries.filter(e => e.action === 'ALARMA').length;
    const ackCount = entries.filter(e => e.action === 'ACK').length;
    const resolvedCount = entries.filter(e => e.action === 'RESUELTA' || e.action === 'RESOLVED').length;

    let html = `
      <div class="hist-summary">
        <span class="hist-summary-item" style="color:var(--text-primary)">● Total: ${total}</span>
        <span class="hist-summary-item" style="color:var(--accent-red)">● Alarmas: ${alarmCount}</span>
        <span class="hist-summary-item" style="color:var(--accent-amber)">● ACK: ${ackCount}</span>
        <span class="hist-summary-item" style="color:var(--accent-green)">● Resueltas: ${resolvedCount}</span>
      </div>
      <div class="hist-toolbar">
        <div class="hist-search-wrap">
          <i data-feather="search" style="width:14px;height:14px;color:var(--text-dim);flex-shrink:0"></i>
          <input type="text" id="histSearch" placeholder="Filtrar por variable o descripción…" class="hist-search-input"
            oninput="HistManager.render()">
        </div>
        ${total > 0 ? `<button onclick="HistManager.clearHistory()" class="hist-clear-btn" title="Limpiar historial">
          <i data-feather="trash-2" style="width:12px;height:12px"></i> Limpiar
        </button>` : ''}
      </div>
    `;

    if (total === 0) {
      html += `<div class="hist-empty">
        <i data-feather="clock" style="width:48px;height:48px;opacity:0.15"></i>
        <p>Sin eventos registrados.<br>Las alarmas aparecerán aquí automáticamente cuando una variable salga de su rango.</p>
      </div>`;
    } else {
      const filter = (document.getElementById('histSearch')?.value || '').toLowerCase();
      const filtered = filter
        ? entries.filter(e =>
            (e.tag || '').toLowerCase().includes(filter) ||
            (e.note || '').toLowerCase().includes(filter)
          )
        : entries;

      if (filtered.length === 0) {
        html += `<div class="hist-empty"><p>Sin resultados para <strong>"${filter}"</strong></p></div>`;
      } else {
        html += `<div class="hist-table-wrap"><table class="hist-table">
          <thead>
            <tr>
              <th style="width:80px">HORA</th>
              <th style="width:90px">TIPO</th>
              <th style="width:120px">VARIABLE</th>
              <th>DESCRIPCIÓN</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(e => {
              const isAlarm = e.action === 'ALARMA';
              const isAck = e.action === 'ACK';
              const isResolved = e.action === 'RESUELTA' || e.action === 'RESOLVED';
              const acColor = isAlarm ? 'var(--accent-red)' : (isAck ? 'var(--accent-amber)' : 'var(--accent-green)');
              const acLabel = isAlarm ? 'ALARMA' : (isAck ? 'ACK' : 'RESUELTA');
              return `<tr class="hist-row" onclick="HistManager.selectTag('${e.tag || ''}')" title="Click: ver en P&amp;ID / HMI">
                <td class="hist-time">${e.ts || ''}</td>
                <td><span class="hist-badge" style="background:${acColor}18;color:${acColor};border:1px solid ${acColor}33">${acLabel}</span></td>
                <td class="hist-tag">${e.tag || '—'}</td>
                <td class="hist-note">${e.note || ''}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>`;
      }
    }

    container.innerHTML = html;
    if (typeof feather !== 'undefined') feather.replace();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => HistManager.init(), 400);
});
