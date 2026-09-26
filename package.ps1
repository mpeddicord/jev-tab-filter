$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$version = (Get-Content manifest.json -Raw | ConvertFrom-Json).version
New-Item -ItemType Directory -Force dist | Out-Null
$zip = Join-Path $PSScriptRoot "dist/theme-tab-filter-$version.zip"
if (Test-Path $zip) { Remove-Item $zip }

$files = @('manifest.json', 'popup.html', 'popup.js', 'LICENSE') +
  (Get-ChildItem icons -Filter 'icon*.png' | Where-Object Name -ne 'icon512.png' | ForEach-Object { "icons/$($_.Name)" })

# Build entries by hand: Compress-Archive flattens folders and writes backslash paths on PowerShell 5.1.
$archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
  foreach ($f in $files) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, (Join-Path $PSScriptRoot $f), $f) | Out-Null
  }
} finally { $archive.Dispose() }
"Wrote $zip"
