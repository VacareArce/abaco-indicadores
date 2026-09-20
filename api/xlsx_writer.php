<?php

declare(strict_types=1);

/**
 * Generador minimo de XLSX para exportaciones tabulares.
 *
 * XLSX es un contenedor ZIP de documentos XML. Esta implementacion escribe el
 * subconjunto necesario para una hoja de datos sin depender de ext-zip, que no
 * esta disponible en todos los servidores cPanel.
 */

function xlsxXml(string $value): string
{
    $clean = preg_replace('/[^\x09\x0A\x0D\x20-\x{D7FF}\x{E000}-\x{FFFD}]/u', '', $value);

    return htmlspecialchars($clean ?? '', ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

function xlsxColumnName(int $index): string
{
    $name = '';
    for ($value = $index + 1; $value > 0; $value = intdiv($value - 1, 26)) {
        $name = chr(65 + (($value - 1) % 26)) . $name;
    }

    return $name;
}

/**
 * @param mixed $value
 */
function xlsxCell(string $reference, $value, int $style, bool $numeric): string
{
    if ($value === null || $value === '') {
        return '<c r="' . $reference . '" s="' . $style . '"/>';
    }

    if ($numeric && is_numeric($value)) {
        // JSON siempre usa punto decimal, independientemente del locale de PHP.
        $number = json_encode((float) $value);
        if ($number === false) {
            $number = '0';
        }

        return '<c r="' . $reference . '" s="' . $style . '" t="n"><v>' . $number . '</v></c>';
    }

    return '<c r="' . $reference . '" s="' . $style
        . '" t="inlineStr"><is><t xml:space="preserve">'
        . xlsxXml((string) $value)
        . '</t></is></c>';
}

/**
 * Crea un ZIP sin compresion. Excel acepta entradas almacenadas y se evita la
 * dependencia de ZipArchive.
 *
 * @param array<string,string> $files
 */
function xlsxZip(array $files): string
{
    $body = '';
    $central = '';
    $offset = 0;
    $now = getdate();
    $dosTime = (($now['hours'] & 0x1f) << 11) | (($now['minutes'] & 0x3f) << 5) | intdiv($now['seconds'], 2);
    $dosDate = ((($now['year'] - 1980) & 0x7f) << 9) | (($now['mon'] & 0x0f) << 5) | ($now['mday'] & 0x1f);

    foreach ($files as $name => $content) {
        $size = strlen($content);
        $crc = (int) sprintf('%u', crc32($content));
        $nameLength = strlen($name);

        $local = pack(
            'VvvvvvVVVvv',
            0x04034b50,
            20,
            0,
            0,
            $dosTime,
            $dosDate,
            $crc,
            $size,
            $size,
            $nameLength,
            0
        ) . $name . $content;

        $central .= pack(
            'VvvvvvvVVVvvvvvVV',
            0x02014b50,
            20,
            20,
            0,
            0,
            $dosTime,
            $dosDate,
            $crc,
            $size,
            $size,
            $nameLength,
            0,
            0,
            0,
            0,
            0,
            $offset
        ) . $name;

        $body .= $local;
        $offset += strlen($local);
    }

    $entries = count($files);
    $centralSize = strlen($central);
    $end = pack('VvvvvVVv', 0x06054b50, 0, 0, $entries, $entries, $centralSize, $offset, 0);

    return $body . $central . $end;
}

/**
 * @param string[]     $headers
 * @param array<mixed> $rows
 * @param int[]        $numericColumns
 */
function xlsxWorkbook(array $headers, array $rows, array $numericColumns = []): string
{
    $lastColumn = xlsxColumnName(max(0, count($headers) - 1));
    $lastRow = count($rows) + 1;
    $sheetRows = [];
    $headerCells = [];

    foreach ($headers as $index => $header) {
        $headerCells[] = xlsxCell(xlsxColumnName($index) . '1', $header, 1, false);
    }
    $sheetRows[] = '<row r="1" ht="24" customHeight="1">' . implode('', $headerCells) . '</row>';

    foreach ($rows as $rowIndex => $row) {
        $excelRow = $rowIndex + 2;
        $cells = [];
        foreach ($headers as $columnIndex => $_header) {
            $isNumeric = in_array($columnIndex, $numericColumns, true);
            $style = $columnIndex === 0 ? 3 : ($isNumeric ? 2 : 4);
            $cells[] = xlsxCell(
                xlsxColumnName($columnIndex) . $excelRow,
                $row[$columnIndex] ?? null,
                $style,
                $isNumeric
            );
        }
        $sheetRows[] = '<row r="' . $excelRow . '">' . implode('', $cells) . '</row>';
    }

    $widths = [10, 13, 24, 54, 20, 20, 19, 22];
    $columns = [];
    foreach ($headers as $index => $_header) {
        $columnNumber = $index + 1;
        $width = $widths[$index] ?? 18;
        $columns[] = '<col min="' . $columnNumber . '" max="' . $columnNumber
            . '" width="' . $width . '" customWidth="1"/>';
    }

    $worksheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        . '<dimension ref="A1:' . $lastColumn . $lastRow . '"/>'
        . '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
        . '<sheetFormatPr defaultRowHeight="15"/>'
        . '<cols>' . implode('', $columns) . '</cols>'
        . '<sheetData>' . implode('', $sheetRows) . '</sheetData>'
        . '<autoFilter ref="A1:' . $lastColumn . $lastRow . '"/>'
        . '</worksheet>';

    $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        . '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>'
        . '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF16A6A8"/><bgColor indexed="64"/></patternFill></fill></fills>'
        . '<borders count="2"><border/><border><left style="thin"><color rgb="FFD9DEDE"/></left><right style="thin"><color rgb="FFD9DEDE"/></right><top style="thin"><color rgb="FFD9DEDE"/></top><bottom style="thin"><color rgb="FFD9DEDE"/></bottom></border></borders>'
        . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
        . '<cellXfs count="5">'
        . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
        . '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>'
        . '<xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>'
        . '<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>'
        . '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>'
        . '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
        . '</styleSheet>';

    return xlsxZip([
        '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            . '</Types>',
        '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '</Relationships>',
        'xl/workbook.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheets><sheet name="Datos" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            . '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            . '</Relationships>',
        'xl/styles.xml' => $styles,
        'xl/worksheets/sheet1.xml' => $worksheet,
    ]);
}
