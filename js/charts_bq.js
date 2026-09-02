(function () {
    let chartInstance = null;
    let activeIndicator = null;
    let activeRequestKey = null;
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
    const MUNICIPAL_INDICATORS = new Set([
        'Ins_Alimentaria_Mun_22_BQ',
        'IPMultidimensional_Mun_BQ',
        'Pobreza_Monetaria_Mun_BQ'
    ]);
    let downloadContext = null;
    // Sufijo de la unidad del indicador activo (%, ha, ha/anio). Lo informa el
    // API en meta.unidad: no todos los indicadores son porcentajes.
    let unidadActual = '%';

    function el(id) {
        return document.getElementById(id);
    }

    function isBQIndicator(indicator) {
        return typeof indicator === 'string' && indicator.endsWith(BQ_SUFFIX);
    }

    // Nombre legible de la unidad, para el titulo del eje Y.
    function nombreUnidad(u) {
        if (u === 'ha') { return 'Hectáreas'; }
        if (u === 'ha/año') { return 'Hectáreas por año'; }
        return 'Porcentaje';
    }

    // Los porcentajes se leen con dos decimales; las magnitudes absolutas
    // (hectareas) sin decimales, que a millones no aportan nada.
    function decimalesDeUnidad(u) {
        return u === '%' ? 2 : 0;
    }

    // 'es-CO' da separador de miles '.' y decimal ','.
    function formatearNumero(value, unidad) {
        const d = decimalesDeUnidad(unidad);
        return Number(value).toLocaleString('es-CO', {
            minimumFractionDigits: d,
            maximumFractionDigits: d
        });
    }

    function formatPercent(value) {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return 'N/D';
        }

        return `${formatearNumero(value, unidadActual)} ${unidadActual}`;
    }

    // Con white-space: nowrap el numero no se parte, pero uno muy largo se
    // saldria de la tarjeta. Se reduce la fuente hasta que quepa; truncarlo con
    // puntos suspensivos perderia digitos, que en una cifra no es aceptable.
    function ajustarTamanoKPI() {
        document.querySelectorAll('.bq-kpi-card').forEach(function (card) {
            const valor = card.querySelector('.bq-kpi-value');
            if (!valor) { return; }

            const base = parseFloat(getComputedStyle(card).getPropertyValue('--kpi-font-base')) || 27;
            valor.style.fontSize = base + 'px';

            let tam = base;
            // 15px es el piso: por debajo el dato deja de leerse de un vistazo.
            while (tam > 15 && valor.scrollWidth > valor.clientWidth) {
                tam -= 1;
                valor.style.fontSize = tam + 'px';
            }
        });
    }

    function setText(id, value) {
        const node = el(id);
        if (node) {
            node.textContent = value;
        }
    }

    function setDownloadEnabled(enabled) {
        const btn = el('bq-download-excel');
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
        return `${formatearNumero(value, unidadActual)} ${unidadActual}`;
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

    function getSortedYearsDesc() {
        const years = Array.isArray(mapPayload && mapPayload.years) ? mapPayload.years : [];
        return years.slice().sort((a, b) => Number(b) - Number(a));
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

        const mostrarIndicador = rawPayload.territoryLevel === 'municipio';
        const cols = (rawPayload.columns || [])
            .filter(col => col !== 'Indicador_filtro' || mostrarIndicador)
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

    /*
     * Cache de sesion. El cache del servidor ya evita el viaje a BigQuery; este
     * evita repetir la peticion entera. El caso concreto es cambiar de municipio
     * dentro del mismo departamento: actualizarTablero() vuelve a llamar a
     * renderBQChart con el mismo codigoD y hoy repite las tres peticiones para
     * obtener exactamente lo mismo.
     */
    const sessionCachePrefix = 'bq:v2:';
    const generacionKey = 'bq:generation';
    const versionEndpoint = 'api/bq_cache_version.php';

    /*
     * Sello de generacion.
     *
     * El cache de abajo no revalida a proposito: es lo que lo hace instantaneo
     * al cambiar de municipio. Validar cada lectura contra el servidor haria la
     * peticion igual y solo ahorraria el cuerpo de la respuesta, perdiendo el
     * beneficio. En cambio se comprueba UNA vez por carga: si el servidor
     * cambio de sello (alguien purgo), se vacia todo lo guardado.
     */
    function vaciarCacheSesion() {
        try {
            Object.keys(sessionStorage)
                .filter(function (k) { return k.indexOf(sessionCachePrefix) === 0; })
                .forEach(function (k) { sessionStorage.removeItem(k); });
        } catch (error) {
            // Navegacion privada o cuota: no hay nada que vaciar.
        }
    }

    async function comprobarGeneracion() {
        try {
            const respuesta = await fetch(versionEndpoint, { cache: 'no-store' });
            if (!respuesta.ok) { return; }

            const datos = await respuesta.json();
            const actual = datos && datos.generation ? String(datos.generation) : '';
            if (actual === '') { return; }

            const guardada = sessionStorage.getItem(generacionKey);
            if (guardada !== actual) {
                vaciarCacheSesion();
                sessionStorage.setItem(generacionKey, actual);
            }
        } catch (error) {
            // Fallar en abierto: un problema de red no debe dejar la app sin
            // cache ni borrar lo que ya tiene.
        }
    }

    let generacionLista = comprobarGeneracion();

    // Al volver a la pestana se recomprueba: cubre tener el tablero abierto
    // mientras se purga desde otro sitio, sin necesidad de sondeo.
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            generacionLista = comprobarGeneracion();
        }
    });

    function sessionCacheGet(key) {
        try {
            const raw = sessionStorage.getItem(sessionCachePrefix + key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null; // Navegacion privada o cuota llena: se sigue sin cache.
        }
    }

    function sessionCacheSet(key, payload) {
        try {
            sessionStorage.setItem(sessionCachePrefix + key, JSON.stringify(payload));
        } catch (error) {
            // Sin cache de sesion todo funciona igual, solo que se vuelve a pedir.
        }
    }

    async function fetchJson(url, cacheKey, errorMessage) {
        // Sin esto se podria servir una entrada de la generacion anterior antes
        // de que llegue la comprobacion. Solo cuesta la primera vez.
        await generacionLista;

        const cached = sessionCacheGet(cacheKey);
        if (cached) {
            return cached;
        }

        const response = await fetch(url);
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
            throw new Error(payload.error || errorMessage);
        }

        sessionCacheSet(cacheKey, payload);

        return payload;
    }

    async function fetchChartData(indicator, codigoD, codigoM) {
        const params = new URLSearchParams({ indicator, codigoD });
        if (codigoM) params.set('codigoM', codigoM);
        return fetchJson(
            `${apiEndpoint}?${params.toString()}`,
            `chart:${indicator}:${codigoD}:${codigoM || ''}`,
            'No fue posible cargar la grafica.'
        );
    }

    async function fetchRawData(indicator, codigoD, codigoM) {
        const params = new URLSearchParams({ indicator, codigoD });
        if (codigoM) params.set('codigoM', codigoM);
        return fetchJson(
            `${rawApiEndpoint}?${params.toString()}`,
            `raw:${indicator}:${codigoD}:${codigoM || ''}`,
            'No fue posible cargar la tabla de datos crudos.'
        );
    }

    async function fetchMapData(indicator, codigoD) {
        const params = new URLSearchParams({ indicator, codigoD });
        // La clave lleva codigoD porque meta.selectedCode cambia con el departamento.
        return fetchJson(
            `${mapApiEndpoint}?${params.toString()}`,
            `map:${indicator}:${codigoD}`,
            'No fue posible cargar los mapas departamentales.'
        );
    }

    async function renderMapPage() {
        const renderVersion = ++mapRenderVersion;
        const indicatorAtStart = activeIndicator;
        if (!mapPayload || !isBQIndicator(indicatorAtStart)) {
            clearMapPanel('No hay datos para construir mapas departamentales.');
            return;
        }

        const years = getSortedYearsDesc();
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
        const fallbackYear = compareCandidates[0] || latestYear;

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

        const years = getSortedYearsDesc();
        if (!years.length) {
            clearMapPanel('No hay años disponibles para este indicador.');
            return;
        }

        const latestYear = years[0];
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

        const years = getSortedYearsDesc();
        if (currentMapView === 'compare') {
            const latestYear = years[0];
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
        const unidadJson = escapeScriptText(JSON.stringify(params.unidad || '%'));

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
const unidad = ${unidadJson};
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
  var d = unidad === '%' ? 2 : 0;
  return Number(value).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' ' + unidad;
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
            unidad: unidadActual,
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

    function updateDownloadContext(indicator, codigoD, codigoM) {
        downloadContext = { indicator, codigoD };
        if (codigoM) downloadContext.codigoM = codigoM;
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

    function indicatorDisplayName(indicator) {
        const items = document.querySelectorAll('#horizontal-menu a.submenu-item');
        for (const item of items) {
            const match = (item.getAttribute('onclick') || '').match(/cambiarMapa\('([^']+)'\)/);
            if (match && match[1] === indicator) {
                return item.textContent.trim();
            }
        }

        return indicator || 'Indicador';
    }

    function setLoading(isLoading, indicator, selectionLabel) {
        const dim = el('bq-screen-dim');
        const loading = el('bq-chart-loading');
        const chartView = el('bq-chart-view');
        if (isLoading) {
            setText('bq-loading-title', indicatorDisplayName(indicator));
            setText(
                'bq-loading-region',
                selectionLabel ? `Selección territorial: ${selectionLabel}` : 'Preparando la selección territorial…'
            );
        }
        if (dim) dim.style.display = isLoading ? 'block' : 'none';
        if (loading) loading.style.display = isLoading ? 'flex' : 'none';
        if (chartView) chartView.setAttribute('aria-busy', isLoading ? 'true' : 'false');
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
        activeIndicator = null;
        activeRequestKey = null;
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

    // Devuelve los limites del eje Y. No puede asumir 0-100: hay indicadores en
    // hectareas (millones) y otros con series enteramente negativas, como el
    // cambio de bosque y la tasa de deforestacion.
    function computeYBounds(values) {
        const limpios = values.filter(v => v !== null && v !== undefined && !Number.isNaN(Number(v))).map(Number);
        const esPorcentaje = unidadActual === '%';
        if (!limpios.length) {
            return { min: 0, max: 6, esPorcentajeChico: esPorcentaje };
        }

        const maxValue = Math.max(...limpios);
        const minValue = Math.min(...limpios);

        // Los porcentajes positivos conservan la escala entera y nunca superan
        // 100 %. El resto de unidades mantiene una escala libre.
        const esPorcentajeChico = esPorcentaje && minValue >= 0;
        if (esPorcentajeChico) {
            const factorMargen = maxValue > 100 ? 1.05 : 1.25;
            const rounded = Math.ceil(maxValue * factorMargen);
            const evenMax = rounded % 2 === 0 ? rounded : rounded + 1;
            // Un estimado municipal puede superar levemente 100 %. Se conserva
            // tal como llega y se amplia el eje para que el punto no se recorte.
            const maxPorcentaje = maxValue > 100 ? evenMax : Math.min(100, evenMax);
            return { min: 0, max: Math.max(6, maxPorcentaje), esPorcentajeChico: true };
        }

        const span = (maxValue - minValue) || Math.abs(maxValue) || 1;
        const pad = span * 0.15;
        return {
            min: minValue < 0 ? minValue - pad : 0,
            max: esPorcentaje ? Math.min(100, maxValue + pad) : maxValue + pad,
            esPorcentajeChico: false
        };
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
        const municipal = data.series.municipal || [];
        const esMunicipal = data.territoryLevel === 'municipio';
        const limitesY = computeYBounds([...nacional, ...departamental, ...municipal]);

        // Con uno o dos cortes una linea no comunica nada: son uno o dos puntos
        // sueltos. En ese caso se comparan Nacional y Departamento con barras.
        const esBarras = years.length <= 2;

        const leyenda = document.querySelector('.bq-custom-legend');
        if (leyenda) { leyenda.classList.toggle('barras', esBarras); }
        const leyendaMunicipal = el('bq-legend-municipality');
        if (leyendaMunicipal) { leyendaMunicipal.style.display = esMunicipal ? '' : 'none'; }

        // Una barra muy corta no tiene sitio para la etiqueta dentro: en ese
        // caso va encima y en el color de la serie, no en blanco.
        function barraCorta(ctx) {
            const v = Math.abs(Number(ctx.dataset.data[ctx.dataIndex]) || 0);
            const tope = Math.max(Math.abs(limitesY.max), Math.abs(limitesY.min)) || 1;
            return (v / tope) < 0.14;
        }

        chartInstance = new Chart(canvas, {
            type: esBarras ? 'bar' : 'line',
            data: {
                labels: years,
                datasets: [
                    Object.assign({
                        label: 'Nacional',
                        data: nacional,
                        borderColor: '#e5167a',
                        backgroundColor: '#e5167a'
                    }, esBarras
                        ? { borderWidth: 0, maxBarThickness: 90 }
                        : { borderWidth: 3, pointRadius: 4, pointHoverRadius: 5, tension: 0 }),
                    Object.assign({
                        label: 'Departamental',
                        data: departamental,
                        borderColor: '#16a6a8',
                        backgroundColor: '#16a6a8'
                    }, esBarras
                        ? { borderWidth: 0, maxBarThickness: 90 }
                        : { borderWidth: 3, pointRadius: 4, pointHoverRadius: 5, tension: 0 }),
                    ...(esMunicipal ? [Object.assign({
                        label: 'Municipal',
                        data: municipal,
                        borderColor: '#f08600',
                        backgroundColor: '#f08600',
                        // Une cortes municipales no consecutivos para comunicar
                        // tendencia, pero distingue visualmente la interpolacion.
                        spanGaps: true,
                        segment: {
                            borderDash: function (ctx) {
                                const salto = Math.abs(ctx.p1DataIndex - ctx.p0DataIndex);
                                return ctx.p0.skip || ctx.p1.skip || salto > 1 ? [7, 6] : undefined;
                            }
                        }
                    }, esBarras
                        ? { borderWidth: 0, maxBarThickness: 90 }
                        : { borderWidth: 3, pointRadius: 4, pointHoverRadius: 5, tension: 0 })] : [])
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // Al acercarse a cualquiera de las dos series, el tooltip se
                // resuelve por año y muestra juntos Nacional y Departamental.
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${formatPercent(context.parsed.y)}`;
                            }
                        }
                    },
                    datalabels: {
                        // En barras se rotula cada una; en linea solo el nivel
                        // territorial mas detallado, para no saturar la serie.
                        display: function (ctx) {
                            return esBarras ? true : ctx.datasetIndex === (esMunicipal ? 2 : 1);
                        },
                        anchor: esBarras ? 'end' : undefined,
                        align: function (ctx) {
                            if (esBarras) { return barraCorta(ctx) ? 'end' : 'start'; }
                            if (ctx.dataIndex === 0) { return 'right'; }
                            if (ctx.dataIndex === years.length - 1) { return 'left'; }
                            return 'top';
                        },
                        offset: esBarras ? 6 : 8,
                        color: function (ctx) {
                            if (!esBarras) { return esMunicipal ? '#f08600' : '#16a6a8'; }
                            return barraCorta(ctx) ? ctx.dataset.backgroundColor : '#fff';
                        },
                        font: {
                            weight: '700',
                            size: 12
                        },
                        formatter: function (value) {
                            return formatPercent(value);
                        }
                    }
                },
                scales: {
                    x: {
                        // Los anios llegan como numeros. Forzar escala de categorias
                        // evita que Chart.js interprete los indices 0..N como valores
                        // sobre un eje lineal 2018..2025 y comprima los puntos al inicio.
                        type: 'category',
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#5f5f5f',
                            font: {
                                size: 13
                            }
                        }
                    },
                    y: {
                        min: limitesY.min,
                        max: limitesY.max,
                        ticks: {
                            // stepSize fijo solo sirve en la escala 0-100; en hectareas
                            // generaria millones de marcas.
                            stepSize: limitesY.esPorcentajeChico ? 1 : undefined,
                            color: '#5f5f5f',
                            callback: function (value) {
                                if (limitesY.esPorcentajeChico) {
                                    return value % 2 === 0 ? `${value}${unidadActual}` : '';
                                }
                                return `${formatearNumero(value, unidadActual)} ${unidadActual}`;
                            },
                            font: {
                                size: 13
                            }
                        },
                        grid: {
                            color: '#c6c6c6'
                        },
                        title: {
                            display: true,
                            // Estaba fijo en 'Porcentaje': mentia en los
                            // indicadores medidos en hectareas.
                            text: nombreUnidad(unidadActual),
                            color: '#4d4d4d',
                            font: {
                                family: 'Poppins, sans-serif',
                                style: 'italic',
                                size: 13,
                                weight: 'normal'
                            }
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    async function renderBQChart(indicator, territoryContext) {
        if (!isBQIndicator(indicator)) {
            hideChartView();
            return;
        }

        const context = territoryContext || {};
        const codigoD = context.codigoD || '';
        const codigoM = MUNICIPAL_INDICATORS.has(indicator) ? (context.codigoM || '') : '';
        const selectionParts = [context.regionLabel, context.departmentLabel];
        if (codigoM) selectionParts.push(context.municipalityLabel);
        const selectionLabel = selectionParts.filter(Boolean).join(' · ') || 'N/D';
        const requestKey = `${indicator}:${codigoD}:${codigoM}`;

        activeIndicator = indicator;
        activeRequestKey = requestKey;
        showChartView();
        setLoading(true, indicator, selectionLabel);
        showError('');
        clearRawTable('Cargando datos crudos...');
        clearMapPanel('Cargando mapas...');
        mapPayload = null;
        mapPageIndex = 0;
        updateDownloadContext(indicator, codigoD, codigoM);

        try {
            const [payload, rawResult, mapResult] = await Promise.all([
                fetchChartData(indicator, codigoD, codigoM),
                fetchRawData(indicator, codigoD, codigoM).then(data => ({ ok: true, data })).catch(err => ({ ok: false, error: err })),
                fetchMapData(indicator, codigoD).then(data => ({ ok: true, data })).catch(err => ({ ok: false, error: err }))
            ]);

            if (activeRequestKey !== requestKey) {
                return;
            }

            unidadActual = (payload.meta && payload.meta.unidad) || '%';
            setText('bq-chart-title', payload.title || indicator);
            setText('bq-kpi-national', formatPercent(payload.kpis.nacional));
            setText('bq-kpi-department', formatPercent(payload.kpis.departamento));
            setText('bq-kpi-municipality', formatPercent(payload.kpis.municipio));
            document.querySelectorAll('.bq-kpi-year').forEach(function (node) {
                node.textContent = payload.kpiYear != null ? payload.kpiYear : '';
            });
            ajustarTamanoKPI();
            setText('bq-chart-source', payload.meta.source || '');
            setText('bq-chart-region', selectionLabel);

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
            if (activeRequestKey !== requestKey) {
                return;
            }
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

    const downloadBtn = el('bq-download-excel');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!downloadContext) return;
            const params = new URLSearchParams(downloadContext);
            const link = document.createElement('a');
            link.href = `${exportApiEndpoint}?${params.toString()}`;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            link.remove();
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

    window.addEventListener('resize', ajustarTamanoKPI);

    window.isBQIndicator = isBQIndicator;
    window.renderBQChart = renderBQChart;
    window.hideBQChartView = hideChartView;

    updateMapModeLayout();
})();
