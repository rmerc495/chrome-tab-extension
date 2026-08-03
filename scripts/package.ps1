# Package the extension into extension.zip for Chrome Web Store upload.
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root "extension.zip"

if (Test-Path $Out) { Remove-Item -Force $Out }

$files = @(
  "manifest.json",
  "background.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "options.html",
  "options.js",
  "options.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png"
)

$zip = [System.IO.Compression.ZipFile]::Open($Out, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($rel in $files) {
    $src = Join-Path $Root ($rel -replace "/", [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path $src)) {
      throw "Missing required file: $rel"
    }
    # Chrome / store zips expect forward-slash entry names.
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
      $zip,
      $src,
      ($rel -replace "\\", "/"),
      [System.IO.Compression.CompressionLevel]::Optimal
    )
  }
}
finally {
  $zip.Dispose()
}

$Manifest = Get-Content (Join-Path $Root "manifest.json") -Raw | ConvertFrom-Json
Write-Host "Created $Out (manifest version $($Manifest.version))"
