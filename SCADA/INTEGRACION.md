# Integración SpY — P&ID ↔ HMI ↔ Dashboard ↔ Alarmas

## Arquitectura general

Tres vistas (P&ID, HMI, Dashboard) comparten los mismos datos en tiempo real a
través de `processVars` (objeto global actualizado cada 2s por `scada-core.js`)
y se comunican entre sí mediante `scadaBus` (bus de eventos basado en
`EventTarget`).

```
scada-core.js
  └─ updateRealtimeData() cada 2s
       ├─ initProcessVars()         ← siembra valores + umbrales
       ├─ fetch API / simulación    ← actualiza processVars
       ├─ populateVars()            ← refresca tabla HTML
       └─ AlarmManager.evaluateAlarms() ← detecta fuera de rango
```

---

## 1. Dashboard de Variables Físico-Químicas

**Archivo:** `dashboard-manager.js`

### Estructura

Se eliminó por completo el sistema anterior de widgets (arrastrar/agregar
gráficas Chart.js individuales). Ahora el dashboard muestra **todas las
variables del proceso a la vez**, organizadas en 6 secciones:

| Sección | Variables | Color |
|---|---|---|
| Propiedades Térmicas | TEMP_REACTOR, TEMP_HX, TEMP_COLUMN | Ámbar |
| Propiedades Mecánicas | PRES_REACTOR, PRES_COLUMN, FLOW_FEED, FLOW_PRODUCT | Cian |
| Propiedades Químicas | ACIDITY, LEVEL_CATALYST_TK, WATER_CONTENT | Verde |
| Calidad del Producto | DENSITY, VISCOSITY | Púrpura |
| Niveles de Tanques | LEVEL_REACTOR, LEVEL_BIODIESEL_TK, LEVEL_OIL_TK, LEVEL_METANOL_TK, LEVEL_GLYCERIN_TK | Azul |
| Estado de Equipos | PUMP_STATUS, MOTOR_AGITADOR | Naranja |

### Tarjeta de variable (prop-card)

Cada variable se representa como una tarjeta que contiene:

- Icono + tag (ej. `TEMP_REACTOR`)
- Nombre descriptivo (ej. "Temp. Reactor")
- **Valor numérico en vivo** — actualizado cada 2s
- Unidad de medida
- **Barra de rango** — muestra la posición del valor entre min/max
- Etiquetas de min y max
- **Indicador de estado**: Normal (verde) / Alarma (rojo) / Sin datos (gris)
- **Efecto pulsante** en la barra cuando hay alarma
- Borde rojo + sombra cuando la variable está fuera de rango

### Integración con scadaBus

- **Click en tarjeta** → emite `tag:select` → todas las vistas reaccionan
- **Receptor de `tag:focus`** → recibe highlight externo (outline verde 2.2s)
  + scrollIntoView

---

## 2. Alarmas automáticas desde processVars

**Archivo:** `alarm-manager.js`

### evaluateAlarms()

Función central ejecutada cada 2s desde `updateRealtimeData()`. Recorre todas
las variables en `processVars` y compara su valor actual contra:

- `alarmHi` / `alarmLo` (si están definidos en la variable)
- Si no existen, usa `max` / `min`

| Condición | Prioridad | Efecto |
|---|---|---|
| valor > alarmHi | critical | Sonido grave + notificación error |
| valor > max | high | Sonido medio |
| valor < min | high | Sonido medio |
| valor < alarmLo | critical | Sonido grave + notificación error |
| Vuelve a rango | resuelta | Sonido de resolución |

Cada detección:

1. Crea/actualiza entrada en `_activeAlarms` (mapa interno)
2. Agrega entrada al historial de localStorage (`scada_alarm_history`)
3. Reproduce sonido según prioridad
4. Muestra notificación en pantalla
5. Actualiza `window.alarmData` (compartido con otras vistas)
6. Refresca tabla de alarmas y badges

### Persistencia

- Historial guardado en `localStorage` bajo clave `scada_alarm_history`
- Límite: 200 entradas (FIFO)
- Cada entrada: `{ action, tag, note, ts }`

---

## 3. P&ID — Coloreado SVG por alarma

**Archivo:** `pid-manager.js`

### _wirePIDLiveValues(svgEl)

Al cargar un SVG, escanea todos los elementos con `data-tag` y crea
superposiciones de texto con el valor en vivo. También inicia un intervalo
de 2s para actualizarlos.

### _updatePIDLiveValues()

Además de actualizar los textos superpuestos, ahora también:

1. Recorre todos los elementos con `data-scada-var`
2. Verifica si la variable asociada está fuera de rango
3. Si está en **alarma** → `stroke="#ef4444"`, `stroke-width="3"`,
   `data-alarm="1"`
4. Si **vuelve a normal** → restaura el stroke original (guardado en
   `data-orig-stroke`) y elimina `data-alarm`

Los colores originales se preservan automáticamente en el primer ciclo.

### Receptor tag:focus

Cuando otra vista emite `tag:focus`, busca el elemento SVG con
`data-scada-var` y aplica un glow verde (`drop-shadow`) por 1.8s.

---

## 4. HMI — Coloreado SVG por alarma

**Archivo:** `hmi-manager.js`

### _updateLiveOverlays()

Misma lógica que P&ID:

1. Actualiza textos superpuestos con valores en vivo
2. Recorre elementos con `data-scada-var`
3. Si la variable está fuera de rango → `stroke="#ef4444"` + `data-alarm="1"`
4. Si vuelve a normal → restaura stroke original

### Receptor tag:focus

Mismo mecanismo que P&ID: glow verde por 1.8s sobre el elemento SVG
correspondiente.

---

## 5. Historial de Alarmas y Eventos

**Archivo:** `historicos-manager.js`

### Diseño

Se reemplazaron los 3 gráficos Chart.js anteriores por una **bitácora
unificada de eventos de alarma** que:

- Lee del mismo `localStorage` que `alarm-manager.js` (`scada_alarm_history`)
- Muestra tabla con columnas: HORA, TIPO, VARIABLE, DESCRIPCIÓN
- **Buscador en vivo** que filtra por nombre de variable o descripción
- **Barra de resumen**: Total / Alarmas / ACK / Resueltas
- Se refresca automáticamente cada 3s
- Botón "Limpiar" con confirmación

### Integración scadaBus

- **Click en cualquier fila** → `scadaBus.emit('tag:select', { tag, source:
  'history' })` → todas las vistas reaccionan

---

## 6. Bus de eventos (scadaBus)

**Archivo:** `integration-bus.js`

### Eventos

| Evento | Emisor | Receptores | Payload |
|---|---|---|---|
| `tag:select` | Cualquier vista | Bus → resuelve, renderiza inspector, re-emite `tag:focus` | `{ varId, tag, source }` |
| `tag:focus` | Bus | P&ID, HMI, Dashboard, 3D, Historial | `{ varId, tag, source }` |

### Detección de integración (`_checkIntegration()`)

Cada vez que se selecciona un tag o se carga un SVG, se comparan los tags de
P&ID, HMI y Dashboard. Si hay al menos un tag común entre P&ID y HMI, se
activa el badge **LIVE** en ambos visores. Si además el Dashboard comparte
ese tag, se muestra un badge especial indicando integración completa.

### Inspector de variables

Panel flotante que aparece al seleccionar un tag, mostrando:

- Tag, descripción, propiedad de ingeniería, ley de transporte
- Valor en vivo (actualizado cada 1.5s)
- Rango (min/max)
- Botones para navegar directamente a P&ID, HMI o Dashboard
  (emiten `tag:focus`)

---

## Flujo completo de ejemplo

```
1. Temperatura del reactor sube a 72°C (max=70°C)

2. updateRealtimeData() detecta el valor elevado
   └─ AlarmManager.evaluateAlarms()
        ├─ Crea alarma: TT-101, priority=high, "excede límite superior"
        ├─ Agrega a window.alarmData
        ├─ Guarda en localStorage (historial)
        ├─ Reproduce sonido beep
        └─ Muestra notificación roja

3. _updatePropertyCards() (dashboard)
   └─ Tarjeta TEMP_REACTOR:
        ├─ data-alarm="1", clase .prop-alarm
        ├─ Borde rojo + sombra
        ├─ Barra pulsante (animación)
        ├─ Estado cambia a "Alarma" (rojo)
        └─ Valor numérico en rojo

4. _updatePIDLiveValues() (P&ID)
   └─ Elemento SVG con data-scada-var="TEMP_REACTOR":
        ├─ stroke="#ef4444", stroke-width="3"
        └─ data-alarm="1"

5. _updateLiveOverlays() (HMI)
   └─ Elemento SVG con data-scada-var="TEMP_REACTOR":
        ├─ stroke="#ef4444", stroke-width="3"
        └─ data-alarm="1"

6. HistManager.render() (Historial)
   └─ Nueva fila: "14:32:15 | ALARMA | TT-101 | Temp. Reactor excede..."

7. Usuario hace clic en la tarjeta del Dashboard
   └─ tag:select → tag:focus
        ├─ P&ID: glow verde en ese elemento SVG
        ├─ HMI: glow verde en ese elemento SVG
        ├─ Dashboard: outline verde en la tarjeta
        └─ 3D: glow verde en el modelo

8. Temperatura vuelve a 65°C (dentro de rango)

9. evaluateAlarms() detecta que ya no hay violación
   ├─ Resuelve la alarma (status = RESUELTA)
   ├─ Guarda en historial: "dentro de rango normal"
   ├─ Reproduce sonido de resolución
   └─ window.alarmData actualizado

10. Dashboard: tarjeta vuelve a estado "Normal" (verde)
11. P&ID: SVG restaura stroke original
12. HMI: SVG restaura stroke original
```
