# Crée la base cnou_bourses sur PostgreSQL local (Windows).
# Prérequis : PostgreSQL installé, service démarré, mot de passe du compte postgres connu.
#
# Usage (PowerShell) :
#   cd backend
#   $env:PGPASSWORD = "mot_de_passe_du_compte_postgres"
#   .\scripts\setup_postgres_windows.ps1
#
# Variables optionnelles :
#   $env:PGHOST = "127.0.0.1"
#   $env:PGPORT = "5432"
#   $env:PGUSER = "postgres"
#   $env:PGDATABASE_NAME = "cnou_bourses"

$ErrorActionPreference = "Stop"

if (-not $env:PGPASSWORD) {
    Write-Host "Définissez d'abord PGPASSWORD (mot de passe de l'utilisateur PostgreSQL, ex. postgres)." -ForegroundColor Yellow
    Write-Host '  $env:PGPASSWORD = "votre_mot_de_passe"' -ForegroundColor Gray
    exit 1
}

$pgRoot = "C:\Program Files\PostgreSQL"
if (-not (Test-Path $pgRoot)) {
    Write-Host "Dossier introuvable : $pgRoot. Adaptez le chemin ou installez PostgreSQL." -ForegroundColor Red
    exit 1
}

$versionDirs = @(Get-ChildItem -Path $pgRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^\d+' } |
    Sort-Object { [int]($_.Name -replace '^(\d+).*', '$1') } -Descending)

if ($versionDirs.Count -eq 0) {
    Write-Host "Aucune installation PostgreSQL trouvée sous $pgRoot." -ForegroundColor Red
    exit 1
}

$psql = $null
foreach ($dir in $versionDirs) {
    $candidate = Join-Path $dir.FullName "bin\psql.exe"
    if (Test-Path $candidate) {
        $psql = $candidate
        break
    }
}
if (-not $psql) {
    Write-Host "psql introuvable sous $pgRoot (bin\\psql.exe manquant)." -ForegroundColor Red
    exit 1
}

Write-Host "Utilisation de : $psql" -ForegroundColor Cyan

$hostName = if ($env:PGHOST) { $env:PGHOST } else { "127.0.0.1" }
$port = if ($env:PGPORT) { $env:PGPORT } else { "5432" }
$user = if ($env:PGUSER) { $env:PGUSER } else { "postgres" }
$dbName = if ($env:PGDATABASE_NAME) { $env:PGDATABASE_NAME } else { "cnou_bourses" }

$sql = "CREATE DATABASE $dbName WITH ENCODING 'UTF8' TEMPLATE template0;"
& $psql -U $user -h $hostName -p $port -d postgres -v ON_ERROR_STOP=1 -c $sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "Si le message indique que la base existe déjà, vous pouvez ignorer l'erreur." -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host "Base '$dbName' créée (ou déjà présente). Configurez backend/.env puis : python manage.py migrate" -ForegroundColor Green
