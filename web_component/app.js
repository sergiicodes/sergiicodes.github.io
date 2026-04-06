// DOM Elements
const toggleBtns = document.querySelectorAll('#condition-toggle .toggle-btn');
const insightSummaryText = document.getElementById('insight-summary-text');
const statType = document.getElementById('stat-type');
const statType2 = document.getElementById('stat-type-2');
const urbanCorrEl = document.getElementById('urban-corr');
const ruralCorrEl = document.getElementById('rural-corr');
const pValueText = document.getElementById('p-value-text');
const urbanPm25El = document.getElementById('urban-pm25');
const ruralPm25El = document.getElementById('rural-pm25');

// Application State
let currentCondition = 'Asthma';
let mnGeoJson = null;
let healthData = null;
let geojsonLayer = null;

// Initialize Map
const map = L.map('map').setView([46.2, -94.3], 6);

// Premium Dark Base Layer from CartoDB
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Color Scale: Diverging Blue -> White -> Red for correlation (-1 to 1)
const colorScale = chroma.scale(['#60a5fa', '#e2e8f0', '#f87171']).domain([-1, 0, 1]);

// Initialize the app
function initApp() {
    try {
        // Load data from global variables in data.js to avoid CORS issues
        mnGeoJson = mnGeoJsonData;
        healthData = mnHealthDataObj;
        
        // Merge data into GeoJSON
        mergeData();
        
        // Setup initial map layout and UI
        renderMap();
        updateDashboard();
        
        // Add Event Listeners
        setupEventListeners();
    } catch (error) {
        console.error("Error loading data:", error);
        insightSummaryText.innerHTML = `<span style="color: #f87171;">Error loading data. ${error.message}</span>`;
    }
}

// Merge JSON records into the GeoJSON properties
function mergeData() {
    // Convert array to dictionary for O(1) lookups
    const dataDict = {};
    healthData.counties.forEach(c => {
        dataDict[c.county] = c;
    });
    
    // Add health data into geojson properties
    mnGeoJson.features.forEach(feature => {
        const countyName = feature.properties.NAME;
        if (dataDict[countyName]) {
            // Append data
            feature.properties = { ...feature.properties, ...dataDict[countyName] };
        } else {
            feature.properties.missing = true;
        }
    });
}

// Render the GeoJSON Map
function renderMap() {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }
    
    geojsonLayer = L.geoJson(mnGeoJson, {
        style: styleFeature,
        onEachFeature: onEachFeature
    }).addTo(map);
}

// Styling feature based on correlation of current condition
function styleFeature(feature) {
    const props = feature.properties;
    const corrProp = `correlation_${currentCondition}`;
    const imputedProp = `is_imputed_${currentCondition}`;
    
    // Default style
    let fill = '#1e293b'; 
    let fillOpacity = 0.8;
    
    if (!props.missing && props[corrProp] !== undefined && props[corrProp] !== null) {
        fill = colorScale(props[corrProp]).hex();
        
        // If imputed, make it slightly transparent to show it's an estimate
        if (props[imputedProp]) {
            fillOpacity = 0.4;
        }
    } else {
        fillOpacity = 0.1; // Dim missing data heavily
    }
    
    return {
        fillColor: fill,
        weight: props[imputedProp] ? 1 : 1.5,
        opacity: props[imputedProp] ? 0.3 : 1,
        color: props[imputedProp] ? '#94a3b8' : 'rgba(255, 255, 255, 0.4)',
        dashArray: props[imputedProp] ? '4' : '', 
        fillOpacity: fillOpacity
    };
}

// Hover interaction and dynamic Tooltips
function onEachFeature(feature, layer) {
    const props = feature.properties;
    const corrProp = `correlation_${currentCondition}`;
    const pm25Prop = `avg_pm25_${currentCondition}`;
    const casesProp = `avg_count_${currentCondition}`;
    const imputedProp = `is_imputed_${currentCondition}`;
    
    // Build tooltip HTML
    let tooltipContent = `<div class="tooltip-title">${props.NAME || 'Unknown'} County</div>`;
    
    if (props.missing || props[corrProp] === undefined || props[corrProp] === null) {
        tooltipContent += `<div class="tooltip-row"><span class="label">Status</span><span class="value">Insufficient Data</span></div>`;
    } else {
        const typeBadge = props.type === 'Urban' ? '<span style="color:#38bdf8">[Urban]</span>' : '<span style="color:#a78bfa">[Rural]</span>';
        const imputedBadge = props[imputedProp] ? `<div style="color:#fbbf24; font-size:0.75rem; margin-bottom:8px; display:block; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">⚠️ Imputed from ${props.type} Average</div>` : '';
        
        tooltipContent += `${imputedBadge}
            <div class="tooltip-row"><span class="label">Geography</span><span class="value">${typeBadge}</span></div>
            <div class="tooltip-row"><span class="label">Correlation (r)</span><span class="value" style="color:${colorScale(props[corrProp]).hex()};">${props[corrProp].toFixed(3)}</span></div>
            <div class="tooltip-row"><span class="label">Avg PM2.5</span><span class="value">${props[pm25Prop].toFixed(2)}</span></div>
            <div class="tooltip-row"><span class="label">Avg ${currentCondition} Cases</span><span class="value">${props[casesProp]}</span></div>
        `;
    }
    
    layer.bindTooltip(tooltipContent, {
        className: 'custom-tooltip',
        direction: 'top',
        sticky: true,
        opacity: 1
    });
    
    // Highlight Effects
    layer.on({
        mouseover: (e) => {
            const l = e.target;
            l.setStyle({
                weight: 3,
                color: '#fff',
                dashArray: '',
                fillOpacity: props[imputedProp] ? 0.7 : 1
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
            }
        },
        mouseout: (e) => {
            geojsonLayer.resetStyle(e.target);
        }
    });
}

// Update text and stats in the dashboard
function updateDashboard() {
    const summary = healthData.insights.summary;
    
    // Filter summary rows for selected condition
    const urbanRow = summary.find(s => s.condition === currentCondition && s.type === 'Urban');
    const ruralRow = summary.find(s => s.condition === currentCondition && s.type === 'Rural');
    
    // P-Test result
    const pTestKey = `${currentCondition.toLowerCase()}_urban_rural_ptest`;
    const pValue = healthData.insights[pTestKey];
    
    // Update Labels
    statType.innerText = currentCondition;
    statType2.innerText = currentCondition;
    
    // Update Values
    urbanCorrEl.innerText = urbanRow ? urbanRow.avg_correlation.toFixed(3) : '--';
    ruralCorrEl.innerText = ruralRow ? ruralRow.avg_correlation.toFixed(3) : '--';
    
    urbanPm25El.innerText = urbanRow ? urbanRow.avg_pm25_overall.toFixed(2) : '--';
    ruralPm25El.innerText = ruralRow ? ruralRow.avg_pm25_overall.toFixed(2) : '--';
    
    // Styling values
    if (urbanRow && urbanRow.avg_correlation < 0) urbanCorrEl.classList.add('negative'); else urbanCorrEl.classList.remove('negative');
    if (ruralRow && ruralRow.avg_correlation < 0) ruralCorrEl.classList.add('negative'); else ruralCorrEl.classList.remove('negative');
    
    // Update Summaries based on statistically significant difference
    let insightHtml = '';
    let pValueHtml = '';
    
    if (pValue !== undefined && pValue !== null) {
        if (pValue < 0.10) {
            pValueHtml = `<strong style="color: #6ee7b7;">Significant (p = ${pValue.toFixed(4)})</strong>. There is a systemic difference between urban and rural PM2.5 health outcomes.`;
            insightHtml = `The relationship between air quality and <strong>${currentCondition}</strong> diverge heavily across geographic lines, suggesting urban and rural environments moderate the impact of PM2.5 on human health.`;
        } else {
            pValueHtml = `<strong style="color: #cbd5e1;">Not Statistically Significant (p = ${pValue.toFixed(4)})</strong>. No strong evidence of geographic divide impacting correlation directly.`;
            insightHtml = `While raw correlations may differ, there is <strong>no strong statistical proof</strong> that the PM2.5-${currentCondition} relationship is systematically different between Urban and Rural counties.`;
        }
    } else {
        pValueHtml = `<strong style="color: #cbd5e1;">Insufficient Data</strong>. Not enough variance across counties to compute a p-value for the geographic divide.`;
        insightHtml = `The PM2.5-${currentCondition} correlations were derived from historical data, highlighting potential hot-spots but requiring more data to prove systemic geographic divides.`;
    }
    
    insightSummaryText.innerHTML = insightHtml;
    pValueText.innerHTML = pValueHtml;
}

// Bind Button Events
function setupEventListeners() {
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all
            toggleBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');
            
            // Set State
            currentCondition = e.target.dataset.condition;
            
            // Re-render map and text
            renderMap();
            updateDashboard();
        });
    });
}

// Start execution
initApp();
