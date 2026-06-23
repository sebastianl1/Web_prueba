window.TAG_PROPERTIES_DB = {

  // ─═ Proceso Unitario 1: Caracterización de Materia Prima ═────────
  'ALCO-001': {
    label: 'Salida Alcoxido',
    unit: 'L/min',
    category: 'Corrientes de Proceso',
    icon: 'arrow-right',
    description: 'Salida de alcoxido preparado a 0.5 M para transesterificación.',
    physical: [
      { key: 'volumen_final', label: 'Volumen final', value: '180', unit: 'L' },
      { key: 'caudal', label: 'Caudal', value: '15 – 20', unit: 'L/min' },
      { key: 'concentracion', label: 'Concentración', value: '0.5', unit: 'M' },
    ],
    chemical: [
      { key: 'pureza', label: 'Pureza', value: '> 95', unit: '%' },
      { key: 'agua_libre', label: 'Agua libre', value: '< 0.05', unit: '%' },
    ],
    process: [
      { key: 'balance_materia_salida', label: 'Salida neta', value: '180', unit: 'L' },
      { key: 'balance_energia_perdidas', label: 'Pérdidas en tuberías', value: '0.01', unit: 'GJ' },
      { key: 'balance_momentum_delta_p', label: 'ΔP', value: '0.1', unit: 'bar' },
      { key: 'balance_momentum_velocidad', label: 'Velocidad', value: '0.8', unit: 'm/s' },
    ],
    alarms: { min: 50, max: 300, crit_min: 20, crit_max: 350 },
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
      { key: 'monitoreo_caudal', label: 'Monitoreo de caudal', value: '--', unit: 'L/min' },
      { key: 'monitoreo_presion', label: 'Monitoreo de presión', value: '--', unit: 'bar' },
      { key: 'monitoreo_nivel', label: 'Monitoreo de nivel', value: '--', unit: '%' },
    ],
    chemical: [
      { key: 'ajuste_ph', label: 'Ajuste de pH', value: '4.8 → 7.5', unit: '' },
      { key: 'acidez_objetivo', label: 'Índice de acidez objetivo', value: '< 1', unit: 'mg KOH/g' },
    ],
    process: [
      { key: 'estado', label: 'Estado del panel', value: '--', unit: '' },
      { key: 'comunicacion', label: 'Comunicación con SCADA', value: '--', unit: '' },
      { key: 'balance_materia_entrada', label: 'Entrada', value: '838', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '834', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas', value: '4', unit: 'L' },
      { key: 'balance_energia_deshidratacion', label: 'Deshidratación a 90°C', value: '0.3', unit: 'GJ' },
      { key: 'balance_energia_secado', label: 'Secado a 70°C', value: '0.1', unit: 'GJ' },
      { key: 'balance_momentum_regulacion', label: 'Regulación de válvulas', value: '2', unit: '%' },
    ],
  },

  'E-003': {
    label: 'Esterificador 001 (Reactor Alcoxido)',
    unit: '°C',
    category: 'Equipos de Proceso',
    icon: 'thermometer',
    description: 'Reactor para formación de alcoxido a 0.5 M con metanol + KOH.',
    physical: [
      { key: 'capacidad', label: 'Capacidad del reactor', value: '1000', unit: 'L' },
      { key: 'volumen_operativo', label: 'Volumen operativo', value: '850', unit: 'L' },
      { key: 'temp_operacion', label: 'Temperatura de operación', value: '60', unit: '°C' },
      { key: 'presion_diseno', label: 'Presión de diseño', value: '4', unit: 'bar' },
    ],
    chemical: [
      { key: 'concentracion_alcoxido', label: 'Concentración alcoxido', value: '0.5', unit: 'M' },
      { key: 'metanol_usado', label: 'Metanol usado', value: '180', unit: 'L' },
      { key: 'koh_usado', label: 'KOH usado', value: '5.05', unit: 'kg' },
    ],
    process: [
      { key: 'balance_materia_salida', label: 'Salida alcoxido', value: '180', unit: 'L' },
      { key: 'balance_energia_calor', label: 'Calor requerido', value: '0.1', unit: 'GJ' },
      { key: 'balance_energia_perdidas', label: 'Pérdidas', value: '0.01', unit: 'GJ' },
      { key: 'balance_momentum_delta_p', label: 'ΔP', value: '0.25', unit: 'bar' },
      { key: 'balance_momentum_caudal', label: 'Caudal interno', value: '15', unit: 'L/min' },
    ],
    alarms: { min: 55, max: 70, crit_min: 50, crit_max: 75 },
  },

  'E.W-003': {
    label: 'Sistema de Circulación de Agua',
    unit: 'm³/h',
    category: 'Equipos de Proceso',
    icon: 'refresh-cw',
    description: 'Sistema de circulación de agua para transferencia térmica a 60°C.',
    physical: [
      { key: 'flujo', label: 'Flujo', value: '1', unit: 'm³/h' },
      { key: 'temperatura', label: 'Temperatura', value: '60', unit: '°C' },
      { key: 'velocidad', label: 'Velocidad', value: '0.5', unit: 'm/s' },
    ],
    chemical: [
      { key: 'fluido', label: 'Fluido', value: 'Agua', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '1000', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '990', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas', value: '10', unit: 'L' },
      { key: 'balance_energia_transferencia', label: 'Transferencia térmica', value: '0.1', unit: 'GJ' },
      { key: 'balance_momentum_delta_p', label: 'ΔP', value: '0.1', unit: 'bar' },
    ],
    alarms: { min: 300, max: 900, crit_min: 200, crit_max: 1000 },
  },

  'FIL-001': {
    label: 'Filtro de Materia Prima',
    unit: 'bar',
    category: 'Equipos de Proceso',
    icon: 'filter',
    description: 'Filtro de malla para eliminación de sólidos y agua.',
    physical: [
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '25', unit: 'L/min' },
      { key: 'presion_diferencial', label: 'Presión diferencial', value: '1.5', unit: 'bar' },
    ],
    chemical: [
      { key: 'eliminacion_solidos', label: 'Eliminación de sólidos', value: '--', unit: '' },
      { key: 'eliminacion_agua', label: 'Eliminación de agua', value: '--', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '891', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '846', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas', value: '45', unit: 'L' },
      { key: 'balance_energia_perdidas', label: 'Pérdidas térmicas', value: '0.5', unit: 'MJ' },
      { key: 'balance_momentum_delta_p', label: 'ΔP', value: '0.2', unit: 'bar' },
    ],
    alarms: { min: 0, max: 3, crit_min: 0, crit_max: 4 },
  },

  'P-001': {
    label: 'Bomba de Transferencia',
    unit: 'L/min',
    category: 'Equipos de Proceso',
    icon: 'power',
    description: 'Bomba centrífuga para transporte de aceite filtrado.',
    physical: [
      { key: 'potencia', label: 'Potencia nominal', value: '3', unit: 'HP' },
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '20', unit: 'L/min' },
      { key: 'presion_descarga', label: 'Presión de descarga', value: '3', unit: 'bar' },
      { key: 'velocidad', label: 'Velocidad', value: '1', unit: 'm/s' },
    ],
    chemical: [
      { key: 'transporte_aceite', label: 'Transporte aceite filtrado', value: '--', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '846', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '838', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas', value: '8', unit: 'L' },
      { key: 'balance_energia_consumo', label: 'Consumo eléctrico', value: '5', unit: 'kW' },
      { key: 'balance_energia_perdidas', label: 'Pérdidas', value: '0.1', unit: 'MJ' },
      { key: 'balance_momentum_delta_p', label: 'ΔP', value: '0.3', unit: 'bar' },
    ],
  },

  'SALACE-001': {
    label: 'Salida Aceite Caracterizado',
    unit: 'L/min',
    category: 'Corrientes de Proceso',
    icon: 'arrow-right',
    description: 'Salida de aceite caracterizado verificado listo para transesterificación.',
    physical: [
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '20', unit: 'L/min' },
      { key: 'velocidad', label: 'Velocidad', value: '0.8', unit: 'm/s' },
    ],
    chemical: [
      { key: 'aceite_verificado', label: 'Aceite verificado', value: 'Listo para transesterificación', unit: '' },
    ],
    process: [
      { key: 'balance_materia_salida', label: 'Salida neta', value: '834', unit: 'L' },
      { key: 'balance_energia_perdidas', label: 'Pérdidas en tuberías', value: '0.05', unit: 'MJ' },
      { key: 'balance_momentum_delta_p', label: 'ΔP', value: '0.1', unit: 'bar' },
    ],
    alarms: { min: 600, max: 1400, crit_min: 400, crit_max: 1600 },
  },

  'TK-001': {
    label: 'Tanque Almacenamiento Aceite Residual',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento de aceite vegetal crudo.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '1000', unit: 'L' },
      { key: 'volumen_operativo', label: 'Volumen operativo', value: '900', unit: 'L' },
      { key: 'nivel_actual', label: 'Nivel actual', value: '90', unit: '%' },
      { key: 'presion_hidrostatica', label: 'Presión hidrostática', value: '0.9', unit: 'bar' },
    ],
    chemical: [
      { key: 'ph', label: 'pH', value: '4.8', unit: '' },
      { key: 'acidez', label: 'Índice de acidez', value: '5', unit: 'mg KOH/g' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '900', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '891', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas (1%)', value: '9', unit: 'L' },
      { key: 'balance_energia', label: 'Energía conservación', value: '25', unit: '°C' },
      { key: 'balance_momentum', label: 'Presión hidrostática inicial', value: '0.9', unit: 'bar' },
    ],
    alarms: { min: 10, max: 90, crit_min: 5, crit_max: 95 },
  },

  'TK-002': {
    label: 'Tanque Aceite Caracterizado',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento de aceite limpio caracterizado.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '1000', unit: 'L' },
      { key: 'volumen_operativo', label: 'Volumen operativo', value: '850', unit: 'L' },
      { key: 'acumulacion_final', label: 'Acumulación final', value: '834', unit: 'L' },
    ],
    chemical: [
      { key: 'aceite_limpio', label: 'Aceite limpio', value: '--', unit: '' },
      { key: 'ph', label: 'pH', value: '7.5', unit: '' },
      { key: 'acidez', label: 'Índice de acidez', value: '< 1', unit: 'mg KOH/g' },
    ],
    process: [
      { key: 'balance_materia_acumulacion', label: 'Acumulación neta', value: '834', unit: 'L' },
      { key: 'balance_energia_mantenimiento', label: 'Mantenimiento térmico', value: '70', unit: '°C' },
      { key: 'balance_momentum_presion', label: 'Presión interna', value: '0.8', unit: 'bar' },
    ],
    alarms: { min: 10, max: 90, crit_min: 5, crit_max: 95 },
  },

  'TK-003': {
    label: 'Tanque de Metanol',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de metanol anhidro para reacción de transesterificación.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '1000', unit: 'L' },
      { key: 'volumen_operativo', label: 'Volumen operativo', value: '850', unit: 'L' },
      { key: 'carga_inicial', label: 'Carga inicial', value: '184', unit: 'L' },
      { key: 'carga_final', label: 'Carga final', value: '180', unit: 'L' },
    ],
    chemical: [
      { key: 'pureza_metanol', label: 'Pureza metanol', value: '> 99', unit: '%' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '184', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '180', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas (2%)', value: '4', unit: 'L' },
      { key: 'balance_energia_calentamiento', label: 'Calentamiento a 60°C', value: '0.05', unit: 'GJ' },
      { key: 'balance_momentum_delta_p', label: 'ΔP', value: '0.2', unit: 'bar' },
    ],
    alarms: { min: 20, max: 80, crit_min: 10, crit_max: 90 },
  },

  'TK-004': {
    label: 'Tanque de KOH',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de KOH sólido para disolución en metanol.',
    physical: [
      { key: 'capacidad_total', label: 'Capacidad total', value: '1000', unit: 'kg' },
      { key: 'volumen_operativo', label: 'Volumen operativo', value: '850', unit: 'kg' },
      { key: 'carga_inicial', label: 'Carga inicial', value: '5.2', unit: 'kg' },
      { key: 'carga_final', label: 'Carga final', value: '5.05', unit: 'kg' },
    ],
    chemical: [
      { key: 'koh_solido', label: 'KOH sólido', value: '--', unit: '' },
      { key: 'disolucion_metanol', label: 'Disolución en metanol', value: '--', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '5.2', unit: 'kg' },
      { key: 'balance_materia_salida', label: 'Salida', value: '5.05', unit: 'kg' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas (3%)', value: '0.15', unit: 'kg' },
      { key: 'balance_energia_calor', label: 'Calor de disolución', value: '0.5', unit: 'MJ' },
      { key: 'balance_momentum_flujo', label: 'Flujo sólido-líquido', value: '--', unit: '' },
    ],
    alarms: { min: 20, max: 80, crit_min: 10, crit_max: 90 },
  },

  // ─═ Proceso Unitario 2: Transesterificación y Separación ═────────
  'EST-001': {
    label: 'Tanque Evaluación y Esterificación',
    unit: '%',
    category: 'Equipos de Proceso',
    icon: 'thermometer',
    description: 'Tanque de evaluación y esterificación del aceite. Recibe 834 L desde SALACE-001, evalúa IA. Si IA>1.5% aplica esterificación con metanol 83L y ácido sulfúrico 4-8 kg.',
    physical: [
      { key: 'capacidad', label: 'Capacidad del tanque', value: '1000', unit: 'L' },
      { key: 'volumen_aceite', label: 'Volumen aceite', value: '834', unit: 'L' },
      { key: 'metanol_esterificacion', label: 'Metanol esterificación', value: '83', unit: 'L' },
      { key: 'acido_sulfurico', label: 'Ácido sulfúrico', value: '4 – 8', unit: 'kg' },
      { key: 'temp_operacion', label: 'Temperatura operación', value: '55 – 70', unit: '°C' },
    ],
    chemical: [
      { key: 'ia_entrada', label: 'Índice acidez entrada', value: '> 1.5', unit: '%' },
      { key: 'ia_salida', label: 'Índice acidez salida', value: '< 1.5', unit: '%' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada aceite', value: '834', unit: 'L' },
      { key: 'balance_materia_metanol', label: 'Metanol esterificación', value: '83', unit: 'L' },
      { key: 'balance_materia_acido', label: 'Ácido sulfúrico', value: '4 – 8', unit: 'kg' },
      { key: 'balance_materia_salida', label: 'Salida aceite esterificado', value: '834', unit: 'L' },
      { key: 'temp_operacion', label: 'Temperatura operación', value: '55 – 70', unit: '°C' },
    ],
    alarms: { min: 55, max: 70, crit_min: 50, crit_max: 75 },
  },

  'GLI-001': {
    label: 'Tanque de Glicerina',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento de glicerina. Recibe 220 L desde TRAN-001. Salida neta 218 L.',
    physical: [
      { key: 'capacidad', label: 'Capacidad del tanque', value: '500', unit: 'L' },
      { key: 'entrada_glicerina', label: 'Entrada glicerina', value: '220', unit: 'L' },
      { key: 'salida_neta', label: 'Salida neta', value: '218', unit: 'L' },
    ],
    chemical: [
      { key: 'pureza_glicerina', label: 'Pureza glicerina', value: '> 80', unit: '%' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '220', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida neta', value: '218', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas menores', value: '2', unit: 'L' },
    ],
    alarms: { min: 10, max: 85, crit_min: 5, crit_max: 90 },
  },

  'PRO_DES-001': {
    label: 'Tanque de Desecho',
    unit: 'L',
    category: 'Tanques de Almacenamiento',
    icon: 'trash-2',
    description: 'Tanque de acumulación de desechos. Acumula 14 L de trazas y producto fuera de especificación.',
    physical: [
      { key: 'capacidad', label: 'Capacidad del tanque', value: '100', unit: 'L' },
      { key: 'acumulacion', label: 'Acumulación actual', value: '14', unit: 'L' },
    ],
    chemical: [
      { key: 'tipo_desecho', label: 'Tipo de desecho', value: 'Trazas y producto fuera de especificación', unit: '' },
    ],
    process: [
      { key: 'balance_materia_acumulacion', label: 'Acumulación', value: '14', unit: 'L' },
    ],
  },

  'SEP-001': {
    label: 'Tanque Almacenamiento Éster Metílico',
    unit: '%',
    category: 'Tanques de Almacenamiento',
    icon: 'droplet',
    description: 'Tanque de almacenamiento de éster metílico. Recibe 780 L desde TRAN-001. Salida neta 770 L.',
    physical: [
      { key: 'capacidad', label: 'Capacidad del tanque', value: '1000', unit: 'L' },
      { key: 'entrada_ester', label: 'Entrada éster metílico', value: '780', unit: 'L' },
      { key: 'salida_neta', label: 'Salida neta', value: '770', unit: 'L' },
    ],
    chemical: [
      { key: 'impurezas', label: 'Impurezas y trazas metanol/jabones', value: '--', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '780', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida neta', value: '770', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas', value: '10', unit: 'L' },
    ],
    alarms: { min: 10, max: 90, crit_min: 5, crit_max: 95 },
  },

  'SIS_BOM-001': {
    label: 'Sistema Bombeo Auxiliar',
    unit: 'kW',
    category: 'Equipos de Proceso',
    icon: 'power',
    description: 'Sistema de bombeo bombeo de respaldo para alimentar reactor y mantener temperatura. Pérdidas 0.5% en transferencia.',
    physical: [
      { key: 'potencia_total', label: 'Potencia total instalada', value: '15', unit: 'kW' },
      { key: 'tipo_bomba', label: 'Tipo de bomba', value: 'Centrífuga multietapa', unit: '' },
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '3000', unit: 'L/h' },
    ],
    chemical: [
      { key: 'fluido', label: 'Fluido bombeado', value: 'Mezcla biodiesel/glicerol/aceite', unit: '' },
    ],
    process: [
      { key: 'estado', label: 'Estado (1=activo)', value: '--', unit: '' },
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'L/h' },
      { key: 'perdidas_transferencia', label: 'Pérdidas transferencia (0.5%)', value: '--', unit: '' },
    ],
    alarms: { min: 0, max: 1, crit_min: 0, crit_max: 1 },
  },

  'SIS_TRAN-001': {
    label: 'Sistema Transferencia Éster Metílico',
    unit: 'L/h',
    category: 'Equipos de Proceso',
    icon: 'truck',
    description: 'Sistema de transferencia de éster metílico desde TRAN-001 a SEP-001. Pérdidas 0.5% (≈4 L).',
    physical: [
      { key: 'tipo_transporte', label: 'Tipo de transporte', value: 'Bomba + tubería', unit: '' },
      { key: 'longitud_tuberia', label: 'Longitud tubería', value: '150', unit: 'm' },
      { key: 'diametro', label: 'Diámetro tubería', value: '3', unit: 'pulg' },
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '780', unit: 'L/h' },
    ],
    chemical: [
      { key: 'fluido', label: 'Fluido transportado', value: 'Éster metílico', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '780', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '776', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas (0.5%)', value: '4', unit: 'L' },
    ],
    alarms: { min: 0, max: 1, crit_min: 0, crit_max: 1 },
  },

  'TRAN-001': {
    label: 'Reactor Transesterificación',
    unit: 'L',
    category: 'Equipos de Proceso',
    icon: 'cpu',
    description: 'Reactor de transesterificación. Mezcla 834 L aceite esterificado + 180 L alcoxido 0.5M. Salida 1014 L (780 L éster + 220 L glicerina + 14 L desechos).',
    physical: [
      { key: 'capacidad', label: 'Capacidad del reactor', value: '1500', unit: 'L' },
      { key: 'volumen_aceite', label: 'Volumen aceite', value: '834', unit: 'L' },
      { key: 'volumen_alcoxido', label: 'Volumen alcoxido', value: '180', unit: 'L' },
      { key: 'temp_operacion', label: 'Temperatura operación', value: '58 – 61', unit: '°C' },
    ],
    chemical: [
      { key: 'conversion', label: 'Conversión esperada', value: '> 96', unit: '%' },
      { key: 'relacion_molar', label: 'Relación molar', value: '6:1', unit: '' },
    ],
    process: [
      { key: 'balance_materia_aceite', label: 'Aceite esterificado', value: '834', unit: 'L' },
      { key: 'balance_materia_alcoxido', label: 'Alcoxido 0.5M', value: '180', unit: 'L' },
      { key: 'balance_materia_salida_total', label: 'Salida total', value: '1014', unit: 'L' },
      { key: 'balance_materia_ester', label: 'Éster metílico', value: '780', unit: 'L' },
      { key: 'balance_materia_glicerina', label: 'Glicerina', value: '220', unit: 'L' },
      { key: 'balance_materia_desechos', label: 'Desechos', value: '14', unit: 'L' },
      { key: 'temp_operacion', label: 'Temperatura operación', value: '58 – 61', unit: '°C' },
    ],
    alarms: { min: 58, max: 61, crit_min: 55, crit_max: 65 },
  },

  // ─═ Proceso Unitario 3: Purificación y Secado ═─────────────────
  'PRO_DES-003': {
    label: 'Tanque Desecho Impurezas',
    unit: 'L',
    category: 'Tanques de Almacenamiento',
    icon: 'trash-2',
    description: 'Tanque de desecho de impurezas. Acumula 10 L de trazas, agua y metanol residual de SEC-001 y SEC_COND-001.',
    physical: [
      { key: 'capacidad', label: 'Capacidad del tanque', value: '100', unit: 'L' },
      { key: 'acumulacion', label: 'Acumulación actual', value: '10', unit: 'L' },
    ],
    chemical: [
      { key: 'tipo_desecho', label: 'Tipo de desecho', value: 'Trazas impurezas, agua, metanol residual', unit: '' },
    ],
    process: [
      { key: 'balance_materia_acumulacion', label: 'Acumulación', value: '10', unit: 'L' },
      { key: 'procedencia', label: 'Procedencia', value: 'SEC-001 y SEC_COND-001', unit: '' },
    ],
  },

  'PRO_FIN-001': {
    label: 'Producto Final Caracterizado',
    unit: 'L',
    category: 'Corrientes de Proceso',
    icon: 'check-circle',
    description: 'Producto final caracterizado controlado por microcontrolador. Solvente compuestos apolares, propiedades dieléctricas, baja acidez, viscosidad 3.5-5.0 cSt, densidad 0.86 g/cm³. Salida 760 L.',
    physical: [
      { key: 'volumen_final', label: 'Volumen final', value: '760', unit: 'L' },
      { key: 'viscosidad', label: 'Viscosidad', value: '3.5 – 5.0', unit: 'cSt' },
      { key: 'densidad', label: 'Densidad', value: '0.86', unit: 'g/cm³' },
      { key: 'temp_referencia', label: 'Temp. referencia', value: '40', unit: '°C' },
      { key: 'resistencia_electrica', label: 'Resistencia eléctrica', value: 'Muy alta (OL)', unit: '' },
    ],
    chemical: [
      { key: 'acidez', label: 'Acidez', value: '≈ 0', unit: 'mg KOH/g' },
      { key: 'solvente_apolar', label: 'Solvente compuestos apolares', value: '--', unit: '' },
      { key: 'propiedades_dielectricas', label: 'Propiedades dieléctricas', value: 'Resistencia muy alta', unit: '' },
      { key: 'norma', label: 'Norma aplicable', value: 'ASTM D6751 / EN 14214', unit: '' },
    ],
    process: [
      { key: 'balance_materia_salida', label: 'Salida final', value: '760', unit: 'L' },
      { key: 'viscosidad_actual', label: 'Viscosidad actual', value: '--', unit: 'cSt' },
      { key: 'densidad_actual', label: 'Densidad actual', value: '--', unit: 'g/cm³' },
      { key: 'calidad', label: 'Calidad (cumple norma)', value: '--', unit: '' },
    ],
  },

  'SEC-001': {
    label: 'Secado y Separación de Fases',
    unit: '°C',
    category: 'Equipos de Proceso',
    icon: 'thermometer',
    description: 'Secador para eliminar trazas de metanol y jabones. Recibe éster metílico tras VIS-001. Microcontrolador mide conductividad: resistencia ≈∞ (OL). Salida 765 L éster seco.',
    physical: [
      { key: 'entrada_ester', label: 'Entrada éster', value: '770', unit: 'L' },
      { key: 'temp_operacion', label: 'Temp. operación', value: '60 – 80', unit: '°C' },
      { key: 'presion_operacion', label: 'Presión operación', value: '1 – 2', unit: 'bar' },
      { key: 'capacidad', label: 'Capacidad nominal', value: '2000', unit: 'L/h' },
    ],
    chemical: [
      { key: 'conductividad', label: 'Conductividad eléctrica', value: 'Muy baja', unit: '' },
      { key: 'resistencia', label: 'Resistencia', value: 'OL (infinito)', unit: '' },
      { key: 'metanol_residual', label: 'Metanol residual', value: '< 0.02', unit: '%' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '770', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '765', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas', value: '5', unit: 'L' },
      { key: 'temp_actual', label: 'Temp. actual', value: '--', unit: '°C' },
      { key: 'conductividad_actual', label: 'Conductividad actual', value: '--', unit: '' },
    ],
    alarms: { min: 60, max: 80, crit_min: 55, crit_max: 85 },
  },

  'SEC_COND-001': {
    label: 'Secado Intensivo y Control Humedad',
    unit: 'ppm',
    category: 'Equipos de Proceso',
    icon: 'wind',
    description: 'Secado intensivo para eliminar trazas de agua. Mide humedad residual <500 ppm. Salida 760 L éster seco libre de humedad.',
    physical: [
      { key: 'entrada_ester', label: 'Entrada éster', value: '765', unit: 'L' },
      { key: 'humedad_objetivo', label: 'Humedad objetivo', value: '< 500', unit: 'ppm' },
      { key: 'temp_operacion', label: 'Temp. operación', value: '60 – 80', unit: '°C' },
      { key: 'presion_operacion', label: 'Presión operación', value: '0.5 – 1.5', unit: 'bar' },
    ],
    chemical: [
      { key: 'humedad_residual', label: 'Humedad residual', value: '< 500', unit: 'ppm' },
      { key: 'agua_eliminada', label: 'Agua eliminada', value: '--', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada', value: '765', unit: 'L' },
      { key: 'balance_materia_salida', label: 'Salida', value: '760', unit: 'L' },
      { key: 'balance_materia_perdidas', label: 'Pérdidas', value: '5', unit: 'L' },
      { key: 'humedad_actual', label: 'Humedad actual', value: '--', unit: 'ppm' },
    ],
    alarms: { min: 0, max: 500, crit_min: 0, crit_max: 1000 },
  },

  'SIS_CIRC-001': {
    label: 'Sistema de Circulación',
    unit: 'L/h',
    category: 'Equipos de Proceso',
    icon: 'refresh-cw',
    description: 'Sistema de circulación que alimenta y conecta SEC-001 y SEC_COND-001. Mantiene flujo estable y control temp ≈60°C. Pérdidas 0.5%.',
    physical: [
      { key: 'caudal_nominal', label: 'Caudal nominal', value: '500 – 800', unit: 'L/h' },
      { key: 'temp_control', label: 'Temp. control', value: '60', unit: '°C' },
      { key: 'presion_operacion', label: 'Presión operación', value: '2 – 3', unit: 'bar' },
      { key: 'diametro_tuberia', label: 'Diámetro tubería', value: '2', unit: 'pulg' },
    ],
    chemical: [
      { key: 'fluido', label: 'Fluido circulante', value: 'Éster metílico en secado', unit: '' },
    ],
    process: [
      { key: 'caudal_actual', label: 'Caudal actual', value: '--', unit: 'L/h' },
      { key: 'temp_actual', label: 'Temp. actual', value: '--', unit: '°C' },
      { key: 'presion_actual', label: 'Presión actual', value: '--', unit: 'bar' },
      { key: 'perdidas_transferencia', label: 'Pérdidas transferencia (0.5%)', value: '--', unit: '' },
      { key: 'estado_bomba', label: 'Estado bomba', value: '--', unit: '' },
    ],
    alarms: { min: 300, max: 900, crit_min: 200, crit_max: 1000 },
  },

  'VIS-001': {
    label: 'Medición de Viscosidad',
    unit: 'cSt',
    category: 'Instrumentación y Control',
    icon: 'activity',
    description: 'Medidor de viscosidad cinemática del éster metílico. Recibe 770 L desde SEP-001. Mide viscosidad al éster metílico. Valor esperado 3.5-5.0 cSt a 40°C (ASTM D6751/EN 14214).',
    physical: [
      { key: 'entrada_ester', label: 'Entrada éster metílico', value: '770', unit: 'L' },
      { key: 'viscosidad_esperada', label: 'Viscosidad esperada', value: '3.5 – 5.0', unit: 'cSt' },
      { key: 'temp_referencia', label: 'Temp. referencia', value: '40', unit: '°C' },
      { key: 'densidad', label: 'Densidad', value: '0.86', unit: 'g/cm³' },
      { key: 'temp_referencia_densidad', label: 'Temp. referencia densidad', value: '25', unit: '°C' },
    ],
    chemical: [
      { key: 'norma', label: 'Norma aplicable', value: 'ASTM D6751 / EN 14214', unit: '' },
    ],
    process: [
      { key: 'balance_materia_entrada', label: 'Entrada éster', value: '770', unit: 'L' },
      { key: 'viscosidad_actual', label: 'Viscosidad actual', value: '--', unit: 'cSt' },
      { key: 'temp_actual', label: 'Temp. actual análisis', value: '--', unit: '°C' },
      { key: 'calidad', label: 'Calidad (cumple norma)', value: '--', unit: '' },
    ],
    alarms: { min: 3.5, max: 5.0, crit_min: 3.0, crit_max: 5.5 },
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
