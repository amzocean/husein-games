param(
  [switch]$ReplaceCredentials
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$secretDir = Join-Path $repoRoot '.birthday-studio\secrets'
$apiKeyPath = Join-Path $secretDir 'openai-api-key.dpapi'
$pinPath = Join-Path $secretDir 'rida-pin.dpapi'

function Save-EncryptedSecret {
  param(
    [Parameter(Mandatory)]
    [string]$Path,
    [Parameter(Mandatory)]
    [string]$Prompt
  )

  $secret = Read-Host $Prompt -AsSecureString
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Path) | Out-Null
  ConvertFrom-SecureString $secret | Set-Content -Path $Path -Encoding utf8 -NoNewline
}

function Read-EncryptedSecret {
  param(
    [Parameter(Mandatory)]
    [string]$Path
  )

  $secure = ConvertTo-SecureString (Get-Content -Raw -Path $Path)
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

if ($ReplaceCredentials -or -not (Test-Path $apiKeyPath)) {
  Save-EncryptedSecret -Path $apiKeyPath -Prompt 'OpenAI API key'
}
if ($ReplaceCredentials -or -not (Test-Path $pinPath)) {
  Save-EncryptedSecret -Path $pinPath -Prompt 'Rida Studio PIN'
}

$env:OPENAI_API_KEY = Read-EncryptedSecret -Path $apiKeyPath
$env:RIDA_STUDIO_PIN = Read-EncryptedSecret -Path $pinPath

try {
  Set-Location $repoRoot
  & node server.js
  exit $LASTEXITCODE
} finally {
  Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
  Remove-Item Env:RIDA_STUDIO_PIN -ErrorAction SilentlyContinue
}
