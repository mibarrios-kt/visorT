// Cargar el mapa con Leaflet
var map = L.map('map').setView([0, 0], 2);

// Agregar un mapa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let tablaDatos = {};
let etiquetasTiempo = [];

// Cargar la tabla Excel con los datos de series
fetch('tus_datos.xlsx')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        var data = new Uint8Array(buffer);
        var workbook = XLSX.read(data, { type: 'array' });
        var sheet = workbook.Sheets[workbook.SheetNames[0]];
        var jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Leer como matriz
        
        etiquetasTiempo = jsonData.slice(1).map(row => row[0]); // Primera columna como etiquetas de tiempo
        let headers = jsonData[0].slice(1); // Primera fila como nombres de ríos
        
        headers.forEach((nombre, index) => {
            tablaDatos[nombre.trim()] = jsonData.slice(1).map(row => Number(row[index + 1]));
        });
    });

// Cargar GeoJSON con los features
fetch('tus_datos.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                layer.on('click', function () {
                    console.log("Feature clickeado:", feature.properties);
                    mostrarGrafico(feature);
                });
            }
        }).addTo(map);
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

function mostrarGrafico(feature) {
    var popupContent = document.createElement('div');
    popupContent.style.width = '300px';
    popupContent.style.height = '200px';

    var id = String(feature.properties.Nombre_1).trim(); // Usar "Nombre_1" como ID
    console.log("ID del Feature:", id);
    console.log("Datos en tablaDatos:", tablaDatos);

    var series = tablaDatos[id] || [];
    console.log("Serie encontrada:", series);

    if (series.length === 0) {
        alert("No hay datos para este feature.");
        return;
    }

    var trace = {
        x: etiquetasTiempo,
        y: series,
        type: 'scatter',
        mode: 'lines',
        line: { color: 'blue' }
    };

    var layout = {
        margin: { t: 10, b: 30, l: 40, r: 10 },
        xaxis: { title: 'Tiempo' },
        yaxis: { title: 'Valor' }
    };

    setTimeout(() => {
        Plotly.newPlot(popupContent, [trace], layout);
    }, 100);

    var coords = obtenerCentroide(feature);
    if (!coords) {
        alert("No se pudieron obtener coordenadas para este feature.");
        return;
    }

    L.popup()
        .setLatLng(coords)
        .setContent(popupContent)
        .openOn(map);
}
