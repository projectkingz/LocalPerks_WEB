# ============================================================
# LocalPerks_WEB - Master Run Script
# Run this ONE script to apply all recommendations at once.
# Usage: .\run-all-improvements.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "############################################" -ForegroundColor Magenta
Write-Host "#   LocalPerks_WEB — Apply All Improvements #" -ForegroundColor Magenta
Write-Host "############################################" -ForegroundColor Magenta
Write-Host ""
Write-Host "This script will:" -ForegroundColor White
Write-Host "  1. Clean root folder (move docs & scripts)"
Write-Host "  2. Remove hello-prisma sandbox folder"
Write-Host "  3. Fix duplicate PostCSS config"
Write-Host "  4. Consolidate database docs"
Write-Host "  5. Install new README.md"
Write-Host ""

$confirm = Read-Host "Ready to proceed? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 0
}

# ── Safety check ─────────────────────────────────────────────
if (-not (Test-Path "$root\package.json")) {
    Write-Host "ERROR: Run this from the project root (where package.json lives)." -ForegroundColor Red
    exit 1
}

# ── Step 1: Run cleanup ───────────────────────────────────────
Write-Host ""
Write-Host ">>> STEP 1/4: Running cleanup.ps1..." -ForegroundColor Cyan
& "$root\cleanup.ps1"

# ── Step 2: Consolidate DB docs ───────────────────────────────
Write-Host ""
Write-Host ">>> STEP 2/4: Running consolidate-db-docs.ps1..." -ForegroundColor Cyan
& "$root\consolidate-db-docs.ps1"

# ── Step 3: Install new README ────────────────────────────────
Write-Host ""
Write-Host ">>> STEP 3/4: Installing new README.md..." -ForegroundColor Cyan

$readmeSrc = Join-Path $root "README.md"
$readmeBackup = Join-Path $root "docs\README_ORIGINAL.md"

# Backup old README if it exists and has content
if (Test-Path $readmeSrc) {
    $existing = Get-Content $readmeSrc -Raw
    if ($existing.Trim().Length -gt 0) {
        Copy-Item -Path $readmeSrc -Destination $readmeBackup -Force
        Write-Host "   Backed up original README to docs\README_ORIGINAL.md" -ForegroundColor Gray
    }
}

Copy-Item -Path "$root\README_NEW.md" -Destination $readmeSrc -Force
Write-Host "   Installed: README.md" -ForegroundColor Green

# ── Step 4: Git commit ────────────────────────────────────────
Write-Host ""
Write-Host ">>> STEP 4/4: Staging changes for Git..." -ForegroundColor Cyan

$gitStatus = git -C $root status --short 2>&1
if ($LASTEXITCODE -eq 0) {
    git -C $root add -A
    git -C $root commit -m "chore: clean repo structure, consolidate docs, fix PostCSS duplicate, update README"
    Write-Host "   Git commit created." -ForegroundColor Green
} else {
    Write-Host "   Git not available or not a git repo - skipping commit." -ForegroundColor Yellow
    Write-Host "   Run manually: git add -A && git commit -m 'chore: clean repo structure'" -ForegroundColor Yellow
}

# ── Summary ───────────────────────────────────────────────────
Write-Host ""
Write-Host "############################################" -ForegroundColor Magenta
Write-Host "#   All improvements applied successfully!  #" -ForegroundColor Magenta
Write-Host "############################################" -ForegroundColor Magenta
Write-Host ""
Write-Host "What changed:" -ForegroundColor White
Write-Host "  docs\              <- All markdown docs moved here"
Write-Host "  docs\archive\      <- Individual DB docs archived"
Write-Host "  docs\DATABASE_COMPLETE_GUIDE.md <- Consolidated DB doc"
Write-Host "  scripts\           <- All utility .js scripts moved here"
Write-Host "  README.md          <- Replaced with new structured README"
Write-Host "  hello-prisma\      <- Deleted"
Write-Host "  postcss.config.js  <- Deleted (kept .mjs)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  git push origin main"
Write-Host "  Review docs\DATABASE_COMPLETE_GUIDE.md for accuracy"
Write-Host ""
