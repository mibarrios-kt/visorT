// Configuración de leyendas para cada capa 
const leyendasConfig = {
    'chk-unidades-hidro': {
        nombre: 'Unidades hidrológicas',
        items: [
            { color: '#b04a6a', label: 'Límites de unidades hidrológicas', tipo: 'linea' }
        ]
    },
    'chk-subzonas': {
        nombre: 'Subzonas Hidrográficas',
        items: [
            { color: '#800020', label: 'Límites de subzonas hidrográficas', tipo: 'linea' }
        ]
    },
    'chk-drenajes': {
        nombre: 'Drenajes',
        items: [
            { color: '#0077be', label: 'Red de drenaje', tipo: 'linea' }
        ]
    },
    'chk-municipios': {
        nombre: 'Municipios',
        items: [
            { color: '#444', label: 'Límites municipales', tipo: 'linea' }
        ]
    },
    'chk-precip-nc': {
        nombre: 'Precipitación (1km) ',
        items: [
            { color: '#C2F0F3', label: '<= 800 mm/año' },
            { color: '#B6E2F1', label: '800.1 - 900 mm/año' },
            { color: '#AAD3EF', label: '900.1 - 1000 mm/año' },
            { color: '#9EC5EC', label: '1000.1 - 1100 mm/año' },
            { color: '#92B7EA', label: '1100.1 - 1200 mm/año' },
            { color: '#86A9E8', label: '1200.1 - 1300 mm/año' },
            { color: '#7A9BE6', label: '1300.1 - 1400 mm/año' },
            { color: '#6E8DE4', label: '1400.1 - 1500 mm/año' },
            { color: '#627FE2', label: '1500.1 - 1600 mm/año' },
            { color: '#5671E0', label: '1600.1 - 1700 mm/año' },
            { color: '#4A63DE', label: '1700.1 - 1800 mm/año' },
            { color: '#3E55DB', label: '1800.1 - 1900 mm/año' },
            { color: '#374DD7', label: '1900.1 - 2000 mm/año' },
            { color: '#3244D3', label: '2000.1 - 2100 mm/año' },
            { color: '#2C3CCF', label: '2100.1 - 2200 mm/año' },
            { color: '#2733CB', label: '2200.1 - 2300 mm/año' },
            { color: '#222AC7', label: '2300.1 - 2400 mm/año' },
            { color: '#1D22C3', label: '2400.1 - 2500 mm/año' },
            { color: '#1819BF', label: '2500.1 - 2600 mm/año' },
            { color: '#1310BB', label: '2600.1 - 2700 mm/año' },
            { color: '#0E08B7', label: '2700.1 - 2800 mm/año' },
            { color: '#3713A1', label: '2800.1 - 2900 mm/año' }
        ]
    },
    'chk-temp-nc': {
        nombre: 'Temperatura media (1km)',
        items: [
            { color: '#000080', label: '≤ 5°C' },
            { color: '#0000FF', label: '5.1 - 8°C' },
            { color: '#0080FF', label: '8.1 - 10°C' },
            { color: '#00FFFF', label: '10.1 - 12°C' },
            { color: '#00FF80', label: '12.1 - 15°C' },
            { color: '#00FF00', label: '15.1 - 18°C' },
            { color: '#80FF00', label: '18.1 - 20°C' },
            { color: '#FFFF00', label: '20.1 - 22°C' },
            { color: '#FFD700', label: '22.1 - 24°C' },
            { color: '#FFA500', label: '24.1 - 26°C' },
            { color: '#FF6600', label: '26.1 - 28°C' },
            { color: '#FF0000', label: '28.1 - 30°C' },
            { color: '#8B0000', label: '> 30°C' }
        ]
    },
    'chk-escorr': {
        nombre: 'Escorrentía',
        items: [
            { color: '#ff0000', label: '0 - 100 mm/año' },
            { color: '#ffff00', label: '100 - 200 mm/año' },
            { color: '#ff7800', label: '200 - 300 mm/año' },
            { color: '#ffb400', label: '300 - 400 mm/año' },
            { color: '#ffcd00', label: '400 - 600 mm/año' },
            { color: '#ffff00', label: '600 - 800 mm/año' },
            { color: '#ffff96', label: '800 - 1000 mm/año' },
            { color: '#a0ff73', label: '1000 - 1500 mm/año' },
            { color: '#4be600', label: '1500 - 2000 mm/año' },
            { color: '#008732', label: '2000 - 2500 mm/año' },
            { color: '#4be600', label: '2500 - 3000 mm/año' },
            { color: '#73b4ff', label: '> 3000 mm/año' }
        ]
    },
    'chk-precip-ideam': {
        nombre: 'Precipitación día actual en mm (IDEAM)',
        items: [
            { color: 'transparent', label: 'Leyenda dinámica del servicio IDEAM', tipo: 'texto', 
              descripcion: 'Esta capa muestra datos en tiempo real del IDEAM con su propia leyenda.' }
        ]
    },
    'chk-tmax-ideam': {
        nombre: 'Temp. máx. día actual en °C (IDEAM)',
        items: [
            { color: 'transparent', label: 'Leyenda dinámica del servicio IDEAM', tipo: 'texto',
              descripcion: 'Esta capa muestra datos en tiempo real del IDEAM con su propia leyenda.' }
        ]
    },
    'chk-pronostico-ideam': {
        nombre: 'Pronóstico Prec. - 24 H en mm (IDEAM)',
        items: [
            { color: 'transparent', label: 'Leyenda dinámica del servicio IDEAM', tipo: 'texto',
              descripcion: 'Esta capa muestra pronósticos del IDEAM con su propia leyenda.' }
        ]
    },
    'chk-est-met': {
        nombre: 'Estaciones Meteorológicas',
        items: [
            { 
                color: 'transparent', 
                label: 'Estaciones meteorológicas CORTOLIMA', 
                icono: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                tipo: 'icono'
            }
        ]
    },
    'chk-est-hidro': {
        nombre: 'Estaciones Hidrométricas',
        items: [
            { 
                color: 'transparent', 
                label: 'Estaciones hidrométricas CORTOLIMA', 
                icono: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                tipo: 'icono'
            }
        ]
    },
    'chk-est-hidro-ideam': {
        nombre: 'Estaciones Limnimétricas',
        items: [
            { 
                color: 'transparent', 
                label: 'Estaciones limnimétricas IDEAM', 
                icono: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
                tipo: 'icono'
            }
        ]
    }
};

// Función para obtener leyendas dinámicas de IDEAM (ACTUALIZADA - con layer específico)
async function obtenerLeyendaIdeam(serviceUrl, layerId = null) {
    try {
        let legendUrl = `${serviceUrl}/legend?f=json`;
        if (layerId !== null) {
            legendUrl += `&layers=${layerId}`;
        }
        
        console.log(`Obteniendo leyenda de: ${legendUrl}`); // Para debug
        
        const response = await fetch(legendUrl);
        const data = await response.json();
        
        console.log('Datos de leyenda recibidos:', data); // Para debug
        
        return data;
    } catch (error) {
        console.error('Error obteniendo leyenda de IDEAM:', error);
        return null;
    }
}

// Función para crear HTML de leyenda IDEAM (ACTUALIZADA - filtrar por layer específico)
function crearLeyendaIdeamHTML(legendData, titulo, contenedor, layerId = null) {
    if (!legendData || !legendData.layers) return;
    
    // Contenedor de cada capa
    let capaDiv = document.createElement('div');
    capaDiv.style.cssText = `
        margin-bottom: 15px; 
        border: 1px solid #ddd; 
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Header de la capa (clickeable)
    let headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        padding: 12px 15px; 
        background: #f8f9fa; 
        cursor: pointer; 
        font-weight: bold; 
        color: #2c5530;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s ease;
    `;
    headerDiv.innerHTML = `
        <span>${titulo}</span>
        <span class="toggle-icon" style="font-size: 14px;">▼</span>
    `;

    // Contenido de la leyenda (inicialmente oculto)
    let contenidoDiv = document.createElement('div');
    contenidoDiv.style.cssText = `
        padding: 0 15px; 
        max-height: 0; 
        overflow: hidden; 
        transition: max-height 0.3s ease, padding 0.3s ease;
    `;

    // Crear items de la leyenda IDEAM
    let itemsHTML = '';
    legendData.layers.forEach(layer => {
        // Si se especifica layerId, solo procesar ese layer
        if (layerId !== null && layer.layerId !== layerId) {
            return; // Saltar este layer
        }
        
        if (layer.legend && layer.legend.length > 0) {
            // Solo mostrar el nombre del layer si hay múltiples layers
            if (layerId === null && layer.layerName) {
                itemsHTML += `<div style="font-weight: bold; margin: 10px 0 8px 0; color: #555; font-size: 14px;">${layer.layerName}</div>`;
            }
            
            layer.legend.forEach(item => {
                itemsHTML += `
                    <div style="display: flex; align-items: center; margin: 6px 0;">
                        ${item.imageData ? `<img src="data:image/png;base64,${item.imageData}" 
                                          alt="${item.label || 'Símbolo'}" 
                                          style="margin-right: 10px; max-width: 25px; max-height: 20px; vertical-align: middle;">` : ''}
                        ${item.label ? `<span style="font-size: 14px; color: #333;">${item.label}</span>` : ''}
                    </div>
                `;
            });
        }
    });
    // Si no se encontró contenido para el layer específico
    if (itemsHTML === '' && layerId !== null) {
        itemsHTML = `<div style="font-style: italic; color: #666; margin: 10px 0;">No se encontró leyenda para el layer ${layerId}</div>`;
    }
    contenidoDiv.innerHTML = itemsHTML;

    // Funcionalidad de expandir/contraer (igual que las otras capas)
    let expandido = false;
    headerDiv.addEventListener('click', function() {
        const toggleIcon = headerDiv.querySelector('.toggle-icon');
        
        if (expandido) {
            // Contraer
            contenidoDiv.style.maxHeight = '0';
            contenidoDiv.style.padding = '0 15px';
            toggleIcon.textContent = '▼';
            headerDiv.style.backgroundColor = '#f8f9fa';
        } else {
            // Expandir
            contenidoDiv.style.maxHeight = contenidoDiv.scrollHeight + 'px';
            contenidoDiv.style.padding = '15px';
            toggleIcon.textContent = '▲';
            headerDiv.style.backgroundColor = '#e9ecef';
        }
        expandido = !expandido;
    });

    // Hover effect (igual que las otras capas)
    headerDiv.addEventListener('mouseenter', function() {
        if (!expandido) {
            headerDiv.style.backgroundColor = '#e9ecef';
        }
    });
    headerDiv.addEventListener('mouseleave', function() {
        if (!expandido) {
            headerDiv.style.backgroundColor = '#f8f9fa';
        }
    });

    capaDiv.appendChild(headerDiv);
    capaDiv.appendChild(contenidoDiv);
    contenedor.appendChild(capaDiv);
}

// Función para crear sección de leyenda estática
function crearSeccionLeyenda(contenedor, nombre, items) {
    // Contenedor de cada capa
    let capaDiv = document.createElement('div');
    capaDiv.style.cssText = `
        margin-bottom: 15px; 
        border: 1px solid #ddd; 
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Header de la capa (clickeable)
    let headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        padding: 12px 15px; 
        background: #f8f9fa; 
        cursor: pointer; 
        font-weight: bold; 
        color: #2c5530;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s ease;
    `;
    headerDiv.innerHTML = `
        <span>${nombre}</span>
        <span class="toggle-icon" style="font-size: 14px;">▼</span>
    `;

    // Contenido de la leyenda (inicialmente oculto)
    let contenidoDiv = document.createElement('div');
    contenidoDiv.style.cssText = `
        padding: 0 15px; 
        max-height: 0; 
        overflow: hidden; 
        transition: max-height 0.3s ease, padding 0.3s ease;
    `;

    // Crear items de la leyenda
    let itemsHTML = '';
    items.forEach(item => {
        if (item.tipo === 'icono') {
            // Para estaciones (con icono real)
            itemsHTML += `
                <div style="display: flex; align-items: center; margin: 8px 0;">
                    <img src="${item.icono}" style="width: 20px; height: auto; margin-right: 10px;" />
                    <span style="font-size: 14px;">${item.label}</span>
                </div>
            `;
        } else if (item.tipo === 'linea') {
            // Para líneas (drenajes, límites)
            itemsHTML += `
                <div style="display: flex; align-items: center; margin: 8px 0;">
                    <div style="width: 25px; height: 3px; background-color: ${item.color}; margin-right: 10px; border-radius: 1px;"></div>
                    <span style="font-size: 14px;">${item.label}</span>
                </div>
            `;
        } else if (item.tipo === 'texto') {
            // Para capas dinámicas del IDEAM
            itemsHTML += `
                <div style="margin: 8px 0; padding: 8px; background: #f0f8ff; border-left: 3px solid #2196F3; border-radius: 4px;">
                    <span style="font-size: 14px; font-style: italic;">${item.label}</span>
                    ${item.descripcion ? `<br><span style="font-size: 12px; color: #666;">${item.descripcion}</span>` : ''}
                </div>
            `;
        } else {
            // Para capas con colores sólidos (rellenos)
            itemsHTML += `
                <div style="display: flex; align-items: center; margin: 6px 0;">
                    <div style="width: 20px; height: 15px; background-color: ${item.color}; border: 1px solid #666; margin-right: 10px; ${item.color === 'transparent' ? 'background: repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 5px, #e0e0e0 5px, #e0e0e0 10px);' : ''}"></div>
                    <span style="font-size: 14px;">${item.label}</span>
                </div>
            `;
        }
    });
    contenidoDiv.innerHTML = itemsHTML;

    // Funcionalidad de expandir/contraer
    let expandido = false;
    headerDiv.addEventListener('click', function() {
        const toggleIcon = headerDiv.querySelector('.toggle-icon');
        
        if (expandido) {
            // Contraer
            contenidoDiv.style.maxHeight = '0';
            contenidoDiv.style.padding = '0 15px';
            toggleIcon.textContent = '▼';
            headerDiv.style.backgroundColor = '#f8f9fa';
        } else {
            // Expandir
            contenidoDiv.style.maxHeight = contenidoDiv.scrollHeight + 'px';
            contenidoDiv.style.padding = '15px';
            toggleIcon.textContent = '▲';
            headerDiv.style.backgroundColor = '#e9ecef';
        }
        expandido = !expandido;
    });

    // Hover effect
    headerDiv.addEventListener('mouseenter', function() {
        if (!expandido) {
            headerDiv.style.backgroundColor = '#e9ecef';
        }
    });
    headerDiv.addEventListener('mouseleave', function() {
        if (!expandido) {
            headerDiv.style.backgroundColor = '#f8f9fa';
        }
    });

    capaDiv.appendChild(headerDiv);
    capaDiv.appendChild(contenidoDiv);
    contenedor.appendChild(capaDiv);
}

// Función para mostrar leyendas de capas activas (ACTUALIZADA - con layers específicos)
async function mostrarLeyendas() {
    // Limpiar el panel lateral
    lateralPanel.innerHTML = '';
    lateralPanel.style.padding = '20px';
    lateralPanel.style.textAlign = 'left';
    lateralPanel.style.display = 'block';

    // Título principal
    let titulo = document.createElement('h2');
    titulo.innerHTML = '📋 Leyenda de Capas Activas';
    titulo.style.cssText = `
        margin: 0 0 20px 0; 
        color: #2c5530; 
        font-size: 20px; 
        text-align: center;
        border-bottom: 2px solid #2c5530;
        padding-bottom: 10px;
    `;
    lateralPanel.appendChild(titulo);

    // Obtener capas activas
    const capasActivas = [];
    Object.keys(leyendasConfig).forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox && checkbox.checked) {
            capasActivas.push({
                id: checkboxId,
                config: leyendasConfig[checkboxId]
            });
        }
    });

    // Verificar si hay capas activas
    if (capasActivas.length === 0) {
        let mensaje = document.createElement('div');
        mensaje.innerHTML = `
            <div style="text-align: center; color: #666; font-style: italic; margin-top: 50px;">
                <p>📭 No hay capas activas</p>
                <p>Activa algunas capas desde el menú "Capas" para ver sus leyendas aquí.</p>
            </div>
        `;
        lateralPanel.appendChild(mensaje);
        return;
    }

    // Crear contenedor de leyendas
    let contenedorLeyendas = document.createElement('div');
    contenedorLeyendas.style.cssText = 'margin-top: 10px;';

    // Procesar cada capa activa
    for (const capa of capasActivas) {
        // Verificar si es una capa de IDEAM activa con layer específico
        if (capa.id === 'chk-pronostico-ideam' && typeof identifyServiceUrl !== 'undefined' && identifyServiceUrl && identifyServiceUrl.includes('Pronostico_24_horas')) {
            const legendData = await obtenerLeyendaIdeam('https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/Pronostico_24_horas/MapServer', 11);
            if (legendData) {
                crearLeyendaIdeamHTML(legendData, 'Pronóstico Precipitación 24H (IDEAM)', contenedorLeyendas, 11);
            }
        } else if (capa.id === 'chk-tmax-ideam' && typeof identifyServiceUrl !== 'undefined' && identifyServiceUrl && identifyServiceUrl.includes('TMaxima_24H')) {
            const legendData = await obtenerLeyendaIdeam('https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/TMaxima_24H/MapServer', 3);
            if (legendData) {
                crearLeyendaIdeamHTML(legendData, 'Temperatura Máxima 24H (IDEAM)', contenedorLeyendas, 3);
            }
        } else if (capa.id === 'chk-precip-ideam' && typeof identifyServiceUrl !== 'undefined' && identifyServiceUrl && identifyServiceUrl.includes('Precipitacion__Acumulada')) {
            const legendData = await obtenerLeyendaIdeam('https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/Precipitacion__Acumulada/MapServer', 4);
            if (legendData) {
                crearLeyendaIdeamHTML(legendData, 'Precipitación Acumulada (IDEAM)', contenedorLeyendas, 4);
            }
        } else {
            // Leyendas estáticas
            crearSeccionLeyenda(contenedorLeyendas, capa.config.nombre, capa.config.items);
        }
    }

    lateralPanel.appendChild(contenedorLeyendas);

    // Nota informativa
    let nota = document.createElement('div');
    nota.innerHTML = `
        <div style="margin-top: 20px; padding: 10px; background: #e8f4f8; border-left: 4px solid #2c5530; border-radius: 4px; font-size: 13px; color: #555;">
            💡 <strong>Tip:</strong> Haz clic en cada capa para expandir/contraer su leyenda.<br>
            📊 Las capas del IDEAM muestran leyendas específicas del layer activo.
        </div>
    `;
    lateralPanel.appendChild(nota);
}