// Cargar el mapa con Leaflet

// URL del proxy Lambda en AWS (PRODUCCIÓN)
const API_PROXY_URL = 'https://6u5qs769qf.execute-api.us-east-2.amazonaws.com/proxy';

var map = L.map('map', {
    attributionControl: false  // ← Deshabilitar control de atribución
}).setView([4.4389, -75.2322], 8);

// Agregar un mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Leer parámetros de la URL para centrar el mapa si existen
function getMapParamsFromURL() {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    const zoom = parseInt(params.get('zoom'));
    if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
        return { lat, lng, zoom };
    }
    return null;
}

const mapParams = getMapParamsFromURL();
if (mapParams) {
    map.setView([mapParams.lat, mapParams.lng], mapParams.zoom);
} else {
    map.setView([4.0925, -75.1545], 9); // Vista por defecto Tolima
}

// Define the bounding box for Colombia
const colombiaBounds = [
    [-4.227, -79.0], // Southwest corner
    [13.5, -66.85]   // Northeast corner
];

// Set the max bounds to Colombia
map.setMaxBounds(colombiaBounds);

// Prevent zooming out beyond Colombia
map.setMinZoom(map.getBoundsZoom(colombiaBounds));

// Ensure the map stays within Colombia bounds when dragged
map.on('drag', function () {
    map.panInsideBounds(colombiaBounds, { animate: true });
});

let tablaDatos = {};
let etiquetasTiempo = [];
let geojson; // <-- Declaración global
let capaEstMet = null;
let capaEstHidro = null;
let capaPronosticoIdeam = null; // Variable global para la capa de pronóstico
let capaPrecipIdeam = null; // Variable global para la capa de precipitación
let capaTmaxIdeam = null; // Variable global para la capa de temperatura máxima
let capaGOES13 = null; // Variable global para la capa GOES Banda 13
let identifyServiceUrl = null; // URL del servicio activo para identify
let mostrarUnidadesHidro = false; // Controla la interacción
let mostrarRellenoUnidades = false; // Controla el relleno
let unidadesHidroAuto = false; // <-- SI ESTA ACTIVO, las unidades fueron seleccionadas automáticamente (cuando se selecciona la capa escorrentia)
let capaSubzonas = null; // Variable para la capa de subzonas hidrográficas
let capaDrenajes = null;
let selectedFeature = null; // Variable para almacenar la unidad seleccionada, esto es para hacer relativo el infoControl al map al arrastrar
let selectedLayer = null; // Variable para almacenar la capa seleccionada, esto es para hacer relativo el infoControl al map al arrastrar
let capaMunicipios = null;
let capaPrec1kClass = null;
let capaMallaPrecT = null;
let capaMunicipiosTransp = null; // Capa municipios transparente para consulta
let capaEstHidroIdeam = null;  // Capa de estaciones hidrométricas (limnimetricas) del IDEAM (con datos en tiempo real)
let capaTemp1k = null;    // Variables globales para temperatura
let capaMallaTemp = null;   // Variables globales para temperatura
var unidadTooltip = document.createElement('div');
unidadTooltip.style.position = 'fixed';
unidadTooltip.style.pointerEvents = 'none';
unidadTooltip.style.background = 'rgba(50,50,50,0.95)';
unidadTooltip.style.color = '#fff';
unidadTooltip.style.padding = '4px 10px';
unidadTooltip.style.borderRadius = '4px';
unidadTooltip.style.fontSize = '13px';
unidadTooltip.style.zIndex = 9999;
unidadTooltip.style.display = 'none';
document.body.appendChild(unidadTooltip);

// para leer capas:
// Mostrar/ocultar menú de capas
document.getElementById('btn-capas').addEventListener('click', function(e) {
    e.stopPropagation();
    const menu = document.getElementById('menu-capas');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

// Ocultar menú al hacer clic fuera
document.addEventListener('click', function(e) {
    const menu = document.getElementById('menu-capas');
    if (menu && !menu.contains(e.target) && e.target.id !== 'btn-capas') {
        menu.style.display = 'none';
    }
});

// Variables globales adiciones para las capas de IDEAM
let serviciosIdeamActivos = []; // Nueva variable para trackear servicios activos

// Listener para el checkbox Pronóstico Prec. - 24 H (IDEAM)
document.getElementById('chk-pronostico-ideam').addEventListener('change', function(e) {
    if (this.checked) {
        capaPronosticoIdeam = L.esri.dynamicMapLayer({
            url: 'https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/Pronostico_24_horas/MapServer',
            opacity: 0.7
        }).addTo(map);
        identifyServiceUrl = 'https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/Pronostico_24_horas/MapServer';
        
        // Agregar a servicios activos
        if (!serviciosIdeamActivos.includes('pronostico')) {
            serviciosIdeamActivos.push('pronostico');
        }
    } else {
        if (capaPronosticoIdeam) {
            map.removeLayer(capaPronosticoIdeam);
            capaPronosticoIdeam = null;
        }
        
        // Remover de servicios activos
        serviciosIdeamActivos = serviciosIdeamActivos.filter(s => s !== 'pronostico');
        
        // Solo desactiva identify si no hay otra capa activa
        if (!document.getElementById('chk-tmax-ideam').checked && 
            !document.getElementById('chk-precip-ideam').checked) {
            identifyServiceUrl = null;
        }
    }
});

// Listener para el checkbox Precipitación dia actual (IDEAM)
document.getElementById('chk-precip-ideam').addEventListener('change', function(e) {
    if (this.checked) {
        capaPrecipIdeam = L.esri.dynamicMapLayer({
            url: 'https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/Precipitacion__Acumulada/MapServer',
            layers: [4],
            opacity: 0.7
        }).addTo(map);
        identifyServiceUrl = 'https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/Precipitacion__Acumulada/MapServer';
        capaPrecipIdeam.bringToFront();
        
        // Agregar a servicios activos
        if (!serviciosIdeamActivos.includes('precipitacion')) {
            serviciosIdeamActivos.push('precipitacion');
        }
    } else {
        if (capaPrecipIdeam) {
            map.removeLayer(capaPrecipIdeam);
            capaPrecipIdeam = null;
        }
        
        // Remover de servicios activos
        serviciosIdeamActivos = serviciosIdeamActivos.filter(s => s !== 'precipitacion');
        
        // Solo desactiva identify si no hay otra capa activa
        if (!document.getElementById('chk-pronostico-ideam').checked && 
            !document.getElementById('chk-tmax-ideam').checked) {
            identifyServiceUrl = null;
        }
    }
});


// Listener para el checkbox Temperatura dia actual (IDEAM)
document.getElementById('chk-tmax-ideam').addEventListener('change', function(e) {
    if (this.checked) {
        capaTmaxIdeam = L.esri.dynamicMapLayer({
            url: 'https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/TMaxima_24H/MapServer',
            opacity: 0.7
        }).addTo(map);
        identifyServiceUrl = 'https://visualizador.ideam.gov.co/gisserver/rest/services/StoryMaps_IDA/TMaxima_24H/MapServer';
        
        // Agregar a servicios activos
        if (!serviciosIdeamActivos.includes('temperatura')) {
            serviciosIdeamActivos.push('temperatura');
        }
    } else {
        if (capaTmaxIdeam) {
            map.removeLayer(capaTmaxIdeam);
            capaTmaxIdeam = null;
        }
        
        // Remover de servicios activos
        serviciosIdeamActivos = serviciosIdeamActivos.filter(s => s !== 'temperatura');
        
        // Solo desactiva identify si no hay otra capa activa
        if (!document.getElementById('chk-pronostico-ideam').checked && 
            !document.getElementById('chk-precip-ideam').checked) {
            identifyServiceUrl = null;
        }
    }
});

// Helper: construir reglas de renderizado para GOES-19 Band 13
function construirRenderingRuleGOES13(preset = 'stretchRainbow') {
    if (preset === 'colormapClases') {
        // Colormap por clases (si el servicio requiere enteros, puede no aplicar en F32)
        return {
            rasterFunction: "Colormap",
            rasterFunctionArguments: {
                // Mapa simple por umbrales de temperatura brillo (K) aproximados
                // [valor, R, G, B, A]
                Colormap: [
                    [200, 160, 0, 200, 255], // muy fríos
                    [210, 128, 0, 128, 255],
                    [220, 255, 0, 255, 255],
                    [230, 255, 0, 0, 255],
                    [240, 255, 64, 64, 255],
                    [250, 255, 128, 128, 255],
                    [260, 255, 180, 180, 255],
                    [270, 255, 220, 220, 255],
                    [280, 240, 240, 240, 255],
                    [290, 180, 180, 180, 255],
                    [300, 128, 128, 128, 255],
                    [310, 64, 64, 64, 255]
                ]
            }
        };
    }

    // Por defecto: Stretch + ColorRamp (continuo)
    return {
        rasterFunction: "Stretch",
        rasterFunctionArguments: {
            StretchType: 3, // StandardDeviation
            NumberOfStandardDeviations: 2,
            DRA: true,
            UseGamma: true,
            Gamma: [1.0],
            // Estadísticos y rango aproximado para BT K (ajústalo si es necesario)
            Statistics: [{ min: 190, max: 320, avg: 260, stddev: 15 }],
            Min: 190,
            Max: 320,
            ColorRamp: {
                type: "MultipartColorRamp",
                colorRamps: [
                    { type: "AlgorithmicColorRamp", algorithm: "HSV",
                      fromColor: [0, 0, 130, 255],   toColor: [0, 240, 255, 255] }, // azul oscuro -> cian
                    { type: "AlgorithmicColorRamp", algorithm: "HSV",
                      fromColor: [0, 240, 255, 255], toColor: [0, 255, 0, 255] },   // cian -> verde
                    { type: "AlgorithmicColorRamp", algorithm: "HSV",
                      fromColor: [0, 255, 0, 255],   toColor: [255, 255, 0, 255] }, // verde -> amarillo
                    { type: "AlgorithmicColorRamp", algorithm: "HSV",
                      fromColor: [255, 255, 0, 255], toColor: [255, 128, 0, 255] }, // amarillo -> naranja
                    { type: "AlgorithmicColorRamp", algorithm: "HSV",
                      fromColor: [255, 128, 0, 255], toColor: [255, 0, 0, 255] },   // naranja -> rojo
                    { type: "AlgorithmicColorRamp", algorithm: "HSV",
                      fromColor: [255, 0, 0, 255],   toColor: [160, 0, 0, 255] }    // rojo -> vino
                ]
            }
        }
    };
}


//Control para mostrar fecha/hora local de GOES13
var goesTimeControl = L.control({ position: 'topleft' });
goesTimeControl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'goes-time-control');
    this._div.style.position = 'fixed';
    this._div.style.left = '40px';
    this._div.style.top = '200px';
    this._div.style.background = 'rgba(255,255,255,0.95)';
    this._div.style.border = '1px solid #bbb';
    this._div.style.borderRadius = '6px';
    this._div.style.padding = '6px 10px';
    this._div.style.fontSize = '13px';
    this._div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    this._div.style.zIndex = 100100;
    this._div.style.display = 'none';
    this.update(null);
    return this._div;
};
goesTimeControl.update = function (ms) {
    if (typeof ms === 'number') {
        const dt = new Date(ms);
        const fecha = dt.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
        const hora = dt.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit' });
        this._div.innerHTML = `<b>GOES-ABI Band 13</b><br>${fecha} ${hora}`;
        this._div.style.display = 'block';
    } else {
        this._div.innerHTML = `<b>GOES-ABI Band 13</b><br>--/--/---- --:--`;
        this._div.style.display = 'none';
    }
};
goesTimeControl.addTo(map);

// Registrar callback para actualizar el control en cada frame
if (window.GOES13Anim && typeof GOES13Anim.onFrame === 'function') {
    GOES13Anim.onFrame(function(frame) {
        if (frame && typeof frame.t === 'number') {
            goesTimeControl.update(frame.t);
        }
    });
}

//Listener para el checkbox GOES Banda 13
document.getElementById('chk-GOES13').addEventListener('change', async function(e) {
  const urlGOES = 'https://satellitemaps.nesdis.noaa.gov/arcgis/rest/services/ABI13_Last_24hr/ImageServer';
  if (this.checked) {
    try {
      capaGOES13 = L.esri.imageMapLayer({
        url: urlGOES,
        opacity: 0.7,
        format: 'png32',
        attribution: 'NOAA/NESDIS'
      }).addTo(map);

      const { frames } = await GOES13Anim.obtenerFramesGOES(urlGOES, 10, 24);
      if (frames.length) {
        GOES13Anim.state.frames = frames;
        GOES13Anim.state.idx = 0;

        // Registrar el callback (sin mostrar nada antes del loop)
        GOES13Anim.onFrame(function(frame) {
          if (frame && typeof frame.t === 'number') {
            goesTimeControl.update(frame.t);
          } else {
            goesTimeControl.update(null);
          }
        });

        // Iniciar la animación (no hay previsualización)
        GOES13Anim.iniciarAnimacionGOES13(capaGOES13);
      } else {
        goesTimeControl.update(null);
      }
    } catch (err) {
      console.error('Error iniciando GOES13:', err);
      this.checked = false;
      goesTimeControl.update(null);
    }
  } else {
    GOES13Anim.detenerAnimacionGOES13();
    if (capaGOES13) { map.removeLayer(capaGOES13); capaGOES13 = null; }
    goesTimeControl.update(null);
  }
});

// Para consultar los datos de la ultima capa de IDEAM cargada al pasar el mouse y mostrar atributos
map.on('click', function(e) {
    if (!identifyServiceUrl) return; // No hay capa activa para identificar

    L.esri.identifyFeatures({
        url: identifyServiceUrl
    })
    .on(map)
    .at(e.latlng)
    .run(function(error, featureCollection) {
        if (error) {
            console.error(error);
            return;
        }
        if (featureCollection.features.length) {
            var props = featureCollection.features[0].properties;
            let titulo = '';
            let pixelLabel = '';
            let classLabel = '';
            let pixelValue = '';
            let classValue = '';

            // Detecta el servicio activo y personaliza los textos
            if (identifyServiceUrl.includes('Pronostico_24_horas')) {
                titulo = 'Pronóstico de Precipitación 24H';
                pixelLabel = 'Valor:';
                classLabel = 'Categoría:';
                pixelValue = props['Classify.Pixel Value'] !== undefined
                    ? `${Number(props['Classify.Pixel Value']).toFixed(1)} mm`
                    : 'N/A';
                classValue = props['Classify.Class value'] !== undefined
                    ? props['Classify.Class value']
                    : 'N/A';
            } else if (identifyServiceUrl.includes('TMaxima_24H')) {
                titulo = 'Temperatura Max 24H';
                pixelLabel = 'Valor:';
                classLabel = 'Categoría:';
                pixelValue = props['Classify.Pixel Value'] !== undefined
                    ? `${Number(props['Classify.Pixel Value']).toFixed(1)} °C`
                    : 'N/A';
                classValue = props['Classify.Class value'] !== undefined
                    ? props['Classify.Class value']
                    : 'N/A';
            } else {
                titulo = 'Precipitación ultimas 24H (IDEAM)';
                pixelLabel = 'Valor:';
                classLabel = 'Categoría:';
                pixelValue = props['Classify.Pixel Value'] !== undefined
                    ? `${Number(props['Classify.Pixel Value']).toFixed(1)} mm`
                    : 'N/A';
                classValue = props['Classify.Class value'] !== undefined
                    ? props['Classify.Class value']
                    : 'N/A';
            }

            var html = `<b>${titulo}</b><br>
                        <b>${pixelLabel}</b> ${pixelValue}<br>
                        <b>${classLabel}</b> ${classValue}`;

            L.popup()
                .setLatLng(e.latlng)
                .setContent(html)
                .openOn(map);
        } else {
            L.popup()
                .setLatLng(e.latlng)
                .setContent('No hay datos en este punto.')
                .openOn(map);
        }
    });
});

// Cargar/descargar capa Estaciones meteorológicas CORTOLIMA
document.getElementById('chk-est-met').addEventListener('change', function(e) {
    if (this.checked) {
        fetch('/capas_estaciones/est_met.geojson')
            .then(resp => resp.json())
            .then(data => {
                // Marcador azul para meteorológicas
                const blueIcon = L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    shadowSize: [41, 41]
                });
                capaEstMet = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: blueIcon }),
                    onEachFeature: function(feature, layer) {
                        let props = feature.properties;
                        let coords = feature.geometry.coordinates;
                        let popupContent = `
                            <b>Nombre:</b> ${props["Nombre_estación"] || 'N/A'}<br>
                            <b>Municipio:</b> ${props["Municipio"] || 'N/A'}<br>
                            <b>Tipo:</b> Meteorológica<br>
                            <b>Corriente hídrica:</b> ${props["Corriente_hídrica"] || 'N/A'}<br>
                            <b>Coordenadas:</b> [${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]
                        `;
                        layer.bindPopup(popupContent);
                    }
                }).addTo(map);
            });
    } else {
        if (capaEstMet) {
            map.removeLayer(capaEstMet);
            capaEstMet = null;
        }
    }
});

// Cargar/descargar capa Estaciones hidrométricas CORTOLIMA
document.getElementById('chk-est-hidro').addEventListener('change', function(e) {
    if (this.checked) {
        fetch('/capas_estaciones/est_hidro.geojson')
            .then(resp => resp.json())
            .then(data => {
                // Marcador rojo para hidrométricas
                const redIcon = L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    shadowSize: [41, 41]
                });
                capaEstHidro = L.geoJSON(data, {
                    pointToLayer: (feature, latlng) => L.marker(latlng, { icon: redIcon }),
                    onEachFeature: function(feature, layer) {
                        let props = feature.properties || {};
                        let coords = feature.geometry && feature.geometry.coordinates ? feature.geometry.coordinates : [0,0];

                        // Determinar código/identificador de estación (ajusta según tu geojson)
                        let stationCode = props['Codigo'] || props['Codigo_estacion'] || props['codigo'] || null;
                        if (!stationCode) {
                            // intentar extraer de nombre (ej. "CAFAM" / "0000HCAFAM")
                            const name = String(props["Nombre_estación"] || props["Nombre"] || '');
                            const m = name.match(/([0-9A-Z]{4,}H[A-Z0-9]+)/i);
                            if (m) stationCode = m[1];
                        }

                        // Popup con botón de datos externos (FTP)
                        let popupContent = `
                            <b>Nombre:</b> ${props["Nombre_estación"] || props["Nombre"] || 'N/A'}<br>
                            <b>Municipio:</b> ${props["Municipio"] || 'N/A'}<br>
                            <b>Tipo:</b> Hidrométrica<br>
                            <b>Corriente hídrica:</b> ${props["Corriente_hídrica"] || 'N/A'}<br>
                            <b>Coordenadas:</b> [${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]<br>
                            <button class="btn-datos-ftp" data-station="${stationCode || ''}">Ver datos externos</button>
                        `;
                        layer.bindPopup(popupContent);

                        layer.on('popupopen', function(e) {
                            const btn = e.popup.getElement().querySelector('.btn-datos-ftp');
                            if (!btn) return;
                            btn.onclick = function() {
                                const code = btn.getAttribute('data-station');
                                if (!code) {
                                    alert('No se encontró código de estación. Añade la propiedad "Codigo" en el GeoJSON.');
                                    return;
                                }
                                // Llamar al proxy que conecta al FTP en el servidor
                                fetch(`http://localhost:3002/ftp-proxy?station=${encodeURIComponent(code)}`)
                                    .then(r => {
                                        if (!r.ok) throw new Error('Error proxy FTP');
                                        return r.json();
                                    })
                                    .then(payload => {
                                        // ...existing code para mostrar modal y gráfica...
                                    })
                                    .catch(err => { console.error(err); alert('Error obteniendo datos externos.'); });
                            };
                        });
                    }
                }).addTo(map);
            });
    } else {
        if (capaEstHidro) {
            map.removeLayer(capaEstHidro);
            capaEstHidro = null;
        }
    }
});

// Cargar/descargar capa Estaciones limnimetricas del IDEAM
document.getElementById('chk-est-hidro-ideam').addEventListener('change', function(e) {
    if (this.checked) {
        fetch('/capas_estaciones/limnimetricas_ideam.geojson')
            .then(resp => resp.json())
            .then(data => {
                capaEstHidroIdeam = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        return L.marker(latlng, {icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34]
                            })
                        });
                    },
                    onEachFeature: function(feature, layer) {
                        let props = feature.properties;
                        let coords = feature.geometry.coordinates;
                        let sourceUrl = props["source"] || '';
                        let nombreEstacion = props["Nombre_estación"] || 'N/A';

                        // Crear contenido del popup con botón
                        let popupContent = `<b>Estación IDEAM</b><br>
                            <b>Nombre:</b> ${nombreEstacion}<br>
                            <b>Municipio:</b> ${props["Municipio"] || 'N/A'}<br>
                            <b>Tipo:</b> ${props["Tipo"] || 'N/A'}<br>
                            <b>Corriente hídrica:</b> ${props["Corriente_hídrica"] || 'N/A'}<br>
                            <b>Coordenadas:</b> [${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}]<br>
                            <button class="btn-datos-estacion" data-source="${sourceUrl}" data-nombre="${nombreEstacion}">
                                Ver datos externos
                            </button>
                        `;
                        layer.bindPopup(popupContent);

                        layer.on('popupopen', function(e) {
                            let btn = document.querySelector('.btn-datos-estacion');
                            if (btn) {
                                btn.onclick = function() {
                                    let url = btn.getAttribute('data-source');
                                    let nombre = btn.getAttribute('data-nombre');
                                    if (!url) {
                                        alert('No hay URL de datos disponible.');
                                        return;
                                    }
                                    //fetch(`http://localhost:3001/proxy?url=${encodeURIComponent(url)}`)  // LOCAL
                                    fetch(`${API_PROXY_URL}?url=${encodeURIComponent(url)}`)  // PRODUCCIÓN
                                        .then(resp => resp.json())
                                        .then(data => {
                                            // Unificar todas las fechas únicas
                                            let fechasSet = new Set();
                                            if (data.Hobs && Array.isArray(data.Hobs.data)) {
                                                data.Hobs.data.forEach(d => d.Fecha && !d.ultimo && fechasSet.add(d.Fecha));
                                            }
                                            if (data.Hsen && Array.isArray(data.Hsen.data)) {
                                                data.Hsen.data.forEach(d => d.Fecha && !d.ultimo && fechasSet.add(d.Fecha));
                                            }
                                            if (data.Pobs && Array.isArray(data.Pobs.data)) {
                                                data.Pobs.data.forEach(d => d.Fecha && !d.ultimo && fechasSet.add(d.Fecha));
                                            }
                                            let fechas = Array.from(fechasSet).sort();

                                            // Mapear valores por fecha
                                            let hobsMap = {};
                                            let hsenMap = {};
                                            let pobsMap = {};
                                            if (data.Hobs && Array.isArray(data.Hobs.data)) {
                                                data.Hobs.data.forEach(d => { if (d.Fecha && !d.ultimo) hobsMap[d.Fecha] = d.Hobs; });
                                            }
                                            if (data.Hsen && Array.isArray(data.Hsen.data)) {
                                                data.Hsen.data.forEach(d => { if (d.Fecha && !d.ultimo) hsenMap[d.Fecha] = d.Hsen; });
                                            }
                                            if (data.Pobs && Array.isArray(data.Pobs.data)) {
                                                data.Pobs.data.forEach(d => { if (d.Fecha && !d.ultimo) pobsMap[d.Fecha] = d.Pobs; });
                                            }

                                            let hobsY = fechas.map(f => hobsMap[f] !== undefined ? hobsMap[f] : null);
                                            let hsenY = fechas.map(f => hsenMap[f] !== undefined ? hsenMap[f] : null);
                                            let pobsY = fechas.map(f => pobsMap[f] !== undefined ? pobsMap[f] : null);

                                            // --- Crear el modal y el contenedor de la gráfica ---
                                            let modal = document.createElement('div');
                                            modal.style.position = 'fixed';
                                            modal.style.top = '0';
                                            modal.style.left = '0';
                                            modal.style.width = '100vw';
                                            modal.style.height = '100vh';
                                            modal.style.background = 'rgba(0,0,0,0.4)';
                                            modal.style.display = 'flex';
                                            modal.style.alignItems = 'center';
                                            modal.style.justifyContent = 'center';
                                            modal.style.zIndex = 99999;
                                            modal.innerHTML = `
                                                <div style="background:#fff;padding:24px 32px 18px 32px;border-radius:8px;max-width:98vw;max-height:90vh;overflow:auto;box-shadow:0 2px 16px #0003;position:relative;">
                                                    <div style="display:flex;justify-content:space-between;align-items:center;">
                                                        <h3 style="margin:0 0 0 0;font-size:20px;">${nombre}</h3>
                                                        <div style="display:flex;gap:10px;align-items:center;">
                                                            <button id="btn-ver-json" style="padding:2px 10px;font-size:13px;">Datos</button>
                                                            <button id="descargar-json" style="padding:2px 10px;font-size:13px;">Descargar</button>
                                                            <button id="cerrar-modal-datos" style="margin-left:8px;font-size:18px;padding:2px 10px;line-height:1;">&#10005;</button>
                                                        </div>
                                                    </div>
                                                    <div id="grafico-estacion" style="width:600px;max-width:90vw;height:320px;margin:18px auto 0 auto;"></div>
                                                    <div id="leyenda-grafico" style="position:absolute;top:18px;right:38px;z-index:2;"></div>
                                                </div>
                                            `;
                                            document.body.appendChild(modal);
                                            // Botón ver JSON
                                            document.getElementById('btn-ver-json').onclick = function() {
                                                window.open(url, '_blank');
                                            };
                                            document.getElementById('cerrar-modal-datos').onclick = function() {
                                                document.body.removeChild(modal);
                                            };
                                            // Botón descargar JSON a CSV
                                            document.getElementById('descargar-json').onclick = function() {
                                                // Construir CSV con columnas: Fecha, Hobs, Hsen, Precipitación
                                                let filas = [];
                                                filas.push('Fecha,Hobs,Hsen,Precipitación');
                                                // Unificar todas las fechas únicas y ordenarlas
                                                let fechasSet = new Set();
                                                if (data.Hobs && Array.isArray(data.Hobs.data)) {
                                                    data.Hobs.data.forEach(d => d.Fecha && !d.ultimo && fechasSet.add(d.Fecha));
                                                }
                                                if (data.Hsen && Array.isArray(data.Hsen.data)) {
                                                    data.Hsen.data.forEach(d => d.Fecha && !d.ultimo && fechasSet.add(d.Fecha));
                                                }
                                                if (data.Pobs && Array.isArray(data.Pobs.data)) {
                                                    data.Pobs.data.forEach(d => d.Fecha && !d.ultimo && fechasSet.add(d.Fecha));
                                                }
                                                let fechas = Array.from(fechasSet).sort();

                                                // Mapear valores por fecha
                                                let hobsMap = {};
                                                let hsenMap = {};
                                                let pobsMap = {};
                                                if (data.Hobs && Array.isArray(data.Hobs.data)) {
                                                    data.Hobs.data.forEach(d => { if (d.Fecha && !d.ultimo) hobsMap[d.Fecha] = d.Hobs; });
                                                }
                                                if (data.Hsen && Array.isArray(data.Hsen.data)) {
                                                    data.Hsen.data.forEach(d => { if (d.Fecha && !d.ultimo) hsenMap[d.Fecha] = d.Hsen; });
                                                }
                                                if (data.Pobs && Array.isArray(data.Pobs.data)) {
                                                    data.Pobs.data.forEach(d => { if (d.Fecha && !d.ultimo) pobsMap[d.Fecha] = d.Pobs; });
                                                }

                                                fechas.forEach(fecha => {
                                                    let hobs = hobsMap[fecha] !== undefined ? hobsMap[fecha] : '';
                                                    let hsen = hsenMap[fecha] !== undefined ? hsenMap[fecha] : '';
                                                    let pobs = pobsMap[fecha] !== undefined ? pobsMap[fecha] : '';
                                                    filas.push(`"${fecha}",${hobs},${hsen},${pobs}`);
                                                });

                                                let csv = filas.join('\n');
                                                const blob = new Blob([csv], {type: 'text/csv'});
                                                const a = document.createElement('a');
                                                a.href = URL.createObjectURL(blob);
                                                a.download = 'datos.csv';
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(a.href);
                                            };

                                            // --- Graficar ---
                                            let traces = [];
                                            if (hobsY.some(v => v !== null)) {
                                                traces.push({
                                                    x: fechas,
                                                    y: hobsY,
                                                    name: data.Hobs.label || 'Nivel Observado',
                                                    type: 'scatter',
                                                    mode: 'lines+markers',
                                                    line: { color: '#0077be' }
                                                });
                                            }
                                            if (hsenY.some(v => v !== null)) {
                                                traces.push({
                                                    x: fechas,
                                                    y: hsenY,
                                                    name: data.Hsen.label || 'Nivel Sensor',
                                                    type: 'scatter',
                                                    mode: 'lines+markers',
                                                    line: { color: '#e67e22', dash: 'dot' }
                                                });
                                            }
                                            if (pobsY.some(v => v !== null)) {
                                                traces.push({
                                                    x: fechas,
                                                    y: pobsY,
                                                    name: data.Pobs.label || 'Precipitación',
                                                    type: 'bar',
                                                    marker: { color: '#4ba3c7' },
                                                    yaxis: 'y2'
                                                });
                                            }

                                            // Espaciar etiquetas del eje X
                                            let tickvals = [];
                                            let step = Math.ceil(fechas.length / 8); // máximo 8 etiquetas
                                            for (let i = 0; i < fechas.length; i += step) {
                                                tickvals.push(fechas[i]);
                                            }

                                            let layout = {
                                                margin: { t: 30, b: 60, l: 50, r: 40 },
                                                legend: {
                                                    orientation: 'h',
                                                    x: 1,
                                                    y: 1.18,
                                                    xanchor: 'right',
                                                    yanchor: 'top',
                                                    font: { size: 13 }
                                                },
                                                xaxis: {
                                                    title: 'Fecha',
                                                    tickangle: -45,
                                                    automargin: true,
                                                    tickvals: tickvals,
                                                    tickformat: '%Y-%m-%d'
                                                },
                                                yaxis: { title: 'Nivel (m)' },
                                                title: '',
                                                autosize: true
                                            };
                                            if (traces.some(t => t.yaxis === 'y2')) {
                                                layout.yaxis2 = {
                                                    title: 'Precipitación (mm)',
                                                    overlaying: 'y',
                                                    side: 'right',
                                                    showgrid: false
                                                };
                                            }
                                            Plotly.newPlot('grafico-estacion', traces, layout, {responsive: true, displayModeBar: false});
                                        })
                                        .catch(() => {
                                            alert('No se pudieron obtener los datos externos.');
                                        });
                                };
                            }
                        });
                    }
                }).addTo(map);
            });
    } else {
        if (capaEstHidroIdeam) {
            map.removeLayer(capaEstHidroIdeam);
            capaEstHidroIdeam = null;
        }
    }
});



// Cargar la tabla json con los datos de series
fetch('tus_datos.json')
    .then(response => response.json())
    .then(data => {
        console.log('Cargando datos JSON...', performance.now());

        // Verificar estructura del JSON
        if (!data.series || !data.promMensual || !data.secoMensual) {
            console.error('Estructura del JSON incorrecta. Se esperaba: series, promMensual, secoMensual');
            alert('Error: El archivo JSON no tiene la estructura correcta.');
            return;
        }

        // Procesar series diarias (hoja principal)
        if (data.series.fechas && data.series.datos) {
            etiquetasTiempo = data.series.fechas;
            tablaDatos = data.series.datos;
            console.log(`Series diarias cargadas: ${etiquetasTiempo.length} fechas, ${Object.keys(tablaDatos).length} unidades`);
        } else {
            console.error('Faltan datos de series diarias en el JSON');
        }

        // Procesar datos mensuales año medio
        if (data.promMensual.meses && data.promMensual.datos) {
            window.tablaPromMensual = data.promMensual.datos;
            window.mesesProm = data.promMensual.meses;
            console.log(`Datos mensuales (año medio) cargados: ${window.mesesProm.length} meses, ${Object.keys(window.tablaPromMensual).length} unidades`);
        } else {
            console.error('Faltan datos de promedio mensual en el JSON');
        }

        // Procesar datos mensuales año seco
        if (data.secoMensual.meses && data.secoMensual.datos) {
            window.tablaSecoMensual = data.secoMensual.datos;
            window.mesesSeco = data.secoMensual.meses;
            console.log(`Datos mensuales (año seco) cargados: ${window.mesesSeco.length} meses, ${Object.keys(window.tablaSecoMensual).length} unidades`);
        } else {
            console.error('Faltan datos de año seco en el JSON');
        }

        // Mostrar información de carga
        const tiempoTotal = performance.now();
        console.log(`✅ Datos JSON cargados exitosamente en ${tiempoTotal.toFixed(0)}ms`);
        
        // Opcional: Mostrar estadísticas
        if (data.metadata) {
            console.log('Metadata:', data.metadata);
        }
        
        // Verificar consistencia de datos
        const unidadesSeriesDiarias = Object.keys(tablaDatos).length;
        const unidadesPromMensual = Object.keys(window.tablaPromMensual).length;
        const unidadesSecoMensual = Object.keys(window.tablaSecoMensual).length;
        
        if (unidadesSeriesDiarias !== unidadesPromMensual || unidadesSeriesDiarias !== unidadesSecoMensual) {
            console.warn(`⚠️ Inconsistencia en número de unidades: Diarias(${unidadesSeriesDiarias}), Prom(${unidadesPromMensual}), Seco(${unidadesSecoMensual})`);
        } else {
            console.log(`✅ Consistencia verificada: ${unidadesSeriesDiarias} unidades en todas las series`);
        }
        
    })
    .catch(error => {
        console.error('❌ Error cargando datos JSON:', error);
        alert('Error cargando los datos. Por favor recarga la página.');
    });

// cargar excel indicadores
fetch('indicadoresOH.xlsx')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        var data = new Uint8Array(buffer);
        var workbook = XLSX.read(data, { type: 'array' });
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        var json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Guarda los encabezados (nombres de las unidades)
        window.indicadoresOHHeaders = json[0].slice(1); // Quita la primera columna (nombre de la variable)
        // Guarda las variables por fila
        window.indicadoresOH = {
            CA_medio: json[3],   // Fila 5 (índice 4)
            OHD_medio: json[10], // Fila 12 (índice 11)
            CA_seco: json[4],    // Fila 6 (índice 5)
            OHD_seco: json[12],  // Fila 14 (índice 13)
            IUA_seco: json[48],  // Fila 48 (índice 47)
            IUA_medio: json[47], // Fila 49 (índice 48)
        };
    });


// Definir escala de colores para el mapa coroplético
function getColor(value) {
    return value > 3000 ? '#73b4ff' :
           value > 2500 ? '#4be600' :
           value > 2000 ? '#008732' :
           value > 1500 ? '#4be600' :
           value > 1000 ? '#a0ff73' :
           value > 800  ? '#ffff96' :
           value > 600  ? '#ffff00' :
           value > 400  ? '#ffcd00' :
           value > 300   ? '#ffb400' :
           value > 200   ? '#ff7800' :
           value > 100   ? '#ffff00' : '#ff0000';
}

// Definir escala de color para precipitación clasificada:
function getBlueGradient(gridcode) {
    // 22 tonos de azul de claro a oscuro (puedes ajustar los colores si lo deseas)
    const blues = [
        '#C2F0F3', '#B6E2F1', '#AAD3EF', '#9EC5EC', '#92B7EA', '#86A9E8',
        '#7A9BE6', '#6E8DE4', '#627FE2', '#5671E0', '#4A63DE', '#3E55DB',
        '#374DD7', '#3244D3', '#2C3CCF', '#2733CB', '#222AC7', '#1D22C3',
        '#1819BF', '#1310BB', '#0E08B7', '#3713A1'
    ];
    // gridcode debe estar entre 1 y 22
    let idx = Math.max(1, Math.min(22, gridcode)) - 1;
    return blues[idx];
}



// Custom Home button control (estilo sobrio tipo Leaflet, icono SVG más grande y fondo gris)
var homeControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function(map) {
        var container = L.DomUtil.create('a', 'leaflet-control-zoom leaflet-bar-part leaflet-control leaflet-control-custom');
        container.title = 'Vista inicial';
        // SVG de casa, puedes cambiar el tamaño (width/height) y el color (fill)
        container.innerHTML = `
<svg width="16" height="16" fill="#222" class="bi bi-house-door" viewBox="0 0 16 16">
  <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4z"/>
</svg>
        `;
        // Ajusta el fondo y el tamaño para que combine con los controles de zoom
        container.style.background = '#f4f4f4';
        container.style.border = '1px solid #bbb';
        container.style.width = '34px';
        container.style.height = '34px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.cursor = 'pointer';
        container.href = '#';
        container.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            map.setView([4.0925, -75.1545], 9);
        };
        return container;
    }
});
map.addControl(new homeControl());


// Custom Share Link button control
var shareLinkControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function(map) {
        var container = L.DomUtil.create('a', 'leaflet-control-zoom leaflet-bar-part leaflet-control leaflet-control-custom');
        container.title = 'Compartir vista actual';
        // SVG de enlace (link)
        container.innerHTML = `
<svg width="16" height="16" fill="#222" class="bi bi-link-45deg" viewBox="0 0 16 16">
  <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
  <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
</svg>
        `;
        container.style.background = '#f4f4f4';
        container.style.border = '1px solid #bbb';
        container.style.width = '34px';
        container.style.height = '34px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.cursor = 'pointer';
        container.href = '#';
        container.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            var center = map.getCenter();
            var zoom = map.getZoom();
            var url = `${window.location.origin}${window.location.pathname}?lat=${center.lat.toFixed(5)}&lng=${center.lng.toFixed(5)}&zoom=${zoom}`;
            navigator.clipboard.writeText(url).then(function() {
                container.title = "¡Enlace copiado!";
                setTimeout(() => container.title = "Compartir vista actual", 1500);
            });
        };
        return container;
    }
});
map.addControl(new shareLinkControl());

// Custom Search button control con input y autocompletado
map.whenReady(function() {
    var zoomContainer = document.querySelector('.leaflet-control-zoom');

    // Botón lupa
    var searchBtn = document.createElement('a');
    searchBtn.className = 'leaflet-control-zoom-in leaflet-control-custom';
    searchBtn.title = 'Buscar corriente';
    searchBtn.innerHTML = `
<svg width="18" height="18" fill="#222" viewBox="0 0 16 16">
  <circle cx="7" cy="7" r="5" stroke="#222" stroke-width="2" fill="none"/>
  <line x1="11" y1="11" x2="15" y2="15" stroke="#222" stroke-width="2"/>
</svg>
    `;
    searchBtn.style.background = '#f4f4f4';
    searchBtn.style.border = '1px solid #bbb';
    searchBtn.style.width = '34px';
    searchBtn.style.height = '34px';
    searchBtn.style.display = 'flex';
    searchBtn.style.alignItems = 'center';
    searchBtn.style.justifyContent = 'center';
    searchBtn.style.cursor = 'pointer';
    searchBtn.style.marginLeft = '8px'; // Espacio entre zoom y lupa
    searchBtn.href = '#';

    // Input de búsqueda (oculto por defecto)
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Buscar corriente...';
    input.style.display = 'none';
    input.style.height = '28px';
    input.style.margin = '0 4px';
    input.style.border = '1px solid #bbb';
    input.style.borderRadius = '3px';
    input.style.padding = '0 8px';
    input.style.fontSize = '14px';
    input.style.width = '180px';

    // Sugerencias
    var suggestionBox = document.createElement('div');
    suggestionBox.classList.add('search-suggestion-box');
    suggestionBox.style.position = 'absolute';
    suggestionBox.style.top = '38px';
    suggestionBox.style.left = '0';
    suggestionBox.style.width = '220px';
    suggestionBox.style.zIndex = '4000';
    suggestionBox.style.display = 'none';
    suggestionBox.style.maxHeight = '180px';
    suggestionBox.style.overflowY = 'auto';
    suggestionBox.style.boxShadow = '0 2px 6px rgba(0,0,0,0.10)';
    suggestionBox.style.background = '#e0e0e0';

    function showSuggestionBox() {
    // Asegura que el contenedor padre sea relativo
    zoomContainer.style.position = 'relative';
    // Calcula la posición y ancho del suggestionBox respecto al input
    suggestionBox.style.left = input.offsetLeft + 'px';
    suggestionBox.style.top = (input.offsetTop + input.offsetHeight + 2) + 'px';
    suggestionBox.style.width = input.offsetWidth + 'px';
    suggestionBox.style.display = 'block';
    }

    // Mostrar/ocultar input al hacer clic en la lupa
    searchBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        input.style.display = input.style.display === 'none' ? 'block' : 'none';
        if (input.style.display === 'block') {
            input.focus();
        } else {
            suggestionBox.style.display = 'none';
        }
    };

    // Desactivar zoom al pasar el mouse sobre input
    input.addEventListener('mouseenter', function() {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
            map.doubleClickZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            map.touchZoom.disable();
    });
    input.addEventListener('mouseleave', function() {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            map.touchZoom.enable();
    });

    // Sugerencias y lógica de búsqueda
    let mouseOverSuggestionBox = false;
    suggestionBox.addEventListener('mouseenter', function() {
        mouseOverSuggestionBox = true;
        map.scrollWheelZoom.disable();
    });
    suggestionBox.addEventListener('mouseleave', function() {
        mouseOverSuggestionBox = false;
        map.scrollWheelZoom.enable();
    });

    input.oninput = function() {
        var query = input.value.trim().toLowerCase();
        if (query.length < 3 || !window.geojsonFeatures) {
            suggestionBox.style.display = 'none';
            return;
        }
        var filtered = window.geojsonFeatures.filter(f =>
            (f.properties.Corriente && f.properties.Corriente.toLowerCase().includes(query)) ||
            (f.properties.Nombre_1 && f.properties.Nombre_1.toLowerCase().includes(query))
        );
        suggestionBox.innerHTML = '';
        if (filtered.length > 0) {
            filtered.forEach(function(feature) {
                var option = document.createElement('div');
                option.textContent =
                    (feature.properties.Nombre_1 || 'N/A') + ' > ' +
                    (feature.properties.Corriente || 'N/A') +
                    (feature.properties.Nombre_SZH ? ', ' + feature.properties.Nombre_SZH : '');
                option.style.padding = '6px 10px';
                option.style.cursor = 'pointer';
                option.onmouseover = function() { option.style.background = '#e0e0e0'; };
                option.onmouseout = function() { option.style.background = '#fff'; };
                option.onclick = function() {
                    var bounds = L.geoJSON(feature).getBounds();
                    map.fitBounds(bounds);
                    input.value = (feature.properties.Nombre_1 || 'N/A');
                    suggestionBox.style.display = 'none';
                    mostrarGrafico(feature);
                    // --- RESALTAR LA UNIDAD SELECCIONADA ---
                    if (window.selectedLayer) {
                        geojson.resetStyle(window.selectedLayer); // Quitar resaltado anterior
                    }
                    var highlight = {
                        weight: 5,
                        color: 'orange',
                        dashArray: '',
                        fillOpacity: 0.7
                    };
                    geojson.eachLayer(function(layer) {
                        // Puedes comparar por un identificador único, aquí se usa Nombre_1
                        if (
                            layer.feature &&
                            layer.feature.properties.Nombre_1 === feature.properties.Nombre_1
                        ) {
                            layer.setStyle(highlight);
                            window.selectedLayer = layer;
                        } else {
                            geojson.resetStyle(layer);
                        }
                    });
                    // Limpiar y ocultar input al mover el mouse en el mapa después de seleccionar
                    var limpiarInput = function() {
                        input.value = '';
                        input.style.display = 'none';
                        map.off('mousemove', limpiarInput); // Remueve el listener después de ejecutarse una vez
                    };
                    map.on('mousemove', limpiarInput);
                };
                suggestionBox.appendChild(option);
            });
            showSuggestionBox();
        } else {
            suggestionBox.innerHTML = '<div style="padding:6px 10px;color:#888;">No se encontraron resultados</div>';
            showSuggestionBox();
        }
    };

    input.onblur = function() {
        setTimeout(() => {
            if (!mouseOverSuggestionBox) {
                suggestionBox.style.display = 'none';
            }
        }, 5000);
    };

    // Inserta el botón y el input en la barra de zoom
    if (zoomContainer) {
        zoomContainer.appendChild(searchBtn);
        zoomContainer.appendChild(input);
        zoomContainer.appendChild(suggestionBox);
        // Ajusta el contenedor para que acepte elementos flexibles si lo deseas:
        zoomContainer.style.display = 'flex';
        zoomContainer.style.alignItems = 'center';
    }
});


// Add a custom control for displaying feature info
var infoControl = L.control({ position: 'topright' }); // Set position to 'topright'

infoControl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info-control'); // Create a div with a class "info-control"
    this._div.style.position = 'fixed';
    this._div.style.pointerEvents = 'none';
    this._div.style.background = 'rgba(255,255,255,0.97)';
    this._div.style.border = '1px solid #bbb';
    this._div.style.padding = '8px 14px';
    this._div.style.borderRadius = '6px';
    this._div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    this._div.style.fontSize = '14px';
    this._div.style.zIndex = 10001;
    this._div.style.display = 'none'; // Oculto por defecto
    return this._div;
};

// Method to update the control based on feature properties
infoControl.update = function (props) {
    this._div.innerHTML = props
        ? `<b>Subzona Hidrográfica:</b> ${props.Nombre_SZH || 'N/A'}<br>
           <b>Área:</b> ${props.Area_Km2 ? props.Area_Km2.toFixed(2) + ' km²' : 'N/A'}<br>
           <b>Escorrentía :</b> ${props.Escorr_Anual ? props.Escorr_Anual.toFixed(1) + ' mm/año' : 'N/A'}<br>
           <b>Caudal medio:</b> ${props.QMA ? props.QMA.toFixed(1) + ' m³/s' : 'N/A'}<br>
           <b>Caudal medio (Año húmedo):</b> ${props.QMAH ? props.QMAH.toFixed(1) + ' m³/s' : 'N/A'}<br>
           <b>Caudal medio (Año seco):</b> ${props.QMAS ? props.QMAS.toFixed(1) + ' m³/s' : 'N/A'}`
        : '';
};

//<b>Fuente Hídrica:</b> ${props.Corriente || 'N/A'}<br>

// Add the control to the map
//infoControl.addTo(map);

// Add a custom control to display cursor lat, lon, and scale
var cursorInfoControl = L.control({ position: 'bottomleft' });

cursorInfoControl.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'cursor-info-control');
    this.update();
    return this._div;
};

cursorInfoControl.update = function (lat, lon) {
    this._div.innerHTML = lat && lon
        ? `<b>Lat:</b> ${lat.toFixed(5)} <b>Lon:</b> ${lon.toFixed(5)}`
        : 'Mueva el cursor sobre el mapa';
};

// Add the control to the map
cursorInfoControl.addTo(map);

// Add a bar scale to the map
L.control.scale({
    position: 'bottomleft', // Position of the scale
    metric: true,            // Display metric units (e.g., kilometers)
    imperial: false          // Do not display imperial units (e.g., miles)
}).addTo(map);

// Update cursor info on mousemove
map.on('mousemove', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    cursorInfoControl.update(lat, lon); // Update with only lat and lon
});

// Clear cursor info when the mouse leaves the map
map.on('mouseout', function () {
    cursorInfoControl.update();
});



// Cargar GeoJSON con los features
fetch('tus_datos.geojson')
    .then(response => response.json())
    .then(data => {
        window.geojsonFeatures = data.features; // Guarda los features globalmente
        geojson = L.geoJSON(data, { // <-- Asignación a la variable global
            style: function(feature) {
                return {
                    fillColor: mostrarRellenoUnidades ? getColor(feature.properties.Escorr_Anual) : 'transparent',
                    weight: 2,
                    opacity: 1,
                    color: '#b04a6a', // Vinotinto suave para unidades hidrológicas
                    dashArray: '',
                    fillOpacity: mostrarRellenoUnidades ? 0.7 : 0 // Solo relleno si está activo
                };
            },
            onEachFeature: function (feature, layer) {
                layer.on({
                    mouseover: function (e) {
                        if (mostrarUnidadesHidro || mostrarRellenoUnidades) {
                            var layer = e.target;
                            layer.setStyle({
                                weight: 5,
                                color: 'grey',
                                dashArray: '',
                                fillOpacity: 0.7
                            });
                            layer.bringToFront();
                            // Mostrar infoControl flotante
                            if (!infoControl._map) infoControl.addTo(map);
                            infoControl.update(feature.properties);
                            infoControl._div.style.display = 'block';
                            // Posiciona el infoControl cerca del mouse
                            infoControl._div.style.left = (e.originalEvent.clientX + 20) + 'px';
                            infoControl._div.style.top = (e.originalEvent.clientY + 15) + 'px';

                            // Mostrar tooltip con el nombre de la unidad
                            unidadTooltip.textContent = feature.properties.Nombre_1 || 'Sin nombre';
                            unidadTooltip.style.display = 'block';
                        }
                    },
                    mousemove: function (e) {
                        if (mostrarUnidadesHidro || mostrarRellenoUnidades) {
                            unidadTooltip.style.left = (e.originalEvent.clientX + 15) + 'px';
                            unidadTooltip.style.top = (e.originalEvent.clientY + 10) + 'px';
                            // Mueve el infoControl con el mouse
                            if (infoControl._div) {
                                infoControl._div.style.left = (e.originalEvent.clientX + 20) + 'px';
                                infoControl._div.style.top = (e.originalEvent.clientY + 15) + 'px';
                            }
                        }
                    },
                    mouseout: function (e) {
                        if (mostrarUnidadesHidro || mostrarRellenoUnidades) {
                            geojson.resetStyle(e.target);
                            if (infoControl._div) infoControl._div.style.display = 'none';
                            unidadTooltip.style.display = 'none';
                            selectedFeature = null;
                            selectedLayer = null;
                        }
                    },
                    click: function (e) {
                        if (mostrarUnidadesHidro || mostrarRellenoUnidades) {
                            var bounds = e.target.getBounds();
                            var targetZoom = map.getBoundsZoom(bounds) - 2;
                            map.setView(bounds.getCenter(), targetZoom);
                            mostrarGrafico(feature);

                            // Guardar el feature y layer seleccionados
                            selectedFeature = feature;
                            selectedLayer = e.target;

                            // Calcular posición relativa al mapa
                            const center = bounds.getCenter();
                            const point = map.latLngToContainerPoint(center);

                            // Posicionar tooltip
                            unidadTooltip.textContent = feature.properties.Nombre_1 || 'Sin nombre';
                            unidadTooltip.style.display = 'block';
                            unidadTooltip.style.left = (point.x + 15) + 'px';
                            unidadTooltip.style.top = (point.y + 10) + 'px';

                            // Posicionar infoControl
                            if (!infoControl._map) infoControl.addTo(map);
                            infoControl.update(feature.properties);
                            infoControl._div.style.display = 'block';
                            infoControl._div.style.left = (point.x + 20) + 'px';
                            infoControl._div.style.top = (point.y + 15) + 'px';
                        }
                    }
                });
            }
        });
    });

// actualiza la posición del tooltip y del infoControl al mover el mapa si hay una unidad seleccionada
map.on('move', function () {
    if (selectedFeature && selectedLayer) {
        const bounds = selectedLayer.getBounds();
        const center = bounds.getCenter();
        const point = map.latLngToContainerPoint(center);

        // Actualiza tooltip
        unidadTooltip.style.left = (point.x + 15) + 'px';
        unidadTooltip.style.top = (point.y + 10) + 'px';

        // Actualiza infoControl
        if (infoControl._div) {
            infoControl._div.style.left = (point.x + 20) + 'px';
            infoControl._div.style.top = (point.y + 40) + 'px';
        }
    }
});
    
// Listener para Subzonas Hidrográficas (capa adicional)
document.getElementById('chk-subzonas').addEventListener('change', function(e) {
    if (this.checked) {
        fetch('SZH_Tolima.geojson')
            .then(resp => resp.json())
            .then(data => {
                capaSubzonas = L.geoJSON(data, {
                    style: {
                        color: '#800020', // Vinotinto
                        weight: 2,
                        fillColor: 'transparent',
                        fillOpacity: 0
                    }
                }).addTo(map);
                // Asegura que quede debajo de la capa principal de unidades
                if (geojson) capaSubzonas.bringToBack();
            });
    } else {
        if (capaSubzonas) {
            map.removeLayer(capaSubzonas);
            capaSubzonas = null;
        }
    }
});

// Listener para Drenajes (capa adicional)
document.getElementById('chk-drenajes').addEventListener('change', function(e) {
    if (this.checked) {
        fetch('Drenc.geojson')
            .then(resp => resp.json())
            .then(data => {
                capaDrenajes = L.geoJSON(data, {
                    style: {
                        color: '#0077be', // Azul para drenajes, puedes cambiar el color
                        weight: 2
                    },
                    onEachFeature: function(feature, layer) {
                        const props = feature.properties || {};
                        const nombre = props.NOMBRE_GEO && props.NOMBRE_GEO.trim() !== '' ? props.NOMBRE_GEO : 'innominado';
                        const cod = props.COD_CUENCA && props.COD_CUENCA.trim() !== '' ? props.COD_CUENCA : 'no codificado';
                        layer.bindPopup(
                            `<b>Nombre:</b> ${nombre}<br><b>Código cuenca:</b> ${cod}`
                        );
                    }
                }).addTo(map);
                // Asegura que quede debajo de la capa principal de unidades
                if (geojson) capaDrenajes.bringToFront();
            });
    } else {
        if (capaDrenajes) {
            map.removeLayer(capaDrenajes);
            capaDrenajes = null;
        }
    }
});

// Función auxiliar para restaurar info general
function restaurarInfoGeneral() {
    if (typeof mostrarInfoProyecto === 'function') {
        mostrarInfoProyecto();
    } else {
        lateralPanel.innerHTML = '<p style="padding:20px;text-align:center;">Información del proyecto no disponible</p>';
    }
}

// Listener para Unidades hidrológicas (MEJORADO)
document.getElementById('chk-unidades-hidro').addEventListener('change', function(e) {
    mostrarUnidadesHidro = this.checked;
    if (mostrarUnidadesHidro || mostrarRellenoUnidades) {
        if (geojson && !map.hasLayer(geojson)) {
            geojson.addTo(map);
        }
    } else {
        if (geojson && map.hasLayer(geojson)) {
            map.removeLayer(geojson);
        }
        // MEJORAR: Solo limpiar si hay una unidad seleccionada, sino restaurar info general
        if (window.selectedFeature) {
            // Hay una unidad seleccionada, limpiar selección
            window.selectedFeature = null;
            window.selectedLayer = null;
            if (infoControl && infoControl._div) {
                infoControl._div.style.display = 'none';
            }
            if (typeof unidadTooltip !== 'undefined') {
                unidadTooltip.style.display = 'none';
            }
        }
        // Restaurar información general
        restaurarInfoGeneral();
    }
    if (geojson) {
        geojson.setStyle(function(feature) {
            return {
                fillColor: mostrarRellenoUnidades ? getColor(feature.properties.Escorr_Anual) : 'transparent',
                weight: 2,
                opacity: 1,
                color: '#b04a6a',
                dashArray: '',
                fillOpacity: mostrarRellenoUnidades ? 0.7 : 0
            };
        });
    }
});

// Listener para Escorrentía (MEJORADO)
document.getElementById('chk-escorr').addEventListener('change', function(e) {
    mostrarRellenoUnidades = this.checked;
    if (mostrarUnidadesHidro || mostrarRellenoUnidades) {
        if (geojson && !map.hasLayer(geojson)) {
            geojson.addTo(map);
        }
    } else {
        if (geojson && map.hasLayer(geojson)) {
            map.removeLayer(geojson);
        }
        // MEJORAR: Solo limpiar si hay una unidad seleccionada, sino restaurar info general
        if (window.selectedFeature) {
            // Hay una unidad seleccionada, limpiar selección
            window.selectedFeature = null;
            window.selectedLayer = null;
            if (infoControl && infoControl._div) {
                infoControl._div.style.display = 'none';
            }
            if (typeof unidadTooltip !== 'undefined') {
                unidadTooltip.style.display = 'none';
            }
        }
        // Restaurar información general
        restaurarInfoGeneral();
    }
    if (geojson) {
        geojson.setStyle(function(feature) {
            return {
                fillColor: mostrarRellenoUnidades ? getColor(feature.properties.Escorr_Anual) : 'transparent',
                weight: 2,
                opacity: 1,
                color: '#b04a6a',
                dashArray: '',
                fillOpacity: mostrarRellenoUnidades ? 0.7 : 0
            };
        });
    }
});


// Listener para Municipios (capa adicional)
document.getElementById('chk-municipios').addEventListener('change', function(e) {
    if (this.checked) {
        fetch('LM_Tolima.geojson')
            .then(resp => resp.json())
            .then(data => {
                capaMunicipios = L.geoJSON(data, {
                    style: {
                        color: '#444',
                        weight: 2,
                        fillColor: 'transparent',
                        fillOpacity: 0
                    },
                    onEachFeature: function(feature, layer) {
                        layer.on('mouseover', function(e) {
                            layer.setStyle({
                                weight: 3,
                                color: '#ff6600',
                                fillOpacity: 0.4
                            });
                            layer.bindTooltip(
                                `<div style="font-size:14px;font-weight:bold;color:#fff;background:#ff6600;padding:6px 16px;border-radius:8px;box-shadow:0 2px 8px #0006;">
                                    ${feature.properties.MPIO_CNMBR || feature.properties.nombre || 'Municipio'}
                                </div>`,
                                {permanent: false, direction: 'center', className: 'custom-muni-tooltip'}
                            ).openTooltip(e.latlng);
                        });
                        layer.on('mouseout', function(e) {
                            capaMunicipios.resetStyle(layer);
                            layer.closeTooltip();
                        });
                    }
                }).addTo(map);
                 // Deshabilitar la selección visual después de crear la capa
                capaMunicipios.eachLayer(function(layer) {
                    if (layer._path) {
                        layer._path.style.outline = 'none';
                        layer._path.style.border = 'none';
                        layer._path.setAttribute('pointer-events', 'visiblePainted');
                    }
                });
            });
    } else {
        if (capaMunicipios) {
            map.removeLayer(capaMunicipios);
            capaMunicipios = null;
        }
    }
});


// Load the Tolima GeoJSON and apply masking
fetch('tolima.geojson')
    .then(response => response.json())
    .then(tolimaData => {
        // Create a MultiPolygon for the world with a hole for Tolima
        const worldWithHole = {
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: [
                    // Outer rectangle (entire world)
                    [[
                        [-180, -90],
                        [-180, 90],
                        [180, 90],
                        [180, -90],
                        [-180, -90]
                    ]],
                    // Inner hole (Tolima region)
                    ...tolimaData.features.map(feature => feature.geometry.coordinates)
                ]
            }
        };

        // Add the gray mask with the hole
        const worldMaskLayer = L.geoJSON(worldWithHole, {
            style: {
                color: 'gray',
                weight: 0,
                fillColor: 'gray',
                fillOpacity: 0.8 // Reduced opacity for the rest of the world
            },
            interactive: false // Prevent interaction with the mask
        }).addTo(map);

        // Add the Tolima region with transparent fill to show the basemap
        const tolimaBorderLayer = L.geoJSON(tolimaData, {
            style: {
                color: 'black', // Border color
                weight: 2, // Border thickness
                fillColor: 'transparent', // Transparent fill to show the basemap
                fillOpacity: 0 // Ensure no fill opacity
            },
            interactive: false // Prevent interaction with the border
        }).addTo(map);

        // Configurar z-index y orden de capas
        worldMaskLayer.setZIndex(1);
        tolimaBorderLayer.setZIndex(2);
    });


function obtenerCentroide(feature) {
    if (feature.geometry.type === "Point") {
        return [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
    } else if (feature.geometry.type === "Polygon") {
        return [feature.geometry.coordinates[0][0][1], feature.geometry.coordinates[0][0][0]];
    } else if (feature.geometry.type === "MultiPolygon") {
        return [feature.geometry.coordinates[0][0][0][1], feature.geometry.coordinates[0][0][0][0]];
    }
    return null;
}


// Reference the existing lateral panel from index.html
var lateralPanel = document.getElementById('lateral-panel');
lateralPanel.style.overflowX = 'auto';
lateralPanel.style.overflowY = 'auto';
lateralPanel.style.boxSizing = 'border-box';

// Remove unnecessary map container adjustments
var mapContainer = document.getElementById('map');
mapContainer.style.position = 'absolute';
mapContainer.style.top = '50px'; // Leave space for the title
mapContainer.style.left = '0';
mapContainer.style.width = '100%'; // Always use full width
mapContainer.style.height = 'calc(100% - 50px)'; // Adjust height to account for the title

// Adjust the map and lateral panel dynamically based on screen size
function adjustLayout() {
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');
    const headerHeight = header ? header.offsetHeight : 50;
    const footerHeight = footer ? footer.offsetHeight : 50;

    // Detecta orientación vertical (retrato)
    const isPortrait = window.innerHeight >= window.innerWidth;

    if (isPortrait) {
        // Panel abajo, ocupa 40% de alto
        lateralPanel.style.position = 'fixed';
        lateralPanel.style.left = '0';
        lateralPanel.style.right = '0';
        lateralPanel.style.bottom = '0';
        lateralPanel.style.top = 'auto';
        lateralPanel.style.width = '100vw';
        lateralPanel.style.height = '40vh';
        lateralPanel.style.maxHeight = '60vh';
        lateralPanel.style.zIndex = '2000';
        lateralPanel.style.borderLeft = 'none';
        lateralPanel.style.borderTop = '2px solid #bbb';
        lateralPanel.style.borderRight = 'none';
        lateralPanel.style.borderBottom = 'none';
        lateralPanel.style.zIndex = '1'; // que sea menor que el menú nav

        mapContainer.style.position = 'absolute';
        mapContainer.style.top = headerHeight + 'px';
        mapContainer.style.left = '0';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = `calc(100vh - ${headerHeight + footerHeight}px - 40vh)`;
    } else {
        // Panel lateral derecho, ocupa 33% de ancho y toda la altura entre header y footer
        lateralPanel.style.position = 'fixed';
        lateralPanel.style.top = headerHeight + 'px';
        lateralPanel.style.right = '0';
        lateralPanel.style.bottom = footerHeight + 'px';
        lateralPanel.style.left = 'auto';
        lateralPanel.style.width = '33vw';
        lateralPanel.style.height = `calc(100vh - ${headerHeight + footerHeight}px)`;
        lateralPanel.style.zIndex = '2000';
        lateralPanel.style.borderLeft = '2px solid #bbb';
        lateralPanel.style.borderTop = 'none';
        lateralPanel.style.borderRight = 'none';
        lateralPanel.style.borderBottom = 'none';
        lateralPanel.style.zIndex = '1'; // que sea menor que el menú nav

        mapContainer.style.position = 'absolute';
        mapContainer.style.top = headerHeight + 'px';
        mapContainer.style.left = '0';
        mapContainer.style.width = '67vw';
        mapContainer.style.height = `calc(100vh - ${headerHeight + footerHeight}px)`;
    }
    map.invalidateSize();
}

// Add event listener to adjust layout on window resize
window.addEventListener('resize', adjustLayout);

// Call adjustLayout initially to set the correct layout
adjustLayout();

/*
function excelDateToISO(excelDate) {
    // Excel date: días desde 1899-12-31, pero Excel considera 1900 como año bisiesto (error histórico)
    // Por eso, hay que restar 25569 para obtener días desde 1970-01-01 (Unix epoch)
    // Y multiplicar por 86400*1000 para obtener milisegundos
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    // Devuelve solo la fecha en formato ISO (YYYY-MM-DD)
    return date.toISOString().slice(0, 10);
}
*/

function mostrarGrafico(feature) {
    var id = String(feature.properties.Nombre_1).trim();
    var series = tablaDatos[id] || [];
    if (series.length === 0) {
        alert("No hay datos para este feature.");
        return;
    }

    // Convierte etiquetasTiempo (números Excel) a fechas ISO
    const fechasISO = etiquetasTiempo;

    // Limpia el panel y agrega el título
    lateralPanel.innerHTML = '';
    lateralPanel.style.padding = '18px 12px 12px 12px';

    // Nombre de la unidad de análisis arriba, centrado y en negrita
    let unidadDiv = document.createElement('div');
    unidadDiv.textContent = id;
    unidadDiv.style.fontWeight = 'bold';
    unidadDiv.style.fontSize = '18px';
    unidadDiv.style.textAlign = 'center';
    unidadDiv.style.marginBottom = '4px';
    lateralPanel.appendChild(unidadDiv);

    // Contenedor para la gráfica con 84% del ancho y centrado (8% padding a cada lado)
    let plotContainer = document.createElement('div');
    plotContainer.style.width = '84%';
    plotContainer.style.margin = '0 auto';
    plotContainer.style.minWidth = '220px'; // Opcional: mínimo para móviles
    plotContainer.style.height = '340px';   // Ajusta según prefieras
    lateralPanel.appendChild(plotContainer);

    var trace = {
        x: fechasISO,
        y: series,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'blue' },
        hovertemplate: '%{y:.2f}  m³/s<extra></extra>' // Muestra solo el valor con 2 decimales
    };

    var layout = {
        margin: { t: 40, b: 60, l: 50, r: 10 },
        title: {
            text: 'Oferta Hídrica Total Simulada (m³/s)',
            font: { size: 16 },
            xref: 'paper',
            x: 0.5,
            y: 0.95,
            yanchor: 'top'
        },
        xaxis: {
            title: 'Fecha',
            type: 'date',
            tickformat: '%Y-%m-%d',
            tickangle: -45,
            automargin: true,
            nticks: 10
        },
        yaxis: {
            title: 'Caudal (m³/s)',
            automargin: true
        }
    };

    Plotly.newPlot(plotContainer, [trace], layout, {responsive: true, displayModeBar: false});
    lateralPanel.style.display = 'block';

    // Gráficas adicionales: Oferta Total Mensual (Año Medio) y (Año Seco)
    if (window.tablaPromMensual && window.tablaSecoMensual) {
        // Contenedor flex para las dos gráficas
        let flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.justifyContent = 'space-between';
        flexContainer.style.gap = '12px';
        flexContainer.style.marginTop = '28px';

        // Oferta Total Mensual (Año Medio)
        let promDiv = document.createElement('div');
        promDiv.style.flex = '1';
        promDiv.style.background = '#fff';
        promDiv.style.borderRadius = '8px';
        promDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
        promDiv.style.padding = '6px 2px 2px 2px';
        let promTitle = document.createElement('div');
        promTitle.textContent = 'Oferta Total Mensual (Año Medio)';
        promTitle.style.textAlign = 'center';
        promTitle.style.fontWeight = 'bold';
        promTitle.style.fontSize = '15px';
        promTitle.style.marginBottom = '4px';
        promDiv.appendChild(promTitle);
        let promGraph = document.createElement('div');
        promGraph.style.height = '180px';
        promDiv.appendChild(promGraph);

        // Oferta Total Mensual (Año Seco)
        let secoDiv = document.createElement('div');
        secoDiv.style.flex = '1';
        secoDiv.style.background = '#fff';
        secoDiv.style.borderRadius = '8px';
        secoDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
        secoDiv.style.padding = '6px 2px 2px 2px';
        let secoTitle = document.createElement('div');
        secoTitle.textContent = 'Oferta Total Mensual (Año Seco)';
        secoTitle.style.textAlign = 'center';
        secoTitle.style.fontWeight = 'bold';
        secoTitle.style.fontSize = '15px';
        secoTitle.style.marginBottom = '4px';
        secoDiv.appendChild(secoTitle);
        let secoGraph = document.createElement('div');
        secoGraph.style.height = '180px';
        secoDiv.appendChild(secoGraph);

        flexContainer.appendChild(promDiv);
        flexContainer.appendChild(secoDiv);
        lateralPanel.appendChild(flexContainer);

        // Datos para la unidad seleccionada
        let promData = window.tablaPromMensual[id] || [];
        let secoData = window.tablaSecoMensual[id] || [];
        let meses = window.mesesProm || ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

        Plotly.newPlot(promGraph, [{
            x: meses,
            y: promData,
            type: 'bar',
            marker: { color: '#4ba3c7' },
            hovertemplate: '%{y:.2f} m³/s<extra></extra>'
        }], {
            margin: { t: 18, b: 50, l: 40, r: 10 },
            xaxis: { title: 'Mes' },
            yaxis: { title: 'm³/s' }
        }, {responsive: true, displayModeBar: false});

        Plotly.newPlot(secoGraph, [{
            x: meses,
            y: secoData,
            type: 'bar',
            marker: { color: '#f5b041' },
            hovertemplate: '%{y:.2f}  m³/s<extra></extra>'
        }], {
            margin: { t: 18, b: 50, l: 40, r: 10 },
            xaxis: { title: 'Mes' },
            yaxis: { title: 'm³/s' }
        }, {responsive: true, displayModeBar: false});
    }

    if (window.indicadoresOHHeaders && window.indicadoresOH) {
        const idx = window.indicadoresOHHeaders.findIndex(h => h.trim() === id.trim());
        if (idx !== -1) {
            // Valores originales en m³/s
            const CA_medio = Number(window.indicadoresOH.CA_medio[idx + 1]);
            const OHD_medio = Number(window.indicadoresOH.OHD_medio[idx + 1]);
            const CA_seco = Number(window.indicadoresOH.CA_seco[idx + 1]);
            const OHD_seco = Number(window.indicadoresOH.OHD_seco[idx + 1]);
            const IUA_medio = window.indicadoresOH.IUA_medio[idx + 1];
            const IUA_seco = window.indicadoresOH.IUA_seco[idx + 1];

            // Calcular porcentajes
            const totalMedio = CA_medio + OHD_medio;
            const totalSeco = CA_seco + OHD_seco;
            const CA_medio_pct = totalMedio > 0 ? (CA_medio / totalMedio) * 100 : 0;
            const OHD_medio_pct = totalMedio > 0 ? (OHD_medio / totalMedio) * 100 : 0;
            const CA_seco_pct = totalSeco > 0 ? (CA_seco / totalSeco) * 100 : 0;
            const OHD_seco_pct = totalSeco > 0 ? (OHD_seco / totalSeco) * 100 : 0;

            // Contenedor para la gráfica de indicadores
            let ohDiv = document.createElement('div');
            ohDiv.style.width = '92%';
            ohDiv.style.margin = '28px auto 0 auto';
            ohDiv.style.background = '#fff';
            ohDiv.style.borderRadius = '8px';
            ohDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
            ohDiv.style.padding = '8px 2px 2px 2px';
            lateralPanel.appendChild(ohDiv);

            // Título
            let ohTitle = document.createElement('div');
            ohTitle.textContent = 'Indicadores Oferta Hídrica';
            ohTitle.style.textAlign = 'center';
            ohTitle.style.fontWeight = 'bold';
            ohTitle.style.fontSize = '16px';
            ohTitle.style.marginBottom = '4px';
            ohDiv.appendChild(ohTitle);

            // Gráfica apilada (porcentaje)
            let ohGraph = document.createElement('div');
            ohGraph.style.height = '180px';
            ohDiv.appendChild(ohGraph);

            Plotly.newPlot(ohGraph, [
                {
                    name: 'OHD (Año Medio)',
                    x: ['Año Medio'],
                    y: [OHD_medio_pct],
                    type: 'bar',
                    marker: { color: '#4ba3c7' },
                    hovertemplate: 'OHD: %{y:.2f}%<br>Valor: ' + OHD_medio.toFixed(2) + ' m³/s<extra></extra>'
                },
                {
                    name: 'CA (Año Medio)',
                    x: ['Año Medio'],
                    y: [CA_medio_pct],
                    type: 'bar',
                    marker: { color: '#f5b041' },
                    hovertemplate: 'CA: %{y:.2f}%<br>Valor: ' + CA_medio.toFixed(2) + ' m³/s<extra></extra>'
                },
                {
                    name: 'OHD (Año Seco)',
                    x: ['Año Seco'],
                    y: [OHD_seco_pct],
                    type: 'bar',
                    marker: { color: '#2980b9' },
                    hovertemplate: 'OHD Seco: %{y:.2f}%<br>Valor: ' + OHD_seco.toFixed(2) + ' m³/s<extra></extra>'
                },
                {
                    name: 'CA (Año Seco)',
                    x: ['Año Seco'],
                    y: [CA_seco_pct],
                    type: 'bar',
                    marker: { color: '#b9770e' },
                    hovertemplate: 'CA Seco: %{y:.2f}%<br>Valor: ' + CA_seco.toFixed(2) + ' m³/s<extra></extra>'
                }
            ], {
                barmode: 'stack',
                margin: { t: 24, b: 30, l: 40, r: 10 },
                xaxis: { title: '', tickfont: { size: 13 } },
                yaxis: { title: 'Porcentaje (%)', range: [0, 100] },
                legend: { orientation: 'h', y: -0.2 },
                showlegend: true,
                title: { text: 'Distribución OHD y CA', font: { size: 15 } }
            }, {responsive: true, displayModeBar: false});

            // Valor IUA año medio
            let iuaMedioDiv = document.createElement('div');
            iuaMedioDiv.innerHTML = `<b>IUA (Año Medio):</b> <span style="color:#2980b9;font-size:18px;font-weight:bold;">${IUA_medio}</span>`;
            iuaMedioDiv.style.textAlign = 'center';
            iuaMedioDiv.style.margin = '14px 0 4px 0';
            ohDiv.appendChild(iuaMedioDiv);

            // Valor IUA año seco
            let iuaSecoDiv = document.createElement('div');
            iuaSecoDiv.innerHTML = `<b>IUA (Año Seco):</b> <span style="color:#b9770e;font-size:18px;font-weight:bold;">${IUA_seco}</span>`;
            iuaSecoDiv.style.textAlign = 'center';
            iuaSecoDiv.style.margin = '4px 0 0 0';
            ohDiv.appendChild(iuaSecoDiv);
        }
    }

    // --- Botones de descarga ---
    let btnsDiv = document.createElement('div');
    btnsDiv.style.display = 'flex';
    btnsDiv.style.justifyContent = 'center';
    btnsDiv.style.gap = '12px';
    btnsDiv.style.margin = '22px 0 0 0';

    // Botón CSV
    let btnCSV = document.createElement('button');
    btnCSV.textContent = 'Descargar datos (CSV)';
    btnCSV.onclick = function() {
        let csv = '';

        // Serie diaria
        csv += 'Fecha,Oferta Hídrica Total Simulada (m³/s)\n';
        fechasISO.forEach((fecha, i) => {
            csv += `${fecha},${series[i] !== undefined ? series[i].toFixed(2) : ''}\n`;
        });
        csv += '\n';

        // Oferta Total Mensual (Año Medio)
        if (window.tablaPromMensual && window.tablaPromMensual[id]) {
            csv += 'Mes,Oferta Total Mensual (Año Medio) (m³/s)\n';
            (window.mesesProm || []).forEach((mes, i) => {
                csv += `${mes},${window.tablaPromMensual[id][i] !== undefined ? window.tablaPromMensual[id][i].toFixed(2) : ''}\n`;
            });
            csv += '\n';
        }

        // Oferta Total Mensual (Año Seco)
        if (window.tablaSecoMensual && window.tablaSecoMensual[id]) {
            csv += 'Mes,Oferta Total Mensual (Año Seco) (m³/s)\n';
            (window.mesesSeco || []).forEach((mes, i) => {
                csv += `${mes},${window.tablaSecoMensual[id][i] !== undefined ? window.tablaSecoMensual[id][i].toFixed(2) : ''}\n`;
            });
            csv += '\n';
        }

        // Indicadores OH
        if (window.indicadoresOHHeaders && window.indicadoresOH) {
            const idx = window.indicadoresOHHeaders.findIndex(h => h.trim() === id.trim());
            if (idx !== -1) {
                const CA_medio = Number(window.indicadoresOH.CA_medio[idx + 1]);
                const OHD_medio = Number(window.indicadoresOH.OHD_medio[idx + 1]);
                const CA_seco = Number(window.indicadoresOH.CA_seco[idx + 1]);
                const OHD_seco = Number(window.indicadoresOH.OHD_seco[idx + 1]);
                const IUA_medio = window.indicadoresOH.IUA_medio[idx + 1];
                const IUA_seco = window.indicadoresOH.IUA_seco[idx + 1];
                csv += 'Indicador,Valor (m³/s)\n';
                csv += `OHD (Año Medio),${OHD_medio}\n`;
                csv += `CA (Año Medio),${CA_medio}\n`;
                csv += `OHD (Año Seco),${OHD_seco}\n`;
                csv += `CA (Año Seco),${CA_seco}\n`;
                csv += `IUA (Año Medio),${IUA_medio}\n`;
                csv += `IUA (Año Seco),${IUA_seco}\n`;
            }
        }

        let blob = new Blob([csv], {type: 'text/csv'});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = `datos_${id.replace(/\s+/g, '_')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Botón Imagen
    let btnIMG = document.createElement('button');
    btnIMG.textContent = 'Descargar panel (PNG)';
    btnIMG.onclick = function() {
        html2canvas(lateralPanel, {
            backgroundColor: '#fff'
        }).then(function(canvas) {
            let link = document.createElement('a');
            link.download = `panel_${id.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    };

    btnsDiv.appendChild(btnCSV);
    btnsDiv.appendChild(btnIMG);
    lateralPanel.appendChild(btnsDiv);

}

// Función auxiliar para verificar si un punto está dentro de un polígono (punto-en-polígono)
function puntoEnPoligono(punto, poligono) {
    let x = punto[0], y = punto[1];
    let inside = false;
    
    let coords;
    if (poligono.type === 'Polygon') {
        coords = poligono.coordinates[0];
    } else if (poligono.type === 'MultiPolygon') {
        for (let poly of poligono.coordinates) {
            coords = poly[0];
            if (verificarPuntoEnCoords(x, y, coords)) {
                return true;
            }
        }
        return false;
    } else {
        return false;
    }
    
    return verificarPuntoEnCoords(x, y, coords);
}

function verificarPuntoEnCoords(x, y, coords) {
    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
        let xi = coords[i][0], yi = coords[i][1];
        let xj = coords[j][0], yj = coords[j][1];
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

// listener para precipitación 1km
document.getElementById('chk-precip-nc').addEventListener('change', function(e) {
    if (this.checked) {
        // Asegura que geojson esté en el mapa para consultas de unidad/subzona
        if (geojson && !map.hasLayer(geojson)) {
            geojson.addTo(map);
            geojson.setStyle({
                fillColor: 'transparent',
                color: 'transparent',
                weight: 0,
                fillOpacity: 0
            });
        }
        
        // Cargar capas en orden específico y con z-index
        Promise.all([
            fetch('ClassPrec_anual.geojson').then(resp => resp.json()),
            fetch('mallaPrecT.geojson').then(resp => resp.json()),
            !capaMunicipiosTransp ? fetch('LM_Tolima.geojson').then(resp => resp.json()) : Promise.resolve(null)
        ]).then(([precipClasData, mallaPrecData, municipiosData]) => {
            
            // 1. Capa de precipitación clasificada (visual)
            capaPrec1kClass = L.geoJSON(precipClasData, {
                style: function(feature) {
                    return {
                        color: 'transparent',
                        weight: 0,
                        fillColor: getBlueGradient(feature.properties.gridcode),
                        fillOpacity: 0.7
                    };
                },
                interactive: false, // ← No necesita interactividad
                pane: 'overlayPane' // ← Asegurar que esté en el pane correcto
            }).addTo(map);
            
            // Configurar z-index
            if (capaPrec1kClass.setZIndex) {
                capaPrec1kClass.setZIndex(10);
            }

            // 2. Cargar municipios transparentes si no existen
            if (municipiosData && !capaMunicipiosTransp) {
                capaMunicipiosTransp = L.geoJSON(municipiosData, {
                    style: {
                        color: 'transparent',
                        weight: 0,
                        fillColor: 'transparent',
                        fillOpacity: 0
                    },
                    interactive: false // ← Solo para consulta, no interactivo
                }).addTo(map);
                
                if (capaMunicipiosTransp.setZIndex) {
                    capaMunicipiosTransp.setZIndex(5);
                }
            }

            // 3. Capa de malla para interacción (DEBE ESTAR ARRIBA)
            capaMallaPrecT = L.geoJSON(mallaPrecData, {
                style: {
                    color: 'transparent',
                    weight: 0,
                    fillColor: 'transparent',
                    fillOpacity: 0
                },
                interactive: true, // ← SÍ necesita interactividad
                pane: 'overlayPane',
                onEachFeature: function(feature, layer) {
                    layer.on('click', function(e) {
                        // Coordenadas del punto de consulta [lng, lat]
                        const puntoConsulta = [e.latlng.lng, e.latlng.lat];
                        const lat = e.latlng.lat.toFixed(5);
                        const lng = e.latlng.lng.toFixed(5);

                        console.log('Click en precipitación detectado:', lat, lng); // ← Debug

                        // Extraer los valores mensuales
                        const props = feature.properties;
                        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                        const valores = meses.map(m => Number(props[m]) || 0);

                        // Buscar información espacial
                        let municipio = 'N/A';
                        let unidad = 'N/A';
                        let subzona = 'N/A';

                        // Buscar municipio
                        if (capaMunicipiosTransp) {
                            capaMunicipiosTransp.eachLayer(function(munLayer) {
                                if (munLayer.feature && munLayer.feature.geometry) {
                                    if (puntoEnPoligono(puntoConsulta, munLayer.feature.geometry)) {
                                        municipio = munLayer.feature.properties.MPIO_CNMBR || 
                                                   munLayer.feature.properties.nombre || 
                                                   munLayer.feature.properties.NOMBRE || 'N/A';
                                        return false;
                                    }
                                }
                            });
                        }

                        // Buscar unidad hidrológica
                        if (geojson) {
                            geojson.eachLayer(function(uhLayer) {
                                if (uhLayer.feature && uhLayer.feature.geometry) {
                                    if (puntoEnPoligono(puntoConsulta, uhLayer.feature.geometry)) {
                                        unidad = uhLayer.feature.properties.Nombre_1 || 'N/A';
                                        subzona = uhLayer.feature.properties.Nombre_SZH || 'N/A';
                                        return false;
                                    }
                                }
                            });
                        }

                        // MEJORAR: Verificar que tenemos datos antes de crear la gráfica
                        if (valores.every(v => v === 0)) {
                            console.warn('No hay datos de precipitación para este punto');
                            L.popup()
                                .setLatLng(e.latlng)
                                .setContent('No hay datos de precipitación disponibles para este punto')
                                .openOn(map);
                            return;
                        }

                        // Limpiar el panel lateral
                        lateralPanel.innerHTML = '';
                        lateralPanel.style.padding = '18px 12px 12px 12px';

                        // Título
                        let titulo = document.createElement('div');
                        titulo.textContent = 'Precipitación mensual (1990 - 2023)';
                        titulo.style.textAlign = 'center';
                        titulo.style.fontWeight = 'bold';
                        titulo.style.fontSize = '16px';
                        titulo.style.marginBottom = '8px';
                        lateralPanel.appendChild(titulo);

                        // Contenedor para la gráfica
                        let graphDiv = document.createElement('div');
                        graphDiv.style.width = '96%';
                        graphDiv.style.margin = '0 auto';
                        graphDiv.style.height = '220px';
                        lateralPanel.appendChild(graphDiv);

                        // MEJORAR: Verificar que Plotly está disponible
                        if (typeof Plotly === 'undefined') {
                            graphDiv.innerHTML = '<p style="text-align:center;color:red;">Error: Plotly no está disponible</p>';
                            console.error('Plotly no está cargado');
                            return;
                        }

                        // Renderizar la gráfica con manejo de errores
                        try {
                            Plotly.newPlot(graphDiv, [{
                                x: meses,
                                y: valores,
                                type: 'bar',
                                marker: { color: '#3498db' }
                            }], {
                                margin: { t: 30, b: 40, l: 60, r: 10 },
                                xaxis: { title: 'Mes' },
                                yaxis: { title: 'Precipitación (mm)' }
                            }, {displayModeBar: false});
                            
                            console.log('Gráfica de precipitación creada exitosamente'); // ← Debug
                        } catch (error) {
                            console.error('Error al crear la gráfica:', error);
                            graphDiv.innerHTML = '<p style="text-align:center;color:red;">Error al crear la gráfica</p>';
                        }

                        // Información adicional
                        let subtitleDiv = document.createElement('div');
                        subtitleDiv.style.fontSize = '13px';
                        subtitleDiv.style.margin = '12px 0 4px 0';
                        subtitleDiv.innerHTML = `
                            <b>Coord:</b> [${lat}, ${lng}]<br>
                            <b>Municipio:</b> ${municipio}<br>
                            <b>Unidad hidro:</b> ${unidad}<br>
                            <b>Subzona hidro:</b> ${subzona}
                        `;
                        lateralPanel.appendChild(subtitleDiv);

                        // Botones de descarga
                        let btnContainer = document.createElement('div');
                        btnContainer.style.margin = '8px 0 0 0';
                        
                        let btnCSV = document.createElement('button');
                        btnCSV.textContent = 'Descargar datos (CSV)';
                        btnCSV.style.marginRight = '8px';
                        btnCSV.onclick = function() {
                            let csv = 'Mes,Precipitacion_mm\n';
                            meses.forEach((m, i) => { csv += `${m},${valores[i]}\n`; });
                            let blob = new Blob([csv], {type: 'text/csv'});
                            let url = URL.createObjectURL(blob);
                            let a = document.createElement('a');
                            a.href = url;
                            a.download = `precipitacion_${lat}_${lng}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        };

                        let btnPNG = document.createElement('button');
                        btnPNG.textContent = 'Descargar gráfica (PNG)';
                        btnPNG.onclick = function() {
                            if (typeof Plotly !== 'undefined') {
                                Plotly.downloadImage(graphDiv, {
                                    format: 'png',
                                    filename: `grafica_precipitacion_${lat}_${lng}`,
                                    width: 700,
                                    height: 400
                                });
                            }
                        };

                        btnContainer.appendChild(btnCSV);
                        btnContainer.appendChild(btnPNG);
                        lateralPanel.appendChild(btnContainer);

                        lateralPanel.style.display = 'block';
                    });
                }
            }).addTo(map);
            
            // CRÍTICO: La capa de malla debe estar arriba para capturar clicks
            if (capaMallaPrecT.setZIndex) {
                capaMallaPrecT.setZIndex(20); // ← Z-index más alto
            }
            
            // Traer al frente para asegurar interactividad
            capaMallaPrecT.bringToFront();
            
            console.log('Capas de precipitación cargadas correctamente');
        }).catch(error => {
            console.error('Error al cargar capas de precipitación:', error);
        });
        
    } else {
        // Limpiar capas
        if (capaPrec1kClass) {
            map.removeLayer(capaPrec1kClass);
            capaPrec1kClass = null;
        }
        if (capaMallaPrecT) {
            map.removeLayer(capaMallaPrecT);
            capaMallaPrecT = null;
        }
        if (capaMunicipiosTransp && !document.getElementById('chk-temp-nc').checked) {
            map.removeLayer(capaMunicipiosTransp);
            capaMunicipiosTransp = null;
        }
        
        // Restaurar información general
        restaurarInfoGeneral();
    }
});

// Función para escala de colores de temperatura 1km (degradado continuo)
function getTempColor(temp) {
    // Escala de colores continua de frío a caliente
    // Azul oscuro -> Azul -> Cian -> Verde -> Amarillo -> Naranja -> Rojo -> Rojo oscuro
    if (temp <= 5) return '#000080';   // Azul marino (muy frío)
    if (temp <= 8) return '#0000FF';   // Azul
    if (temp <= 10) return '#0080FF';  // Azul claro
    if (temp <= 12) return '#00FFFF';  // Cian
    if (temp <= 15) return '#00FF80';  // Verde-cian
    if (temp <= 18) return '#00FF00';  // Verde
    if (temp <= 20) return '#80FF00';  // Verde-amarillo
    if (temp <= 22) return '#FFFF00';  // Amarillo
    if (temp <= 24) return '#FFD700';  // Oro
    if (temp <= 26) return '#FFA500';  // Naranja
    if (temp <= 28) return '#FF6600';  // Naranja-rojo
    if (temp <= 30) return '#FF0000';  // Rojo
    return '#8B0000';                  // Rojo oscuro (muy caliente)
}

// Listener para temperatura 1km
document.getElementById('chk-temp-nc').addEventListener('change', function(e) {
    if (this.checked) {
        // Asegurar que geojson esté en el mapa para consultas
        if (geojson && !map.hasLayer(geojson)) {
            geojson.addTo(map);
            geojson.setStyle({
                fillColor: 'transparent',
                color: 'transparent',
                weight: 0,
                fillOpacity: 0
            });
        }
        
        // Cargar el GeoJSON de temperatura con visualización continua
        Promise.all([
            fetch('mallaTmed.geojson').then(resp => resp.json()),
            !capaMunicipiosTransp ? fetch('LM_Tolima.geojson').then(resp => resp.json()) : Promise.resolve(null)
        ]).then(([tempData, municipiosData]) => {
            
            // 1. Crear dos capas del mismo GeoJSON: una para visualización y otra para interacción
            
            // Capa para visualización (degradado continuo)
            capaTemp1k = L.geoJSON(tempData, {
                style: function(feature) {
                    const tempAnual = feature.properties.Anual || 0;
                    return {
                        color: 'transparent',
                        weight: 0,
                        fillColor: getTempColor(tempAnual),
                        fillOpacity: 0.7
                    };
                },
                interactive: false // Solo visual
            }).addTo(map);
            
            // Configurar z-index
            if (capaTemp1k.setZIndex) {
                capaTemp1k.setZIndex(10);
            }

            // 2. Cargar municipios transparentes si no existen
            if (municipiosData && !capaMunicipiosTransp) {
                capaMunicipiosTransp = L.geoJSON(municipiosData, {
                    style: {
                        color: 'transparent',
                        weight: 0,
                        fillColor: 'transparent',
                        fillOpacity: 0
                    },
                    interactive: false
                }).addTo(map);
                
                if (capaMunicipiosTransp.setZIndex) {
                    capaMunicipiosTransp.setZIndex(5);
                }
            }

            // 3. Capa para interacción (la misma data pero transparente)
            capaMallaTemp = L.geoJSON(tempData, {
                style: {
                    color: 'transparent',
                    weight: 0,
                    fillColor: 'transparent',
                    fillOpacity: 0
                },
                interactive: true,
                pane: 'overlayPane',
                onEachFeature: function(feature, layer) {
                    layer.on('click', function(e) {
                        // Coordenadas del punto de consulta [lng, lat]
                        const puntoConsulta = [e.latlng.lng, e.latlng.lat];
                        const lat = e.latlng.lat.toFixed(5);
                        const lng = e.latlng.lng.toFixed(5);

                        console.log('Click en temperatura detectado:', lat, lng);

                        // Extraer los valores mensuales de temperatura
                        const props = feature.properties;
                        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                        const valores = meses.map(m => Number(props[m]) || 0);
                        const tempAnual = Number(props.Anual) || 0;

                        // MEJORAR: Buscar información espacial usando puntoEnPoligono (misma lógica que precipitación)
                        let municipio = 'N/A';
                        let unidad = 'N/A';
                        let subzona = 'N/A';

                        // Buscar municipio usando consulta punto-en-polígono precisa
                        if (capaMunicipiosTransp) {
                            capaMunicipiosTransp.eachLayer(function(munLayer) {
                                if (munLayer.feature && munLayer.feature.geometry) {
                                    if (puntoEnPoligono(puntoConsulta, munLayer.feature.geometry)) {
                                        municipio = munLayer.feature.properties.MPIO_CNMBR || 
                                                   munLayer.feature.properties.nombre || 
                                                   munLayer.feature.properties.NOMBRE || 'N/A';
                                        return false; // Salir del bucle cuando encuentre match
                                    }
                                }
                            });
                        }

                        // Buscar unidad hidrológica y subzona usando consulta punto-en-polígono precisa
                        if (geojson) {
                            geojson.eachLayer(function(uhLayer) {
                                if (uhLayer.feature && uhLayer.feature.geometry) {
                                    if (puntoEnPoligono(puntoConsulta, uhLayer.feature.geometry)) {
                                        unidad = uhLayer.feature.properties.Nombre_1 || 
                                                uhLayer.feature.properties.NOMBRE_1 || 'N/A';
                                        subzona = uhLayer.feature.properties.Nombre_SZH || 
                                                 uhLayer.feature.properties.NOMBRE_SZH || 'N/A';
                                        return false; // Salir del bucle cuando encuentre match
                                    }
                                }
                            });
                        }

                        // Verificar que tenemos datos
                        if (valores.every(v => v === 0) && tempAnual === 0) {
                            console.warn('No hay datos de temperatura para este punto');
                            L.popup()
                                .setLatLng(e.latlng)
                                .setContent('No hay datos de temperatura disponibles para este punto')
                                .openOn(map);
                            return;
                        }

                        // Limpiar el panel lateral
                        lateralPanel.innerHTML = '';
                        lateralPanel.style.padding = '18px 12px 12px 12px';

                        // Título
                        let titulo = document.createElement('div');
                        titulo.textContent = 'Temperatura promedio mensual (1990 - 2023)';
                        titulo.style.textAlign = 'center';
                        titulo.style.fontWeight = 'bold';
                        titulo.style.fontSize = '16px';
                        titulo.style.marginBottom = '8px';
                        lateralPanel.appendChild(titulo);

                        // Mostrar temperatura anual destacada
                        let tempAnualDiv = document.createElement('div');
                        tempAnualDiv.innerHTML = `<strong>Temperatura media anual: ${tempAnual.toFixed(1)}°C</strong>`;
                        tempAnualDiv.style.textAlign = 'center';
                        tempAnualDiv.style.fontSize = '14px';
                        tempAnualDiv.style.color = getTempColor(tempAnual);
                        tempAnualDiv.style.fontWeight = 'bold';
                        tempAnualDiv.style.marginBottom = '12px';
                        tempAnualDiv.style.padding = '8px';
                        tempAnualDiv.style.border = `2px solid ${getTempColor(tempAnual)}`;
                        tempAnualDiv.style.borderRadius = '6px';
                        tempAnualDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';
                        lateralPanel.appendChild(tempAnualDiv);

                        // Contenedor para la gráfica
                        let graphDiv = document.createElement('div');
                        graphDiv.style.width = '96%';
                        graphDiv.style.margin = '0 auto';
                        graphDiv.style.height = '220px';
                        lateralPanel.appendChild(graphDiv);

                        // Verificar que Plotly está disponible y renderizar gráfica
                        if (typeof Plotly === 'undefined') {
                            graphDiv.innerHTML = '<p style="text-align:center;color:red;">Error: Plotly no está disponible</p>';
                            console.error('Plotly no está cargado');
                            return;
                        }

                        try {
                            // Crear colores para cada marcador según la temperatura
                            const coloresBarra = valores.map(temp => getTempColor(temp));
                            
                            Plotly.newPlot(graphDiv, [{
                                x: meses,
                                y: valores,
                                type: 'scatter',
                                mode: 'lines+markers',
                                line: { 
                                    color: '#e74c3c', 
                                    width: 3 
                                },
                                marker: { 
                                    color: coloresBarra,
                                    size: 8,
                                    line: { color: '#333', width: 1 }
                                },
                                name: 'Temperatura'
                            }], {
                                margin: { t: 30, b: 40, l: 60, r: 10 },
                                xaxis: { title: 'Mes' },
                                yaxis: { title: 'Temperatura (°C)' },
                                showlegend: false
                            }, {displayModeBar: false});
                            
                            console.log('Gráfica de temperatura creada exitosamente');
                        } catch (error) {
                            console.error('Error al crear la gráfica:', error);
                            graphDiv.innerHTML = '<p style="text-align:center;color:red;">Error al crear la gráfica</p>';
                        }

                        // Información adicional (con información de debug si no encuentra datos)
                        let subtitleDiv = document.createElement('div');
                        subtitleDiv.style.fontSize = '13px';
                        subtitleDiv.style.margin = '12px 0 4px 0';
                        
                        // Agregar información de debug si no encuentra datos
                        let debugInfo = '';
                        if (municipio === 'N/A' || unidad === 'N/A') {
                            debugInfo = `<br><small style="color:#888;">Debug: Coord [${lng}, ${lat}]</small>`;
                        }
                        
                        subtitleDiv.innerHTML = `
                            <b>Coordenadas:</b> [${lat}, ${lng}]<br>
                            <b>Municipio:</b> ${municipio}<br>
                            <b>Unidad hidro:</b> ${unidad}<br>
                            <b>Subzona hidro:</b> ${subzona}${debugInfo}
                        `;
                        lateralPanel.appendChild(subtitleDiv);

                        // Botones de descarga
                        let btnContainer = document.createElement('div');
                        btnContainer.style.margin = '8px 0 0 0';
                        
                        let btnCSV = document.createElement('button');
                        btnCSV.textContent = 'Descargar datos (CSV)';
                        btnCSV.style.marginRight = '8px';
                        btnCSV.onclick = function() {
                            let csv = 'Mes,Temperatura_C\n';
                            meses.forEach((m, i) => { 
                                csv += `${m},${valores[i].toFixed(1)}\n`; 
                            });
                            
                            // Agregar metadata
                            csv += '\nMetadata\n';
                            csv += `Temperatura_media_anual,${tempAnual.toFixed(1)}\n`;
                            csv += `Coordenadas,"[${lat}, ${lng}]"\n`;
                            csv += `Municipio,"${municipio}"\n`;
                            csv += `Unidad_Hidrologica,"${unidad}"\n`;
                            csv += `Subzona_Hidrografica,"${subzona}"\n`;
                            
                            let blob = new Blob([csv], {type: 'text/csv'});
                            let url = URL.createObjectURL(blob);
                            let a = document.createElement('a');
                            a.href = url;
                            a.download = `temperatura_${lat}_${lng}.csv`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        };

                        let btnPNG = document.createElement('button');
                        btnPNG.textContent = 'Descargar gráfica (PNG)';
                        btnPNG.onclick = function() {
                            if (typeof Plotly !== 'undefined') {
                                Plotly.downloadImage(graphDiv, {
                                    format: 'png',
                                    filename: `grafica_temperatura_${lat}_${lng}`,
                                    width: 700,
                                    height: 400
                                });
                            }
                        };

                        btnContainer.appendChild(btnCSV);
                        btnContainer.appendChild(btnPNG);
                        lateralPanel.appendChild(btnContainer);

                        lateralPanel.style.display = 'block';
                    });
                }
            }).addTo(map);
            
            // La capa de malla debe estar arriba para capturar clicks
            if (capaMallaTemp.setZIndex) {
                capaMallaTemp.setZIndex(20);
            }
            
            capaMallaTemp.bringToFront();
            
            console.log('Capas de temperatura cargadas correctamente');
        }).catch(error => {
            console.error('Error al cargar capas de temperatura:', error);
        });
        
    } else {
        // Limpiar capas cuando se desactiva
        if (capaTemp1k) {
            map.removeLayer(capaTemp1k);
            capaTemp1k = null;
        }
        if (capaMallaTemp) {
            map.removeLayer(capaMallaTemp);
            capaMallaTemp = null;
        }
        if (capaMunicipiosTransp && !document.getElementById('chk-precip-nc').checked) {
            map.removeLayer(capaMunicipiosTransp);
            capaMunicipiosTransp = null;
        }
        
        // Restaurar información general
        if (typeof mostrarInfoProyecto === 'function') {
            mostrarInfoProyecto();
        }
    }
});

// Listener mejorado para el botón "Info General" en el menú (mostrarInfoProyecto)
document.addEventListener('DOMContentLoaded', function() {
    const btnInfoGeneral = document.getElementById('btn-info-general');
    
    if (btnInfoGeneral) {
        btnInfoGeneral.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Botón Info. General clickeado'); // Para debug
            
            // Verificar que la función mostrarInfoProyecto existe
            if (typeof mostrarInfoProyecto === 'function') {
                mostrarInfoProyecto();
            } else {
                console.error('La función mostrarInfoProyecto no está disponible');
                lateralPanel.innerHTML = '<p style="padding:20px;text-align:center;color:red;">Error: No se pudo cargar la información del proyecto</p>';
            }
            
            // Cerrar el menú si está abierto
            const menu = document.getElementById('menu-capas');
            if (menu) {
                menu.style.display = 'none';
            }
            
            // Limpiar cualquier selección visual activa en el mapa
            if (window.selectedLayer && geojson) {
                geojson.resetStyle(window.selectedLayer);
                window.selectedLayer = null;
                window.selectedFeature = null;
            }
            
            // Ocultar cualquier tooltip o infoControl activo
            if (infoControl && infoControl._div) {
                infoControl._div.style.display = 'none';
            }
            if (typeof unidadTooltip !== 'undefined') {
                unidadTooltip.style.display = 'none';
            }
        });
        
        console.log('Listener agregado al botón Info. General');
    } else {
        console.error('No se encontró el botón con ID "btn-info-general"');
    }
});

// Función optimizada para cargar info del proyecto
function cargarInfoProyectoInicial() {
    if (typeof mostrarInfoProyecto === 'function') {
        mostrarInfoProyecto();
        console.log('Información del proyecto cargada al inicio');
    } else {
        // Si la función no está lista, esperar menos tiempo y reintentar
        setTimeout(cargarInfoProyectoInicial, 50);
    }
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Ejecutar inmediatamente sin delay
    cargarInfoProyectoInicial();
});

// Backup cuando el mapa esté listo (solo si el panel sigue vacío)
map.whenReady(function() {
    setTimeout(function() {
        if (lateralPanel.innerHTML.trim() === '') {
            cargarInfoProyectoInicial();
        }
    }, 200); // Tiempo mucho menor
});

// Listener para el botón "Leyenda"
document.addEventListener('DOMContentLoaded', function() {
    const btnLeyenda = document.getElementById('btn-leyenda');
    
    if (btnLeyenda) {
        btnLeyenda.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Botón Leyenda clickeado');
            
            // Verificar que la función mostrarLeyendas existe
            if (typeof mostrarLeyendas === 'function') {
                mostrarLeyendas();
            } else {
                console.error('La función mostrarLeyendas no está disponible');
                lateralPanel.innerHTML = '<p style="padding:20px;text-align:center;color:red;">Error: No se pudo cargar las leyendas</p>';
            }
            
            // Cerrar el menú si está abierto
            const menu = document.getElementById('menu-capas');
            if (menu) {
                menu.style.display = 'none';
            }
            
            // Limpiar cualquier selección visual activa en el mapa
            if (window.selectedLayer && geojson) {
                geojson.resetStyle(window.selectedLayer);
                window.selectedLayer = null;
                window.selectedFeature = null;
            }
            
            // Ocultar cualquier tooltip o infoControl activo
            if (infoControl && infoControl._div) {
                infoControl._div.style.display = 'none';
            }
            if (typeof unidadTooltip !== 'undefined') {
                unidadTooltip.style.display = 'none';
            }
        });
        
        console.log('Listener agregado al botón Leyenda');
    } else {
        console.error('No se encontró el botón con ID "btn-leyenda"');
    }
});

//para animar 24 pasos ERR desde un manifest.json publicado en S3/CloudFront
let capaERRLayers = [];
let ERRTimer = null;
let ERRIdx = 0;

async function cargarERRTiles(manifestUrl = '/tiles/err/manifest.json') {
  try {
    const m = await fetch(manifestUrl, { cache: 'no-cache' }).then(r => r.json());
    const frames = (m.frames || []).sort((a,b) => a.t - b.t);

    detenerAnimERR();
    capaERRLayers.forEach(l => map.removeLayer(l));
    capaERRLayers = [];
    ERRIdx = 0;

    // Define bounds para Colombia (ajusta si recortaste a Tolima)
    const bounds = [[-4.227, -79.0], [13.5, -66.85]];

    frames.forEach((f) => {
      // Usa la ruta PNG directa del manifest
      const imgUrl = f.tiles.startsWith('/') ? f.tiles : '/' + f.tiles;
      const imgLayer = L.imageOverlay(imgUrl, bounds, {
        opacity: 0.0,
        interactive: false
      }).addTo(map);
      capaERRLayers.push(imgLayer);
    });
    return frames;
  } catch (e) {
    console.error('ERR manifest error', e);
    return [];
  }
}

function iniciarAnimERR(frames, speedMs = 350) {
  detenerAnimERR();
  if (!frames.length) return;

  ERRIdx = 0;
  ERRTimer = setInterval(() => {
    capaERRLayers.forEach((l, i) => l.setOpacity(i === ERRIdx ? 1.0 : 0.0));
    const t = frames[ERRIdx].t;
    if (typeof t === 'number') goesTimeControl.update(t);
    ERRIdx = (ERRIdx + 1) % frames.length;
  }, speedMs);
}

function detenerAnimERR() {
  if (ERRTimer) { clearInterval(ERRTimer); ERRTimer = null; }
  capaERRLayers.forEach(l => l.setOpacity(0.0));
}

// Listener para activar ERR (añade un checkbox con id="chk-ERR" en el HTML)
document.getElementById('chk-ERR')?.addEventListener('change', async function() {
  if (this.checked) {
    const frames = await cargarERRTiles('/tiles/err/manifest.json');
    if (!frames.length) { this.checked = false; return; }
    iniciarAnimERR(frames, 350);
  } else {
    detenerAnimERR();
    capaERRLayers.forEach(l => map.removeLayer(l));
    capaERRLayers = [];
    goesTimeControl.update(null);
  }
});