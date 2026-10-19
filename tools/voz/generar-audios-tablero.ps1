[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$Rate = '0%',
    [int]$IntervaloMs = 3200,
    [switch]$Force,
    [switch]$SoloMuestra
)

$ErrorActionPreference = 'Stop'

try {
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
} catch {
    # Si el host no permite cambiar la codificacion, continuar.
}

function Fail {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit 1
}

if ($Rate -notmatch '^[+-]?\d{1,3}%$') {
    Fail "El parametro -Rate debe tener el formato '0%', '-5%' o '+5%'."
}

if ($IntervaloMs -lt 0) {
    Fail 'El parametro -IntervaloMs debe ser un entero >= 0.'
}

# Los acentos se construyen con [char] para mantener el script en ASCII y
# evitar problemas de codificacion en Windows PowerShell 5.1.
$acentoA = [char]0x00E1
$acentoI = [char]0x00ED
$textoPasara = 'Pasar' + $acentoA + ' a'
$textoSiguientes = 'Los siguientes pacientes pasar' + $acentoA + 'n a la cl' + $acentoI + 'nica'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outputRoot = Join-Path $repoRoot 'frontend/public/audio/tablero'

$items = New-Object System.Collections.Generic.List[object]

function Add-AudioItem {
    param(
        [string]$Directory,
        [string]$FileName,
        [string]$Text
    )

    $items.Add([PSCustomObject]@{
        Directory    = $Directory
        FileName     = $FileName
        Text         = $Text
        RelativePath = "$Directory/$FileName"
    })
}

Add-AudioItem 'generales' 'paciente.mp3' 'Paciente'
Add-AudioItem 'generales' 'pasar_a.mp3' 'Pasar a'
Add-AudioItem 'generales' 'pasara_a.mp3' $textoPasara
Add-AudioItem 'generales' 'siguientes_pacientes_clinica.mp3' $textoSiguientes

1..200 | ForEach-Object {
    Add-AudioItem 'numeros' ($_.ToString('000') + '.mp3') ([string]$_)
}

Add-AudioItem 'numeros' '6a.mp3' '6 A'
Add-AudioItem 'numeros' '6b.mp3' '6 B'

if ($items.Count -ne 206) {
    Fail "El manifiesto completo debe tener 206 elementos; se obtuvieron $($items.Count)."
}

$duplicados = $items | Group-Object RelativePath | Where-Object { $_.Count -gt 1 }
if ($duplicados) {
    Fail "Hay rutas duplicadas en el manifiesto: $($duplicados.Name -join ', ')"
}

$itemsCompletos = $items
$totalGenerales = @($itemsCompletos | Where-Object { $_.Directory -eq 'generales' }).Count
$totalNumeros = @($itemsCompletos | Where-Object {
    $_.Directory -eq 'numeros' -and $_.FileName -match '^\d{3}\.mp3$'
}).Count
$totalDestinos = @($itemsCompletos | Where-Object {
    $_.FileName -eq '6a.mp3' -or $_.FileName -eq '6b.mp3'
}).Count

if ($SoloMuestra) {
    $ordenMuestra = @(
        'generales/paciente.mp3',
        'numeros/025.mp3',
        'generales/pasara_a.mp3',
        'numeros/6a.mp3'
    )
    $porRuta = @{}
    foreach ($item in $itemsCompletos) {
        $porRuta[$item.RelativePath] = $item
    }
    $items = @($ordenMuestra | ForEach-Object { $porRuta[$_] })

    $nulos = @($items | Where-Object { $null -eq $_ })
    if ($items.Count -ne 4 -or $nulos.Count -gt 0) {
        Fail 'No se pudieron resolver los cuatro archivos de muestra.'
    }
}

Write-Host ("Manifiesto: {0} elementos (generales={1}, numeros={2}, destinos={3})" -f `
    $itemsCompletos.Count, $totalGenerales, $totalNumeros, $totalDestinos)
Write-Host ("Seleccion actual: {0} archivo(s)" -f $items.Count)
Write-Host ("Velocidad SSML: {0}" -f $Rate)
Write-Host ("Intervalo entre solicitudes: {0} ms" -f $IntervaloMs)

if ($DryRun) {
    Write-Host ''
    Write-Host 'MODO DRY-RUN: sin llamadas a Azure, sin credenciales, sin archivos.'

    $indice = 0
    foreach ($item in $items) {
        $indice += 1
        Write-Host ("[{0}/{1}] {2} <- {3}" -f $indice, $items.Count, $item.RelativePath, $item.Text)
    }

    Write-Host ''
    Write-Host ("Elementos: {0}" -f $items.Count)
    Write-Host 'Llamadas reales: 0'
    Write-Host 'Archivos creados: 0'
    exit 0
}

$key = $env:SPEECH_KEY
$region = $env:SPEECH_REGION

if ([string]::IsNullOrWhiteSpace($key)) {
    Fail 'Falta la variable de entorno SPEECH_KEY.'
}
if ([string]::IsNullOrWhiteSpace($region)) {
    Fail 'Falta la variable de entorno SPEECH_REGION.'
}

$region = $region.Trim()
if ($region -notmatch '^[a-z0-9-]+$') {
    Fail 'SPEECH_REGION no tiene un formato valido.'
}

$endpoint = "https://$region.tts.speech.microsoft.com/cognitiveservices/v1"
$headers = @{
    'Ocp-Apim-Subscription-Key' = $key
    'X-Microsoft-OutputFormat'  = 'audio-24khz-96kbitrate-mono-mp3'
}

$script:ultimaSolicitudReal = $null

function Esperar-Intervalo {
    param([int]$IntervaloMs)

    if ($null -eq $script:ultimaSolicitudReal) {
        return
    }

    $transcurrido = ((Get-Date) - $script:ultimaSolicitudReal).TotalMilliseconds
    $restante = $IntervaloMs - $transcurrido
    if ($restante -gt 0) {
        Start-Sleep -Milliseconds ([int][math]::Ceiling($restante))
    }
}

function Marcar-SolicitudReal {
    $script:ultimaSolicitudReal = Get-Date
}

$generados = 0
$omitidos = 0
$errores = 0
$indice = 0

foreach ($item in $items) {
    $indice += 1
    $directorioFinal = Join-Path $outputRoot $item.Directory
    $rutaFinal = Join-Path $directorioFinal $item.FileName

    if (-not (Test-Path -LiteralPath $directorioFinal)) {
        New-Item -ItemType Directory -Path $directorioFinal -Force | Out-Null
    }

    if ((Test-Path -LiteralPath $rutaFinal) -and -not $Force) {
        $omitidos += 1
        Write-Host ("[{0}/{1}] OMITIDO {2}" -f $indice, $items.Count, $item.RelativePath)
        continue
    }

    $textoXml = [System.Security.SecurityElement]::Escape($item.Text)
    $ssml = @"
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-GT">
  <voice name="es-GT-AndresNeural">
    <prosody rate="$Rate">$textoXml</prosody>
  </voice>
</speak>
"@

    $rutaTemporal = $rutaFinal + '.tmp'
    if (Test-Path -LiteralPath $rutaTemporal) {
        Remove-Item -LiteralPath $rutaTemporal -Force
    }

    Write-Host ("[{0}/{1}] GENERANDO {2} <- {3}" -f $indice, $items.Count, $item.RelativePath, $item.Text)

    $cuerpo = [System.Text.Encoding]::UTF8.GetBytes($ssml)
    $generado = $false

    for ($intento = 1; $intento -le 3; $intento++) {
        if (Test-Path -LiteralPath $rutaTemporal) {
            Remove-Item -LiteralPath $rutaTemporal -Force -ErrorAction SilentlyContinue
        }

        Esperar-Intervalo -IntervaloMs $IntervaloMs

        try {
            Marcar-SolicitudReal
            Invoke-WebRequest -Uri $endpoint -Method Post -Headers $headers `
                -ContentType 'application/ssml+xml' -Body $cuerpo `
                -OutFile $rutaTemporal -UseBasicParsing -TimeoutSec 60 `
                -UserAgent 'HRO-Tablero-AudioGenerator' | Out-Null

            $temporal = Get-Item -LiteralPath $rutaTemporal -ErrorAction Stop
            if ($temporal.Length -le 0) {
                throw 'Azure devolvio un archivo vacio.'
            }

            Move-Item -LiteralPath $rutaTemporal -Destination $rutaFinal -Force
            $generados += 1
            $generado = $true
            Write-Host ("[{0}/{1}] GENERADO {2}" -f $indice, $items.Count, $item.RelativePath)
            break
        }
        catch {
            if (Test-Path -LiteralPath $rutaTemporal) {
                Remove-Item -LiteralPath $rutaTemporal -Force -ErrorAction SilentlyContinue
            }

            $codigo = $null
            try {
                if ($_.Exception.Response -ne $null) {
                    $codigo = [int]$_.Exception.Response.StatusCode
                }
            } catch {
                # Sin response HTTP disponible.
            }

            if ($codigo -eq 429 -and $intento -lt 3) {
                $espera = 60
                $retryAfter = $null
                try {
                    if ($_.Exception.Response -ne $null) {
                        $retryAfter = $_.Exception.Response.Headers['Retry-After']
                    }
                } catch {
                    # Sin header Retry-After.
                }

                if (-not [string]::IsNullOrWhiteSpace($retryAfter)) {
                    $segundos = 0
                    if ([int]::TryParse([string]$retryAfter, [ref]$segundos)) {
                        if ($segundos -ge 0) {
                            $espera = $segundos
                        }
                    } else {
                        $fecha = [DateTimeOffset]::MinValue
                        if ([DateTimeOffset]::TryParse([string]$retryAfter, [ref]$fecha)) {
                            $calculado = [math]::Ceiling(($fecha - [DateTimeOffset]::Now).TotalSeconds)
                            if ($calculado -ge 0) {
                                $espera = [int]$calculado
                            }
                        }
                    }
                }

                Write-Host ("429 recibido para {0}." -f $item.RelativePath) -ForegroundColor Yellow
                Write-Host ("Reintento {0}/3 en {1} segundos." -f ($intento + 1), $espera) -ForegroundColor Yellow
                Start-Sleep -Milliseconds ([int]($espera * 1000))
                continue
            }

            $errores += 1
            $estado = ''
            if ($codigo) {
                $estado = "HTTP $codigo - "
            }

            Write-Host ("[{0}/{1}] ERROR {2}: {3}{4}" -f `
                $indice, $items.Count, $item.RelativePath, $estado, $_.Exception.Message) -ForegroundColor Red
            if ($codigo -eq 429) {
                Write-Host 'Se agotaron los 3 intentos para este archivo.' -ForegroundColor Red
            }
            Write-Host 'Se detiene la generacion para no continuar con errores.' -ForegroundColor Red
            break
        }
    }

    if (-not $generado) {
        break
    }
}

$faltantes = 0
foreach ($item in $items) {
    $ruta = Join-Path (Join-Path $outputRoot $item.Directory) $item.FileName
    if (-not (Test-Path -LiteralPath $ruta)) {
        $faltantes += 1
        Write-Host ("FALTANTE: {0}" -f $item.RelativePath) -ForegroundColor Yellow
        continue
    }
    if ((Get-Item -LiteralPath $ruta).Length -le 0) {
        $faltantes += 1
        Write-Host ("VACIO: {0}" -f $item.RelativePath) -ForegroundColor Yellow
    }
}

$extras = 0
if (-not $SoloMuestra) {
    $esperadas = @{}
    foreach ($item in $items) {
        $ruta = Join-Path (Join-Path $outputRoot $item.Directory) $item.FileName
        $esperadas[[System.IO.Path]::GetFullPath($ruta)] = $true
    }

    foreach ($sub in @('generales', 'numeros')) {
        $directorio = Join-Path $outputRoot $sub
        if (Test-Path -LiteralPath $directorio) {
            Get-ChildItem -LiteralPath $directorio -File | ForEach-Object {
                $completa = [System.IO.Path]::GetFullPath($_.FullName)
                if (-not $esperadas.ContainsKey($completa)) {
                    $extras += 1
                    Write-Host ("EXTRA: {0}" -f $_.FullName) -ForegroundColor Yellow
                }
            }
        }
    }
}

Write-Host ''
Write-Host ("Esperados: {0}" -f $items.Count)
Write-Host ("Generados: {0}" -f $generados)
Write-Host ("Omitidos:  {0}" -f $omitidos)
Write-Host ("Errores:   {0}" -f $errores)
Write-Host ("Faltantes: {0}" -f $faltantes)
Write-Host ("Extras:    {0}" -f $extras)

if ($errores -gt 0 -or $faltantes -gt 0 -or $extras -gt 0) {
    exit 1
}

exit 0
