(function () {
    let chartInstance = null;
    let activeIndicator = null;
    let currentBQSubTab = 'grafica';

    const BQ_SUFFIX = '_BQ';
    const apiEndpoint = 'api/charts_bq.php';
    const rawApiEndpoint = 'api/charts_bq_raw.php';
    const exportApiEndpoint = 'api/charts_bq_export.php';
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

        if (!chartPanel || !tablePanel) return;

        if (view === 'tabla') {
            chartPanel.style.display = 'none';
            tablePanel.style.display = 'block';
            currentBQSubTab = 'tabla';
            setActiveSidebarIcon('tabla');
            return;
        }

        chartPanel.style.display = 'block';
        tablePanel.style.display = 'none';
        currentBQSubTab = 'grafica';
        setActiveSidebarIcon('grafica');
    }

    function isBQModeActive() {
        const chartView = el('bq-chart-view');
        return !!(activeIndicator && isBQIndicator(activeIndicator) && chartView && chartView.style.display !== 'none');
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

    function updateDownloadContext(indicator, codigoD) {
        downloadContext = { indicator, codigoD };
    }

    function showChartView() {
        const iframe = el('tablero');
        const chartView = el('bq-chart-view');
        if (iframe) iframe.style.display = 'none';
        if (chartView) chartView.style.display = 'block';
        setTableIconVisible(true);
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
        updateDownloadContext(indicator, codigoD);

        const params = new URLSearchParams({ indicator, codigoD });

        try {
            const [response, rawResult] = await Promise.all([
                fetch(`${apiEndpoint}?${params.toString()}`),
                fetchRawData(indicator, codigoD).then(data => ({ ok: true, data })).catch(err => ({ ok: false, error: err }))
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

    window.handleBQContentType = function (tipo) {
        if (!isBQModeActive()) {
            return false;
        }

        if (tipo === 'grafica' || tipo === 'tabla') {
            setBQSubTab(tipo);
            return true;
        }

        return false;
    };

    window.isBQIndicator = isBQIndicator;
    window.renderBQChart = renderBQChart;
    window.hideBQChartView = hideChartView;
})();
