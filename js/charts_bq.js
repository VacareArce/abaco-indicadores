(function () {
    let chartInstance = null;
    let activeIndicator = null;
    let currentBQSubTab = 'grafica';
    let mapPayload = null;
    let mapPageIndex = 0;
    let currentMapView = 'series';
    let selectedCompareYear = null;
    let mapInstances = [];
    let mapGeoJsonPromise = null;
    let mapRenderVersion = 0;

    const BQ_SUFFIX = '_BQ';
    const apiEndpoint = 'api/charts_bq.php';
    const rawApiEndpoint = 'api/charts_bq_raw.php';
    const exportApiEndpoint = 'api/charts_bq_export.php';
    const mapApiEndpoint = 'api/charts_bq_map.php';
    const mapGeoJsonPath = 'map/ColDepSNVlite.geojson';
    const MAPS_PER_PAGE = 4;
    let downloadContext = null;

    function el(id) {
        return document.getElementById(id);
    }

    function isBQIndicator(indicator) {
        return typeof indicator === 'string' && indicator.endsWith(BQ_SUFFIX);
    }

    function formatPercent(value) {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return 'N/D';
        }

        return `${Number(value).toFixed(2).replace('.', ',')} %`;
    }

    function setText(id, value) {
        const node = el(id);
        if (node) {
            node.textContent = value;
        }
    }

    function setDownloadEnabled(enabled) {
        const btn = el('bq-download-csv');
        if (!btn) return;
        btn.disabled = !enabled;
    }

    function setTableIconVisible(isVisible) {
        const tableIcon = el('tabla');
        if (!tableIcon) return;
        tableIcon.style.display = isVisible ? '' : 'none';
    }

    function setMapIconVisible(isVisible) {
        const mapIcon = el('mapa');
        if (!mapIcon) return;
        mapIcon.style.display = isVisible ? '' : 'none';
    }

    function setActiveSidebarIcon(iconId) {
        document.querySelectorAll('.icon-link').forEach(link => {
            link.classList.remove('active');
        });

        const icon = el(iconId);
        if (icon) {
            icon.classList.add('active');
        }
    }

    function setBQSubTab(view) {
        const chartPanel = el('bq-chart-panel');
        const tablePanel = el('bq-table-panel');
        const mapPanel = el('bq-map-panel');

        if (!chartPanel || !tablePanel || !mapPanel) return;

        if (view === 'tabla') {
            chartPanel.style.display = 'none';
            tablePanel.style.display = 'block';
            mapPanel.style.display = 'none';
            currentBQSubTab = 'tabla';
            setActiveSidebarIcon('tabla');
            return;
        }

        if (view === 'mapa') {
            chartPanel.style.display = 'none';
            tablePanel.style.display = 'none';
            mapPanel.style.display = 'block';
            currentBQSubTab = 'mapa';
            setActiveSidebarIcon('mapa');
            updateMapModeLayout();
            if (mapPayload) {
                renderCurrentMapView();
            } else {
                clearMapPanel('Cargando mapas...');
            }
            return;
        }

        chartPanel.style.display = 'block';
        tablePanel.style.display = 'none';
        mapPanel.style.display = 'none';
        currentBQSubTab = 'grafica';
        setActiveSidebarIcon('grafica');
    }

    function isBQModeActive() {
        const chartView = el('bq-chart-view');
        return !!(activeIndicator && isBQIndicator(activeIndicator) && chartView && chartView.style.display !== 'none');
    }

    function normalizeDeptCode(code) {
        const numeric = String(code || '').replace(/\D+/g, '');
        return numeric.padStart(2, '0');
    }

    function formatMapPercent(value) {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return 'N/D';
        }
        return `${Number(value).toFixed(2).replace('.', ',')} %`;
    }

    function mapColor(value, min, max) {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return '#d8d8d8';
        }

        if (min === null || min === undefined || max === null || max === undefined || min === max) {
            return '#f8961e';
        }

        const ratio = Math.max(0, Math.min(1, (Number(value) - min) / (max - min)));
        if (ratio < 0.25) return '#fff5bf';
        if (ratio < 0.5) return '#ffd166';
        if (ratio < 0.75) return '#f8961e';
        return '#e85d04';
    }

    async function loadMapGeoJson() {
        if (!mapGeoJsonPromise) {
            mapGeoJsonPromise = fetch(mapGeoJsonPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('No fue posible cargar el archivo geojson de departamentos.');
                    }
                    return response.json();
                });
        }

        return mapGeoJsonPromise;
    }

    function destroyMapInstances() {
        mapInstances.forEach(instance => {
            try {
                instance.remove();
            } catch (error) {
                // noop
            }
        });
        mapInstances = [];
    }

    function updateMapPager(totalPages) {
        const prevBtn = el('bq-map-prev');
        const nextBtn = el('bq-map-next');
        const page = el('bq-map-page');
        if (page) {
            const total = Math.max(totalPages, 1);
            page.textContent = `Pagina ${Math.min(mapPageIndex + 1, total)} de ${total}`;
        }
        if (prevBtn) {
            prevBtn.disabled = mapPageIndex <= 0;
        }
        if (nextBtn) {
            nextBtn.disabled = mapPageIndex >= totalPages - 1;
        }
    }

    function setActiveMapViewButton() {
        const seriesBtn = el('bq-map-view-series');
        const compareBtn = el('bq-map-view-compare');
        if (seriesBtn) {
            seriesBtn.classList.toggle('active', currentMapView === 'series');
        }
        if (compareBtn) {
            compareBtn.classList.toggle('active', currentMapView === 'compare');
        }
    }

    function updateMapModeLayout() {
        const pager = el('bq-map-controls');
        const compareControls = el('bq-map-compare-controls');
        const grid = el('bq-map-grid');
        const compareGrid = el('bq-map-compare-grid');

        setActiveMapViewButton();

        if (pager) {
            pager.style.display = currentMapView === 'series' ? 'flex' : 'none';
        }

        if (compareControls) {
            compareControls.style.display = currentMapView === 'compare' ? 'flex' : 'none';
        }

        if (grid) {
            grid.style.display = currentMapView === 'series' ? 'grid' : 'none';
        }

        if (compareGrid) {
            compareGrid.style.display = currentMapView === 'compare' ? 'grid' : 'none';
        }
    }

    function setMapView(view) {
        currentMapView = view === 'compare' ? 'compare' : 'series';
        updateMapModeLayout();
        if (currentBQSubTab === 'mapa' && mapPayload) {
            renderCurrentMapView();
        }
    }

    function renderCurrentMapView() {
        if (currentMapView === 'compare') {
            renderMapCompareSafe();
            return;
        }
        renderMapPageSafe();
    }

    function fitMapToStoredBounds(map) {
        if (!map || !map.__bqBounds || !map.__bqBounds.isValid()) {
            return;
        }

        const rawBounds = map.__bqBounds;
        const mapSize = map.getSize();
        const mapAspect = mapSize.y > 0 ? mapSize.x / mapSize.y : 1;
        const lngSpan = Math.abs(rawBounds.getEast() - rawBounds.getWest());
        const latSpan = Math.abs(rawBounds.getNorth() - rawBounds.getSouth());
        const dataAspect = latSpan > 0 ? lngSpan / latSpan : mapAspect;

        let boundsToFit = rawBounds;
        if (dataAspect > mapAspect * 1.45) {
            boundsToFit = rawBounds.pad(-0.22);
        }

        map.fitBounds(boundsToFit, {
            animate: false,
            padding: [12, 12]
        });
    }

    function getMapScale() {
        return {
            min: mapPayload && mapPayload.scale && mapPayload.scale.min !== undefined ? mapPayload.scale.min : null,
            max: mapPayload && mapPayload.scale && mapPayload.scale.max !== undefined ? mapPayload.scale.max : null
        };
    }

    function createMapCardHtml(year, containerId) {
        return `<div class="bq-map-card"><div class="bq-map-card-head"><div class="bq-map-year">${year}</div><div><button class="bq-map-fullscreen-btn" type="button" title="Pantalla completa" aria-label="Pantalla completa">Pantalla completa</button></div></div><div id="${containerId}" class="bq-map-canvas"></div></div>`;
    }

    function renderLeafletDeptMap(containerId, geoData, values, selectedCode, min, max) {
        const mapContainer = el(containerId);
        if (!mapContainer) {
            return null;
        }
        if (mapContainer._leaflet_id) {
            mapContainer._leaflet_id = null;
        }

        const map = L.map(containerId, {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: false,
            keyboard: false
        });

        const geoLayer = L.geoJSON(geoData, {
            style: feature => {
                const depCode = normalizeDeptCode(feature.properties.DPTO_CCDGO);
                const value = values[depCode];
                const selected = depCode === selectedCode;

                return {
                    color: selected ? '#0d6e6f' : '#ffffff',
                    weight: selected ? 2.8 : 1,
                    fillColor: mapColor(value, min, max),
                    fillOpacity: selected ? 0.92 : 0.82
                };
            },
            onEachFeature: (feature, layer) => {
                const depCode = normalizeDeptCode(feature.properties.DPTO_CCDGO);
                const value = values[depCode];
                const depName = feature.properties.DPTO_CNMBR || feature.properties.name || depCode;
                const highlightLabel = depCode === selectedCode ? ' (Seleccionado)' : '';
                layer.bindTooltip(`${depName}${highlightLabel}<br>${formatMapPercent(value)}`);
            }
        }).addTo(map);

        const bounds = geoLayer.getBounds();
        map.__bqBounds = bounds;
        fitMapToStoredBounds(map);

        return map;
    }

    function clearMapPanel(message) {
        mapRenderVersion += 1;
        mapPageIndex = 0;
        destroyMapInstances();

        const grid = el('bq-map-grid');
        const compareGrid = el('bq-map-compare-grid');
        const empty = el('bq-map-empty');
        const legend = el('bq-map-legend');
        const latestYearLabel = el('bq-map-latest-year');
        const compareYearSelect = el('bq-map-compare-year');

        if (grid) {
            grid.innerHTML = '';
        }

        if (compareGrid) {
            compareGrid.innerHTML = '';
        }

        if (empty) {
            empty.textContent = message || 'No hay datos para construir mapas departamentales.';
            empty.style.display = 'block';
        }

        if (legend) {
            legend.style.display = 'none';
        }

        if (latestYearLabel) {
            latestYearLabel.textContent = 'N/D';
        }

        if (compareYearSelect) {
            compareYearSelect.innerHTML = '';
        }

        selectedCompareYear = null;
        updateMapModeLayout();

        updateMapPager(1);
    }

    function clearRawTable(message) {
        const head = el('bq-raw-table-head');
        const body = el('bq-raw-table-body');
        const wrap = el('bq-raw-table-wrap');
        const empty = el('bq-raw-table-empty');

        if (head) head.innerHTML = '';
        if (body) body.innerHTML = '';
        if (wrap) wrap.style.display = 'none';
        if (empty) {
            empty.textContent = message || 'No hay datos crudos para este filtro.';
            empty.style.display = 'block';
        }
        setDownloadEnabled(false);
    }

    function formatCell(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number' && Number.isFinite(value)) {
            if (Number.isInteger(value)) {
                return String(value);
            }

            return value
                .toFixed(4)
                .replace(/\.0+$/, '')
                .replace(/(\.\d*?)0+$/, '$1')
                .replace('.', ',');
        }
        return String(value);
    }

    function renderRawTable(rawPayload) {
        const head = el('bq-raw-table-head');
        const body = el('bq-raw-table-body');
        const wrap = el('bq-raw-table-wrap');
        const empty = el('bq-raw-table-empty');

        if (!head || !body || !wrap || !empty) return;

        const cols = (rawPayload.columns || [])
            .filter(col => col !== 'Indicador_filtro')
            .map(col => (col === 'A__o' ? 'Año' : col));
        const rows = rawPayload.rows || [];

        if (!cols.length || !rows.length) {
            clearRawTable('No hay datos crudos para este filtro.');
            return;
        }

        head.innerHTML = `<tr>${cols.map(col => `<th>${col}</th>`).join('')}</tr>`;
        body.innerHTML = rows.map(row => {
            const tds = cols.map(col => {
                const key = col === 'Año' ? 'A__o' : col;
                return `<td>${formatCell(row[key])}</td>`;
            }).join('');
            return `<tr>${tds}</tr>`;
        }).join('');

        wrap.style.display = 'block';
        empty.style.display = 'none';
        setDownloadEnabled(true);
    }

    async function fetchRawData(indicator, codigoD) {
        const params = new URLSearchParams({ indicator, codigoD });
        const response = await fetch(`${rawApiEndpoint}?${params.toString()}`);
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
            throw new Error(payload.error || 'No fue posible cargar la tabla de datos crudos.');
        }

        return payload;
    }

    async function fetchMapData(indicator, codigoD) {
        const params = new URLSearchParams({ indicator, codigoD });
        const response = await fetch(`${mapApiEndpoint}?${params.toString()}`);
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
            throw new Error(payload.error || 'No fue posible cargar los mapas departamentales.');
        }

        return payload;
    }

    async function renderMapPage() {
        const renderVersion = ++mapRenderVersion;
        const indicatorAtStart = activeIndicator;
        if (!mapPayload || !isBQIndicator(indicatorAtStart)) {
            clearMapPanel('No hay datos para construir mapas departamentales.');
            return;
        }

        const years = Array.isArray(mapPayload.years) ? mapPayload.years : [];
        if (!years.length) {
            clearMapPanel('No hay años disponibles para este indicador.');
            return;
        }

        const totalPages = Math.ceil(years.length / MAPS_PER_PAGE);
        mapPageIndex = Math.min(Math.max(mapPageIndex, 0), Math.max(totalPages - 1, 0));
        updateMapPager(totalPages);

        const grid = el('bq-map-grid');
        const empty = el('bq-map-empty');
        const legend = el('bq-map-legend');

        if (!grid || !empty || !legend) {
            return;
        }

        const yearsToRender = years.slice(mapPageIndex * MAPS_PER_PAGE, (mapPageIndex + 1) * MAPS_PER_PAGE);
        if (!yearsToRender.length) {
            clearMapPanel('No hay datos para esta pagina.');
            return;
        }

        destroyMapInstances();
        grid.innerHTML = yearsToRender
            .map(year => createMapCardHtml(year, `bq-map-canvas-${year}`))
            .join('');

        const geoData = await loadMapGeoJson();
        if (indicatorAtStart !== activeIndicator || renderVersion !== mapRenderVersion) {
            return;
        }

        const scale = getMapScale();
        const selectedCode = normalizeDeptCode((mapPayload.meta && mapPayload.meta.selectedCode) || '');

        yearsToRender.forEach(year => {
            if (renderVersion !== mapRenderVersion) {
                return;
            }

            const yearKey = String(year);
            const values = mapPayload.valuesByYear && mapPayload.valuesByYear[yearKey]
                ? mapPayload.valuesByYear[yearKey]
                : {};

            const map = renderLeafletDeptMap(`bq-map-canvas-${year}`, geoData, values, selectedCode, scale.min, scale.max);

            if (!map) {
                return;
            }

            mapInstances.push(map);
        });

        empty.style.display = 'none';
        legend.style.display = 'flex';
    }

    function syncCompareSelector(years, latestYear) {
        const compareYearSelect = el('bq-map-compare-year');
        const latestYearLabel = el('bq-map-latest-year');

        if (latestYearLabel) {
            latestYearLabel.textContent = String(latestYear);
        }

        if (!compareYearSelect) {
            return;
        }

        const compareCandidates = years.filter(y => y !== latestYear);
        const fallbackYear = compareCandidates[compareCandidates.length - 1] || latestYear;

        if (!selectedCompareYear || !compareCandidates.includes(Number(selectedCompareYear))) {
            selectedCompareYear = fallbackYear;
        }

        compareYearSelect.innerHTML = compareCandidates
            .map(y => `<option value="${y}">${y}</option>`)
            .join('');

        compareYearSelect.disabled = compareCandidates.length === 0;

        if (compareCandidates.length > 0) {
            compareYearSelect.value = String(selectedCompareYear);
        }
    }

    async function renderMapCompare() {
        const renderVersion = ++mapRenderVersion;
        const indicatorAtStart = activeIndicator;
        if (!mapPayload || !isBQIndicator(indicatorAtStart)) {
            clearMapPanel('No hay datos para construir mapas departamentales.');
            return;
        }

        const years = Array.isArray(mapPayload.years) ? mapPayload.years : [];
        if (!years.length) {
            clearMapPanel('No hay años disponibles para este indicador.');
            return;
        }

        const latestYear = years[years.length - 1];
        syncCompareSelector(years, latestYear);

        const compareGrid = el('bq-map-compare-grid');
        const empty = el('bq-map-empty');
        const legend = el('bq-map-legend');

        if (!compareGrid || !empty || !legend) {
            return;
        }

        const compareYear = Number(selectedCompareYear || latestYear);
        destroyMapInstances();

        compareGrid.innerHTML = [
            createMapCardHtml(latestYear, `bq-map-compare-canvas-${latestYear}`),
            createMapCardHtml(compareYear, `bq-map-compare-canvas-${compareYear}`)
        ].join('');

        const geoData = await loadMapGeoJson();
        if (indicatorAtStart !== activeIndicator || renderVersion !== mapRenderVersion) {
            return;
        }

        const selectedCode = normalizeDeptCode((mapPayload.meta && mapPayload.meta.selectedCode) || '');
        const scale = getMapScale();

        const latestValues = mapPayload.valuesByYear && mapPayload.valuesByYear[String(latestYear)]
            ? mapPayload.valuesByYear[String(latestYear)]
            : {};
        const compareValues = mapPayload.valuesByYear && mapPayload.valuesByYear[String(compareYear)]
            ? mapPayload.valuesByYear[String(compareYear)]
            : {};

        const latestMap = renderLeafletDeptMap(
            `bq-map-compare-canvas-${latestYear}`,
            geoData,
            latestValues,
            selectedCode,
            scale.min,
            scale.max
        );
        if (latestMap) {
            mapInstances.push(latestMap);
        }

        const compareMap = renderLeafletDeptMap(
            `bq-map-compare-canvas-${compareYear}`,
            geoData,
            compareValues,
            selectedCode,
            scale.min,
            scale.max
        );
        if (compareMap) {
            mapInstances.push(compareMap);
        }

        updateMapPager(1);
        empty.style.display = 'none';
        legend.style.display = 'flex';
    }

    function renderMapPageSafe() {
        renderMapPage().catch(error => {
            clearMapPanel(error && error.message ? error.message : 'No fue posible cargar los mapas departamentales.');
        });
    }

    function invalidateMapSizes() {
        mapInstances.forEach(map => {
            try {
                if (map && typeof map.invalidateSize === 'function') {
                    map.invalidateSize();
                    fitMapToStoredBounds(map);
                }
            } catch (error) {
                // noop
            }
        });
    }

    function escapeScriptText(text) {
        return String(text).replace(/<\//g, '<\\/');
    }

    function getPopupMapItems(button) {
        if (!mapPayload || !Array.isArray(mapPayload.years) || mapPayload.years.length === 0) {
            return [];
        }

        const years = mapPayload.years;
        if (currentMapView === 'compare') {
            const latestYear = years[years.length - 1];
            const compareYear = Number(selectedCompareYear || latestYear);
            return [latestYear, compareYear].map(year => ({
                year,
                values: (mapPayload.valuesByYear && mapPayload.valuesByYear[String(year)]) || {}
            }));
        }

        const card = button ? button.closest('.bq-map-card') : null;
        if (!card) {
            return [];
        }

        const yearNode = card.querySelector('.bq-map-year');
        const year = Number((yearNode && yearNode.textContent || '').trim());
        if (!Number.isFinite(year)) {
            return [];
        }

        return [{
            year,
            values: (mapPayload.valuesByYear && mapPayload.valuesByYear[String(year)]) || {}
        }];
    }

    function buildMapPopupHtml(params) {
        const geoDataJson = escapeScriptText(JSON.stringify(params.geoData));
        const mapsJson = escapeScriptText(JSON.stringify(params.maps));
        const scaleJson = escapeScriptText(JSON.stringify(params.scale));
        const selectedCodeJson = escapeScriptText(JSON.stringify(params.selectedCode));
        const indicatorTitleJson = escapeScriptText(JSON.stringify(params.title));
        const preferFullscreenJson = JSON.stringify(!!params.preferFullscreen);

        return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mapas departamentales</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>
body { margin: 0; font-family: Poppins, Arial, sans-serif; background: #f0f0f0; color: #333; }
.popup-wrap { min-height: 100dvh; padding: 12px; box-sizing: border-box; }
.popup-head { align-items: center; display: flex; justify-content: space-between; margin: 0 0 10px; }
.popup-title { font-size: 18px; font-weight: 700; margin: 0; }
.popup-fs-btn { background: #16a6a8; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-size: 12px; font-weight: 700; padding: 8px 12px; }
.popup-grid { display: grid; gap: 12px; grid-template-columns: repeat(${params.maps.length > 1 ? 2 : 1}, minmax(0, 1fr)); }
.popup-card { background: #fff; border: 1px solid #ddd; border-radius: 10px; overflow: hidden; min-height: 0; display: flex; flex-direction: column; }
.popup-year { background: #f6f6f6; font-weight: 700; padding: 8px 10px; }
.popup-map { height: calc(100dvh - 120px); min-height: 420px; }
@media (max-width: 1100px), (orientation: portrait) {
  .popup-grid { grid-template-columns: 1fr; }
  .popup-map { height: calc(100dvh - 150px); min-height: 380px; }
}
</style>
</head>
<body>
  <div class="popup-wrap">
    <div class="popup-head">
      <h1 class="popup-title">${'${indicatorTitle}'}</h1>
      <button class="popup-fs-btn" id="popup-fs-btn" type="button">Pantalla completa</button>
    </div>
    <div class="popup-grid" id="popup-grid"></div>
  </div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""><\/script>
<script>
const geoData = ${geoDataJson};
const mapItems = ${mapsJson};
const scale = ${scaleJson};
const selectedCode = ${selectedCodeJson};
const indicatorTitle = ${indicatorTitleJson};
const preferFullscreen = ${preferFullscreenJson};
document.querySelector('.popup-title').textContent = indicatorTitle || 'Mapas departamentales';

function requestFullscreenForPopup() {
  const target = document.documentElement;
  if (target.requestFullscreen) {
    target.requestFullscreen().catch(() => {});
    return;
  }
  if (target.webkitRequestFullscreen) {
    target.webkitRequestFullscreen();
  }
}

const fsBtn = document.getElementById('popup-fs-btn');
if (fsBtn) {
  fsBtn.addEventListener('click', requestFullscreenForPopup);
}

if (preferFullscreen) {
  setTimeout(requestFullscreenForPopup, 80);
}

function normalizeDeptCode(code) {
  const numeric = String(code || '').replace(/\\D+/g, '');
  return numeric.padStart(2, '0');
}

function mapColor(value, min, max) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '#d8d8d8';
  if (min === null || min === undefined || max === null || max === undefined || min === max) return '#f8961e';
  const ratio = Math.max(0, Math.min(1, (Number(value) - min) / (max - min)));
  if (ratio < 0.25) return '#fff5bf';
  if (ratio < 0.5) return '#ffd166';
  if (ratio < 0.75) return '#f8961e';
  return '#e85d04';
}

function formatMapPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/D';
  return Number(value).toFixed(2).replace('.', ',') + ' %';
}

const grid = document.getElementById('popup-grid');
const maps = [];

mapItems.forEach(item => {
  const card = document.createElement('div');
  card.className = 'popup-card';
  card.innerHTML = '<div class="popup-year">' + item.year + '</div><div class="popup-map" id="popup-map-' + item.year + '"></div>';
  grid.appendChild(card);

  const map = L.map('popup-map-' + item.year, {
    zoomControl: true,
    attributionControl: false,
    dragging: true,
    scrollWheelZoom: true
  });

  const layer = L.geoJSON(geoData, {
    style: feature => {
      const depCode = normalizeDeptCode(feature.properties.DPTO_CCDGO);
      const value = item.values[depCode];
      const selected = depCode === selectedCode;
      return {
        color: selected ? '#0d6e6f' : '#ffffff',
        weight: selected ? 2.8 : 1,
        fillColor: mapColor(value, scale.min, scale.max),
        fillOpacity: selected ? 0.92 : 0.82
      };
    },
    onEachFeature: (feature, layerItem) => {
      const depCode = normalizeDeptCode(feature.properties.DPTO_CCDGO);
      const depName = feature.properties.DPTO_CNMBR || feature.properties.name || depCode;
      const value = item.values[depCode];
      const highlightLabel = depCode === selectedCode ? ' (Seleccionado)' : '';
      layerItem.bindTooltip(depName + highlightLabel + '<br>' + formatMapPercent(value));
    }
  }).addTo(map);

  const bounds = layer.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [18, 18] });
  }

  maps.push(map);
});

window.addEventListener('resize', () => {
  maps.forEach(map => {
    map.invalidateSize();
  });
});
</script>
</body>
</html>`;
    }

    async function openMapsInNewWindow(button, options) {
        const opts = options || {};
        if (!mapPayload) {
            return;
        }

        const mapItems = getPopupMapItems(button);
        if (!mapItems.length) {
            return;
        }

        const width = (window.screen && window.screen.availWidth) ? window.screen.availWidth : 1400;
        const height = (window.screen && window.screen.availHeight) ? window.screen.availHeight : 900;
        const features = opts.forceFullWindow
            ? `left=0,top=0,width=${width},height=${height},resizable=yes,scrollbars=yes`
            : 'width=1400,height=900,resizable=yes,scrollbars=yes';

        const popup = window.open('', '_blank', features);
        if (!popup) {
            showError('El navegador bloqueo la nueva ventana. Habilita popups para ver los mapas ampliados.');
            return;
        }

        try {
            popup.opener = null;
        } catch (error) {
            // noop
        }

        if (opts.forceFullWindow) {
            try {
                popup.moveTo(0, 0);
                popup.resizeTo(width, height);
            } catch (error) {
                // noop
            }
        }

        const geoData = await loadMapGeoJson();
        const html = buildMapPopupHtml({
            geoData,
            maps: mapItems,
            scale: getMapScale(),
            selectedCode: normalizeDeptCode((mapPayload.meta && mapPayload.meta.selectedCode) || ''),
            title: mapPayload.title || activeIndicator || 'Mapas departamentales',
            preferFullscreen: !!opts.forceFullWindow
        });

        popup.document.open();
        popup.document.write(html);
        popup.document.close();
    }

    function renderMapCompareSafe() {
        renderMapCompare().catch(error => {
            clearMapPanel(error && error.message ? error.message : 'No fue posible cargar los mapas departamentales.');
        });
    }

    function updateDownloadContext(indicator, codigoD) {
        downloadContext = { indicator, codigoD };
    }

    function showChartView() {
        const iframe = el('tablero');
        const chartView = el('bq-chart-view');
        if (iframe) iframe.style.display = 'none';
        if (chartView) chartView.style.display = 'block';
        setTableIconVisible(true);
        setMapIconVisible(true);
        updateMapModeLayout();
        setBQSubTab(currentBQSubTab);
    }

    function setLoading(isLoading) {
        const dim = el('bq-screen-dim');
        const loading = el('bq-chart-loading');
        if (dim) dim.style.display = isLoading ? 'block' : 'none';
        if (loading) loading.style.display = isLoading ? 'flex' : 'none';
    }

    function hideChartView() {
        const iframe = el('tablero');
        const chartView = el('bq-chart-view');
        const errorBox = el('bq-chart-error');
        setLoading(false);
        if (iframe) iframe.style.display = 'block';
        if (chartView) chartView.style.display = 'none';
        if (errorBox) errorBox.style.display = 'none';
        setTableIconVisible(false);
        setMapIconVisible(false);
        mapPayload = null;
        mapPageIndex = 0;
        clearMapPanel('No hay datos para construir mapas departamentales.');
        currentBQSubTab = 'grafica';
        setActiveSidebarIcon('grafica');
        clearRawTable('No hay datos crudos para este filtro.');
    }

    function showError(message) {
        const errorBox = el('bq-chart-error');
        if (!errorBox) return;

        const safeMessage = (message || '').trim();
        errorBox.textContent = safeMessage;
        errorBox.style.display = safeMessage ? 'block' : 'none';
    }

    function computeSuggestedMax(values) {
        const maxValue = Math.max(...values.filter(v => v !== null && v !== undefined), 0);
        const padded = maxValue * 1.25;
        const rounded = Math.ceil(padded);
        const evenMax = rounded % 2 === 0 ? rounded : rounded + 1;
        return Math.max(6, evenMax);
    }

    function renderChart(data) {
        const canvas = el('bq-chart-canvas');
        if (!canvas) return;

        if (chartInstance) {
            chartInstance.destroy();
        }

        const years = data.series.years || [];
        const nacional = data.series.nacional || [];
        const departamental = data.series.departamental || [];
        const maxY = computeSuggestedMax([...nacional, ...departamental]);

        chartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Nacional',
                        data: nacional,
                        borderColor: '#e5167a',
                        backgroundColor: '#e5167a',
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 5,
                        tension: 0
                    },
                    {
                        label: 'Departamental',
                        data: departamental,
                        borderColor: '#16a6a8',
                        backgroundColor: '#16a6a8',
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 5,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${formatPercent(context.parsed.y)}`;
                            }
                        }
                    },
                    datalabels: {
                        display: function (ctx) {
                            return ctx.datasetIndex === 1;
                        },
                        align: 'top',
                        offset: 8,
                        color: '#16a6a8',
                        font: {
                            weight: '700',
                            size: 14
                        },
                        formatter: function (value) {
                            return formatPercent(value);
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#5f5f5f',
                            font: {
                                size: 18
                            }
                        }
                    },
                    y: {
                        min: 0,
                        max: maxY,
                        ticks: {
                            stepSize: 1,
                            color: '#5f5f5f',
                            callback: function (value) {
                                return value % 2 === 0 ? `${value}%` : '';
                            },
                            font: {
                                size: 18
                            }
                        },
                        grid: {
                            color: '#c6c6c6'
                        },
                        title: {
                            display: true,
                            text: 'Porcentaje',
                            color: '#4d4d4d',
                            font: {
                                family: 'Poppins, sans-serif',
                                style: 'italic',
                                size: 16,
                                weight: 'normal'
                            }
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    async function renderBQChart(indicator, codigoD, regionLabel) {
        if (!isBQIndicator(indicator)) {
            hideChartView();
            return;
        }

        activeIndicator = indicator;
        showChartView();
        setLoading(true);
        showError('');
        clearRawTable('Cargando datos crudos...');
        clearMapPanel('Cargando mapas...');
        mapPayload = null;
        mapPageIndex = 0;
        updateDownloadContext(indicator, codigoD);

        const params = new URLSearchParams({ indicator, codigoD });

        try {
            const [response, rawResult, mapResult] = await Promise.all([
                fetch(`${apiEndpoint}?${params.toString()}`),
                fetchRawData(indicator, codigoD).then(data => ({ ok: true, data })).catch(err => ({ ok: false, error: err })),
                fetchMapData(indicator, codigoD).then(data => ({ ok: true, data })).catch(err => ({ ok: false, error: err }))
            ]);
            const payload = await response.json();

            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || 'No fue posible cargar la grafica.');
            }

            if (activeIndicator !== indicator) {
                setLoading(false);
                return;
            }

            setText('bq-chart-title', payload.title || indicator);
            setText('bq-kpi-national', formatPercent(payload.kpis.nacional_2024));
            setText('bq-kpi-department', formatPercent(payload.kpis.departamento_2024));
            setText('bq-kpi-municipality', 'N/D');
            setText('bq-chart-source', payload.meta.source || '');
            setText('bq-chart-region', regionLabel || 'N/D');

            renderChart(payload);
            if (rawResult.ok) {
                renderRawTable(rawResult.data);
            } else {
                clearRawTable('No fue posible cargar la tabla de datos crudos.');
            }

            if (mapResult.ok) {
                mapPayload = mapResult.data;
                mapPageIndex = 0;
            } else {
                mapPayload = null;
                clearMapPanel('No fue posible cargar los mapas departamentales.');
            }
            setBQSubTab(currentBQSubTab);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            showError(error.message || 'No fue posible cargar la grafica.');
            setText('bq-chart-title', 'Sin datos disponibles');
            setText('bq-kpi-national', 'N/D');
            setText('bq-kpi-department', 'N/D');
            setText('bq-kpi-municipality', 'N/D');
            clearRawTable('No fue posible cargar la tabla de datos crudos.');
            mapPayload = null;
            clearMapPanel('No fue posible cargar los mapas departamentales.');
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
        }
    }

    const downloadBtn = el('bq-download-csv');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!downloadContext) return;
            const params = new URLSearchParams(downloadContext);
            window.open(`${exportApiEndpoint}?${params.toString()}`, '_blank');
        });
    }

    const mapPrevBtn = el('bq-map-prev');
    if (mapPrevBtn) {
        mapPrevBtn.addEventListener('click', function () {
            if (!mapPayload || mapPageIndex <= 0) return;
            mapPageIndex -= 1;
            renderMapPageSafe();
        });
    }

    const mapViewSeriesBtn = el('bq-map-view-series');
    if (mapViewSeriesBtn) {
        mapViewSeriesBtn.addEventListener('click', function () {
            setMapView('series');
        });
    }

    const mapViewCompareBtn = el('bq-map-view-compare');
    if (mapViewCompareBtn) {
        mapViewCompareBtn.addEventListener('click', function () {
            setMapView('compare');
        });
    }

    const mapCompareYearSelect = el('bq-map-compare-year');
    if (mapCompareYearSelect) {
        mapCompareYearSelect.addEventListener('change', function () {
            selectedCompareYear = Number(this.value);
            if (currentBQSubTab === 'mapa' && currentMapView === 'compare' && mapPayload) {
                renderMapCompareSafe();
            }
        });
    }

    const mapNextBtn = el('bq-map-next');
    if (mapNextBtn) {
        mapNextBtn.addEventListener('click', function () {
            if (!mapPayload) return;
            const totalPages = Math.ceil((mapPayload.years || []).length / MAPS_PER_PAGE);
            if (mapPageIndex >= totalPages - 1) return;
            mapPageIndex += 1;
            renderMapPageSafe();
        });
    }

    const mapPanel = el('bq-map-panel');
    if (mapPanel) {
        mapPanel.addEventListener('click', function (event) {
            const btn = event.target.closest('.bq-map-fullscreen-btn');
            if (!btn) {
                return;
            }

            openMapsInNewWindow(btn, { forceFullWindow: true }).catch(() => {
                showError('No fue posible abrir la ventana ampliada de mapas.');
            });
        });
    }

    document.addEventListener('fullscreenchange', function () {
        setTimeout(invalidateMapSizes, 120);
    });

    document.addEventListener('webkitfullscreenchange', function () {
        setTimeout(invalidateMapSizes, 120);
    });

    window.addEventListener('resize', function () {
        setTimeout(invalidateMapSizes, 120);
    });

    window.addEventListener('orientationchange', function () {
        setTimeout(invalidateMapSizes, 180);
    });

    window.handleBQContentType = function (tipo) {
        if (!isBQModeActive()) {
            return false;
        }

        if (tipo === 'grafica' || tipo === 'tabla' || tipo === 'mapa') {
            setBQSubTab(tipo);
            return true;
        }

        return false;
    };

    window.isBQIndicator = isBQIndicator;
    window.renderBQChart = renderBQChart;
    window.hideBQChartView = hideChartView;

    updateMapModeLayout();
})();
