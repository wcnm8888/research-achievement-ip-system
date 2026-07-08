# Step170A - Local Backup / Restore Acceptance Commands

Date: 2026-07-08

Scope: local Docker production-like acceptance only. These commands do not
access production, VPS, production DB, or secret files.

## Containers

Expected local containers:

- `research-achievement-production-postgres-1`
- `research-achievement-production-api-1`
- `research-achievement-production-web-1`

Read-only health check:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "research-achievement-production"
```

## Manual Local Database Backup

Create a local artifact directory:

```powershell
$backupRoot = "E:\Vibe coding\production-github-main-20260626\.local-step170a-backup-restore"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
```

Run a local Docker `pg_dump` against the local production-like PostgreSQL
container:

```powershell
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$dumpPath = Join-Path $backupRoot "local-postgres-backup-$timestamp.sql"
docker exec research-achievement-production-postgres-1 pg_dump `
  -U research_achievement_app `
  -d research_achievement_production `
  --no-owner `
  --no-privileges `
  --encoding=UTF8 `
  > $dumpPath
```

Generate a local manifest:

```powershell
$hash = Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256
$dumpItem = Get-Item -LiteralPath $dumpPath
$manifestPath = Join-Path $backupRoot "local-backup-manifest-$timestamp.json"
$manifest = [ordered]@{
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  source = "local Docker production-like"
  database = "research_achievement_production"
  dumpFile = $dumpItem.Name
  dumpBytes = $dumpItem.Length
  sha256 = $hash.Hash.ToLowerInvariant()
  dockerContainers = @(
    "research-achievement-production-postgres-1",
    "research-achievement-production-api-1",
    "research-achievement-production-web-1"
  )
  restoreRehearsalMode = "dry-run / non-destructive"
  retentionPolicy = "30 days target; manual cleanup required for local demo artifacts"
  productionBoundary = "not production backup; not VPS; not production DB"
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
```

## Non-Destructive Verification

Validate the local backup artifact:

```powershell
$recomputedHash = (Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256).Hash.ToLowerInvariant()
$manifestObject = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$sqlHead = Get-Content -LiteralPath $dumpPath -TotalCount 80

[ordered]@{
  dumpExists = Test-Path -LiteralPath $dumpPath
  manifestExists = Test-Path -LiteralPath $manifestPath
  dumpBytes = (Get-Item -LiteralPath $dumpPath).Length
  sha256Matches = $recomputedHash -eq $manifestObject.sha256
  containsPostgresDumpHeader = ($sqlHead -join "`n") -match "PostgreSQL database dump"
  containsSchemaMarkers = ($sqlHead -join "`n") -match "CREATE|SET|SELECT"
} | ConvertTo-Json
```

## Restore Rehearsal Plan

This step does not restore over the current local database. A production or
destructive local restore rehearsal requires a separate approved step.

Non-destructive rehearsal checklist:

1. Confirm the dump and manifest exist.
2. Recompute SHA-256 and compare with the manifest.
3. Inspect the SQL header for PostgreSQL dump markers.
4. Prepare an isolated disposable database or container for a future restore
   rehearsal.
5. Restore only into that isolated target, then run application health checks.

Production RTO/RPO remains pending production-specific infrastructure,
schedule, retention, and restore drill acceptance.
