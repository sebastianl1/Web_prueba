# Referencia de Variables para Diagramas P&ID

> Para que un símbolo en tu SVG sea interactivo, agrega `data-tag="ID_VARIABLE"` al elemento (`<rect>`, `<circle>`, `<path>`, `<g>`, etc.).

---

## 1. Reactor de Transesterificación — R-201

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `TEMP_REACTOR` | Temperatura del reactor | °C | TT-101 |
| `PRES_REACTOR` | Presión interna del reactor | bar | PT-101 |
| `LEVEL_REACTOR` | Nivel en el reactor | % | LT-101 |
| `MOTOR_AGITADOR` | Corriente del motor del agitador | A | I-101 |

## 2. Tanques de Almacenamiento

### TK-201 — Tanque de Aceite Vegetal

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `LEVEL_OIL_TK` | Nivel de aceite vegetal en tanque de alimentación | % | LT-201 |

### TK-202 — Tanque de Metanol

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `LEVEL_METANOL_TK` | Nivel de metanol en tanque de almacenamiento | % | LT-202 |

### TK-203 — Tanque de Catalizador

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `LEVEL_CATALYST_TK` | Nivel de catalizador en tanque de dosificación | % | LT-203 |

### TK-401 — Tanque de Biodiesel (Producto Terminado)

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `LEVEL_BIODIESEL_TK` | Nivel de biodiesel en tanque de producto terminado | % | LT-401 |
| `DENSITY` | Densidad del biodiesel (ASTM D1298) | kg/m³ | DT-401 |
| `VISCOSITY` | Viscosidad cinemática del biodiesel a 40°C | cSt | VT-401 |
| `ACIDITY` | Índice de acidez del biodiesel | mgKOH/g | AT-401 |
| `WATER_CONTENT` | Contenido de agua en biodiesel (Karl Fischer) | ppm | WT-401 |

### TK-402 — Tanque de Glicerina

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `LEVEL_GLYCERIN_TK` | Nivel de glicerina en tanque de almacenamiento | % | LT-402 |

## 3. Intercambiador de Calor — HX-102

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `TEMP_HX` | Temperatura de salida del intercambiador de calor | °C | TT-102 |

## 4. Columna de Destilación de Metanol — C-301

| data-tag | Descripción | Unidad | Tag P&ID |
|---|---|---|---|
| `TEMP_COLUMN` | Temperatura de la columna de destilación | °C | TT-301 |
| `PRES_COLUMN` | Presión en columna de destilación | mbar | PT-301 |

## 5. Bombas y Flujo

| data-tag | Descripción | Unidad | Tag P&ID | Equipo |
|---|---|---|---|---|
| `FLOW_FEED` | Caudal de alimentación al reactor | L/h | FT-301 | P-101 / B-204 |
| `FLOW_PRODUCT` | Caudal de biodiesel producido | L/h | FT-401 | — |
| `PUMP_STATUS` | Estado de la bomba de transferencia de biodiesel | — | VT-501 | B-204 |

## 6. Otros

| data-tag | Descripción | Unidad |
|---|---|---|
| `WATER_CONTENT` | Contenido de agua en biodiesel | ppm |

---

## Cómo usar en AutoCAD

Al exportar tu P&ID desde AutoCAD a SVG, edita el archivo resultante y agrega `data-tag` a los elementos que representan cada sensor o instrumento:

```svg
<!-- Ejemplo: símbolo de un transmisor de temperatura en el reactor -->
<circle cx="450" cy="320" r="12" data-tag="TEMP_REACTOR" />

<!-- Ejemplo: tanque con nivel -->
<rect x="100" y="200" width="80" height="160" data-tag="LEVEL_OIL_TK" />

<!-- Ejemplo: grupo conteniendo un instrumento -->
<g id="TT-101" data-tag="TEMP_REACTOR">
  <circle cx="300" cy="400" r="10" />
  <text x="300" y="420">TT-101</text>
</g>
```

### Recomendaciones

| Práctica | Explicación |
|---|---|
| `data-tag` en el elemento **más pequeño** posible | El zoom se centrará en el `getBoundingClientRect()` de ese elemento. Si pones `data-tag` en un `<g>` grande, el zoom será menor. |
| Prefiere el `<circle>`, `<rect>` o `<path>` del sensor | No el texto de la etiqueta ni el grupo contenedor. |
| Un solo `data-tag` por símbolo | Si varios elementos tienen el mismo `data-tag`, el sistema usará el primero que encuentre. |
| ID en mayúsculas con guiones bajos | Ej: `LEVEL_OIL_TK`, no `level-oil-tk` ni `LevelOilTk`. |
| Etiqueta de instrumento (opcional) | Puedes agregar `data-tag` además del tag de instrumento existente (ej: TT-101). |

> Para más detalles, revisa `GUIA_INTEGRACION_PID_HMI_DASHBOARD.md`.
