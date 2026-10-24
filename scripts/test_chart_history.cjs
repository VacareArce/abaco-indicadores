'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const chartsPath = path.join(__dirname, '..', 'js', 'charts_bq.js');
const source = fs.readFileSync(chartsPath, 'utf8');
const marker = '    window.isBQIndicator = isBQIndicator;';

assert.ok(
    source.includes(marker),
    `No se encontro el marcador de exposicion en ${chartsPath}`
);

// La funcion se mantiene privada en produccion. El test solo la expone en el
// sandbox de vm antes de que la IIFE publique sus APIs normales.
const testSource = source.replace(
    marker,
    `    window.__test = { selectHistoryWindow };\n${marker}`
);

function createStorage() {
    const values = Object.create(null);
    return {
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
        },
        setItem(key, value) {
            values[key] = String(value);
        },
        removeItem(key) {
            delete values[key];
        }
    };
}

function loadSelector() {
    const sessionStorage = createStorage();
    const document = {
        visibilityState: 'visible',
        getElementById() {
            return null;
        },
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        addEventListener() {}
    };
    const window = {
        addEventListener() {},
        requestAnimationFrame() {}
    };
    const fetch = async (url) => {
        assert.equal(url, 'api/bq_cache_version.php');
        return {
            ok: true,
            async json() {
                return { generation: 'test-generation' };
            }
        };
    };

    window.window = window;
    window.document = document;
    window.fetch = fetch;

    const sandbox = {
        window,
        document,
        sessionStorage,
        fetch,
        URLSearchParams,
        setTimeout() {},
        clearTimeout() {},
        console
    };

    vm.createContext(sandbox);
    vm.runInContext(testSource, sandbox, { filename: chartsPath });

    assert.equal(typeof sandbox.window.__test?.selectHistoryWindow, 'function');
    return sandbox.window.__test.selectHistoryWindow;
}

const selectHistoryWindow = loadSelector();
let cases = 0;

function check(name, input, expected) {
    const original = structuredClone(input);
    const actual = selectHistoryWindow(input);
    const comparable = {
        years: Array.from(actual.years || []),
        nacional: Array.from(actual.nacional || []),
        departamental: Array.from(actual.departamental || []),
        municipal: Array.from(actual.municipal || [])
    };
    assert.deepEqual(comparable, expected, name);
    assert.deepEqual(input, original, `${name}: no debe mutar la fuente`);
    cases += 1;
}

check(
    'recorta a los ultimos once anos usando el maximo disponible',
    {
        years: Array.from({ length: 16 }, (_, i) => 2020 + i),
        nacional: Array.from({ length: 16 }, (_, i) => `n${2020 + i}`),
        departamental: Array.from({ length: 16 }, (_, i) => `d${2020 + i}`),
        municipal: Array.from({ length: 16 }, (_, i) => `m${2020 + i}`)
    },
    {
        years: Array.from({ length: 11 }, (_, i) => 2025 + i),
        nacional: Array.from({ length: 11 }, (_, i) => `n${2025 + i}`),
        departamental: Array.from({ length: 11 }, (_, i) => `d${2025 + i}`),
        municipal: Array.from({ length: 11 }, (_, i) => `m${2025 + i}`)
    }
);

check(
    'conserva exactamente once anos',
    {
        years: Array.from({ length: 11 }, (_, i) => 2015 + i),
        nacional: Array.from({ length: 11 }, (_, i) => i),
        departamental: Array.from({ length: 11 }, (_, i) => i + 10),
        municipal: Array.from({ length: 11 }, (_, i) => i + 20)
    },
    {
        years: Array.from({ length: 11 }, (_, i) => 2015 + i),
        nacional: Array.from({ length: 11 }, (_, i) => i),
        departamental: Array.from({ length: 11 }, (_, i) => i + 10),
        municipal: Array.from({ length: 11 }, (_, i) => i + 20)
    }
);

check(
    'mantiene los anos validos aunque haya saltos',
    {
        years: [2010, 2014, 2015, 2020, 2025],
        nacional: ['n10', 'n14', 'n15', 'n20', 'n25'],
        departamental: ['d10', 'd14', 'd15', 'd20', 'd25'],
        municipal: ['m10', 'm14', 'm15', 'm20', 'm25']
    },
    {
        years: [2015, 2020, 2025],
        nacional: ['n15', 'n20', 'n25'],
        departamental: ['d15', 'd20', 'd25'],
        municipal: ['m15', 'm20', 'm25']
    }
);

check(
    'conserva los ultimos dos cortes',
    {
        years: [2024, 2025],
        nacional: [4, 5],
        departamental: [14, 15],
        municipal: [24, 25]
    },
    {
        years: [2024, 2025],
        nacional: [4, 5],
        departamental: [14, 15],
        municipal: [24, 25]
    }
);

check(
    'preserva nulos y ceros',
    {
        years: [2015, 2020, 2025],
        nacional: [null, 0, 2],
        departamental: [0, null, 3],
        municipal: [null, 0, 4]
    },
    {
        years: [2015, 2020, 2025],
        nacional: [null, 0, 2],
        departamental: [0, null, 3],
        municipal: [null, 0, 4]
    }
);

check(
    'devuelve arreglos vacios para entrada vacia',
    { years: [], nacional: [], departamental: [], municipal: [] },
    { years: [], nacional: [], departamental: [], municipal: [] }
);

check(
    'crea municipal vacio si la serie no existe',
    { years: [2020, 2025], nacional: [1, 2], departamental: [3, 4] },
    { years: [2020, 2025], nacional: [1, 2], departamental: [3, 4], municipal: [] }
);

check(
    'crea municipal vacio si la serie esta vacia',
    { years: [2020, 2025], nacional: [1, 2], departamental: [3, 4], municipal: [] },
    { years: [2020, 2025], nacional: [1, 2], departamental: [3, 4], municipal: [] }
);

check(
    'convierte anos numericos, descarta invalidos y alinea el orden',
    {
        years: ['2025', 'no-es-ano', 2017, 2020.5, '2018', '', null, true],
        nacional: ['n25', 'invalid', 'n17', 'fraction', 'n18', 'empty', 'null', 'bool'],
        departamental: ['d25', 'invalid', 'd17', 'fraction', 'd18', 'empty', 'null', 'bool'],
        municipal: ['m25', 'invalid', 'm17', 'fraction', 'm18', 'empty', 'null', 'bool']
    },
    {
        years: [2017, 2018, 2025],
        nacional: ['n17', 'n18', 'n25'],
        departamental: ['d17', 'd18', 'd25'],
        municipal: ['m17', 'm18', 'm25']
    }
);

check(
    'ordena anos validos ascendentes sin perder sus valores',
    {
        years: ['2022', 2018, 2021, 2020],
        nacional: ['n22', 'n18', 'n21', 'n20'],
        departamental: ['d22', 'd18', 'd21', 'd20'],
        municipal: ['m22', 'm18', 'm21', 'm20']
    },
    {
        years: [2018, 2020, 2021, 2022],
        nacional: ['n18', 'n20', 'n21', 'n22'],
        departamental: ['d18', 'd20', 'd21', 'd22'],
        municipal: ['m18', 'm20', 'm21', 'm22']
    }
);

check(
    'si todos los anos son invalidos devuelve series vacias',
    {
        years: ['x', '', null, undefined, 2020.5, Infinity],
        nacional: [1, 2, 3, 4, 5, 6],
        departamental: [7, 8, 9, 10, 11, 12],
        municipal: [13, 14, 15, 16, 17, 18]
    },
    { years: [], nacional: [], departamental: [], municipal: [] }
);

check(
    'no interpreta booleanos como anos numericos',
    {
        years: [true, false],
        nacional: ['true', 'false'],
        departamental: ['true', 'false'],
        municipal: ['true', 'false']
    },
    { years: [], nacional: [], departamental: [], municipal: [] }
);

console.log(`chart history tests passed (${cases} cases)`);
