// Función para mostrar información del proyecto
function mostrarInfoProyecto() {
    // Limpiar completamente el panel lateral (igual que hace mostrarGrafico)
    lateralPanel.innerHTML = '';
    lateralPanel.style.padding = '20px';
    lateralPanel.style.textAlign = 'center';
    
    // Logo del proyecto
    let logoImg = document.createElement('img');
    logoImg.src = 'logos/cma.png';
    logoImg.style.maxWidth = '60%';
    logoImg.style.height = 'auto';
    logoImg.style.marginBottom = '20px';
    logoImg.style.display = 'block';
    logoImg.style.margin = '0 auto 20px auto';
    logoImg.onerror = function() {
        // Si no se puede cargar la imagen, mostrar texto alternativo
        let logoText = document.createElement('div');
        logoText.textContent = 'CORTOLIMA';
        logoText.style.fontSize = '24px';
        logoText.style.fontWeight = 'bold';
        logoText.style.color = '#2c5530';
        logoText.style.marginBottom = '20px';
        lateralPanel.appendChild(logoText);
    };
    lateralPanel.appendChild(logoImg);
    
    // Título del proyecto
    let tituloProyecto = document.createElement('div');
    tituloProyecto.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #2c5530; font-size: 18px; line-height: 1.4;">
            Proyecto: Implementación de un sistema de monitoreo, seguimiento y evaluación del recurso hídrico en el departamento del Tolima
        </h3>
        <p style="margin: 0; color: #555; font-size: 16px; font-weight: 500;">
            Ibagué, Colombia
        </p>
    `;
    lateralPanel.appendChild(tituloProyecto);
    
    // Descripción adicional
    let descripcion = document.createElement('div');
    descripcion.innerHTML = `
        <div style="margin-top: 25px; text-align: left; color: #666; font-size: 14px; line-height: 1.5;">
            <p><strong>Objetivo de la plataforma:</strong> Visualizar y analizar información de los recursos hídricos del departamento del Tolima mediante herramientas geoespaciales interactivas.</p>
            <p><strong>Funcionalidades:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Consulta de unidades hidrológicas</li>
                <li>Consulta y análisis de indicadores hídricos</li>
                <li>Visualización de datos de estaciones meteorológicas e hidrométricas</li>
                <li>Consulta de datos de precipitación, temperatura del aire, oferta hídrica y nivel de agua en ríos y embalses </li>
            </ul>
        </div>
    `;
    lateralPanel.appendChild(descripcion);
    
    // Agregar créditos 
    let creditos = document.createElement('div');
    creditos.innerHTML = `
        <div style="margin-top: 30px; padding: 24px; background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%); border-radius: 16px; border: 1px solid rgba(0,0,0,0.06);">
            <h4 style="margin: 0 0 18px 0; color: #2d3748; font-size: 16px; font-weight: 600; text-align: center; display: flex; align-items: center; justify-content: center;">
                <span style="width: 4px; height: 16px; background: linear-gradient(135deg, #4299e1, #3182ce); border-radius: 2px; margin-right: 12px;"></span>
                Créditos Cartográficos
            </h4>
            <div style="font-size: 13px; color: #4a5568; line-height: 1.8; text-align: center;">
                <div style="margin: 12px 0;">
                    <strong style="color: #2d3748;">Mapa base:</strong> © <a href="https://www.openstreetmap.org/copyright" target="_blank" style="color: #3182ce; text-decoration: none;">OpenStreetMap contributors</a>
                </div>
                <div style="margin: 12px 0;">
                    <strong style="color: #2d3748;">Biblioteca:</strong> <a href="https://leafletjs.com/" target="_blank" style="color: #3182ce; text-decoration: none;">Leaflet.js</a>
                </div>
                <div style="margin: 12px 0;">
                    <strong style="color: #2d3748;">Datos Hidrométricos y Meteorológicos:</strong><br>
                    <a href="https://www.ideam.gov.co/" target="_blank" style="color: #3182ce; text-decoration: none;">IDEAM</a> - <a href="https://www.cortolima.gov.co/" target="_blank" style="color: #3182ce; text-decoration: none;">CORTOLIMA</a>
                </div>
                <div style="margin: 12px 0;">
                    <strong style="color: #2d3748;">Cartografía Temática:</strong><br>
                    <a href="https://www.cortolima.gov.co/" target="_blank" style="color: #3182ce; text-decoration: none;">CORTOLIMA</a> - <a href="https://ut.edu.co/" target="_blank" style="color: #3182ce; text-decoration: none;">UNIVERSIDAD DEL TOLIMA</a>
                </div>
                <div style="margin: 12px 0;">
                    <strong style="color: #2d3748;">Cartografía Base:</strong> <a href="https://www.igac.gov.co/" target="_blank" style="color: #3182ce; text-decoration: none;">IGAC</a>
                </div>
                <div style="margin: 12px 0;">
                    <strong style="color: #2d3748;">Desarrollo de Software:</strong> <a href="https://waterlab.com.co/" target="_blank" style="color: #3182ce; text-decoration: none;">WaterLab</a>
                </div>
                <div style="margin: 20px 0 0 0; padding: 12px; background: rgba(66, 153, 225, 0.1); border-radius: 8px; font-size: 14px; color: #2d3748;">
                    <strong>Universidad del Tolima</strong><br>
                    Laboratorio de Hidrología e Hidráulica Computacional<br>
                    <a href="https://waterlab.com.co/" target="_blank" style="color: #3182ce; text-decoration: none;">WaterLab</a>
                </div>
            </div>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 11px; color: #718096; text-align: center; letter-spacing: 0.5px;">
                VERSIÓN 1.0 • AGOSTO 2025 • © TODOS LOS DERECHOS RESERVADOS
            </div>
        </div>
    `;
    lateralPanel.appendChild(creditos);
    
       
    // Asegurar que el panel sea visible
    lateralPanel.style.display = 'block';
}