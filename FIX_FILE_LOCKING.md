# Fixing File Locking Issues on Windows

## Problem
Windows file locking errors (errno: -4094) occur when Next.js tries to access files in the `.next` folder that are locked by:
- Antivirus software (Windows Defender, etc.)
- File indexing services
- Multiple Node.js processes
- Windows file system caching

## Quick Fix
Run the PowerShell script:
```powershell
.\clear-next.ps1
```

Or manually:
```powershell
# Stop all Node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2

# Delete .next folder
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Restart dev server
npm run dev
```

## Permanent Solutions

### 1. Exclude .next folder from Windows Defender
1. Open Windows Security
2. Go to Virus & threat protection
3. Click "Manage settings" under Virus & threat protection settings
4. Scroll down to "Exclusions"
5. Click "Add or remove exclusions"
6. Add folder exclusion for: `C:\0_LocalPerks\LocalPerks_WEB\.next`

### 2. Exclude from Windows Search Indexing
1. Open Indexing Options (search "Indexing Options" in Start menu)
2. Click "Modify"
3. Expand your project folder
4. Uncheck the `.next` folder

### 3. Use WSL (Windows Subsystem for Linux)
If file locking persists, consider running the dev server in WSL:
```bash
wsl
cd /mnt/c/0_LocalPerks/LocalPerks_WEB
npm run dev
```

### 4. Add to .gitignore
Ensure `.next` is in `.gitignore` (already done)

## Prevention
- Always stop the dev server (Ctrl+C) before closing terminal
- Use the `clear-next.ps1` script when errors occur
- Consider adding `.next` to antivirus exclusions




