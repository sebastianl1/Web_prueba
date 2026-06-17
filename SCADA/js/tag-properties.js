window.TAG_PROPERTIES_DB = {

  // ─═ Proceso Unitario 1: Caracterización de Materia Prima ═────────
  'ALCO-001': {
    label: 'Alcohol (Metanol/EtOH)',
    unit: '%',
    category: 'Instrumentación y Control',
    icon: 'thermometer',
    description: 'Concentración de alcohol en la materia prima para la reacción de transesterificación.',
    physical: [
      { key: 'densidad', label: 'Densidad del alcohol', value: '789 – 810', unit: 'kg/m³' },
      { key: 'pureza_min', label: 'Pureza mínima requerida', value: '99.5', unit: '%' },
    ],
    chemical: [
      { key: 'concentracion', label: 'Concentración medida', value: '--', unit: '%' },
      { key: 'humedad', label: 'Humedad', value: '< 0.2', unit: '%' },
    ],
    process: [
      { key: 'concentracion_actual', label: 'Concentración actual', value: '--', unit: '%' },
      { key: 'caudal_dosificacion', label: 'Caudal de dosificación', value: '--', unit: 'L/h' },
    ],
    alarms: { min: 90, max: 100, crit_min: 85, crit_max: 100 },
  },

  'CLP-001': {
    label: 'Panel de Control',
    unit: '',
    category: 'Instrumentación y Control',
    icon: 'cpu',
    description: 'Panel de control del proceso de caracterización de materia prima.',
    physical: [
      { key: 'voltaje', label: 'Voltaje de alimentación', value: '24', unit: 'VDC' },
      { key: 'corriente', label: 'Corriente nominal', value: '2.5', unit: 'A' },
    ],
    chemical: [],
    process: [
      { key: 'estado', label: 'Estado del panel', value: '--', unit: '' },
      { key: 'comunicacion', label: 'Comunicación con SCADA', value: '--', unit: '' },
    ],
  },

  'E-003': {
    label: 'Equipo de Proceso E-003',
    unit: '',
    category: 'Equipos de Proceso',
    icon: 'tool',
    description: 'Equipo de proceso auxiliar en la línea de caracterización de materia prima.',
    physical: [
      { key: 'capacidad', label: 'Capacidad nominal', value: '500', unit: 'L' },
      { key: 'material_const', label: 'Material de construcción', value: 'Acero inoxidable 316', unit: '' },
    ],
    chemical: [],
    process: [
      { key: 'variable_proceso', label: 'Variable de proceso', value: '--', unit: '' },
      { key: 'estado_operativo', label: 'Estado operativo', value: '--', unit: '' },
    ],
  },

  'E.W-003': {
    label: 'Peso Equipo E.W-003',
    unit: 'kg',
    category: 'Equipos de Proceso',
    icon: 'scale',
    description: 'Sistema de pesaje del equipo de caracterización de materia prima.',
    physical: [
      { key: 'capacidad_max', label: 'Capacidad máxima', value: '2000', unit: 'kg' },
      { key: 'precision', label: 'Precisión del sensor', value: '±0.5', unit: 'kg' },
    ],
    chemical: [],
    process: [
      { key: 'peso_actual', label: 'Peso actual', value: '--', unit: 'kg' },
      { key: 'tara', label: 'Tara configurada', value: '--', unit: 'kg' },
    ],
    alarms: { min: 50, max: 1800, crit_min: 20, crit_max: 1950 },
  },

  'FIL-001': {
    label: 'Filtro de Materia Prima',
    unit: 'bar',
    category: 'Equipos de Proceso',
    icon: 'filter',
    description: 'Filtro de malla para remoción de impurezas sólidas de la materia prima.',
    physical: [
      { key: 'tipo_filtro', label: 'Tipo de filtro', value: 'Malla de acero inoxidable', unit: '' },
      { key: 'micronaje', label: 'Abertura de malla', value: '100 – 200', unit: 'µm' },
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '2000', unit: 'L/h' },
    ],
    chemical: [
      { key: 'retencion', label: 'Retención de partículas', value: '> 90', unit: '%' },
    ],
    process: [
      { key: 'presion_diferencial', label: 'Presión diferencial', value: '--', unit: 'bar' },
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'L/h' },
    ],
    alarms: { min: 0, max: 3, crit_min: 0, crit_max: 4 },
  },

  'P-001': {
    label: 'Bomba de Transferencia',
    unit: '',
    category: 'Equipos de Proceso',
    icon: 'power',
    description: 'Bomba centrífuga para transferencia de materia prima entre equipos.',
    physical: [
      { key: 'potencia', label: 'Potencia nominal', value: '3', unit: 'HP' },
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '1800', unit: 'L/h' },
      { key: 'presion_descarga', label: 'Presión de descarga', value: '3', unit: 'bar' },
    ],
    chemical: [],
    process: [
      { key: 'estado', label: 'Estado de la bomba', value: '--', unit: '' },
      { key: 'horas_operacion', label: 'Horas de operación', value: '--', unit: 'h' },
    ],
  },

  'SALACE-001': {
    label: 'Salida de Aceite Caracterizado',
    unit: 'L/h',
    category: 'Corrientes de Proceso',
    icon: 'arrow-right',
    description: 'Corriente de salida de aceite vegetal caracterizado hacia la siguiente etapa.',
    physical: [
      { key: 'caudal_nominal', label: 'Caudal nominal de salida', value: '800 – 1200', unit: 'L/h' },
      { key: 'temp_operacion', label: 'Temperatura de operación', value: '30 – 40', unit: '°C' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez del aceite caracterizado', value: '< 2', unit: 'mg KOH/g' },
      { key: 'humedad', label: 'Humedad residual', value: '< 0.05', unit: '%' },
    ],
    process: [
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'L/h' },
      { key: 'presion_linea', label: 'Presión en línea', value: '--', unit: 'bar' },
    ],
    alarms: { min: 600, max: 1400, crit_min: 400, crit_max: 1600 },
  },

  'TK-001': {
    label: 'Tanque de Materia Prima',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento de materia prima (aceite vegetal crudo).',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '20000', unit: 'L' },
      { key: 'densidad', label: 'Densidad del contenido', value: '910 – 930', unit: 'kg/m³' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez de la materia prima', value: '< 2', unit: 'mg KOH/g' },
      { key: 'humedad', label: 'Humedad', value: '< 0.05', unit: '%' },
    ],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
    ],
    alarms: { min: 10, max: 90, crit_min: 5, crit_max: 95 },
  },

  'TK-002': {
    label: 'Tanque de Aceite Caracterizado',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento de aceite vegetal ya caracterizado.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '15000', unit: 'L' },
      { key: 'material', label: 'Material del tanque', value: 'Acero inoxidable 304', unit: '' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez del aceite caracterizado', value: '< 1.5', unit: 'mg KOH/g' },
    ],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
    ],
    alarms: { min: 10, max: 90, crit_min: 5, crit_max: 95 },
  },

  'TK-003': {
    label: 'Tanque Intermedio',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento intermedio para materia prima procesada.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '10000', unit: 'L' },
    ],
    chemical: [],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
    ],
    alarms: { min: 10, max: 90, crit_min: 5, crit_max: 95 },
  },

  'TK-004': {
    label: 'Tanque de Producto Caracterizado',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento final de producto caracterizado listo para proceso.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '25000', unit: 'L' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez del producto', value: '< 1', unit: 'mg KOH/g' },
      { key: 'humedad', label: 'Humedad del producto', value: '< 0.03', unit: '%' },
    ],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
    ],
    alarms: { min: 15, max: 85, crit_min: 8, crit_max: 92 },
  },

  // ─═ Variables legadas ═─────────────────────────────────────────
  TK_ACEITE: {
    label: 'Tanque de Aceite Crudo',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Almacenamiento de aceite vegetal (triglicéridos), materia prima principal del proceso de transesterificación.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '30000', unit: 'L' },
      { key: 'densidad_aceite', label: 'Densidad del aceite', value: '910 – 930', unit: 'kg/m³' },
      { key: 'viscosidad_40c', label: 'Viscosidad a 40°C', value: '30 – 40', unit: 'cSt' },
      { key: 'temp_almacenamiento', label: 'Temp. de almacenamiento', value: '25 – 35', unit: '°C' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez (mg KOH/g)', value: '< 2', unit: 'mg KOH/g' },
      { key: 'humedad', label: 'Humedad', value: '< 0.05', unit: '%' },
      { key: 'trigliceridos', label: 'Triglicéridos', value: '> 98', unit: '%' },
    ],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
      { key: 'caudal_salida', label: 'Caudal hacia filtración', value: '800 – 1200', unit: 'L/h' },
      { key: 'autonomia', label: 'Autonomía estimada', value: '--', unit: 'h' },
    ],
    alarms: { min: 15, max: 85, crit_min: 5, crit_max: 95 },
  },

  FILTRADO: {
    label: 'Filtro de Aceite',
    unit: 'bar',
    category: 'Equipos de Proceso',
    icon: 'filter',
    description: 'Filtro de malla para remoción de impurezas sólidas del aceite vegetal antes de la transesterificación.',
    physical: [
      { key: 'tipo_filtro', label: 'Tipo de filtro', value: 'Malla de acero inoxidable', unit: '' },
      { key: 'micronaje', label: 'Abertura de malla', value: '50 – 100', unit: 'µm' },
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '1500', unit: 'L/h' },
      { key: 'presion_max', label: 'Presión máxima de trabajo', value: '6', unit: 'bar' },
    ],
    chemical: [
      { key: 'retencion', label: 'Retención de partículas', value: '> 95', unit: '%' },
      { key: 'material', label: 'Material del medio filtrante', value: 'Acero inoxidable 304', unit: '' },
    ],
    process: [
      { key: 'presion_diferencial', label: 'Presión diferencial actual', value: '--', unit: 'bar' },
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'L/h' },
      { key: 'estado', label: 'Estado operativo', value: '--', unit: '' },
      { key: 'horas_operacion', label: 'Horas de operación', value: '--', unit: 'h' },
    ],
    alarms: { min: 0, max: 1.5, crit_min: 0, crit_max: 2.5 },
  },

  BOMBEO: {
    label: 'Bomba de Transferencia',
    unit: '',
    category: 'Equipos de Proceso',
    icon: 'power',
    description: 'Bomba centrífuga para transferencia de aceite y productos intermedios del proceso.',
    physical: [
      { key: 'tipo_bomba', label: 'Tipo de bomba', value: 'Centrífuga', unit: '' },
      { key: 'potencia_nominal', label: 'Potencia nominal', value: '7.5', unit: 'kW' },
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '40', unit: 'm³/h' },
      { key: 'altura_dinamica', label: 'Altura dinámica total', value: '30', unit: 'm' },
    ],
    chemical: [
      { key: 'fluido', label: 'Fluido bombeado', value: 'Aceite vegetal / Biodiesel', unit: '' },
      { key: 'temp_fluido', label: 'Temperatura del fluido', value: '30 – 60', unit: '°C' },
    ],
    process: [
      { key: 'estado', label: 'Estado (1=encendido, 0=apagado)', value: '--', unit: '' },
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'm³/h' },
      { key: 'presion_descarga', label: 'Presión de descarga', value: '--', unit: 'bar' },
      { key: 'horas_operacion', label: 'Horas acumuladas', value: '--', unit: 'h' },
    ],
    alarms: { min: 0, max: 1, crit_min: 0, crit_max: 1 },
  },

  CONTROL_1: {
    label: 'Panel de Control',
    unit: '',
    category: 'Instrumentación y Control',
    icon: 'cpu',
    description: 'Panel de control principal del proceso. Monitorea y regula setpoints, modos de operación y estado general de la planta.',
    physical: [
      { key: 'tipo_panel', label: 'Tipo de panel', value: 'PLC + HMI táctil', unit: '' },
      { key: 'voltaje_alimentacion', label: 'Voltaje de alimentación', value: '24 VDC / 120 VAC', unit: '' },
      { key: 'proteccion', label: 'Grado de protección', value: 'IP65', unit: '' },
    ],
    chemical: [
      { key: 'temp_ambiente', label: 'Temperatura ambiente de operación', value: '0 – 50', unit: '°C' },
      { key: 'humedad_ambiente', label: 'Humedad relativa máxima', value: '95', unit: '%' },
    ],
    process: [
      { key: 'modo_operacion', label: 'Modo de operación', value: 'Automático / Manual', unit: '' },
      { key: 'setpoint_reactor', label: 'Setpoint temperatura reactor', value: '--', unit: '°C' },
      { key: 'alarmas_activas', label: 'Alarmas activas', value: '--', unit: '' },
      { key: 'tiempo_operacion', label: 'Tiempo de operación continua', value: '--', unit: 'h' },
    ],
    alarms: { min: 0, max: 1, crit_min: 0, crit_max: 1 },
  },

  TK_ACE_FILTRADO: {
    label: 'Tanque de Aceite Filtrado',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Almacenamiento de aceite vegetal filtrado, listo para ser alimentado al reactor de transesterificación.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '20000', unit: 'L' },
      { key: 'densidad_aceite', label: 'Densidad del aceite filtrado', value: '910 – 925', unit: 'kg/m³' },
      { key: 'viscosidad', label: 'Viscosidad a 40°C', value: '28 – 36', unit: 'cSt' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez residual', value: '< 1.5', unit: 'mg KOH/g' },
      { key: 'humedad', label: 'Humedad residual', value: '< 0.03', unit: '%' },
      { key: 'solidos', label: 'Sólidos en suspensión', value: '< 10', unit: 'ppm' },
    ],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
      { key: 'caudal_alimentacion', label: 'Caudal hacia reactor', value: '500 – 800', unit: 'L/h' },
      { key: 'autonomia', label: 'Autonomía estimada', value: '--', unit: 'h' },
    ],
    alarms: { min: 20, max: 80, crit_min: 10, crit_max: 90 },
  },

  TK_METANOL: {
    label: 'Tanque de Metanol',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Almacenamiento de metanol anhidro para la reacción de transesterificación.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '15000', unit: 'L' },
      { key: 'densidad_metanol', label: 'Densidad del metanol (25°C)', value: '791', unit: 'kg/m³' },
      { key: 'punto_ebullicion', label: 'Punto de ebullición', value: '64.7', unit: '°C' },
      { key: 'viscosidad', label: 'Viscosidad a 25°C', value: '0.544', unit: 'cSt' },
    ],
    chemical: [
      { key: 'pureza', label: 'Pureza requerida', value: '> 99.5', unit: '%' },
      { key: 'humedad_max', label: 'Humedad máxima', value: '< 0.1', unit: '%' },
      { key: 'relacion_molar', label: 'Relación molar Metanol:Aceite', value: '6:1 – 9:1', unit: '' },
    ],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
      { key: 'caudal_dosificacion', label: 'Caudal de dosificación', value: '100 – 200', unit: 'L/h' },
      { key: 'autonomia', label: 'Autonomía estimada', value: '--', unit: 'h' },
    ],
    alarms: { min: 20, max: 80, crit_min: 10, crit_max: 90 },
  },

  TK_NAOH: {
    label: 'Tanque de NaOH',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de dosificación de hidróxido de sodio (catalizador) para la reacción de transesterificación.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '5000', unit: 'L' },
      { key: 'densidad_solucion', label: 'Densidad solución NaOH 1M', value: '1040', unit: 'kg/m³' },
      { key: 'concentracion', label: 'Concentración típica', value: '0.5 – 1.5', unit: 'M' },
      { key: 'temp_dosificacion', label: 'Temp. de dosificación', value: '25 – 30', unit: '°C' },
    ],
    chemical: [
      { key: 'tipo_catalizador', label: 'Tipo de catalizador', value: 'NaOH / KOH', unit: '' },
      { key: 'pureza', label: 'Pureza del catalizador', value: '> 98', unit: '%' },
      { key: 'dosificacion', label: 'Dosificación respecto al aceite', value: '0.5 – 1.0', unit: '% p/p' },
    ],
    process: [
      { key: 'nivel_actual', label: 'Nivel actual', value: '--', unit: '%' },
      { key: 'volumen_actual', label: 'Volumen actual', value: '--', unit: 'L' },
      { key: 'caudal_dosificacion', label: 'Caudal de dosificación', value: '10 – 30', unit: 'L/h' },
      { key: 'autonomia', label: 'Autonomía estimada', value: '--', unit: 'h' },
    ],
    alarms: { min: 20, max: 80, crit_min: 10, crit_max: 90 },
  },

  INT_CALOR: {
    label: 'Intercambiador de Calor',
    unit: '°C',
    category: 'Equipos de Proceso',
    icon: 'thermometer',
    description: 'Intercambiador de calor de coraza y tubos para precalentar el aceite antes del reactor.',
    physical: [
      { key: 'rango_salida', label: 'Rango temp. de salida', value: '55 – 70', unit: '°C' },
      { key: 'temp_entrada', label: 'Temp. de entrada típica', value: '30 – 40', unit: '°C' },
      { key: 'delta_t', label: 'ΔT de intercambio', value: '25 – 30', unit: '°C' },
      { key: 'coef_transferencia', label: 'Coef. U de transferencia', value: '250 – 400', unit: 'W/m²K' },
    ],
    chemical: [
      { key: 'fluido_calefactor', label: 'Fluido calefactor', value: 'Vapor saturado / Aceite térmico', unit: '' },
      { key: 'presion_vapor', label: 'Presión del fluido calefactor', value: '3 – 5', unit: 'bar' },
    ],
    process: [
      { key: 'temp_salida_actual', label: 'Temp. de salida actual', value: '--', unit: '°C' },
      { key: 'area_intercambio', label: 'Área de intercambio', value: '12.5', unit: 'm²' },
      { key: 'flujo_calor', label: 'Flujo de calor transferido', value: '--', unit: 'kW' },
      { key: 'eficiencia', label: 'Eficiencia térmica', value: '85 – 92', unit: '%' },
    ],
    alarms: { min: 50, max: 70, crit_min: 45, crit_max: 80 },
  },

  SIS_CIRCULACION: {
    label: 'Sistema de Circulación',
    unit: 'bar',
    category: 'Equipos de Proceso',
    icon: 'refresh-cw',
    description: 'Sistema de recirculación que mantiene el flujo continuo de aceite/metanol a través del reactor y el intercambiador.',
    physical: [
      { key: 'caudal_circulacion', label: 'Caudal de circulación nominal', value: '2000 – 3000', unit: 'L/h' },
      { key: 'presion_operacion', label: 'Presión de operación', value: '2 – 4', unit: 'bar' },
      { key: 'diametro_tuberia', label: 'Diámetro de tubería', value: '2 — 3', unit: 'pulg' },
      { key: 'material', label: 'Material', value: 'Acero inoxidable 316L', unit: '' },
    ],
    chemical: [
      { key: 'fluido', label: 'Fluido circulante', value: 'Mezcla aceite + metanol', unit: '' },
      { key: 'temp_operacion', label: 'Temperatura de operación', value: '55 – 65', unit: '°C' },
    ],
    process: [
      { key: 'caudal_actual', label: 'Caudal circulante actual', value: '--', unit: 'L/h' },
      { key: 'presion_actual', label: 'Presión del sistema', value: '--', unit: 'bar' },
      { key: 'valvula_bypass', label: 'Válvula bypass (apertura)', value: '--', unit: '%' },
      { key: 'estado_bomba_circ', label: 'Estado bomba de circulación', value: '--', unit: '' },
    ],
    alarms: { min: 1, max: 5, crit_min: 0.5, crit_max: 6 },
  },

  SAL_ALCOXIDO: {
    label: 'Salida de Alcoxido',
    unit: 'L/h',
    category: 'Corrientes de Proceso',
    icon: 'arrow-right',
    description: 'Corriente de salida de alcoxido de sodio (metanol + NaOH) preparado para la reacción.',
    physical: [
      { key: 'caudal_salida', label: 'Caudal de salida', value: '100 – 250', unit: 'L/h' },
      { key: 'densidad', label: 'Densidad de la solución', value: '860 – 900', unit: 'kg/m³' },
      { key: 'concentracion', label: 'Concentración de alcoxido', value: '0.5 – 1.0', unit: 'M' },
    ],
    chemical: [
      { key: 'pureza', label: 'Pureza del alcoxido', value: '> 95', unit: '%' },
      { key: 'agua_libre', label: 'Agua libre', value: '< 0.05', unit: '%' },
      { key: 'relacion_mezcla', label: 'Relación MeOH:NaOH', value: '20:1 – 30:1', unit: 'mol:mol' },
    ],
    process: [
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'L/h' },
      { key: 'temp_salida', label: 'Temperatura de salida', value: '--', unit: '°C' },
      { key: 'presion_linea', label: 'Presión en línea', value: '--', unit: 'bar' },
      { key: 'valvula_control', label: 'Válvula de control (apertura)', value: '--', unit: '%' },
    ],
    alarms: { min: 50, max: 300, crit_min: 20, crit_max: 350 },
  },

  SAL_ACEITE: {
    label: 'Salida de Aceite',
    unit: 'L/h',
    category: 'Corrientes de Proceso',
    icon: 'arrow-right',
    description: 'Corriente de salida de aceite precalentado hacia el reactor de transesterificación.',
    physical: [
      { key: 'caudal_salida', label: 'Caudal de salida nominal', value: '500 – 800', unit: 'L/h' },
      { key: 'temp_salida', label: 'Temperatura de salida', value: '55 – 65', unit: '°C' },
      { key: 'presion_linea', label: 'Presión en la línea', value: '2 – 3', unit: 'bar' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez del aceite', value: '< 1.5', unit: 'mg KOH/g' },
      { key: 'humedad', label: 'Humedad del aceite', value: '< 0.03', unit: '%' },
      { key: 'calidad', label: 'Calidad del aceite filtrado', value: 'Apta para reacción', unit: '' },
    ],
    process: [
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'L/h' },
      { key: 'temp_actual', label: 'Temperatura actual', value: '--', unit: '°C' },
      { key: 'presion_actual', label: 'Presión actual', value: '--', unit: 'bar' },
      { key: 'valvula_regulacion', label: 'Válvula de regulación (apertura)', value: '--', unit: '%' },
    ],
    alarms: { min: 400, max: 900, crit_min: 300, crit_max: 1000 },
  },

};

window.getTagProperties = function(varId) {
  return window.TAG_PROPERTIES_DB[varId] || null;
};
