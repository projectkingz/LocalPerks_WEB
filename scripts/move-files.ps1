# Create necessary directories
New-Item -ItemType Directory -Force -Path ".\src\app\components"
New-Item -ItemType Directory -Force -Path ".\src\components"
New-Item -ItemType Directory -Force -Path ".\src\lib"

# Copy files from C:\src to project directory
Copy-Item -Path "C:\src\app\*" -Destination ".\src\app\" -Recurse -Force
Copy-Item -Path "C:\src\components\*" -Destination ".\src\components\" -Recurse -Force
Copy-Item -Path "C:\src\lib\*" -Destination ".\src\lib\" -Recurse -Force
Copy-Item -Path "C:\src\middleware.ts" -Destination ".\src\" -Force

Write-Host "Files have been moved successfully!" 