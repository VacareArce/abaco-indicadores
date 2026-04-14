param(
    [string]$CredentialsPath = "C:\ruta\a\credenciales\bq-observatorio.json",
    [string]$ProjectId = "observatorio-377023",
    [string]$DatasetId = "Indicadores",
    [string]$TestTableId = "T_Frutas_BQ"
)

$env:GOOGLE_APPLICATION_CREDENTIALS = $CredentialsPath
$env:BQ_PROJECT_ID = $ProjectId
$env:BQ_DATASET_ID = $DatasetId
$env:BQ_TEST_TABLE_ID = $TestTableId

Write-Host "Variables de entorno configuradas para esta sesion:" -ForegroundColor Green
Write-Host "GOOGLE_APPLICATION_CREDENTIALS=$env:GOOGLE_APPLICATION_CREDENTIALS"
Write-Host "BQ_PROJECT_ID=$env:BQ_PROJECT_ID"
Write-Host "BQ_DATASET_ID=$env:BQ_DATASET_ID"
Write-Host "BQ_TEST_TABLE_ID=$env:BQ_TEST_TABLE_ID"

if (Test-Path $CredentialsPath) {
    Write-Host "Credencial encontrada en: $CredentialsPath" -ForegroundColor Green
} else {
    Write-Host "No se encontro la credencial en: $CredentialsPath" -ForegroundColor Yellow
}
