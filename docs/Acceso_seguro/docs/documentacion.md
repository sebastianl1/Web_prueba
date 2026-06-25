# Manual Técnico — Sistema SCADA SPY SENA

**Planta de Producción de Ésteres Monoalquílicos**
**Grupo 3 · Proyecto de Formación Tecnológica SENA**

---

## Contenido

1. [Introducción](#1-introducción)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Acceso al Sistema](#3-acceso-al-sistema)
4. [Dashboard de Variables](#4-dashboard-de-variables)
5. [Nomenclatura de Tags (ISA-5.1)](#5-nomenclatura-de-tags-isa-51)
6. [Simbología P&ID (ISA-5.1 / ISO 10628)](#6-simbología-pid-isa-51--iso-10628)
7. [Visor P&ID](#7-visor-pid)
8. [Interfaz HMI](#8-interfaz-hmi)
9. [Proceso de Producción — Ésteres Monoalquílicos](#9-proceso-de-producción--ésteres-monoalquílicos)
10. [Reporte de Producción](#10-reporte-de-producción)
11. [Balance de Materia y Energía](#11-balance-de-materia-y-energía)
12. [Vista 3D — Gemelo Digital](#12-vista-3d--gemelo-digital)
13. [Gestión de Alarmas](#13-gestión-de-alarmas)
14. [Historial de Alarmas y Eventos](#14-historial-de-alarmas-y-eventos)
15. [Calendario de Mantenimiento](#15-calendario-de-mantenimiento)
16. [Gestor de Archivos](#16-gestor-de-archivos)
17. [Configuración del Sistema](#17-configuración-del-sistema)
18. [Referencias Normativas](#18-referencias-normativas)

---

## 1. Introducción

**SPY SENA** es un sistema SCADA (Supervisory Control and Data Acquisition) desarrollado para la supervisión, control y optimización de una planta de producción de **ésteres monoalquílicos** (biodiesel) a escala industrial. El sistema permite la visualización en tiempo real de variables de proceso, la generación de reportes técnicos, el análisis de balances de materia y energía, y la integración con modelos 3D de la planta.

Desarrollado por el **Grupo 3** como proyecto de formación tecnológica del **Servicio Nacional de Aprendizaje (SENA)**, este sistema implementa estándares internacionales de instrumentación y control industrial.

### 1.1 Propósito

- Monitorear en tiempo real las variables críticas del proceso de producción de ésteres monoalquílicos.
- Proveer herramientas de análisis para la optimización de eficiencia y calidad del producto.
- Mantener un registro histórico de alarmas y eventos para auditoría y mejora continua.
- Facilitar la toma de decisiones mediante reportes automatizados y balances técnicos.

---

## 2. Arquitectura del Sistema

### 2.1 Stack Tecnológico

| Componente | Tecnología |
|---|---|
| **Servidor de desarrollo** | Node.js + Webpack Dev Server |
| **Frontend** | HTML5 + Bootstrap 5 + Feather Icons |
| **Gráficos** | Chart.js 4.x |
| **Modelado 3D** | Three.js r128 + OrbitControls |
| **Visualización SVG** | SVG Pan Zoom |
| **Exportación PDF** | html2pdf.js (html2canvas + jsPDF) |
| **Procesamiento** | JavaScript (ES5/ES6) |
| **Estilos** | CSS personalizado con variables |
| **Persistencia** | localStorage (navegador) |
| **Backend opcional** | FastAPI + PostgreSQL (ai_backend.py) |

### 2.2 Flujo de Datos

```
Sensores de campo (PLC/PLC)
    ↓
API REST (localhost:5000)  ←→  Simulación integrada (fallback)
    ↓
processVars (runtime)  →  Dashboard / P&ID / HMI / Reportes
    ↓
AlarmManager  →  localStorage (historial de alarmas)
    ↓
BalanceManager  →  Cálculos de materia y energía por PU
```

### 2.3 Estructura de Directorios

```
SPY_SENA/
├── SCADA/
│   ├── index.html                  ← Página principal
│   ├── webpack.config.js           ← Configuración Webpack
│   ├── css/
│   │   ├── style.css               ← Variables globales, layout, componentes
│   │   └── scada-core.css          ← Estilos específicos SCADA
│   ├── js/
│   │   ├── app.js                  ← Entry point, i18n, login
│   │   ├── scada-core.js           ← Datos, simulación, alarmas
│   │   ├── dashboard-manager.js    ← Dashboard de propiedades
│   │   ├── pid-manager.js          ← Visor P&ID
│   │   ├── hmi-manager.js          ← Visor HMI
│   │   ├── reporte-manager.js      ← Generación de reportes
│   │   ├── alarm-manager.js        ← Gestión de alarmas
│   │   ├── balance-manager.js      ← Balances M&E
│   │   ├── variable-manager.js     ← Gestor de variables
│   │   ├── file-manager.js         ← Gestor de archivos
│   │   ├── calendar-manager.js     ← Calendario mantenimiento
│   │   ├── integration-bus.js      ← Bus de comunicación entre módulos
│   │   ├── tag-properties.js       ← Base de datos de propiedades
│   │   └── ... (otros módulos)
│   ├── backend/
│   │   └── ai_backend.py           ← FastAPI + PostgreSQL + OpenAI
│   └── Acceso_seguro/              ← Almacenamiento seguro de archivos
│       ├── pid/                    ← Diagramas P&ID (.svg)
│       ├── hmi/                    ← Diagramas HMI (.svg)
│       ├── models/                 ← Modelos 3D (.glb)
│       └── docs/                   ← Documentación
└── docs/                           ← Mirror para GitHub Pages
```

---

## 3. Acceso al Sistema

### 3.1 Credenciales de Ingreso

| Usuario | Contraseña | Rol |
|---|---|---|
| `grupo3` | `grupo3` | Administrador |
| `admin` | `admin123` | Administrador (legado) |

### 3.2 Interfaz de Login

La pantalla de ingreso presenta un diseño de dos paneles:
- **Panel izquierdo**: Identidad visual SENA con imagen de fondo y branding institucional.
- **Panel derecho**: Formulario de acceso con animación molecular (canvas) que representa las interacciones a escala molecular del proceso de esterificación.

### 3.3 Navegación Principal

Una vez autenticado, el sistema presenta:

- **Barra lateral (sidebar)**: Navegación entre módulos (Dashboard, P&ID, HMI, Balance M&E, 3D, Alarmas, Históricos, Calendario, Configuración, Archivos, Documentación).
- **Barra superior (topbar)**: Reloj, buscador de tags, estado del sistema, notificaciones, selector de idioma (ES/EN/DE), personalización de tema y perfil de usuario.
- **Indicadores de conexión**: LEDs de estado por módulo (Dashboard, P&ID, HMI, Alarmas) en la barra lateral.

---

## 4. Dashboard de Variables

### 4.1 Descripción General

El dashboard principal muestra **tarjetas de propiedades físico-químicas** para cada variable de proceso detectada en el diagrama P&ID. Cada tarjeta presenta información detallada organizada por categorías.

### 4.2 Categorías de Variables

| Categoría | Color | Ícono | Descripción |
|---|---|---|---|
| Tanques de Almacenamiento | Azul (`#3b82f6`) | `droplet` | Niveles y capacidad de tanques |
| Equipos de Proceso | Naranja (`#f97316`) | `tool` | Reactores, filtros, secadores |
| Instrumentación y Control | Púrpura (`#8b5cf6`) | `cpu` | Paneles, sensores, controladores |
| Corrientes de Proceso | Verde (`#22c55e`) | `arrow-right-circle` | Caudales, flujos, transferencias |

### 4.3 Estructura de una Tarjeta

Cada tarjeta de variable contiene:

```
┌─────────────────────────────────────┐
│ TAG-ID        ● [Valor] [Unidad]   │
│ Título de la Variable               │
│ Descripción del equipo/proceso      │
│ ─────────────────────────────────── │
│ [Físicas]                           │
│   Temperatura: 65 °C                │
│   Presión: 2.5 bar                  │
│ [Químicas]                          │
│   pH: 7.2                           │
│   Acidez: 0.8 mg KOH/g             │
│ [Proceso]                           │
│   Caudal: 180 L/h                   │
│   Conversión: 96.5%                 │
│ ─────────────────────────────────── │
│ ● Estable      [Ver en P&ID]       │
└─────────────────────────────────────┘
```

### 4.4 Actualización en Vivo

Los valores de las tarjetas se actualizan cada **2 segundos** mediante un ciclo de simulación que emula el comportamiento real de los sensores utilizando funciones sinusoidales con ruido aleatorio.

### 4.5 Integración con P&ID y HMI

Al hacer clic en una tarjeta, el sistema emite un evento `tag:select` que:
1. Resalta el símbolo correspondiente en el diagrama P&ID.
2. Localiza el elemento en la vista HMI.
3. Muestra el inspector de tags con información detallada.

---

## 5. Nomenclatura de Tags (ISA-5.1)

### 5.1 Estándar ISA-5.1

El sistema implementa la nomenclatura de instrumentación según la norma **ANSI/ISA-5.1-2022 (Instrumentation Symbols and Identification)**. Cada tag de instrumento sigue el formato:

```
TT-101
├┘├┘ └┘
│ │  └── Número de bucle (001-999)
│ └────── Letra funcional / sufijo
└──────── Letra de medición (variable medida)
```

### 5.2 Codificación de Letras (ISA-5.1)

| 1ª Letra | Variable Medida | Letras Siguientes | Función |
|---|---|---|---|
| **A** | Análisis / Calidad | **C** | Controlador |
| **C** | Conductividad | **I** | Indicador |
| **D** | Densidad | **R** | Registrador |
| **F** | Caudal (Flow) | **T** | Transmisor |
| **L** | Nivel (Level) | **A** | Alarma |
| **P** | Presión (Pressure) | **S** | Interruptor (Switch) |
| **T** | Temperatura | **H** | Muy alto (High) |
| **V** | Viscosidad | **L** | Muy bajo (Low) |
| **W** | Peso / Masa | **Y** | Relé / Conversor |

### 5.3 Tags del Sistema (Ésteres Monoalquílicos)

#### Unidad de Caracterización (PU1)

| Tag | Tipo ISA | Descripción | Unidad | Rango |
|---|---|---|---|---|
| TK-001 | LI / LS | Tanque de materia prima | % | 0–100 |
| TK-002 | LI / LS | Tanque de aceite caracterizado | % | 0–100 |
| TK-003 | LI / LS | Tanque intermedio | % | 0–100 |
| TK-004 | LI / LS | Tanque de producto | % | 0–100 |
| FIL-001 | PDI / PDS | Filtro de aceite | bar | 0–10 |
| P-001 | Y | Bomba de transferencia | — | On/Off |
| E-003 | TE / TC | Reactor de alcoxido | °C | 0–100 |
| E.W-003 | WI | Peso del reactor alcoxido | kg | 0–2000 |
| SALACE-001 | FI / FT | Salida de aceite caracterizado | L/h | 0–500 |
| CLP-001 | — | Panel de control (PLC) | — | — |
| ALCO-001 | AI / AT | Concentración de alcoxido | % | 0–100 |

#### Unidad de Esterificación (PU2)

| Tag | Tipo ISA | Descripción | Unidad | Rango |
|---|---|---|---|---|
| EST-001 | TE / TC | Esterificador (reactor principal) | °C | 0–120 |
| GLI-001 | LI / LS | Separador de glicerol | % | 0–100 |
| SEP-001 | PDI / PDS | Separador de fases | bar | 0–10 |
| TRAN-001 | FI / FT | Transporte de producto | L/h | 0–500 |
| SIS_BOM-001 | Y | Sistema de bombas PU2 | — | On/Off |
| SIS_TRAN-001 | Y | Sistema de transporte PU2 | — | On/Off |
| PRO_DES-001 | ZSC | Válvula de destino PU2 | — | On/Off |

#### Unidad de Purificación (PU3)

| Tag | Tipo ISA | Descripción | Unidad | Rango |
|---|---|---|---|---|
| SEC-001 | TE / TC | Secador de éster | °C | 0–150 |
| SEC_COND-001 | PDI / PDS | Condensador del secador | bar | 0–8 |
| VIS-001 | VI / VT | Viscosímetro (ASTM D445) | cSt | 0–20 |
| SIS_CIRC-001 | FI / FT | Sistema de circulación | L/h | 0–300 |
| PRO_DES-003 | ZSC | Válvula de destino PU3 | — | On/Off |
| PRO_FIN-001 | ZSO | Válvula de producto final | — | On/Off |

---

## 6. Simbología P&ID (ISA-5.1 / ISO 10628)

### 6.1 Estándares Aplicados

El sistema de diagramas de tuberías e instrumentación (P&ID) se rige por:

| Norma | Alcance |
|---|---|
| **ANSI/ISA-5.1** | Símbolos e identificación de instrumentación |
| **ISA-5.2** | Diagramas lógicos de control de procesos |
| **ISO 10628** | Diagramas de flujo para plantas de proceso |
| **DIN 19227** | Simbología de control de procesos (Alemania) |
| **SENA-IE** | Adaptación institucional para formación tecnológica |

### 6.2 Símbolos de Instrumentos

#### Instrumentos de campo y panel

```
      ┌─────┐        ┌─────┐        ┌─────┐        ┌─────┐
      │ TT  │        │ TIC │        │ FV  │        │ PT  │
      │ 101 │        │ 101 │        │ 201 │        │ 301 │
      └─────┘        └─────┘        └─────┘        └─────┘
     Campo/Local    Panel/Sala    Válvula autor.  Computadora
```

#### Líneas de señal

```
──────────────   Señal de proceso (tubería)
••••••••••••••   Señal eléctrica
--------------   Señal neumática
- - - - - - - -   Señal hidráulica
/ / / / / / / /   Señal óptica / fibra
~~·~~·~~·~~·~~·   Señal inalámbrica
```

### 6.3 Símbolos de Equipos Principales

| Símbolo | Equipo | Descripción |
|---|---|---|
| ⬤ | Tanque | Almacenamiento de materia prima / producto |
| ◯ | Bomba | Transferencia de fluidos |
| ⟐ | Filtro | Separación de sólidos |
| □ | Intercambiador | Transferencia de calor |
| ⎔ | Reactor | Esterificación / transesterificación |
| ⟁ | Separador | Separación de fases (glicerol/éster) |
| ⏗ | Columna | Destilación / purificación |
| ⌬ | Válvula | Control de flujo |

### 6.4 Identificación de Líneas de Tubería

Formato: **DN (Diámetro Nominal) — Fluido — Material — Clase de Presión**

```
DN50-ACERO-INOX-316L-CL150
├─┘ ├──────────┘ ├──────────┘
│   │            └── Clase de presión (ASME B16.5)
│   └─────────────── Material (ASTM A312 TP316L)
└─────────────────── Diámetro nominal (mm)
```

**Códigos de fluido:**

| Código | Fluido |
|---|---|
| AC | Aceite crudo |
| AC-CAR | Aceite caracterizado |
| MET | Metanol |
| ALC | Alcoxido |
| EST | Éster monoalquílico |
| GLY | Glicerol |
| CAT | Catalizador (KOH/NaOH) |
| VAP | Vapor de agua |
| CW | Agua de enfriamiento |

---

## 7. Visor P&ID

### 7.1 Funcionalidad

El visor P&ID permite cargar y visualizar diagramas de tuberías e instrumentación en formato **SVG**. Los elementos del diagrama con atributo `data-tag` se vinculan automáticamente con las variables del sistema.

### 7.2 Operación

1. **Cargar P&ID**: Use el botón "Subir P&ID" o arrastre un archivo `.svg` sobre el panel.
2. **Navegación**: Zoom con rueda del ratón, desplazamiento con clic derecho.
3. **Interacción**: Haga clic sobre cualquier elemento con tag para ver su valor en vivo.
4. **Reset Zoom**: Restaura la vista inicial del diagrama.

### 7.3 Requisitos del SVG

Para que un símbolo sea interactivo, el elemento SVG debe incluir:

```xml
<g data-tag="EST-001" class="pid-symbol">
  <path d="..." />
  <text>TE-101</text>
</g>
```

El sistema detecta automáticamente todos los elementos con `data-tag` y los resalta en el dashboard y el inspector de tags.

### 7.4 Inspector de Tags

Al seleccionar un tag en el P&ID, se despliega un panel flotante con:
- **Nombre y descripción** de la variable
- **Valor actual** con unidad
- **Ley de transporte** aplicable (Fick, Fourier, Newton, etc.)
- **Estado de alarma** (normal / advertencia / crítica)
- **Barra de nivel** con porcentaje

---

## 8. Interfaz HMI

### 8.1 Descripción

La interfaz hombre-máquina (HMI) proporciona una vista sinóptica del proceso en formato SVG, con superposición de valores en tiempo real y elementos interactivos.

### 8.2 Herramientas del Visor

| Herramienta | Función |
|---|---|
| 🔍+ / 🔍− | Zoom in / Zoom out |
| ⛶ | Ajustar vista (reset zoom) |
| ⟲ / ⟳ | Rotar 90° antihorario / horario |
| ▭ / ▯ | Orientación horizontal / vertical |
| ⛶⛶ | Pantalla completa |
| 📤 Subir HMI | Cargar nuevo diagrama HMI |
| 📂 Catálogo HMI | Seleccionar HMI del servidor |

### 8.3 Tags en HMI

Similar al visor P&ID, los elementos SVG con `data-tag` muestran superposiciones de valor en vivo que se actualizan cada 2 segundos. Los valores se muestran junto al símbolo correspondiente.

---

## 9. Proceso de Producción — Ésteres Monoalquílicos

### 9.1 Descripción del Proceso

La planta produce **ésteres monoalquílicos de ácidos grasos** (biodiesel) mediante la reacción de **transesterificación** de triglicéridos (aceites vegetales) con un alcohol de cadena corta (metanol), en presencia de un catalizador alcalino (KOH/NaOH).

$$
\text{Triglicérido} + 3\,\text{CH}_3\text{OH} \xrightarrow{\text{KOH}} 3\,\text{Éster metílico} + \text{Glicerol}
$$

### 9.2 Unidades de Proceso

#### PU1: Caracterización de Materia Prima

| Etapa | Equipos | Parámetros Críticos |
|---|---|---|
| Recepción de aceite | TK-001 | Nivel, temperatura |
| Filtrado primario | FIL-001 | Presión diferencial (< 2 bar) |
| Caracterización | E-003, ALCO-001 | Concentración alcoxido 0.5 M |
| Almacenamiento intermedio | TK-002, TK-003, TK-004 | Nivel 20–80% |
| Bombeo a proceso | P-001, SALACE-001 | Caudal 15–20 L/min |

**Tiempo estimado: 2.5 – 4.0 horas**

#### PU2: Esterificación y Transesterificación

| Etapa | Equipos | Parámetros Críticos |
|---|---|---|
| Reacción principal | EST-001 | Temperatura 60–65 °C, presión atmosférica |
| Separación de fases | SEP-001, GLI-001 | Presión 1–3 bar, nivel glicerol |
| Transporte intermedio | TRAN-001, SIS_TRAN-001 | Caudal 10–30 L/h |
| Bombas de proceso | SIS_BOM-001 | Estado operativo |

**Tiempo estimado: 3.0 – 5.0 horas**

**Cinética de reacción (Arrhenius):**

$$
k = A \cdot e^{-E_a / RT} \qquad (k: \text{constante cinética}, T: \text{temperatura})
$$

#### PU3: Purificación y Control de Calidad

| Etapa | Equipos | Parámetros Críticos |
|---|---|---|
| Secado del éster | SEC-001 | Temperatura 100–120 °C |
| Condensación de vapores | SEC_COND-001 | Presión 2–5 bar |
| Circulación | SIS_CIRC-001 | Caudal 50–150 L/h |
| Control de viscosidad | VIS-001 | 3.5–5.0 cSt (ASTM D445) |
| Producto final | PRO_FIN-001 | Calidad certificada |

**Tiempo estimado: 2.0 – 3.5 horas**

### 9.3 Parámetros de Calidad del Producto

| Parámetro | Norma | Límite Inferior | Límite Superior | Unidad |
|---|---|---|---|---|
| Viscosidad cinemática (40 °C) | ASTM D445 / EN 14214 | 3.5 | 5.0 | cSt |
| Densidad (15 °C) | ASTM D1298 / EN ISO 3675 | 860 | 900 | kg/m³ |
| Índice de acidez | ASTM D664 / EN 14104 | — | 0.50 | mg KOH/g |
| Agua y sedimentos | ASTM D2709 / EN 12937 | — | 0.05 | % vol |
| Punto de inflamación | ASTM D93 / EN ISO 2719 | 120 | — | °C |
| Contenido de éster | EN 14103 | 96.5 | — | % (m/m) |
| Glicerol libre | ASTM D6584 / EN 14105 | — | 0.02 | % (m/m) |
| Glicerol total | ASTM D6584 / EN 14105 | — | 0.25 | % (m/m) |
| Metanol residual | EN 14110 | — | 0.20 | % (m/m) |
| Estabilidad a la oxidación | EN 15751 | 8 | — | horas |

### 9.4 Leyes de Transporte Aplicadas

Cada variable del sistema está asociada a una **ley de transporte** que modela su comportamiento físico-químico:

| Ley | Ecuación | Variable | Aplicación |
|---|---|---|---|
| **Fick** | $J = -D_{AB} \frac{dC}{dx}$ | ALCO-001 | Difusión de alcohol en matriz oleosa |
| **Darcy** | $Q = \frac{-kA}{\mu} \frac{dP}{dx}$ | FIL-001 | Flujo en medio poroso |
| **Bernoulli** | $P + \frac{1}{2}\rho v^2 + \rho gh = cte$ | SALACE-001, TRAN-001, SIS_CIRC-001 | Flujo en tuberías |
| **Arrhenius** | $k = A \cdot e^{-E_a/RT}$ | EST-001 | Cinética de esterificación |
| **Fourier** | $\frac{\partial T}{\partial t} = \alpha \nabla^2 T$ | SEC-001 | Transferencia de calor |
| **Stokes** | $v_s = \frac{2}{9}\frac{(\rho_p - \rho_f)}{\mu}g r^2$ | SEP-001, GLI-001 | Sedimentación de glicerol |
| **Newton** | $\tau = \mu \frac{du}{dy}$ | VIS-001 | Viscosidad del éster (ASTM D445) |
| **Hagen-Poiseuille** | $Q = \frac{\pi r^4 \Delta P}{8\mu L}$ | TRAN-001 | Flujo laminar en tuberías |
| **Clausius-Clapeyron** | $\ln P = -\frac{\Delta H_{vap}}{R}\frac{1}{T} + C$ | SEC_COND-001 | Condensación de vapores |
| **Arquímedes** | $\sum m_{in} - \sum m_{out} = m_{acum}$ | TK-001 a TK-004 | Balance de masa en tanques |

---

## 10. Reporte de Producción

### 10.1 Acceso

El botón **📄** (ícono de documento) en la barra superior, junto al reloj, abre el generador de reportes.

### 10.2 Contenido del Reporte

| Sección | Contenido |
|---|---|
| **Encabezado** | Logo, "Reporte de Producción - Éster Monoalquílico", ID único (RPT-YYYYMMDD-NNNN), fecha/hora |
| **Resumen Ejecutivo** | Eficiencia global (%), estado general (Óptimo/Advertencia/Crítico), alarmas activas, variables en línea |
| **Tiempos de Proceso** | Duración estimada por unidad de proceso (PU1, PU2, PU3) |
| **Estado por Unidad** | Tablas detalladas con TAG, variable, valor actual, unidad, nivel (barra), tiempo estimado y ley de transporte |
| **Tendencias** | Sparklines de temperatura (EST-001), presión (FIL-001) y eficiencia global (último minuto) |
| **Resumen de Alarmas** | Tabla con severidad, TAG, valor actual, límite y hora de activación |
| **Recomendaciones** | Generadas automáticamente en base a umbrales de proceso |

### 10.3 Acciones

- **Descargar PDF**: Exporta a PDF profesional (formato A4, html2pdf.js).
- **Imprimir**: Envía a impresora desde la vista previa.

### 10.4 Datos de Línea Base

El reporte captura una instantánea de:
- Variables de proceso en tiempo real (`processVars`)
- Alarmas activas (`alarmData`)
- Balances de materia y energía (si disponibles)
- Buffer histórico de 30 segundos para tendencias

---

## 11. Balance de Materia y Energía

### 11.1 Descripción

El módulo de balances calcula y visualiza los balances de **materia (Fick)**, **energía (Fourier)** y **momentum (Newton)** para cada unidad de proceso, utilizando valores reales de `TAG_PROPERTIES_DB`.

### 11.2 Ecuaciones Implementadas

#### Balance de Materia (1ª Ley de Fick)

$$
J = -D_{AB} \frac{dC}{dx} \qquad \sum m_{in} - \sum m_{out} = m_{perdidas}
$$

#### Balance de Energía (2ª Ley de Fourier)

$$
\frac{\partial T}{\partial t} = \alpha \nabla^2 T + \frac{\dot{q}}{\rho c_p} \qquad Q = -kA\frac{dT}{dx}
$$

#### Balance de Momentum (Ley de Newton)

$$
\tau = \mu \frac{du}{dy} \qquad \rho \frac{Dv}{Dt} = -\nabla P + \mu \nabla^2 v + f
$$

### 11.3 Visualización

Cada unidad de proceso (PU1, PU2, PU3) presenta:
- Ecuación del balance con renderizado KaTeX.
- Tabla de variables participantes con valores actuales.
- Indicador de consistencia del balance (entrada vs salida vs pérdidas).

---

## 12. Vista 3D — Gemelo Digital

### 12.1 Descripción

Visualización tridimensional de la planta industrial utilizando **Three.js**. Permite inspeccionar modelos `.glb` de equipos y tuberías en un entorno interactivo.

### 12.2 Controles

| Acción | Control |
|---|---|
| Rotar | Clic izquierdo + arrastrar |
| Zoom | Rueda del ratón |
| Desplazar | Clic derecho + arrastrar |
| Reset cámara | Botón "Reset" |
| Vista superior | Botón "Top" |
| Vista frontal | Botón "Frente" |
| Modo wireframe | Botón "Wire" |

---

## 13. Gestión de Alarmas

### 13.1 Sistema de Alarmas

El sistema evalúa continuamente las variables de proceso contra umbrales configurables:

| Prioridad | Color | Condición | Acción |
|---|---|---|---|
| CRÍTICA | 🔴 Rojo | Variable fuera de rango crítico | Alarma sonora + notificación inmediata |
| ALTA | 🟠 Naranja | Variable fuera de rango operativo | Notificación visual + opcional sonora |
| MEDIA | 🔵 Azul | Variable en rango de advertencia | Registro en historial |
| RESUELTA | 🟢 Verde | Variable retornó a rango normal | Auto-ACK (configurable) |

### 13.2 Tabla de Alarmas

La vista de alarmas presenta una tabla filtrable con columnas:
- **Prioridad**: CRÍTICA / ALTA / MEDIA / RESUELTA
- **TAG**: Identificador del instrumento
- **Descripción**: Variable y equipo asociado
- **Valor**: Lectura actual del sensor
- **Límite**: Umbral violado
- **Hora**: Marca de tiempo del evento
- **Estado**: Activa / Reconocida / Resuelta

### 13.3 Estadísticas

Panel lateral con gráfico de torta (Chart.js) mostrando la distribución de alarmas por prioridad y top de áreas con más eventos.

---

## 14. Historial de Alarmas y Eventos

Bitácora completa de todas las alarmas generadas, almacenada en `localStorage`. Incluye:
- Búsqueda por TAG, prioridad o fecha.
- Filtros por tipo (TODAS, CRÍTICAS, ALTAS, RESUELTAS).
- Exportación a CSV.

---

## 15. Calendario de Mantenimiento

### 15.1 Descripción

Plan maestro de mantenimiento preventivo y correctivo para los equipos de la planta.

### 15.2 Indicadores

| Indicador | Descripción |
|---|---|
| Próximos 7 días | Mantenimientos programados en la semana |
| Vencidos | Equipos que requieren atención urgente |
| Salud promedio | Health Score general de equipos |
| Cumplimiento | Porcentaje de mantenimientos realizados vs programados |

### 15.3 Gestión de Eventos

- Agregar eventos de mantenimiento con tipo (preventivo, correctivo, inspección).
- Asignación a técnicos (Sebastian, Paola, Yenevid).
- Vista mensual con indicadores por día.

---

## 16. Gestor de Archivos

### 16.1 Alcance

Gestor centralizado de documentos limitado a la carpeta **`Acceso_seguro/`**. Arquitectura de seguridad que impide el acceso a directorios del sistema.

### 16.2 Operaciones

| Acción | Rol Requerido | Descripción |
|---|---|---|
| Navegar | Todos | Explorar carpetas y archivos |
| Subir archivo | Administrador | Cargar SVG, PDF, GLB |
| Crear carpeta | Administrador | Organizar documentos |
| Eliminar | Administrador | Remover archivos o carpetas |
| Descargar | Todos | Obtener copia local |

### 16.3 Estructura de Carpetas

```
Acceso_seguro/
├── pid/           ← Diagramas P&ID (.svg)
├── hmi/           ← Diagramas HMI (.svg)
├── models/        ← Modelos 3D (.glb)
└── docs/          ← Documentación
```

---

## 17. Configuración del Sistema

### 17.1 Perfiles de Usuario

| Rol | Permisos |
|---|---|
| **ADMIN** | Acceso completo: gestión de usuarios, tags, configuración, archivos |
| **OPERADOR** | Monitoreo, ACK de alarmas, visualización de datos |
| **SUPERVISOR** | Monitoreo, ACK, configuración de tags |
| **VIEWER** | Solo lectura |

### 17.2 Sub-tabs de Configuración

| Sub-tab | Función |
|---|---|
| **Perfil** | Foto, nombre, correo, cargo, planta, seguridad (2FA, contraseña) |
| **Tags** | Catálogo de tags del sistema (TT-101, PT-201, FT-301, etc.) |
| **Variables** | Gestor de variables: ID, tag, descripción, unidad, origen de datos |
| **Conexiones** | Intervalo de polling, rutas SVG, configuración OPC-UA/MODBUS |
| **Alarmas** | Umbrales por variable, comportamiento (sonido, auto-ACK, email) |
| **Usuarios** | Gestión de cuentas y asignación de roles |
| **Sistema** | Hostname, puerto WebSocket, base de datos, seguridad, estado |

### 17.3 Personalización de Interfaz

- **Tema**: Oscuro / Claro (toggle en topbar).
- **Esquema de color**: 6 variantes (verde SENA, violeta, azul, rosa, naranja, zinc).
- **Densidad**: Spacious / Comfortable / Compact.
- **Idioma**: Español, English, Deutsch.

---

## 18. Referencias Normativas

### 18.1 Instrumentación y Control

| Norma | Título |
|---|---|
| ANSI/ISA-5.1-2022 | Instrumentation Symbols and Identification |
| ISA-5.2-1976 (R2021) | Binary Logic Diagrams for Process Operations |
| ISA-5.4-1991 (R2021) | Instrument Loop Diagrams |
| ISO 10628-1:2014 | Diagrams for the chemical and petrochemical industry — Part 1: Specification |
| ISO 10628-2:2012 | Diagrams for the chemical and petrochemical industry — Part 2: Graphical symbols |
| DIN 19227 | Graphical symbols and identifying letters for process control engineering |
| IEC 62682 | Management of alarm systems for the process industries |
| ANSI/ISA-18.2 | Management of Alarm Systems for the Process Industries |

### 18.2 Calidad de Ésteres Monoalquílicos

| Norma | Título | Parámetros Clave |
|---|---|---|
| **ASTM D6751** | Standard Specification for Biodiesel (B100) | Estándar EE.UU. para biodiesel |
| **EN 14214** | Automotive fuels — Fatty acid methyl esters (FAME) | Estándar europeo |
| **ASTM D445** | Kinematic Viscosity of Transparent and Opaque Liquids | Viscosidad cinemática |
| **ASTM D664** | Acid Number of Petroleum Products | Índice de acidez |
| **ASTM D93** | Flash Point by Pensky-Martens | Punto de inflamación |
| **ASTM D2709** | Water and Sediment in Middle Distillate Fuels | Agua y sedimentos |
| **ASTM D6584** | Determination of Free and Total Glycerin in Biodiesel | Glicerol libre y total |
| **EN 14103** | Determination of ester and linolenic acid methyl ester content | Contenido de éster |
| **EN 14104** | Determination of acid value | Índice de acidez (método europeo) |
| **EN 14105** | Determination of free and total glycerol | Glicerol libre y total (método europeo) |
| **EN 14110** | Determination of methanol content | Metanol residual |
| **EN 15751** | Oxidation stability (Rancimat method) | Estabilidad a la oxidación |
| **EN ISO 3675** | Crude petroleum and liquid petroleum products — Density | Densidad |

### 18.3 Seguridad Industrial

| Norma | Título |
|---|---|
| **IEC 61511** | Functional safety — Safety instrumented systems for the process industry sector |
| **IEC 62443** | Security for industrial automation and control systems |
| **NFPA 704** | Standard System for the Identification of the Hazards of Materials |
| **OSHA 29 CFR 1910** | Occupational Safety and Health Standards |
| **NTC 3701** | Norma Técnica Colombiana — Biodiesel (Icontec) |

### 18.4 Tuberías y Equipos

| Norma | Título |
|---|---|
| ASME B31.3 | Process Piping |
| ASME B16.5 | Pipe Flanges and Flanged Fittings |
| ASME BPVC | Boiler and Pressure Vessel Code |
| API 520 | Sizing, Selection, and Installation of Pressure-Relieving Devices |

---

*Documento generado por el **Sistema SCADA SPY SENA · Grupo 3** — Proyecto de formación tecnológica SENA.*  
*Última actualización: junio 2026*
