# Guía de Integración P&ID ↔ HMI ↔ Dashboard
## Cómo construir diagramas en AutoCAD para que se integren automáticamente en NexSCADA

---

## 1. Filosofía del Sistema

NexSCADA unifica tres vistas mediante un bus de eventos (`scadaBus`) y datos en vivo (`processVars`):

```
  scadaBus (tag:select / tag:focus)
  ┌─────────┐     ┌─────────┐     ┌──────────────┐
  │   P&ID   │◄───►│   HMI   │◄───►│  Dashboard   │
  │ (SVG)   │     │ (SVG)   │     │ (tarjetas)   │
  └─────────┘     └─────────┘     └──────────────┘
         ▲              ▲                ▲
         └──────────────┴────────────────┘
                  processVars
               (actualiza cada 2s)
```

**El puente entre tus dibujos y el sistema es el atributo `data-tag`.**

---

## 2. Mecanismo Central: `data-tag`

### Qué hace

Cada elemento SVG (`<rect>`, `<circle>`, `<path>`, `<polygon>`, `<g>`, etc.) que tenga `data-tag="NOMBRE_VARIABLE"` se vuelve:

1. **Clickeable** → abre el Inspector de Tag y navega al P&ID/HMI/Dashboard
2. **Resaltable** → al pasar el mouse se ilumina en verde
3. **Coloreable en alarma** → si la variable supera límites, el trazo se pone rojo
4. **Con overlay de valor vivo** → aparece un texto flotante con el valor actual (se actualiza cada 2s)

### Reglas de nombres

| Regla | Detalle |
|---|---|
| Atributo | `data-tag="TEMP_REACTOR"` |
| Formato | MAYÚSCULAS_CON_GUIONES_BAJOS |
| Debe coincidir con | El `id` de una variable en `variable-manager.js` |
| Normalización | El sistema convierte a minúsculas y espacios a `_` |
| Búsqueda (por orden) | 1. `data-tag` 2. `data-var` 3. `id` del elemento 4. `inkscape:label` |

### Lista completa de IDs de variables disponibles

```
TEMP_REACTOR        → Temperatura del reactor principal
TEMP_HX             → Temperatura de salida del intercambiador
TEMP_COLUMN         → Temperatura de la columna de destilación
PRES_REACTOR        → Presión del reactor
PRES_COLUMN         → Presión de la columna
FLOW_FEED           → Caudal de alimentación
FLOW_PRODUCT        → Caudal de producto
LEVEL_REACTOR       → Nivel del reactor
LEVEL_BIODIESEL_TK  → Nivel del tanque de biodiesel
LEVEL_OIL_TK        → Nivel del tanque de aceite
LEVEL_METANOL_TK    → Nivel del tanque de metanol
LEVEL_CATALYST_TK   → Nivel del tanque de catalizador
LEVEL_GLYCERIN_TK   → Nivel del tanque de glicerina
LEVEL_WASH_TK       → Nivel del tanque de lavado
DENSITY             → Densidad del producto
VISCOSITY           → Viscosidad del producto
ACIDITY             → Acidez del producto
WATER_CONTENT       → Contenido de agua del producto
PUMP_STATUS         → Estado de la bomba (encendida/apagada)
MOTOR_AGITADOR      → Estado del motor del agitador
```

---

## 3. Cómo Integrar tus Diagramas de AutoCAD

### Paso 1: Exportar desde AutoCAD

1. Dibuja tu P&ID o HMI en AutoCAD con la simbología estándar (ISA S5.1 para P&ID).
2. Usa el comando `EXPORT` → selecciona formato **SVG**.
3. Guarda el archivo con un nombre descriptivo, ej: `reactor-area.svg`.
4. **Recomendación:** usa `viewBox="0 0 1200 800"` y `preserveAspectRatio="xMidYMid meet"`.

### Paso 2: Asignar `data-tag` a cada elemento

Abre el SVG exportado en un editor de texto (VS Code, Notepad++) y agrega `data-tag="NOMBRE_VARIABLE"` a las etiquetas SVG que representen cada instrumento/equipo.

**Ejemplo — Reactor R-201:**

```svg
<!-- Antes (solo visual) -->
<rect x="100" y="200" width="80" height="120" rx="10"
      fill="none" stroke="#00bfff" stroke-width="2"/>

<!-- Después (interactivo + datos en vivo) -->
<rect x="100" y="200" width="80" height="120" rx="10"
      fill="none" stroke="#00bfff" stroke-width="2"
      data-tag="TEMP_REACTOR"/>
```

**Ejemplo — Tanque de Biodiesel TK-401:**

```svg
<!-- Nivel del tanque -->
<rect x="400" y="150" width="60" height="100" rx="5"
      fill="none" stroke="#00bfff" stroke-width="2"
      data-tag="LEVEL_BIODIESEL_TK"/>
```

**Ejemplo — Bomba B-204:**

```svg
<!-- Círculo para la bomba -->
<circle cx="600" cy="400" r="25"
        fill="none" stroke="#00bfff" stroke-width="2"
        data-tag="PUMP_STATUS"/>
<!-- Tubería de entrada -->
<line x1="500" y1="400" x2="575" y2="400"
      stroke="#666" stroke-width="3"
      data-tag="FLOW_FEED"/>
```

### Paso 3: Reglas de color y trazo

| Estado | Trazo (stroke) | Ancho (stroke-width) | Relleno (fill) |
|---|---|---|---|
| Normal | Color original del SVG | Original del SVG | Sin cambios |
| Mouse hover | `#22c55e` (verde) | 3 | Sin cambios |
| Alarma activa | `#ef4444` (rojo) | 3 | Sin cambios |

**Importante:**
- El sistema guarda el color y ancho original la primera vez que interactúa con el elemento (`data-orig-stroke`, `data-orig-stroke-width`).
- Al salir de alarma, el trazo se restaura al valor original.
- El relleno (fill) **nunca se modifica** automáticamente.

### Paso 4: Colores prohibidos

El sistema convierte automáticamente los colores negros a blanco para compatibilidad con tema oscuro:

| Color original | Se convierte a |
|---|---|
| `#000000` | `#ffffff` |
| `#000` | `#ffffff` |
| `black` | `#ffffff` |
| `rgb(0,0,0)` | `#ffffff` |

**Usa colores claros** (`#00bfff`, `#7aa8cc`, `#4e7cfe`) para tus contornos principales.

---

## 4. Overlays de Valores en Vivo

Cuando el sistema carga tu SVG, automáticamente:

1. Detecta cada elemento con `data-tag`.
2. Calcula su posición con `getBBox()`.
3. Crea un `<text>` flotante justo encima del elemento (6px por encima del borde superior).
4. El texto se muestra en verde neón (`#22c55e`) con sombra, fuente `JetBrains Mono`, tamaño 13px.
5. Cada 2 segundos, el valor se actualiza desde `window.processVars`.

**Ejemplo visual:**

```
          58.3 °C      ← overlay automático (se actualiza cada 2s)
         ┌──────────────────┐
         │                  │
         │    REACTOR       │
         │    R-201         │
         │                  │
         └──────────────────┘
```

---

## 5. El Bus de Eventos (`scadaBus`)

### ¿Qué hace?

Cuando el usuario hace clic en un elemento con `data-tag` en cualquiera de las tres vistas, el sistema:

1. **Emite** `scadaBus.emit('tag:select', { varId, tag, source })`
2. **P&ID, HMI y Dashboard reaccionan**: resaltan el elemento/variable correspondiente
3. **Inspector de Tag**: se abre mostrando el valor en vivo, la unidad y el estado de alarma

### Eventos del bus

| Evento | Quién lo emite | Quién lo escucha | Efecto |
|---|---|---|---|
| `tag:select` | Click en SVG (P&ID/HMI/ticker) | integration-bus.js | Abre inspector, re-emite `tag:focus` |
| `tag:select` | Click en tarjeta del Dashboard | integration-bus.js | Mismo efecto |
| `tag:select` | Click en item del Ticker | integration-bus.js | Mismo efecto + cambia de pestaña |
| `tag:focus` | integration-bus.js | P&ID, HMI, Dashboard | Resalta elemento con sombra verde 1.8s |

### Efecto visual del `tag:focus`

| Vista | Efecto | Duración |
|---|---|---|
| **P&ID** | `drop-shadow(0 0 6px #22c55e)` sobre `[data-scada-var="ID"]` | 1800ms |
| **HMI** | Mismo `drop-shadow` sobre el elemento SVG | 1800ms |
| **Dashboard** | `box-shadow` verde + `outline` en `.prop-card[data-var-id="ID"]`, scroll automático | 2200ms |

---

## 6. El Indicador LIVE / INTEGRADO

En la barra superior hay un badge que muestra el estado de integración:

| Badge | Significado | Condición |
|---|---|---|
| (oculto) | Sin integración | No hay tags comunes entre P&ID y HMI |
| `● EN LÍNEA (3)` | P&ID + HMI conectados pero Dashboard aparte | Tags compartidos solo entre P&ID y HMI |
| `● INTEGRADO (3)` | Sistema completamente integrado | Al menos un tag común en las tres vistas |

**Para lograr `● INTEGRADO`:**
- Debes tener al menos un `data-tag="ALGUNA_VARIABLE"` en tu SVG de P&ID
- **Y** al menos un `data-tag="LA_MISMA_VARIABLE"` en tu SVG de HMI
- **Y** esa variable debe existir en el Dashboard (en `window.PROPERTY_SECTIONS`)

---

## 7. Guía Práctica para tus Diagramas

### P&ID (Instrumentation & Piping)

| Elemento | ¿Qué dibujar? | `data-tag` recomendado |
|---|---|---|
| Reactor R-201 | Vessel cilíndrico vertical con chaqueta | `TEMP_REACTOR`, `LEVEL_REACTOR`, `PRES_REACTOR` |
| Intercambiador HX-102 | Dos rectángulos concéntricos (tubos + coraza) | `TEMP_HX` |
| Columna C-301 | Cilindro alto con platos | `TEMP_COLUMN`, `PRES_COLUMN` |
| Bomba B-204 | Círculo con triángulo interior | `PUMP_STATUS`, `FLOW_FEED` |
| Tanques (TK-xxx) | Rectángulo con fondo curvo | `LEVEL_BIODIESEL_TK`, `LEVEL_OIL_TK`, etc. |
| Válvulas | Símbolo ISA de válvula (cuadrado + línea) | `FLOW_FEED`, `FLOW_PRODUCT` |
| Tuberías | Líneas con flechas de flujo | Cualquier variable de caudal |
| Agitador | Círculo con aspas sobre el reactor | `MOTOR_AGITADOR` |

### HMI (Human-Machine Interface)

El HMI es una versión simplificada y operativa del proceso:

| Elemento | `data-tag` recomendado | Comportamiento |
|---|---|---|
| Indicador digital (rectángulo con texto) | Cualquier variable | Muestra el valor en vivo en su overlay |
| Barra de nivel horizontal | `LEVEL_*` | Overlay muestra el % |
| Botón/flecha de bomba | `PUMP_STATUS` | Al hacer clic, debería alternar estado |
| Termómetro gráfico | `TEMP_REACTOR`, `TEMP_HX`, `TEMP_COLUMN` | Overlay muestra °C |
| Manómetro gráfico | `PRES_REACTOR`, `PRES_COLUMN` | Overlay muestra presión |
| Indicador de calidad | `DENSITY`, `VISCOSITY`, `ACIDITY`, `WATER_CONTENT` | Overlay muestra valor |
| Tanque con nivel coloreado | `LEVEL_*` | Ideal para vista general |

### Diagrama de Operaciones Unitarias

Puedes crear SVGs individuales por equipo y subirlos a `Acceso_seguro/operaciones_unitarias/`. Se insertan como `<g data-op-unit="filename.svg">` escalados al 60% y posicionados al 40% del viewBox base.

---

## 8. Flujo de Trabajo Recomendado

```
1. Dibujar en AutoCAD
   ├── Usar capas separadas: instrumentos, tuberías, equipos, texto
   ├── Usar colores claros (#00bfff, #7aa8cc)
   └── Exportar como SVG (EXPORT → SVG)

2. Abrir SVG en editor de texto
   ├── Buscar elementos que representan sensores/variables
   └── Agregar data-tag="VAR_ID" a cada uno

3. Subir a NexSCADA
   ├── P&ID → panel P&ID → botón "Subir"
   │   └── El archivo va a Acceso_seguro/pid/
   └── HMI → panel HMI → botón "Subir"
       └── El archivo va a Acceso_seguro/hmi/

4. Verificar integración
   ├── Hacer clic en un elemento del diagrama
   ├── Debería abrirse el Inspector de Tag
   ├── El Dashboard debería resaltar la variable correspondiente
   └── El badge superior debería mostrar "INTEGRADO"
```

---

## 9. Verificación Rápida

Después de subir tu SVG, abre la Consola del Navegador (F12) y ejecuta:

```js
// Ver todos los tags detectados en P&ID
[...document.querySelectorAll('#pidContainer svg [data-tag]')].map(el => el.dataset.tag)

// Ver todos los tags detectados en HMI
[...document.querySelectorAll('#hmiContainer svg [data-tag]')].map(el => el.dataset.tag)

// Verificar si scadaBus existe y tiene listeners
window.scadaBus
```

Si los tags aparecen en la lista y coinciden con los nombres de `variable-manager.js`, la integración funciona.

---

## 10. Resumen de Archivos y Directorios

```
Acceso_seguro/
├── pid/                          ← Aquí se suben los P&ID
│   ├── reactor-area.svg
│   ├── columna-destilacion.svg
│   └── ...
├── hmi/                          ← Aquí se suben los HMI
│   ├── panel-principal.svg
│   ├── panel-bombas.svg
│   └── ...
└── operaciones_unitarias/        ← SVGs de equipos individuales (opcional)
    ├── intercambiador.svg
    └── reactor.svg
```

**Archivos JS clave del sistema:**

| Archivo | Rol |
|---|---|
| `pid-manager.js` | Carga SVGs de P&ID, asigna eventos, maneja alarmas, overlays |
| `hmi-manager.js` | Carga SVGs de HMI, mismo mecanismo que P&ID |
| `integration-bus.js` | Bus de eventos scadaBus, lógica del badge INTEGRADO |
| `dashboard-manager.js` | Tarjetas del Dashboard, define `PROPERTY_SECTIONS` |
| `scada-core.js` | `processVars` y ciclo de actualización cada 2s |
| `variable-manager.js` | Catálogo completo de variables del proceso biodiesel |
| `balance-manager.js` | Balances de materia y energía en tiempo real |
| `calendar-manager.js` | Plan maestro de mantenimiento vinculado a equipos P&ID |
