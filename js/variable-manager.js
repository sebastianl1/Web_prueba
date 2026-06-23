class VariableManager {
    constructor() {
        this.variables = JSON.parse(localStorage.getItem('scada-variables')) || [
            // ── Proceso Unitario 1: Caracterización de Materia Prima ──
            { id: 'ALCO-001', tag: 'Alcohol', desc: 'Concentración de alcohol (metanol/etanol) en la materia prima', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'CLP-001', tag: 'Panel Control', desc: 'Estado del panel de control del proceso de caracterización', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'E-003', tag: 'Equipo 003', desc: 'Variable de proceso del equipo E-003 en caracterización', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'E.W-003', tag: 'Peso Equipo 003', desc: 'Peso/volumen del equipo E.W-003 en caracterización', unit: 'kg', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'FIL-001', tag: 'Filtro 001', desc: 'Presión diferencial del filtro de materia prima', unit: 'bar', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'P-001', tag: 'Bomba 001', desc: 'Estado de la bomba de transferencia de materia prima', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'SALACE-001', tag: 'Salida Aceite 001', desc: 'Caudal de salida de aceite vegetal caracterizado', unit: 'L/h', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'TK-001', tag: 'Tanque 001', desc: 'Nivel del tanque de almacenamiento de materia prima', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'TK-002', tag: 'Tanque 002', desc: 'Nivel del tanque de aceite caracterizado', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'TK-003', tag: 'Tanque 003', desc: 'Nivel del tanque de almacenamiento intermedio', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'TK-004', tag: 'Tanque 004', desc: 'Nivel del tanque de producto caracterizado', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            // ── Proceso Unitario 2: Transesterificación y Separación ──
            { id: 'EST-001', tag: 'Esterificador 001', desc: 'Temperatura del reactor de esterificación/transesterificación', unit: '°C', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'GLI-001', tag: 'Separador Glicerol 001', desc: 'Nivel de glicerol en el separador de fases', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'PRO_DES-001', tag: 'Producto Destino 001', desc: 'Estado de la línea de producto hacia destino final', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'SEP-001', tag: 'Separador 001', desc: 'Presión del separador de fases (biodiesel/glicerol)', unit: 'bar', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'SIS_BOM-001', tag: 'Sistema Bombas 001', desc: 'Estado del sistema de bombas de proceso', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'SIS_TRAN-001', tag: 'Sistema Transporte 001', desc: 'Estado del sistema de transporte de producto', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'TRAN-001', tag: 'Transporte 001', desc: 'Caudal de transporte de producto entre etapas', unit: 'L/h', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            // ── Proceso Unitario 3: Purificación y Secado ──
            { id: 'PRO_DES-003', tag: 'Producto Destino 003', desc: 'Estado de la línea de producto final hacia destino en purificación', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'PRO_FIN-001', tag: 'Producto Final 001', desc: 'Estado de la línea de producto final purificado', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: true },
            { id: 'SEC-001', tag: 'Secador 001', desc: 'Temperatura del secador de biodiesel purificado', unit: '°C', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'SEC_COND-001', tag: 'Condensador Secador 001', desc: 'Presión del condensador del secador', unit: 'bar', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'SIS_CIRC-001', tag: 'Sistema Circulación 001', desc: 'Caudal del sistema de circulación de purificación', unit: 'L/h', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            { id: 'VIS-001', tag: 'Viscosímetro 001', desc: 'Viscosidad cinemática del biodiesel purificado', unit: 'cSt', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: true },
            // ── Variables legadas (compatibilidad con dashboards existentes) ──
            { id: 'TK_ACEITE', tag: 'Tanque Aceite', desc: 'Nivel del tanque de almacenamiento de aceite vegetal crudo', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: false },
            { id: 'FILTRADO', tag: 'Filtro Aceite', desc: 'Presión diferencial del filtro de aceite vegetal', unit: 'bar', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: false },
            { id: 'BOMBEO', tag: 'Bomba Transferencia', desc: 'Estado de la bomba centrífuga de transferencia', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: false },
            { id: 'CONTROL_1', tag: 'Panel Control', desc: 'Estado del panel de control principal del proceso', unit: '', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: false },
            { id: 'TK_ACE_FILTRADO', tag: 'Tanque Aceite Filtrado', desc: 'Nivel del tanque de aceite vegetal filtrado', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: false },
            { id: 'TK_METANOL', tag: 'Tanque Metanol', desc: 'Nivel del tanque de almacenamiento de metanol', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: false },
            { id: 'TK_NAOH', tag: 'Tanque NaOH', desc: 'Nivel del tanque de dosificación de hidróxido de sodio', unit: '%', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var9', dbVar20: '2', toGraph: false },
            { id: 'INT_CALOR', tag: 'Intercambiador Calor', desc: 'Temperatura de salida del intercambiador de calor', unit: '°C', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: false },
            { id: 'SIS_CIRCULACION', tag: 'Sist. Circulación', desc: 'Presión del sistema de circulación del proceso', unit: 'bar', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: false },
            { id: 'SAL_ALCOXIDO', tag: 'Salida Alcoxido', desc: 'Caudal de salida de alcoxido de sodio preparado', unit: 'L/h', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: false },
            { id: 'SAL_ACEITE', tag: 'Salida Aceite', desc: 'Caudal de salida de aceite precalentado al reactor', unit: 'L/h', dbIdDisp: '95', dbTable: 'variable2', dbVar: 'var2', dbVar20: '1', toGraph: false },
        ];
        this.renderTable();
    }

    save() {
        localStorage.setItem('scada-variables', JSON.stringify(this.variables));
        this.renderTable();
        // Sincronizar con el resto del sistema si es necesario
        // Sincronizar con el resto del sistema
        if (typeof updateWidgetSelectors === 'function') updateWidgetSelectors();
        if (typeof updateHistoricalSelectors === 'function') updateHistoricalSelectors();
        if (typeof updateTrendChart === 'function') updateTrendChart();
    }

    add(v) {
        this.variables.push(v);
        this.save();
    }

    update(id, updated) {
        const idx = this.variables.findIndex(v => v.id === id);
        if (idx !== -1) {
            this.variables[idx] = { ...this.variables[idx], ...updated };
            this.save();
        }
    }

    delete(id) {
        this.variables = this.variables.filter(v => v.id !== id);
        this.save();
    }

    renderTable() {
        const body = document.getElementById('varManagerBody');
        if (!body) return;
        body.innerHTML = '';
        this.variables.forEach(v => {
            // Unificamos Origen Datos para incluir ID, Tabla, Columna y VAR20
            const originStr = `ID:${v.dbIdDisp || '95'} -> ${v.dbTable}.${v.dbVar} (@${v.dbVar20 || '1'})`;
            body.innerHTML += `
                <tr>
                    <td class="font-mono">${v.id}</td>
                    <td class="fw-bold">${v.tag}</td>
                    <td class="text-muted small">${v.desc}</td>
                    <td><span class="primary-soft-badge">${v.unit}</span></td>
                    <td class="font-mono text-muted small" style="font-size:11px">${originStr}</td>
                    <td>${v.toGraph ? '<span class="badge bg-success" style="font-size:10px">GRAFICADA</span>' : '<span class="badge bg-secondary" style="font-size:10px">OCULTA</span>'}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="openVarEditor('${v.id}')"><i data-feather="edit-2" class="feather-xs"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="variableManager.delete('${v.id}')"><i data-feather="trash-2" class="feather-xs"></i></button>
                    </td>
                </tr>`;
        });
        if (typeof feather !== 'undefined') feather.replace();
    }
}

window.openVarEditor = function(id) {
    const v = id ? window.variableManager.variables.find(x => x.id === id) : null;
    const modal = document.getElementById('varEditorModal');
    if (!modal) return;
    
    const nextId = 'Var' + (window.variableManager.variables.length + 1);
    document.getElementById('varEditorId').value = v ? v.id : nextId;
    document.getElementById('editVarTag').value = v ? v.tag : '';
    document.getElementById('editVarDesc').value = v ? v.desc : '';
    document.getElementById('editVarUnit').value = v ? v.unit : '';
    document.getElementById('editVarIdDisp').value = v ? (v.dbIdDisp || '95') : '95';
    document.getElementById('editVarTable').value = v ? v.dbTable : '';
    document.getElementById('editVarColumn').value = v ? v.dbVar : '';
    document.getElementById('editVarVar20').value = v ? (v.dbVar20 || '') : '';
    document.getElementById('editVarToGraph').checked = v ? v.toGraph : true;
    
    document.getElementById('varEditorTitle').innerText = v ? 'Editar Variable' : 'Añadir Nueva Variable';
    // Desactivamos el ID si es edición para no romper referencias (opcional)
    // document.getElementById('varEditorId').readOnly = !!v; 
    
    modal.style.display = 'flex';
};

window.saveVarEditor = function() {
    const targetId = document.getElementById('varEditorId').value;
    const isNew = !window.variableManager.variables.some(v => v.id === targetId);

    const data = {
        id: targetId,
        tag: document.getElementById('editVarTag').value,
        desc: document.getElementById('editVarDesc').value,
        unit: document.getElementById('editVarUnit').value,
        dbIdDisp: document.getElementById('editVarIdDisp').value,
        dbTable: document.getElementById('editVarTable').value,
        dbVar: document.getElementById('editVarColumn').value,
        dbVar20: document.getElementById('editVarVar20').value,
        toGraph: document.getElementById('editVarToGraph').checked
    };

    if (isNew) {
        window.variableManager.add(data);
        showNotif('Variable añadida correctamente', 'success');
    } else {
        window.variableManager.update(targetId, data);
        showNotif('Variable actualizada correctamente', 'success');
    }
    document.getElementById('varEditorModal').style.display = 'none';
};
