# Builds the signed Android APK. Add -Install to also install it on a connected phone.
#   powershell -File scripts\build-android.ps1 [-Install]
param([switch]$Install)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

# Capacitor 8 needs JDK 21 (the same one the storytime project uses).
$env:JAVA_HOME = 'C:\Users\ferri\jdks\jdk-21.0.12.1+1'
# The signing key lives outside the repo. Back that folder up: updates must be signed with the same key.
$env:CHESTRUN_KEYSTORE_PROPERTIES = 'C:\Users\ferri\AI Projects\chest-run-tracker-keystore\keystore.properties'
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'

function Run([string]$what, [scriptblock]$cmd) {
    & $cmd
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit code $LASTEXITCODE)" }
}

Set-Location $root
Run 'Web build' { npm run build }          # no PAGES variable, so no base path
Run 'Capacitor sync' { npx cap sync android }

# Forward slashes: backslashes are escape characters in .properties files (\f becomes a form feed).
$sdk = ($env:LOCALAPPDATA -replace '\\', '/') + '/Android/Sdk'
Set-Content -Path (Join-Path $root 'android\local.properties') -Value "sdk.dir=$sdk" -Encoding ascii

Set-Location (Join-Path $root 'android')
Run 'Gradle build' { cmd /c '.\gradlew.bat assembleRelease --no-daemon' }

$apk = Join-Path $root 'android\app\build\outputs\apk\release\app-release.apk'
Write-Host "APK: $apk ($([math]::Round((Get-Item $apk).Length / 1MB, 1)) MB)"

if ($Install) {
    Run 'adb install' { & $adb install -r $apk }
    Write-Host 'Installed.'
}
