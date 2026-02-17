# Visor del Agua del Tolima - V1

Aplicación web desarrollada en JavaScript para la visualización de información hidrográfica del departamento del Tolima.

## Descripción

Este visor permite desplegar capas geográficas en formato GeoJSON relacionadas con:

- Estaciones hidrométricas
- Subzonas hidrográficas
- Datos asociados a monitoreo

El objetivo es facilitar la consulta y análisis visual de información hídrica.

## Tecnologías

- JavaScript
- HTML5
- CSS
- GeoJSON
- Leaflet
- Backend (Serverless: se ha probado con lambda en AWS y en local)

## Estructura del proyecto
- En la versión 1.0.0 los datos no están centralizados en una carpeta ni los scripts JS
- capas_estaciones/ contiene los datos de las estaciones
- Clima_Mes_Tolima/ contiene capas tiff con datos meteorológicos a visualizar
- css/ contiene el archivo customize.css del proyecto
- logos/ contiene logos institucionales


## ▶️ Cómo ejecutar en local

1. Clonar el repositorio: git clone https://github.com/tu_usuario/visorT.git
2. Abrir `index.html` en el navegador o usar un servidor local, se requiere ejecutar backend/proxy.mjs (en backend/ ejecutar: node proxy.mjs)

## 📌 Estado del proyecto

Versión estable inicial: v1.0.0

## 📄 Licencia

Copyright © 2026 Miguel Barrios.
Licensed under the Apache License, Version 2.0.