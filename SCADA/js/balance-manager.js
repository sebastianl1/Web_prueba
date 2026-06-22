function _num(v) {if (v === null || v === undefined || typeof v !== "number" || !isFinite(v)) return "0";if (v === 0) return "0";var abs = Math.abs(v);if (abs >= 10000 || abs < 0.001) {var exp = Math.floor(Math.log10(abs));var mant = v / Math.pow(10, exp);return mant.toFixed(2) + " \u00d7 10^{" + exp + "}";}if (abs >= 100) return v.toFixed(1);if (abs >= 1) return v.toFixed(2);if (abs >= 0.01) return v.toFixed(4);return v.toFixed(6);}
/**
 * NexSCADA — balance-manager.js  v8.1
 * Balance de Materia (Fick), Energía (Fourier) y Momentum (Newton)
 * por Proceso Unitario — valores reales de TAG_PROPERTIES_DB
 * Render con KaTeX · Actualización cada 2s
 * Cada tag → modal con ecuación del balance + datos reales + resultado coherente
 */
const BalanceManager = (function () {

  var _intervalId = null;
  var _rendered = false;
  var _currentPU = 'pu1';

  // ─── Constantes físicas ─────────────────────────────────────
  var PHYS = {
    RHO_ACEITE: 920, RHO_BIODIESEL: 880, RHO_METANOL: 791,
    G: 9.81,
  };

  // ─── Configuración por Proceso Unitario ──────────────────────
  var PU_INFO = {
    pu1: { label: 'Caracterización de Materia Prima', icon: '\u{1F6E5}\uFE0F', short: 'PU1',
      desc: 'Recepción, almacenamiento, filtrado y acondicionamiento del aceite vegetal crudo antes de la reacción.' },
    pu2: { label: 'Esterificación y Transesterificación', icon: '\u2697\uFE0F', short: 'PU2',
      desc: 'Reacción de transesterificación de triglicéridos con metanol para producir ésteres metílicos (biodiesel) y glicerina.' },
    pu3: { label: 'Purificación y Producto Final', icon: '\u{1F6E0}\uFE0F', short: 'PU3',
      desc: 'Lavado, secado y control de calidad del biodiesel para cumplir con la norma ASTM D6751.' },
  };

  // Tags de cada PU
  var PU_TAGS = {
    pu1: ['TK-001','FIL-001','P-001','TK-002','E.W-003','E-003','TK-003','TK-004','CLP-001','SALACE-001','ALCO-001'],
    pu2: ['EST-001','TRAN-001','SEP-001','GLI-001','PRO_DES-001','SIS_TRAN-001','SIS_BOM-001'],
    pu3: ['PRO_DES-003','PRO_FIN-001','SEC-001','SEC_COND-001','SIS_CIRC-001','VIS-001'],
  };

  // ─── Leyes de transferencia por PU ───────────────────────────
  // (fick) Balance de Materia — 1.ª Ley de Fick
  // (fourier) Balance de Energía — 2.ª Ley de Fourier
  // (newton) Balance de Momentum — Ley de Newton
  // Cada entrada: [tagId, descripción, [valores a mostrar]]
  // Cada valor: [categoría, key, unidad, label_corto]
  var PU_LAWS = {
    pu1: {
      fick: {
        title: '\u2696 1.\u00aa Ley de Fick — Transferencia de Masa',
        equation: 'J = -D_{AB} \\frac{dC}{dx} \\qquad \\sum m_{in} - \\sum m_{out} = m_{perdidas}',
        desc: 'Balance de masa en cada equipo del PU1. La diferencia entre entrada y salida representa las pérdidas por evaporación, sedimentos o fugas en el acondicionamiento de la materia prima.',
        tags: [
          ['TK-001', 'Recepción de aceite crudo', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['FIL-001', 'Filtración de sólidos y agua', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['P-001', 'Bombeo al acondicionamiento', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['CLP-001', 'Acondicionamiento final', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['SALACE-001', 'Salida a reactor', [
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
          ]],
          ['E.W-003', 'Circuito de agua térmica', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['E-003', 'Formación de alcóxido', [
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
          ]],
          ['TK-003', 'Dosificación de metanol', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['TK-004', 'Dosificación de KOH', [
            ['process', 'balance_materia_entrada', 'kg', 'Ent.'],
            ['process', 'balance_materia_salida', 'kg', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'kg', 'Per.'],
          ]],
          ['ALCO-001', 'Alcóxido hacia reactor', [
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
          ]],
        ],
      },
      fourier: {
        title: '\u{1F525} 2.\u00aa Ley de Fourier — Transferencia de Energía',
        equation: '\\dot{q} = -k \\, \\nabla T \\qquad Q_{entregado} - Q_{perdido} = Q_{útil}',
        desc: 'Balance energético del PU1: potencia de bombeo, calentamiento de reactivos, deshidratación del aceite y pérdidas térmicas en equipos y tuberías.',
        tags: [
          ['TK-001', 'Temperatura de conservación', [
            ['process', 'balance_energia', '°C', 'T'],
          ]],
          ['FIL-001', 'Pérdidas térmicas en filtro', [
            ['process', 'balance_energia_perdidas', 'MJ', 'Per.'],
          ]],
          ['P-001', 'Consumo del motor eléctrico', [
            ['process', 'balance_energia_consumo', 'kW', 'Cons.'],
            ['process', 'balance_energia_perdidas', 'MJ', 'Per.'],
          ]],
          ['E-003', 'Calor de formación de alcóxido', [
            ['process', 'balance_energia_calor', 'GJ', 'Calor'],
            ['process', 'balance_energia_perdidas', 'GJ', 'Per.'],
          ]],
          ['E.W-003', 'Transferencia térmica', [
            ['process', 'balance_energia_transferencia', 'GJ', 'Transf.'],
          ]],
          ['CLP-001', 'Deshidratación + secado', [
            ['process', 'balance_energia_deshidratacion', 'GJ', 'Desh.'],
            ['process', 'balance_energia_secado', 'GJ', 'Sec.'],
          ]],
          ['TK-003', 'Calentamiento de metanol', [
            ['process', 'balance_energia_calentamiento', 'GJ', 'Calor'],
          ]],
          ['TK-004', 'Calor de disolución de KOH', [
            ['process', 'balance_energia_calor', 'MJ', 'Calor'],
          ]],
          ['SALACE-001', 'Pérdidas en tubería de salida', [
            ['process', 'balance_energia_perdidas', 'MJ', 'Per.'],
          ]],
          ['ALCO-001', 'Pérdidas en tubería de alcóxido', [
            ['process', 'balance_energia_perdidas', 'GJ', 'Per.'],
          ]],
        ],
      },
      newton: {
        title: '\u{1F4A7} Ley de Newton — Transferencia de Momentum',
        equation: '\\tau = \\mu \\frac{dv}{dy} \\qquad \\Delta P_{total} = \\sum \\Delta P_i',
        desc: 'Caídas de presión acumuladas en el circuito de materia prima. La suma de ΔP de cada equipo determina la altura dinámica total que debe vencer la bomba.',
        tags: [
          ['TK-001', 'Presión hidrostática inicial', [
            ['process', 'balance_momentum', 'bar', 'P'],
          ]],
          ['FIL-001', 'ΔP a través del filtro', [
            ['process', 'balance_momentum_delta_p', 'bar', 'ΔP'],
          ]],
          ['P-001', 'ΔP en la bomba', [
            ['process', 'balance_momentum_delta_p', 'bar', 'ΔP'],
          ]],
          ['E-003', 'ΔP en el reactor de alcóxido', [
            ['process', 'balance_momentum_delta_p', 'bar', 'ΔP'],
            ['process', 'balance_momentum_caudal', 'L/min', 'Q'],
          ]],
          ['E.W-003', 'ΔP en intercambiador', [
            ['process', 'balance_momentum_delta_p', 'bar', 'ΔP'],
          ]],
          ['CLP-001', 'Regulación de válvulas', [
            ['process', 'balance_momentum_regulacion', '%', 'Reg.'],
          ]],
          ['TK-003', 'ΔP tanque de metanol', [
            ['process', 'balance_momentum_delta_p', 'bar', 'ΔP'],
          ]],
          ['SALACE-001', 'ΔP tubería de salida', [
            ['process', 'balance_momentum_delta_p', 'bar', 'ΔP'],
          ]],
          ['ALCO-001', 'ΔP + velocidad de flujo', [
            ['process', 'balance_momentum_delta_p', 'bar', 'ΔP'],
            ['process', 'balance_momentum_velocidad', 'm/s', 'v'],
          ]],
        ],
      },
    },
    pu2: {
      fick: {
        title: '\u2696 1.\u00aa Ley de Fick — Transferencia de Masa',
        equation: 'J = -D_{AB} \\frac{dC}{dx} \\qquad \\sum m_{in} = \\sum m_{out}',
        desc: 'Balance de materia en la esterificación y transesterificación. La masa de reactivos (aceite + metanol + alcóxido) se transforma en biodiesel, glicerina y desechos.',
        tags: [
          ['EST-001', 'Esterificación del aceite', [
            ['process', 'balance_materia_entrada', 'L', 'Aceite'],
            ['process', 'balance_materia_metanol', 'L', 'MeOH'],
          ]],
          ['TRAN-001', 'Transesterificación', [
            ['process', 'balance_materia_aceite', 'L', 'Aceite'],
            ['process', 'balance_materia_alcoxido', 'L', 'Alcóx.'],
            ['process', 'balance_materia_ester', 'L', 'Éster'],
            ['process', 'balance_materia_glicerina', 'L', 'Glic.'],
            ['process', 'balance_materia_desechos', 'L', 'Desech.'],
          ]],
          ['SEP-001', 'Separación éster/glicerina', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['GLI-001', 'Almacenamiento de glicerina', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['SIS_TRAN-001', 'Transferencia por tubería', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['PRO_DES-001', 'Acumulación de desechos', [
            ['process', 'balance_materia_acumulacion', 'L', 'Acum.'],
          ]],
        ],
      },
      fourier: {
        title: '\u{1F525} 2.\u00aa Ley de Fourier — Transferencia de Energía',
        equation: '\\dot{q} = -k \\, \\nabla T \\qquad k = A \\, e^{-E_a/(R\\,T)}',
        desc: 'Condiciones térmicas de los equipos de reacción. La temperatura sigue la ley de Arrhenius y determina la velocidad de conversión de triglicéridos a biodiesel.',
        tags: [
          ['EST-001', 'Temperatura de esterificación', [
            ['physical', 'temp_operacion', '°C', 'T'],
          ]],
          ['TRAN-001', 'Temperatura de reacción', [
            ['process', 'temp_operacion', '°C', 'T'],
          ]],
          ['SIS_BOM-001', 'Potencia instalada', [
            ['physical', 'potencia_total', 'kW', 'P'],
          ]],
        ],
      },
      newton: {
        title: '\u{1F4A7} Ley de Newton — Transferencia de Momentum',
        equation: 'P_h = \\rho \\, g \\, H \\, Q \\qquad \\tau = \\mu \\frac{dv}{dy}',
        desc: 'Potencia hidráulica del sistema de bombeo para recirculación de la mezcla de reacción. La fuerza viscosa (Newton) se opone al flujo en tuberías.',
        tags: [
          ['SIS_BOM-001', 'Potencia del sistema de bombeo', [
            ['physical', 'potencia_total', 'kW', 'P total'],
            ['physical', 'caudal_nominal', 'L/h', 'Q nom.'],
          ]],
        ],
      },
    },
    pu3: {
      fick: {
        title: '\u2696 1.\u00aa Ley de Fick — Transferencia de Masa',
        equation: 'J = -D_{AB} \\frac{dC}{dx} \\qquad \\sum m_{in} - \\sum m_{out} = m_{perdidas}',
        desc: 'Eliminación de metanol residual y agua por secado y condensación. El producto final de 760 L cumple la norma ASTM D6751.',
        tags: [
          ['SEC-001', 'Secado del biodiesel', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['SEC_COND-001', 'Condensación de vapores', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
            ['process', 'balance_materia_perdidas', 'L', 'Per.'],
          ]],
          ['PRO_FIN-001', 'Producto terminado', [
            ['process', 'balance_materia_salida', 'L', 'Sal.'],
          ]],
          ['PRO_DES-003', 'Desechos de purificación', [
            ['process', 'balance_materia_acumulacion', 'L', 'Acum.'],
          ]],
          ['VIS-001', 'Control de viscosidad', [
            ['process', 'balance_materia_entrada', 'L', 'Ent.'],
          ]],
        ],
      },
      fourier: {
        title: '\u{1F525} 2.\u00aa Ley de Fourier — Transferencia de Energía',
        equation: '\\dot{q} = -k \\, \\frac{dT}{dx} \\qquad Q_{cond} = \\dot{m} \\, \\Delta H_{vap}',
        desc: 'Transferencia de calor en los equipos de purificación. El gradiente térmico impulsa la evaporación del metanol residual y el secado del biodiesel.',
        tags: [
          ['SEC-001', 'Temperatura y presión de secado', [
            ['physical', 'temp_operacion', '°C', 'T'],
            ['physical', 'presion_operacion', 'bar', 'P'],
          ]],
          ['SEC_COND-001', 'Temperatura y presión de condensación', [
            ['physical', 'temp_operacion', '°C', 'T'],
            ['physical', 'presion_operacion', 'bar', 'P'],
          ]],
          ['SIS_CIRC-001', 'Control térmico del circuito', [
            ['physical', 'temp_control', '°C', 'T Ctrl'],
          ]],
        ],
      },
      newton: {
        title: '\u{1F4A7} Ley de Newton — Transferencia de Momentum',
        equation: '\\tau = \\mu \\frac{dv}{dy} \\qquad \\Delta P = f \\, \\frac{L}{D} \\, \\frac{\\rho v^2}{2}',
        desc: 'Condiciones de flujo en el circuito de purificación. La presión impulsa el biodiesel a través de secadores, condensadores y tuberías.',
        tags: [
          ['SEC-001', 'Presión de operación', [
            ['physical', 'presion_operacion', 'bar', 'P'],
          ]],
          ['SEC_COND-001', 'Presión de condensación', [
            ['physical', 'presion_operacion', 'bar', 'P'],
          ]],
          ['SIS_CIRC-001', 'Caudal y presión de circulación', [
            ['physical', 'caudal_nominal', 'L/h', 'Q'],
            ['physical', 'presion_operacion', 'bar', 'P'],
          ]],
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

  function _getStr(tagId, cat, key, fallback) {
    var tag = _getTag(tagId);
    if (!tag || !tag[cat]) return fallback;
    for (var i = 0; i < tag[cat].length; i++) {
      if (tag[cat][i].key === key) return tag[cat][i].value;
    }
    return fallback;
  }

  function _getValRaw(tagId, cat, key, fallback) {
    var tag = _getTag(tagId);
    if (!tag || !tag[cat]) return fallback;
    for (var i = 0; i < tag[cat].length; i++) {
      if (tag[cat][i].key === key) return tag[cat][i].value;
    }
    return fallback;
  }

  function _getLabel(tagId) {
    var tag = _getTag(tagId);
    return tag ? tag.label : tagId;
  }

  function _getEngProp(tagId) {
    return (window.ENGINEERING_PROPS && window.ENGINEERING_PROPS[tagId])
      || { law: '—', lawKey: '' };
  }

  // ─── KaTeX helper ───────────────────────────────────────────
  function _katex(latex) {
    if (typeof katex !== 'undefined') {
      try { return katex.renderToString(latex, { displayMode: true, throwOnError: false }); } catch (e) {}
    }
    return '<div style="color:var(--accent-cyan);font-family:JetBrains Mono,monospace;font-size:14px;padding:8px;background:rgba(0,0,0,0.3);border-radius:6px;text-align:center">' + latex + '</div>';
  }

  function _katexInline(latex) {
    if (typeof katex !== 'undefined') {
      try { return katex.renderToString(latex, { displayMode: false, throwOnError: false }); } catch (e) {}
    }
    return '<span style="color:var(--accent-cyan);font-family:JetBrains Mono,monospace">' + latex + '</span>';
  }

  // ─── Modal flotante por tag ─────────────────────────────────
  var TAG_DETAILS = {

  /********************************************************************
   * PU1: CARACTERIZACIÓN DE MATERIA PRIMA
   * Ley de Fick — Balance de Materia
   ********************************************************************/

  "TK-001": function(){
    var e = _getVal("TK-001","process","balance_materia_entrada",900);
    var s = _getVal("TK-001","process","balance_materia_salida",891);
    var p = _getVal("TK-001","process","balance_materia_perdidas",9);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    var temp = _getVal("TK-001","process","balance_energia",25);
    var pres = _getVal("TK-001","process","balance_momentum",0.9);
    return {
      title: "1.\u00aa Ley de Fick — Balance de Masa en Tanque",
      tagId: "TK-001", tagLabel: "Tanque de Materia Prima",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Aceite crudo recibido",e.toFixed(0),"L"],
        ["Salida","Enviado a FIL-001",s.toFixed(0),"L"],
        ["Pérdidas","Evaporación + sedimentos (1%)",p.toFixed(0),"L"],
        ["Cierre","Ent − Sal − Per",cierre.toFixed(0),"L"],
        ["Eficiencia","(Sal/Ent)\u00d7100",eff.toFixed(1),"%"],
        ["T","Temp. de conservación",temp.toFixed(0),"\u00b0C"],
        ["P","Presión hidrostática",pres.toFixed(1),"bar"],
      ],
      solving: [
        {text:"Balance de materia: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L residual")},
        {text:"Eficiencia de almacenamiento: "+s.toFixed(0)+"/"+e.toFixed(0)+"\u00d7100 = "+eff.toFixed(1)+"%"+(cierre===0?". Las pérdidas (1%) corresponden a evaporación y sedimentos.":"")},
        {text:"Temperatura: "+temp.toFixed(0)+"\u00b0C. Presión hidrostática: "+pres.toFixed(1)+" bar (columna de aceite ≈ "+(pres*1e5/(PHYS.RHO_ACEITE*PHYS.G)).toFixed(1)+" m)."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia másica: "+eff.toFixed(1)+"%. Balance de materia: "+(cierre===0?"cerrado \u2713":"residual "+cierre.toFixed(1)+" L. Pérdidas: "+p.toFixed(0)+" L ("+((p/e)*100).toFixed(1)+"%).")},
    };
  },

  "FIL-001": function(){
    var e = _getVal("FIL-001","process","balance_materia_entrada",891);
    var s = _getVal("FIL-001","process","balance_materia_salida",846);
    var p = _getVal("FIL-001","process","balance_materia_perdidas",45);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    var dp = _getVal("FIL-001","process","balance_momentum_delta_p",0.2);
    return {
      title: "1.\u00aa Ley de Fick — Balance de Masa en Filtro",
      tagId: "FIL-001", tagLabel: "Filtro de Aceite",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Aceite desde TK-001",e.toFixed(0),"L"],
        ["Salida","Aceite filtrado a P-001",s.toFixed(0),"L"],
        ["Pérdidas","Sólidos + agua retenidos",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento del filtro",eff.toFixed(1),"%"],
        ["\u0394P","Caída de presión (Darcy)",dp.toFixed(1),"bar"],
      ],
      solving: [
        {text:"Balance de materia: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia de filtración: "+s.toFixed(0)+"/"+e.toFixed(0)+"\u00d7100 = "+eff.toFixed(1)+"%. Retención de impurezas: "+p.toFixed(0)+" L ("+((p/e)*100).toFixed(1)+"%)."},
        {text:"\u0394P = "+dp.toFixed(1)+" bar. Aplicando Darcy: Q = k\u00b7A\u00b7\u0394P/(\u03bc\u00b7L). El filtro retiene sólidos y agua."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Impurezas retenidas: "+p.toFixed(0)+" L. \u0394P: "+dp.toFixed(1)+" bar."},
    };
  },

  "P-001": function(){
    var e = _getVal("P-001","process","balance_materia_entrada",846);
    var s = _getVal("P-001","process","balance_materia_salida",838);
    var p = _getVal("P-001","process","balance_materia_perdidas",8);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    var consumo = _getVal("P-001","process","balance_energia_consumo",5);
    var dp = _getVal("P-001","process","balance_momentum_delta_p",0.3);
    var rho = PHYS.RHO_ACEITE;
    var Hm = dp * 1e5 / (rho * PHYS.G);
    return {
      title: "1.\u00aa Ley de Fick — Balance de Masa en Bomba",
      tagId: "P-001", tagLabel: "Bomba Centrífuga",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Aceite desde FIL-001",e.toFixed(0),"L"],
        ["Salida","Aceite hacia CLP-001",s.toFixed(0),"L"],
        ["Pérdidas","Fugas internas",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento volumétrico",eff.toFixed(1),"%"],
        ["Consumo","Potencia eléctrica",consumo.toFixed(0),"kW"],
        ["\u0394P","Incremento de presión",dp.toFixed(1),"bar"],
        ["H","Altura dinámica equivalente",Hm.toFixed(1),"m"],
      ],
      solving: [
        {text:"Balance de materia: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia volumétrica: "+eff.toFixed(1)+"%. Pérdidas por fugas internas: "+p.toFixed(0)+" L."},
        {text:"Altura equivalente al \u0394P: H = \u0394P/(\u03c1\u00b7g) = "+dp.toFixed(1)+"\u00d710\u2075/("+rho+"\u00d79.81) = "+Hm.toFixed(1)+" m."},
        {text:"Consumo: "+consumo.toFixed(0)+" kW. La bomba transfiere energía al fluido (Euler)."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Rendimiento volumétrico: "+eff.toFixed(1)+"%. \u0394P: "+dp.toFixed(1)+" bar ("+Hm.toFixed(1)+" m.c.l.). Consumo: "+consumo.toFixed(0)+" kW."},
    };
  },

  "CLP-001": function(){
    var e = _getVal("CLP-001","process","balance_materia_entrada",838);
    var s = _getVal("CLP-001","process","balance_materia_salida",834);
    var p = _getVal("CLP-001","process","balance_materia_perdidas",4);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    var desh = _getVal("CLP-001","process","balance_energia_deshidratacion",0.3);
    var sec = _getVal("CLP-001","process","balance_energia_secado",0.1);
    var reg = _getVal("CLP-001","process","balance_momentum_regulacion",2);
    return {
      title: "1.\u00aa Ley de Fick — Balance en Acondicionamiento",
      tagId: "CLP-001", tagLabel: "Panel de Control",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Aceite desde P-001",e.toFixed(0),"L"],
        ["Salida","Aceite caracterizado",s.toFixed(0),"L"],
        ["Pérdidas","Evaporación + purgas",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento másico",eff.toFixed(1),"%"],
        ["Deshidrat.","Energía de deshidratación",desh.toFixed(1),"GJ"],
        ["Secado","Energía de secado",sec.toFixed(1),"GJ"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. El panel regula válvulas al "+reg.toFixed(0)+"% de apertura."},
        {text:"Energía de deshidratación: "+desh.toFixed(1)+" GJ. Secado: "+sec.toFixed(1)+" GJ. El aceite queda listo para transesterificar."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Deshidratación: "+desh.toFixed(1)+" GJ + secado: "+sec.toFixed(1)+" GJ."},
    };
  },

  "SALACE-001": function(){
    var s = _getVal("SALACE-001","process","balance_materia_salida",834);
    var perE = _getVal("SALACE-001","process","balance_energia_perdidas",0.05);
    var dp = _getVal("SALACE-001","process","balance_momentum_delta_p",0.1);
    return {
      title: "1.\u00aa Ley de Fick — Corriente de Salida",
      tagId: "SALACE-001", tagLabel: "Salida Aceite Caracterizado",
      equation: "\\dot{m}_{out} = " + s + "\\;L/h",
      appliedEq: "\\text{Flujo de aceite caracterizado hacia EST-001: }" + s + "\\;L",
      params: [
        ["Salida","Caudal de aceite caracterizado",s.toFixed(0),"L"],
      ],
      solving: [
        {text:"El PU1 entrega "+s.toFixed(0)+" L de aceite caracterizado al reactor de esterificación."},
        {text:"Balance global PU1: 900 L iniciales \u2192 "+s.toFixed(0)+" L finales (66 L perdidos en procesos)."},
      ],
      result:{value:s.toFixed(0), unit:"L",
        desc:"Salida neta: "+s.toFixed(0)+" L de aceite caracterizado listo para EST-001."},
    };
  },

  "E.W-003": function(){
    var e = _getVal("E.W-003","process","balance_materia_entrada",1000);
    var s = _getVal("E.W-003","process","balance_materia_salida",990);
    var p = _getVal("E.W-003","process","balance_materia_perdidas",10);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    var transf = _getVal("E.W-003","process","balance_energia_transferencia",0.1);
    return {
      title: "1.\u00aa Ley de Fick — Circuito de Agua Térmica",
      tagId: "E.W-003", tagLabel: "Sist. Circulación Agua",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Agua de circulación",e.toFixed(0),"L"],
        ["Salida","Agua retornada",s.toFixed(0),"L"],
        ["Pérdidas","Evaporación + fugas",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
        ["Q_transf","Transferencia térmica",transf.toFixed(1),"GJ"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. El sistema mantiene el agua a 60°C para intercambio térmico."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Transferencia térmica: "+transf.toFixed(1)+" GJ."},
    };
  },

  "E-003": function(){
    var salida = _getVal("E-003","process","balance_materia_salida",180);
    var calor = _getVal("E-003","process","balance_energia_calor",0.1);
    var perdE = _getVal("E-003","process","balance_energia_perdidas",0.01);
    var dp = _getVal("E-003","process","balance_momentum_delta_p",0.25);
    var q = _getVal("E-003","process","balance_momentum_caudal",15);
    return {
      title: "1.\u00aa Ley de Fick — Reactor de Alcóxido",
      tagId: "E-003", tagLabel: "Esterificador",
      equation: "\\dot{m}_{out} = " + salida + "\\;L \\qquad \\dot{Q} = " + calor + "\\;GJ",
      appliedEq: "\\text{MeOH + KOH} \\rightarrow " + salida + "\\;L \\;\\text{de alcóxido 0.5M}",
      params: [
        ["Salida","Alcóxido producido",salida.toFixed(0),"L"],
        ["Calor","Calor requerido (60°C)",calor.toFixed(2),"GJ"],
        ["Pérdidas E","Pérdidas térmicas",perdE.toFixed(2),"GJ"],
        ["\u0394P","Caída de presión",dp.toFixed(2),"bar"],
        ["Caudal","Caudal interno",q.toFixed(0),"L/min"],
      ],
      solving: [
        {text:"Producción: "+salida.toFixed(0)+" L de alcóxido 0.5M a partir de metanol + KOH."},
        {text:"Calor suministrado: "+calor.toFixed(2)+" GJ. Pérdidas térmicas: "+perdE.toFixed(2)+" GJ."},
      ],
      result:{value:salida.toFixed(0), unit:"L",
        desc:"Producción: "+salida.toFixed(0)+" L alcóxido 0.5M. Calor: "+calor.toFixed(2)+" GJ."},
    };
  },

  "TK-002": function(){
    var acum = _getVal("TK-002","process","balance_materia_acumulacion",834);
    var t = _getVal("TK-002","process","balance_energia_mantenimiento",70);
    var p = _getVal("TK-002","process","balance_momentum_presion",0.8);
    return {
      title: "1.\u00aa Ley de Fick — Tanque Pulmón",
      tagId: "TK-002", tagLabel: "Tanque de Aceite Caracterizado",
      equation: "m_{acum} = " + acum + "\\;L",
      appliedEq: "\\text{Acumulación de aceite caracterizado: }" + acum + "\\;L",
      params: [
        ["Acumulación","Volumen almacenado",acum.toFixed(0),"L"],
        ["T mantenimiento","Temperatura",t.toFixed(0),"\u00b0C"],
        ["Presión interna","Presión del tanque",p.toFixed(1),"bar"],
      ],
      solving: [
        {text:"El tanque acumula "+acum.toFixed(0)+" L de aceite caracterizado a "+t.toFixed(0)+"\u00b0C."},
        {text:"Capacidad total: 1000 L. Nivel: "+(acum/10)+"%. Presión: "+p.toFixed(1)+" bar."},
      ],
      result:{value:acum.toFixed(0), unit:"L",
        desc:"Acumulación: "+acum.toFixed(0)+" L a "+t.toFixed(0)+"\u00b0C. Presión: "+p.toFixed(1)+" bar."},
    };
  },

  "TK-003": function(){
    var e = _getVal("TK-003","process","balance_materia_entrada",184);
    var s = _getVal("TK-003","process","balance_materia_salida",180);
    var p = _getVal("TK-003","process","balance_materia_perdidas",4);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    var cal = _getVal("TK-003","process","balance_energia_calentamiento",0.05);
    return {
      title: "1.\u00aa Ley de Fick — Dosificación de Metanol",
      tagId: "TK-003", tagLabel: "Tanque de Metanol",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Metanol cargado",e.toFixed(0),"L"],
        ["Salida","Metanol a E-003",s.toFixed(0),"L"],
        ["Pérdidas","Evaporación (2%)",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
        ["Calor","Calentamiento a 60°C",cal.toFixed(2),"GJ"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. Pérdidas: "+p.toFixed(0)+" L (2%) por evaporación."},
        {text:"Calor de calentamiento: "+cal.toFixed(2)+" GJ para llevar el metanol a 60°C."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Pérdidas: "+p.toFixed(0)+" L. Calor: "+cal.toFixed(2)+" GJ."},
    };
  },

  "TK-004": function(){
    var e = _getVal("TK-004","process","balance_materia_entrada",5.2);
    var s = _getVal("TK-004","process","balance_materia_salida",5.05);
    var p = _getVal("TK-004","process","balance_materia_perdidas",0.15);
    var cierre = Math.abs(e - s - p);
    var eff = (s/e)*100;
    var calor = _getVal("TK-004","process","balance_energia_calor",0.5);
    return {
      title: "1.\u00aa Ley de Fick — Dosificación de KOH",
      tagId: "TK-004", tagLabel: "Tanque de KOH",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre<0.01?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(2)+"\\;kg"),
      params: [
        ["Entrada","KOH sólido cargado",e.toFixed(2),"kg"],
        ["Salida","KOH disuelto",s.toFixed(2),"kg"],
        ["Pérdidas","Polvo + residuos (3%)",p.toFixed(2),"kg"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(2),"kg"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
        ["Calor","Calor de disolución",calor.toFixed(1),"MJ"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(2)+" \u2212 "+s.toFixed(2)+" \u2212 "+p.toFixed(2)+" = "+(cierre<0.01?"0 \u2713":cierre.toFixed(2)+" kg")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. El KOH se disuelve en metanol para el alcóxido."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Calor de disolución: "+calor.toFixed(1)+" MJ."},
    };
  },

  "ALCO-001": function(){
    var s = _getVal("ALCO-001","process","balance_materia_salida",180);
    var perE = _getVal("ALCO-001","process","balance_energia_perdidas",0.01);
    var dp = _getVal("ALCO-001","process","balance_momentum_delta_p",0.1);
    var v = _getVal("ALCO-001","process","balance_momentum_velocidad",0.8);
    return {
      title: "1.\u00aa Ley de Fick — Corriente de Alcóxido",
      tagId: "ALCO-001", tagLabel: "Salida de Alcóxido",
      equation: "\\dot{m}_{out} = " + s + "\\;L/h",
      appliedEq: "\\text{Alcóxido 0.5M hacia TRAN-001: }" + s + "\\;L",
      params: [
        ["Salida","Alcóxido producido",s.toFixed(0),"L"],
      ],
      solving: [
        {text:"El PU1 entrega "+s.toFixed(0)+" L de alcóxido 0.5M al reactor TRAN-001."},
        {text:"Velocidad de flujo: "+v.toFixed(1)+" m/s. \u0394P: "+dp.toFixed(1)+" bar."},
      ],
      result:{value:s.toFixed(0), unit:"L",
        desc:"Salida: "+s.toFixed(0)+" L alcóxido 0.5M. Velocidad: "+v.toFixed(1)+" m/s."},
    };
  },

  /********************************************************************
   * PU2: ESTERIFICACIÓN Y TRANSESTERIFICACIÓN
   ********************************************************************/

  "EST-001": function(){
    var aceite = _getVal("EST-001","process","balance_materia_entrada",834);
    var metanol = _getVal("EST-001","process","balance_materia_metanol",83);
    var salida = _getVal("EST-001","process","balance_materia_salida",834);
    return {
      title: "1.\u00aa Ley de Fick — Esterificación",
      tagId: "EST-001", tagLabel: "Tanque de Esterificación",
      equation: "\\sum m_{in} = \\sum m_{out}",
      appliedEq: aceite+" + "+metanol+" \\rightarrow " + salida + "\\;L \\;\\text{(aceite esterificado)}",
      params: [
        ["Aceite entrada","Desde SALACE-001",aceite.toFixed(0),"L"],
        ["Metanol","Adicionado para esterificar",metanol.toFixed(0),"L"],
        ["Ácido","Catalizador H\u2082SO\u2084","4 \u2013 8","kg"],
        ["Aceite salida","Aceite esterificado",salida.toFixed(0),"L"],
      ],
      solving: [
        {text:"Carga de aceite: "+aceite.toFixed(0)+" L. Se adicionan "+metanol.toFixed(0)+" L de metanol + \u00e1cido sulf\u00farico."},
        {text:"El aceite esterificado ( "+salida.toFixed(0)+" L ) mantiene su volumen porque el metanol reacciona y se elimina como subproducto (agua + \u00e9ster met\u00edlico)."},
        {text:"Si IA > 1.5%, la esterificaci\u00f3n reduce la acidez a <1.5% para la transesterificaci\u00f3n."},
      ],
      result:{value:salida.toFixed(0), unit:"L",
        desc:"Aceite esterificado: "+salida.toFixed(0)+" L. Relaci\u00f3n metanol:aceite = "+metanol.toFixed(0)+":"+aceite.toFixed(0)+". Ácido sulfúrico: 4-8 kg."},
    };
  },

  "TRAN-001": function(){
    var aceite = _getVal("TRAN-001","process","balance_materia_aceite",834);
    var alcoxido = _getVal("TRAN-001","process","balance_materia_alcoxido",180);
    var total = aceite + alcoxido;
    var ester = _getVal("TRAN-001","process","balance_materia_ester",780);
    var glicerina = _getVal("TRAN-001","process","balance_materia_glicerina",220);
    var desechos = _getVal("TRAN-001","process","balance_materia_desechos",14);
    var sumaOut = ester + glicerina + desechos;
    var cierre = total - sumaOut;
    var rendBio = (ester/total)*100;
    return {
      title: "1.\u00aa Ley de Fick — Transesterificación",
      tagId: "TRAN-001", tagLabel: "Reactor Principal",
      equation: "\\sum m_{in} = \\sum m_{out}",
      appliedEq: aceite+" + "+alcoxido+" = "+ester+" + "+glicerina+" + "+desechos+" = "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(0)+"\\;L"),
      params: [
        ["Aceite","Desde EST-001",aceite.toFixed(0),"L"],
        ["Alcóxido","Desde E-003",alcoxido.toFixed(0),"L"],
        ["Total in","Carga al reactor",total.toFixed(0),"L"],
        ["Éster","Biodiesel producido",ester.toFixed(0),"L"],
        ["Glicerina","Subproducto",glicerina.toFixed(0),"L"],
        ["Desechos","Trazas",desechos.toFixed(0),"L"],
        ["Total out","Suma productos",sumaOut.toFixed(0),"L"],
        ["Cierre","Balance masa",cierre.toFixed(0),"L"],
      ],
      solving: [
        {text:"Entrada: "+aceite.toFixed(0)+" L aceite + "+alcoxido.toFixed(0)+" L alcóxido = "+total.toFixed(0)+" L"},
        {text:"Salida: "+ester.toFixed(0)+" L biodiesel + "+glicerina.toFixed(0)+" L glicerina + "+desechos.toFixed(0)+" L desechos = "+sumaOut.toFixed(0)+" L"},
        {text:"Cierre de masa: "+total.toFixed(0)+" \u2212 "+sumaOut.toFixed(0)+" = "+(cierre===0?"0 \u2713 (balance perfecto)":cierre.toFixed(0)+" L")},
        {text:"Fracción de biodiesel en productos: "+((ester/total)*100).toFixed(1)+"%. Conversión química >96% (ASTM D6751)."},
      ],
      result:{value:ester.toFixed(0), unit:"L por lote",
        desc:"Balance cerrado: "+total.toFixed(0)+" L in = "+sumaOut.toFixed(0)+" L out \u2713. Biodiesel: "+ester.toFixed(0)+" L ("+rendBio.toFixed(1)+"%). Glicerina: "+glicerina.toFixed(0)+" L."},
    };
  },

  "SEP-001": function(){
    var e = _getVal("SEP-001","process","balance_materia_entrada",780);
    var s = _getVal("SEP-001","process","balance_materia_salida",770);
    var p = _getVal("SEP-001","process","balance_materia_perdidas",10);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    return {
      title: "1.\u00aa Ley de Fick — Separación de Fases",
      tagId: "SEP-001", tagLabel: "Separador de Éster",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Éster desde TRAN-001",e.toFixed(0),"L"],
        ["Salida","Éster a purificación",s.toFixed(0),"L"],
        ["Pérdidas","Impurezas retiradas",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"% ("+p.toFixed(0)+" L de impurezas separadas por diferencia de densidad)."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Impurezas separadas: "+p.toFixed(0)+" L."},
    };
  },

  "GLI-001": function(){
    var e = _getVal("GLI-001","process","balance_materia_entrada",220);
    var s = _getVal("GLI-001","process","balance_materia_salida",218);
    var p = _getVal("GLI-001","process","balance_materia_perdidas",2);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    return {
      title: "1.\u00aa Ley de Fick — Almacenamiento de Glicerina",
      tagId: "GLI-001", tagLabel: "Tanque de Glicerina",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Glicerina desde TRAN-001",e.toFixed(0),"L"],
        ["Salida","Glicerina almacenada",s.toFixed(0),"L"],
        ["Pérdidas","Agua + residuos",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. Pureza >80%. Subproducto comercializable."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Pérdidas: "+p.toFixed(0)+" L."},
    };
  },

  "SIS_TRAN-001": function(){
    var e = _getVal("SIS_TRAN-001","process","balance_materia_entrada",780);
    var s = _getVal("SIS_TRAN-001","process","balance_materia_salida",776);
    var p = _getVal("SIS_TRAN-001","process","balance_materia_perdidas",4);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    return {
      title: "1.\u00aa Ley de Fick — Transferencia por Tubería",
      tagId: "SIS_TRAN-001", tagLabel: "Sist. Transferencia",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Éster desde TRAN-001",e.toFixed(0),"L"],
        ["Salida","Éster hacia SEP-001",s.toFixed(0),"L"],
        ["Pérdidas","0.5% en tubería",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. Tubería de 150 m, 3\". Pérdidas: 4 L (0.5%)."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Tubería 150 m, 3\". Pérdidas: "+p.toFixed(0)+" L (0.5%)."},
    };
  },

  "PRO_DES-001": function(){
    var acum = _getVal("PRO_DES-001","process","balance_materia_acumulacion",14);
    return {
      title: "1.\u00aa Ley de Fick — Tanque de Desecho",
      tagId: "PRO_DES-001", tagLabel: "Desechos",
      equation: "m_{acum} = " + acum + "\\;L",
      appliedEq: "\\text{Acumulación de desechos del proceso: }" + acum + "\\;L",
      params: [
        ["Acumulación","Trazas de metanol, jabones, éster",acum.toFixed(0),"L"],
      ],
      solving: [
        {text:"El tanque acumula "+acum.toFixed(0)+" L de desechos (trazas, jabones, éster fuera de especificación). Capacidad: 100 L."},
        {text:"Representa el "+(acum/1014*100).toFixed(1)+"% de la carga del reactor TRAN-001."},
      ],
      result:{value:acum.toFixed(0), unit:"L",
        desc:"Acumulación: "+acum.toFixed(0)+" L. Capacidad: 100 L."},
    };
  },

  "SIS_BOM-001": function(){
    var pot = _getVal("SIS_BOM-001","physical","potencia_total",15);
    var qnom = _getVal("SIS_BOM-001","physical","caudal_nominal",3000);
    var rho = PHYS.RHO_BIODIESEL;
    var Qms = qnom / 3600 / 1000;
    var H = 20;
    var Ph = rho * PHYS.G * H * Qms / 1000;
    return {
      title: "Ley de Newton — Sistema de Bombeo",
      tagId: "SIS_BOM-001", tagLabel: "Bombas Auxiliares",
      equation: "P_h = \\rho \\, g \\, H \\, Q",
      appliedEq: "P_h = "+rho+"\\times9.81\\times"+H.toFixed(0)+"\\times"+Qms.toExponential(2)+" = "+Ph.toFixed(3)+"\\;kW",
      params: [
        ["Potencia total","Instalada",pot.toFixed(0),"kW"],
        ["Caudal nominal","Nominal del sistema",qnom.toFixed(0),"L/h"],
        ["\u03c1 biodiesel","Densidad",rho,"kg/m\u00b3"],
        ["H","Altura dinámica estimada",H.toFixed(0),"m"],
        ["P_h","Potencia hidráulica",Ph.toFixed(3),"kW"],
      ],
      solving: [
        {text:"Potencia instalada: "+pot.toFixed(0)+" kW. Caudal nominal: "+qnom.toFixed(0)+" L/h."},
        {text:"Potencia hidráulica: P_h = \u03c1\u00b7g\u00b7H\u00b7Q = "+Ph.toFixed(3)+" kW."},
        {text:"Bomba centrífuga multietapa para recirculación de mezcla en el reactor."},
      ],
      result:{value:Ph.toFixed(3), unit:"kW",
        desc:"Potencia hidráulica: "+Ph.toFixed(3)+" kW. Instalada: "+pot.toFixed(0)+" kW."},
    };
  },

  /********************************************************************
   * PU3: PURIFICACIÓN Y PRODUCTO FINAL
   ********************************************************************/

  "SEC-001": function(){
    var e = _getVal("SEC-001","process","balance_materia_entrada",770);
    var s = _getVal("SEC-001","process","balance_materia_salida",765);
    var p = _getVal("SEC-001","process","balance_materia_perdidas",5);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    return {
      title: "1.\u00aa Ley de Fick — Secado del Biodiesel",
      tagId: "SEC-001", tagLabel: "Secador",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Éster desde SEP-001/VIS-001",e.toFixed(0),"L"],
        ["Salida","Éster seco",s.toFixed(0),"L"],
        ["Pérdidas","Metanol + agua evaporados",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. Se evaporan "+p.toFixed(0)+" L de metanol + agua (T=60-80°C)."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Metanol evaporado: "+p.toFixed(0)+" L."},
    };
  },

  "SEC_COND-001": function(){
    var e = _getVal("SEC_COND-001","process","balance_materia_entrada",765);
    var s = _getVal("SEC_COND-001","process","balance_materia_salida",760);
    var p = _getVal("SEC_COND-001","process","balance_materia_perdidas",5);
    var cierre = e - s - p;
    var eff = (s/e)*100;
    return {
      title: "1.\u00aa Ley de Fick — Condensación de Vapores",
      tagId: "SEC_COND-001", tagLabel: "Condensador",
      equation: "\\sum m_{in} - \\sum m_{out} = m_{perdidas}",
      appliedEq: e+" - "+s+" = "+p+" \\rightarrow "+(cierre===0?"\\text{Balance cerrado}":"\\text{Residual: }"+cierre.toFixed(1)+"\\;L"),
      params: [
        ["Entrada","Éster desde SEC-001",e.toFixed(0),"L"],
        ["Salida","Éster libre de humedad",s.toFixed(0),"L"],
        ["Pérdidas","Agua condensada",p.toFixed(0),"L"],
        ["Cierre","Ent \u2212 Sal \u2212 Per",cierre.toFixed(0),"L"],
        ["Eficiencia","Rendimiento",eff.toFixed(1),"%"],
      ],
      solving: [
        {text:"Balance: "+e.toFixed(0)+" \u2212 "+s.toFixed(0)+" \u2212 "+p.toFixed(0)+" = "+(cierre===0?"0 \u2713":cierre.toFixed(1)+" L")},
        {text:"Eficiencia: "+eff.toFixed(1)+"%. Humedad residual <500 ppm. Presión: 0.5-1.5 bar."},
      ],
      result:{value:eff.toFixed(1), unit:"%",
        desc:"Eficiencia: "+eff.toFixed(1)+"%. Agua eliminada: "+p.toFixed(0)+" L."},
    };
  },

  "PRO_FIN-001": function(){
    var salida = _getVal("PRO_FIN-001","process","balance_materia_salida",760);
    var d = _getVal("PRO_FIN-001","physical","densidad",0.86);
    var masa = d * salida;
    return {
      title: "1.\u00aa Ley de Fick — Producto Final",
      tagId: "PRO_FIN-001", tagLabel: "Biodiesel PURO",
      equation: "m = \\rho \\, V",
      appliedEq: "m = "+d.toFixed(2)+" \\times "+salida.toFixed(0)+" = "+masa.toFixed(0)+"\\;kg",
      params: [
        ["Volumen","Biodiesel producido",salida.toFixed(0),"L"],
        ["Densidad","A 40°C (ASTM D6751)",d.toFixed(2),"g/cm\u00b3"],
        ["Masa","Masa del lote",masa.toFixed(0),"kg"],
      ],
      solving: [
        {text:"Volumen final: "+salida.toFixed(0)+" L de biodiesel purificado."},
        {text:"Masa: m = \u03c1\u00b7V = "+d.toFixed(2)+"\u00d7"+salida.toFixed(0)+" = "+masa.toFixed(0)+" kg."},
        {text:"Cumple ASTM D6751: \u03c1=0.86-0.90 g/cm\u00b3, \u03bd=3.5-5.0 cSt, acidez \u22480 mg KOH/g."},
      ],
      result:{value:salida.toFixed(0), unit:"L",
        desc:"Producción: "+salida.toFixed(0)+" L ("+masa.toFixed(0)+" kg). Producto conforme ASTM D6751."},
    };
  },

  "PRO_DES-003": function(){
    var acum = _getVal("PRO_DES-003","process","balance_materia_acumulacion",10);
    return {
      title: "1.\u00aa Ley de Fick — Tanque de Impurezas",
      tagId: "PRO_DES-003", tagLabel: "Desechos",
      equation: "m_{acum} = " + acum + "\\;L",
      appliedEq: "\\text{Acumulación de impurezas: }" + acum + "\\;L",
      params: [
        ["Acumulación","Agua, metanol, trazas",acum.toFixed(0),"L"],
      ],
      solving: [
        {text:"El tanque acumula "+acum.toFixed(0)+" L de impurezas provenientes de SEC-001 y SEC_COND-001."},
      ],
      result:{value:acum.toFixed(0), unit:"L",
        desc:"Acumulación: "+acum.toFixed(0)+" L de impurezas de purificación."},
    };
  },

  "VIS-001": function(){
    var entrada = _getVal("VIS-001","process","balance_materia_entrada",770);
    var viscRaw = _getStr("VIS-001","physical","viscosidad_esperada","3.5 – 5.0");
    var viscNum = _getVal("VIS-001","physical","viscosidad_esperada",4.5);
    var astmOk = isFinite(viscNum) && viscNum >= 3.5 && viscNum <= 5.0;
    return {
      title: "1.\u00aa Ley de Fick — Control de Viscosidad",
      tagId: "VIS-001", tagLabel: "Viscosímetro",
      equation: "\\tau = \\mu \\, \\frac{dv}{dy} \\qquad m_{in} = " + entrada + "\\;L",
      appliedEq: "\\nu_{esperada}: " + viscRaw + "\\;cSt \\quad \\text{ASTM D6751: }1.9 \\leq \\nu \\leq 6.0",
      params: [
        ["Entrada","Éster desde SEP-001",entrada.toFixed(0),"L"],
        ["Viscosidad","Rango esperado",viscRaw,"cSt"],
        ["Norma ASTM","1.9 – 6.0 cSt a 40°C","1.9 – 6.0","cSt"],
        ["Verificación","Cumple ASTM",astmOk ? "SÍ \u2713" : "—",""],
      ],
      solving: [
        {text:"Control de viscosidad cinemática según ASTM D445 a 40°C: "+viscRaw+" cSt."},
        {text:"Rango ASTM D6751: 1.9 \u2264 \u03bd \u2264 6.0 cSt."+(astmOk?" Producto dentro de especificación.":" Verificar en campo.")},
      ],
      result:{value:viscRaw+(astmOk?" \u2713":""), unit:"cSt",
        desc:"Viscosidad esperada: "+viscRaw+" cSt. "+(astmOk?"Dentro del rango ASTM \u2713":"Rango ASTM: 1.9-6.0 cSt.")},
    };
  },

  "SIS_CIRC-001": function(){
    return {
      title: "Ley de Newton — Circulación en Purificación",
      tagId: "SIS_CIRC-001", tagLabel: "Circuito de Purificación",
      equation: "Q = A \\, v \\qquad \\Delta P = f \\, \\frac{L}{D} \\, \\frac{\\rho v^2}{2}",
      appliedEq: "\\text{Caudal: 500-800 L/h, Presión: 2-3 bar, Temp: 60°C}",
      params: [
        ["Caudal nominal","Rango de operación","500 – 800","L/h"],
        ["Presión","Operación","2 – 3","bar"],
        ["T control","Temperatura","60","°C"],
      ],
      solving: [
        {text:"El sistema de circulación conecta SEC-001 y SEC_COND-001 con caudal de 500-800 L/h."},
        {text:"Presión: 2-3 bar, temperatura: 60°C. Pérdidas estimadas: 0.5%."},
      ],
      result:{value:"500–800", unit:"L/h",
        desc:"Caudal nominal: 500-800 L/h. Presión: 2-3 bar. Temperatura: 60°C."},
    };
  },
  };

  // ─── Mostrar modal flotante ─────────────────────────────────
  function _showTagModal(tagId) {
    _hideTagModal();

    var detailFn = TAG_DETAILS[tagId];
    if (!detailFn) return;

    var data;
    try { data = detailFn(); } catch (e) {
      console.warn("TAG_DETAILS error for " + tagId + ":", e);
      return;
    }
    if (!data) return;

    var safeArray = function (arr) { return Array.isArray(arr) ? arr : []; };

    var eqHtml = _katex(data.equation || "\\text{Sin ecuación definida}");
    var appEqHtml = _katex(data.appliedEq || "\\text{Sin aplicación definida}");

    var paramRows = safeArray(data.params).map(function (p) {
      return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;border-bottom:1px solid rgba(48,54,61,0.08)">' +
        '<span style="font-family:JetBrains Mono,monospace;color:var(--accent-cyan);font-weight:600;min-width:70px">' + (p[0] || "") + '</span>' +
        '<span style="flex:1;color:var(--text-muted);font-size:11px">' + (p[1] || "") + '</span>' +
        '<span style="font-family:JetBrains Mono,monospace;color:#fff;font-weight:500;text-align:right">' + (p[2] || "—") + '</span>' +
        '<span style="color:var(--text-muted);min-width:40px;text-align:right;font-size:10px">' + (p[3] || "") + '</span>' +
        '</div>';
    }).join('');

    var stepsHtml = '<div style="margin:8px 0">' +
      safeArray(data.solving).map(function (s, i) {
        var eq = '';
        if (s.latex) {
          try { eq = typeof katex !== 'undefined' ? katex.renderToString(s.latex, { displayMode: false, throwOnError: false }) : '<span style="color:var(--accent-cyan);font-family:JetBrains Mono,monospace;font-size:11px">' + s.latex + '</span>'; } catch (e) { eq = ''; }
        }
        return '<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-bottom:1px solid rgba(48,54,61,0.06)">' +
          '<span style="color:var(--primary);font-weight:700;font-family:JetBrains Mono,monospace;min-width:18px;font-size:11px">' + (i + 1) + '.</span>' +
          '<div style="flex:1">' +
            '<div style="font-size:11px;color:var(--text-secondary)">' + (s.text || "") + '</div>' +
            (eq ? '<div style="margin-top:2px;padding:3px 6px;background:rgba(0,0,0,0.15);border-radius:4px">' + eq + '</div>' : '') +
          '</div></div>';
      }).join('') + '</div>';

    var overlay = document.createElement('div');
    overlay.id = 'tagModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9998;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px';

    var modal = document.createElement('div');
    modal.id = 'tagModal';
    modal.style.cssText = 'background:var(--bg-card,#161a27);border:1px solid var(--border-default,rgba(255,255,255,0.07));border-radius:14px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);position:relative;z-index:9999';

    modal.innerHTML =
      '<div style="position:sticky;top:0;background:var(--bg-card,#161a27);z-index:1;border-radius:14px 14px 0 0;border-bottom:1px solid rgba(48,54,61,0.1);padding:16px 18px 12px;display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div>' +
          '<div style="font-size:11px;color:var(--text-muted);font-family:JetBrains Mono,monospace">' + data.tagId + '</div>' +
          '<div style="font-size:15px;font-weight:700;color:var(--text-primary);margin-top:2px">' + data.title + '</div>' +
          '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">' + data.tagLabel + '</div>' +
        '</div>' +
        '<button id="tagModalClose" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;padding:4px 8px;line-height:1;border-radius:6px;">✕</button>' +
      '</div>' +
      '<div style="padding:14px 18px 18px;display:flex;flex-direction:column;gap:12px">' +
        '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:10px;border:1px solid rgba(99,139,255,0.15)">' +
          '<div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Ecuación de la ley</div>' +
          eqHtml +
        '</div>' +
        '<div style="background:rgba(16,185,129,0.06);border-radius:8px;padding:10px;border:1px solid rgba(16,185,129,0.15)">' +
          '<div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Aplicación al equipo</div>' +
          appEqHtml +
        '</div>' +
        '<div>' +
          '<div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Parámetros del balance</div>' +
          paramRows +
        '</div>' +
        '<div>' +
          '<div style="font-size:10px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Procedimiento de cálculo</div>' +
          stepsHtml +
        '</div>' +
        '<div style="background:rgba(99,139,255,0.08);border-radius:8px;padding:12px 14px;border:1px solid rgba(99,139,255,0.2);display:flex;justify-content:space-between;align-items:center">' +
          '<div style="font-size:11px;color:var(--text-muted);font-weight:600">Resultado:</div>' +
          '<div style="text-align:right">' +
            '<span style="font-size:18px;font-weight:700;color:var(--accent-cyan);font-family:JetBrains Mono,monospace">' + data.result.value + '</span>' +
            '<span style="font-size:11px;color:var(--text-muted);margin-left:4px">' + data.result.unit + '</span>' +
            '<div style="font-size:10px;color:var(--text-secondary);margin-top:2px">' + data.result.desc + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) _hideTagModal();
    });
    document.getElementById('tagModalClose').addEventListener('click', _hideTagModal);

    document.addEventListener('keydown', _modalEscHandler);
  }

  function _modalEscHandler(e) {
    if (e.key === 'Escape') _hideTagModal();
  }

  function _hideTagModal() {
    var overlay = document.getElementById('tagModalOverlay');
    if (overlay) { overlay.remove(); }
    document.removeEventListener('keydown', _modalEscHandler);
  }

  // ─── Render de una tarjeta de ley para un PU ────────────────
  function _buildLawCard(puId, lawKey) {
    var cfg = PU_LAWS[puId][lawKey];
    if (!cfg) return '';

    var prefix = puId + '-' + lawKey;

    var tagRows = cfg.tags.map(function (item, i) {
      var tagId = item[0], desc = item[1], values = item[2] || [];

      var valCells = values.map(function (v, vi) {
        var valId = prefix + '-tv' + i + '-' + vi;
        return '<span style="display:inline-flex;align-items:center;gap:2px;margin:0 3px;font-size:10px;color:var(--text-muted)">' +
          '<span style="color:var(--text-muted);font-size:9px">' + v[3] + ':</span>' +
          '<span id="' + valId + '" style="font-family:JetBrains Mono,monospace;color:var(--text-primary);font-weight:500;font-size:11px">—</span>' +
          '<span style="color:var(--text-muted);font-size:9px">' + v[2] + '</span>' +
          '</span>';
      }).join('');

      return '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(48,54,61,0.08)">' +
        '<button class="tag-detail-btn" data-tag="' + tagId + '" style="background:none;border:none;color:var(--accent-cyan);font-weight:700;font-family:JetBrains Mono,monospace;cursor:pointer;padding:2px 6px;border-radius:4px;min-width:75px;text-align:left;transition:all 0.12s">' +
          tagId +
        '</button>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + desc + '</div>' +
        '</div>' +
        '<div style="text-align:right;display:flex;flex-wrap:wrap;gap:1px;justify-content:flex-end">' +
          valCells +
        '</div>' +
        '</div>';
    }).join('');

    var eqHtml = _katex(cfg.equation);

    return '<div class="panel fade-in" style="display:flex;flex-direction:column;margin-bottom:0">' +
      '<div class="panel-header" style="padding:10px 14px">' +
        '<div class="panel-title" style="font-size:13px">' + cfg.title + '</div>' +
      '</div>' +
      '<div class="panel-body" style="padding:12px 14px;flex:1;display:flex;flex-direction:column;gap:6px">' +
        '<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;border:1px solid rgba(99,139,255,0.15);overflow-x:auto">' +
          eqHtml +
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

  // ─── Wire tag detail buttons ────────────────────────────────
  function _wireTagButtons() {
    document.querySelectorAll('.tag-detail-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tagId = this.getAttribute('data-tag');
        _showTagModal(tagId);
      });
      btn.addEventListener('mouseenter', function () {
        this.style.background = 'rgba(99,139,255,0.12)';
      });
      btn.addEventListener('mouseleave', function () {
        this.style.background = 'none';
      });
    });
  }

  // ─── API pública ────────────────────────────────────────────
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

      container.querySelectorAll('.pu-selector-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-pu');
          api.renderBalances(id);
          api.updateData();
        });
      });

      _wireTagButtons();

      api.updateData();
      _rendered = true;
    },

    updateData: function () {
      if (!_rendered) return;
      var puId = _currentPU;

      Object.keys(PU_LAWS[puId]).forEach(function (lawKey) {
        var cfg = PU_LAWS[puId][lawKey];
        cfg.tags.forEach(function (item, i) {
          var tagId = item[0];
          var values = item[2] || [];
          values.forEach(function (v, vi) {
            var el = document.getElementById(puId + '-' + lawKey + '-tv' + i + '-' + vi);
            if (el) {
              var raw = _getValRaw(tagId, v[0], v[1], '—');
              var num = parseFloat(raw);
              var display = isFinite(num) ? num.toFixed(1) : raw;
              el.textContent = display === 'NaN' ? '—' : display;
            }
          });
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
