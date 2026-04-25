# Run this after adding/removing photos in the photos/ folder
# It regenerates photos/manifest.json automatically

$photosDir = Join-Path $PSScriptRoot "photos"
$exts = @('.jpg', '.jpeg', '.png', '.webp', '.gif')
$files = Get-ChildItem $photosDir -File | Where-Object { $exts -contains $_.Extension.ToLower() } | ForEach-Object { $_.Name }
$json = $files | ConvertTo-Json
if ($null -eq $json) { $json = '[]' }
if ($files.Count -eq 1) { $json = "[$json]" }
Set-Content (Join-Path $photosDir "manifest.json") $json -Encoding UTF8
Write-Host "manifest.json updated: $($files.Count) photo(s)"
