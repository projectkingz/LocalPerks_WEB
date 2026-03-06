# ============================================================
# LocalPerks_WEB - Cleanup Script
# Run from: C:\0_LocalPerks\LocalPerks_WEB
# Usage: .\cleanup.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LocalPerks_WEB Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Safety check ─────────────────────────────────────────────
if (-not (Test-Path "$root\package.json")) {
    Write-Host "ERROR: package.json not found. Make sure you're running this from the project root." -ForegroundColor Red
    exit 1
}

# ── 1. Create target folders ──────────────────────────────────
Write-Host "1. Creating folder structure..." -ForegroundColor Yellow

$foldersToCreate = @("docs", "scripts")
foreach ($folder in $foldersToCreate) {
    $path = Join-Path $root $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
        Write-Host "   Created: $folder\" -ForegroundColor Green
    } else {
        Write-Host "   Exists:  $folder\" -ForegroundColor Gray
    }
}

# ── 2. Move markdown docs to docs\ ────────────────────────────
Write-Host ""
Write-Host "2. Moving documentation files to docs\..." -ForegroundColor Yellow

$docsToMove = @(
    ".build-optimization-report.md",
    "BATCH_UPDATE_MOBILE.md",
    "BUILD_FIXES_SUMMARY.md",
    "BUNDLE_OPTIMIZATION.md",
    "CONNECT_TO_MYSQL.md",
    "CORS_AND_CACHING.md",
    "CRITICAL_FIXES_COMPLETED.md",
    "DATABASE_MIGRATION_INSTRUCTIONS.md",
    "DATABASE_SETUP.md",
    "DATABASE_URL_FIX.md",
    "DATABASE_URL_TROUBLESHOOTING.md",
    "DEPLOYMENT_GUIDE.md",
    "DEPLOYMENT_SUCCESS.md",
    "DEPLOYMENT_SUCCESS_SUMMARY.md",
    "DISPLAY_ID_IMPLEMENTATION.md",
    "ENVIRONMENT_SETUP.md",
    "ENVIRONMENT_SETUP_COMPLETE.md",
    "FIX_API_KEY_ERROR.md",
    "FIX_FILE_LOCKING.md",
    "FIX_INCOMPLETE_DATABASE_URL.md",
    "FIX_LOCAL_ENV.md",
    "FIX_REACT_NATIVE_REACT_VERSION.md",
    "FIX_REACT_VERSION_STEPS.md",
    "LOCAL_ENV_FIXED.md",
    "MAILTRAP_SETUP.md",
    "MIGRATION_INSTRUCTIONS.md",
    "MOBILE_NUMBERS_REQUIRED.md",
    "MULTI_DATABASE_SETUP.md",
    "PARTNER_LOGIN_FIX.md",
    "POINTS_SYSTEM_IMPLEMENTATION_SUMMARY.md",
    "PRISMA_VERCEL_FIX.md",
    "PRODUCTION_DB_MANUAL_SETUP.md",
    "PROJECT_ANALYSIS.md",
    "QR_CODE_MIGRATION_GUIDE.md",
    "QUICK_DEPLOY.md",
    "QUICK_START.md",
    "QUICK_UPDATE_MOBILE.md",
    "README_TESTING.md",
    "REDIS_FIX_INSTRUCTIONS.md",
    "SETUP_PRISMA_ACCELERATE.md",
    "SOCIAL_AUTH_SETUP.md",
    "STRIPE_ENV_SETUP.md",
    "SUBSCRIPTION_SETUP.md",
    "SYSTEM_CONFIG_UPDATE.md",
    "TEST_STATUS.md",
    "TWILIO_SANDBOX_SETUP.md",
    "UPDATE_MOBILE_NOW.md",
    "UPDATE_MOBILE_NUMBERS.md",
    "UPDATE_VERCEL_CORS.md",
    "VERCEL_ENV_SETUP.md",
    "WHATSAPP_2FA_FIX.md",
    "WHATSAPP_SANDBOX_FIX.md"
)

$docsMoved = 0
foreach ($file in $docsToMove) {
    $src = Join-Path $root $file
    $dst = Join-Path $root "docs\$file"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dst -Force
        Write-Host "   Moved: $file" -ForegroundColor Green
        $docsMoved++
    }
}
Write-Host "   Total moved: $docsMoved files" -ForegroundColor Cyan

# ── 3. Move one-off JS scripts to scripts\ ────────────────────
Write-Host ""
Write-Host "3. Moving utility scripts to scripts\..." -ForegroundColor Yellow

$scriptsToMove = @(
    "add-tina.js",
    "check-admin.js",
    "check-env.js",
    "check-recent-data.js",
    "check-superadmin.js",
    "check-tina.js",
    "check-transaction-seeding.js",
    "check-transactions.js",
    "check-user-customers.js",
    "check-user-password.js",
    "clean-database.js",
    "cleanup-console-logs.js",
    "create-superadmin.js",
    "create-test-customer.js",
    "debug-customers.js",
    "deploy-production.js",
    "final-cleanup.js",
    "fix-customer-tenants.js",
    "fix-local-env.js",
    "fix-partners-simple.js",
    "fix-typescript-errors.js",
    "force-cleanup.js",
    "clear-next.ps1",
    "move-files.ps1",
    "deploy-both-environments.bat"
)

$scriptsMoved = 0
foreach ($file in $scriptsToMove) {
    $src = Join-Path $root $file
    $dst = Join-Path $root "scripts\$file"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dst -Force
        Write-Host "   Moved: $file" -ForegroundColor Green
        $scriptsMoved++
    }
}
Write-Host "   Total moved: $scriptsMoved files" -ForegroundColor Cyan

# ── 4. Remove hello-prisma folder ─────────────────────────────
Write-Host ""
Write-Host "4. Removing hello-prisma sandbox folder..." -ForegroundColor Yellow

$helloPrisma = Join-Path $root "hello-prisma"
if (Test-Path $helloPrisma) {
    Remove-Item -Path $helloPrisma -Recurse -Force
    Write-Host "   Removed: hello-prisma\" -ForegroundColor Green
} else {
    Write-Host "   Not found: hello-prisma\ (skipping)" -ForegroundColor Gray
}

# ── 5. Fix duplicate PostCSS config ───────────────────────────
Write-Host ""
Write-Host "5. Fixing duplicate PostCSS config..." -ForegroundColor Yellow

$postcssJs  = Join-Path $root "postcss.config.js"
$postcssMjs = Join-Path $root "postcss.config.mjs"

if ((Test-Path $postcssJs) -and (Test-Path $postcssMjs)) {
    # Keep .mjs (modern ESM), remove .js
    Remove-Item -Path $postcssJs -Force
    Write-Host "   Removed: postcss.config.js  (keeping postcss.config.mjs)" -ForegroundColor Green
} elseif (Test-Path $postcssJs) {
    Write-Host "   Only postcss.config.js exists - no duplicate to fix" -ForegroundColor Gray
} elseif (Test-Path $postcssMjs) {
    Write-Host "   Only postcss.config.mjs exists - no duplicate to fix" -ForegroundColor Gray
} else {
    Write-Host "   No PostCSS config found (skipping)" -ForegroundColor Gray
}

# ── 6. Remove .vercel-rebuild-trigger ─────────────────────────
Write-Host ""
Write-Host "6. Removing .vercel-rebuild-trigger hack file..." -ForegroundColor Yellow

$vercelTrigger = Join-Path $root ".vercel-rebuild-trigger"
if (Test-Path $vercelTrigger) {
    Remove-Item -Path $vercelTrigger -Force
    Write-Host "   Removed: .vercel-rebuild-trigger" -ForegroundColor Green
} else {
    Write-Host "   Not found (skipping)" -ForegroundColor Gray
}

# ── Done ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cleanup complete!" -ForegroundColor Cyan
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run .\consolidate-db-docs.ps1" -ForegroundColor White
Write-Host "  2. Review docs\ and scripts\ folders" -ForegroundColor White
Write-Host "  3. git add -A && git commit -m 'chore: clean up root, move docs and scripts'" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
