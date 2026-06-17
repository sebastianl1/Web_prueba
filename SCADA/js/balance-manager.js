const BalanceManager = (function () {

  const PHYS = {
    CP_ACEITE: 2.1, CP_METANOL: 2.5, CP_BIODIESEL: 1.8,
    RHO_ACEITE: 920, RHO_BIODIESEL: 880, RHO_METANOL: 790,
    H_REACCION: -180, G: 9.81,
  };

  const GEOM = {
    'TK-01': { D: 3.5, H: 6, V: 30000 },
    'TK-02': { D: 3.0, H: 5, V: 20000 },
    'TK-03': { D: 2.5, H: 5, V: 15000 },
    'TK-04': { D: 1.8, H: 3, V: 5000 },
    'HX-01': { A: 45, U: 1.2 },
    'FL-01': { A_filt: 2.5, porosidad: 0.4, espesor: 0.05 },
    'B-01':  { potencia: 7.5, eficiencia: 0.72, D_tub: 0.1, L_tub: 50, f: 0.02 },
    'SC-01': { D: 0.08, L: 100, f: 0.025 },
  };

  const VAR_MAP = {
    tanqueAceite:     ['TK_ACEITE'],
    tanqueAceiteFilt: ['TK_ACE_FILTRADO'],
    tanqueMetanol:    ['TK_METANOL'],
    tanqueNaOH:       ['TK_NAOH'],
    intercambiador:   ['INT_CALOR'],
    filtrado:         ['FILTRADO'],
    bombeo:           ['BOMBEO'],
    circulacion:      ['SIS_CIRCULACION'],
    salidaAlcoxido:   ['SAL_ALCOXIDO'],
    salidaAceite:     ['SAL_ACEITE'],
  };

  let _lastResults = {};

  function pv(id) { return (window.processVars && window.processVars[id]) || {}; }
  function pvVal(id, fallback) {
    const v = pv(id).val;
    return v !== undefined && v !== null && isFinite(v) ? v : fallback;
  }

  function balanceTanqueAceite() {
    const nivel = pvVal('TK_ACEITE', 55) / 100;
    const V = 30000;
    const rho = PHYS.RHO_ACEITE;
    const m_acum = nivel * V * rho;
    return {
      title: 'TK-01 Tanque de Aceite — Balance de Masa',
      diffEq: 'dm/dt = ρ·Q_ent − ρ·Q_sal',
      terms: [
        { sym: 'ρ', label: 'Densidad aceite', val: rho, unit: 'kg/m³', varId: null },
        { sym: 'V', label: 'Capacidad total', val: V, unit: 'L', varId: null },
        { sym: 'h/L', label: 'Nivel operación', val: (nivel * 100).toFixed(1), unit: '%', varId: 'TK_ACEITE' },
        { sym: 'm_acum', label: 'Masa acumulada', val: (m_acum / 1000).toFixed(1), unit: 'kg × 10³', varId: null },
      ],
      result: `${(m_acum / 1000).toFixed(1)} × 10³ kg`,
      estado: nivel > 0.8 ? 'ALTO' : nivel > 0.15 ? 'NORMAL' : 'BAJO',
      refTag: 'TK-01',
    };
  }

  function balanceIntercambiador() {
    const T_sal = pvVal('INT_CALOR', 58);
    const T_ent = 35;
    const dT = T_sal - T_ent;
    const U = GEOM['HX-01'].U;
    const A = GEOM['HX-01'].A;
    const Q = U * A * dT;
    return {
      title: 'HX-01 Intercambiador — Transferencia de Calor',
      diffEq: 'Q = U · A · ΔT',
      terms: [
        { sym: 'U', label: 'Coef. global transf.', val: U, unit: 'kW/m²·K', varId: null },
        { sym: 'A', label: 'Área intercambio', val: A, unit: 'm²', varId: null },
        { sym: 'ΔT', label: 'Diferencia térmica', val: dT.toFixed(1), unit: 'K', varId: null },
        { sym: 'T_sal', label: 'Temp. salida', val: T_sal, unit: '°C', varId: 'INT_CALOR' },
        { sym: 'Q_transf', label: 'Calor transferido', val: Q.toFixed(1), unit: 'kW', varId: null },
      ],
      result: `${Q.toFixed(1)} kW`,
      estado: Q > 50 ? 'EFICIENCIA NOMINAL' : Q > 25 ? 'REQUIERE LIMPIEZA' : 'INCRUSTACIÓN CRÍTICA',
      refTag: 'HX-01',
    };
  }

  function balanceBombeo() {
    const estado = pvVal('BOMBEO', 1);
    const Q_nom = 40 / 3600;
    const rho = PHYS.RHO_ACEITE;
    const g = PHYS.G;
    const H = 30;
    const P_hid = rho * g * H * Q_nom / 1000;
    const P_motor = GEOM['B-01'].potencia;
    const eff = GEOM['B-01'].eficiencia;
    return {
      title: 'B-01 Bomba de Transferencia — Potencia Hidráulica',
      diffEq: 'P_hid = ρ·g·H·Q / η',
      terms: [
        { sym: 'ρ', label: 'Densidad fluido', val: rho, unit: 'kg/m³', varId: null },
        { sym: 'g', label: 'Gravedad', val: g, unit: 'm/s²', varId: null },
        { sym: 'H', label: 'Altura dinámica', val: H, unit: 'm', varId: null },
        { sym: 'Q', label: 'Caudal nominal', val: Q_nom, unit: 'm³/s', varId: null },
        { sym: 'η', label: 'Eficiencia motor', val: eff, unit: '', varId: null },
        { sym: 'Estado', label: 'Estado bomba', val: estado ? 'ON' : 'OFF', unit: '', varId: 'BOMBEO' },
        { sym: 'P_hid', label: 'Potencia hidráulica', val: P_hid.toFixed(2), unit: 'kW', varId: null },
        { sym: 'P_motor', label: 'Potencia motor', val: P_motor, unit: 'kW', varId: null },
      ],
      result: estado ? `${P_hid.toFixed(2)} kW (${(P_hid / P_motor * 100).toFixed(0)}% de carga)` : 'BOMBA DETENIDA',
      estado: estado ? 'OPERANDO' : 'DETENIDA',
      refTag: 'B-01',
    };
  }

  function balanceCirculacion() {
    const presion = pvVal('SIS_CIRCULACION', 2.5);
    const Q_circ = 2500 / 3600;
    const rho = PHYS.RHO_ACEITE;
    const D = GEOM['SC-01'].D;
    const v = Q_circ / (Math.PI * D * D / 4);
    const dP = GEOM['SC-01'].f * (GEOM['SC-01'].L / D) * (rho * v * v / 2) / 1e5;
    return {
      title: 'SC-01 Sistema de Circulación — Pérdida de Carga',
      diffEq: 'ΔP = f · (L/D) · (ρ·v²/2)',
      terms: [
        { sym: 'f', label: 'Factor de fricción', val: GEOM['SC-01'].f, unit: '', varId: null },
        { sym: 'L', label: 'Longitud tubería', val: GEOM['SC-01'].L, unit: 'm', varId: null },
        { sym: 'D', label: 'Diámetro tubería', val: D, unit: 'm', varId: null },
        { sym: 'v', label: 'Velocidad flujo', val: v.toFixed(2), unit: 'm/s', varId: null },
        { sym: 'Q', label: 'Caudal circulación', val: Q_circ, unit: 'm³/s', varId: null },
        { sym: 'P_sist', label: 'Presión del sistema', val: presion, unit: 'bar', varId: 'SIS_CIRCULACION' },
        { sym: 'ΔP_calc', label: 'Pérdida de carga', val: dP.toFixed(3), unit: 'bar', varId: null },
      ],
      result: `${presion.toFixed(2)} bar`,
      estado: presion > 4 ? 'PRESIÓN ALTA' : presion > 1 ? 'NORMAL' : 'PRESIÓN BAJA',
      refTag: 'SC-01',
    };
  }

  function computeAll() {
    _lastResults = {
      tanqueAceite:     balanceTanqueAceite(),
      intercambiador:   balanceIntercambiador(),
      bombeo:           balanceBombeo(),
      circulacion:      balanceCirculacion(),
    };
    return _lastResults;
  }

  function getLast() { return _lastResults; }

  return { computeAll, getLast, VAR_MAP };
})();

window.BalanceManager = BalanceManager;
