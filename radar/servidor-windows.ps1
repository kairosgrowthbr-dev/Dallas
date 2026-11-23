# Servidor local do Radar Dalas (painel de clientes) para Windows.
# Usa só o PowerShell que já vem no Windows: nada para instalar.
# Abre o painel em http://localhost:8090 (ou a próxima porta livre) e fica rodando
# enquanto esta janela estiver aberta.

param([string]$Pagina = '')

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
if (-not (Test-Path (Join-Path $root 'index.html'))) {
  Write-Host 'Não achei o index.html ao lado deste arquivo. Descompacte o zip inteiro antes de abrir.'
  Read-Host 'Aperte Enter para sair'
  exit 1
}

$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.ico' = 'image/x-icon'
  '.mp4' = 'video/mp4'; '.webm' = 'video/webm'; '.woff2' = 'font/woff2'
  '.webmanifest' = 'application/manifest+json'; '.txt' = 'text/plain; charset=utf-8'
}

# primeira porta livre entre 8090 e 8109
$listener = $null
foreach ($p in 8090..8109) {
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
    $listener.Start()
    $port = $p
    break
  } catch { $listener = $null }
}
if (-not $listener) {
  Write-Host 'Nenhuma porta livre entre 8090 e 8109.'
  Read-Host 'Aperte Enter para sair'
  exit 1
}

$url = "http://localhost:$port/"
Write-Host ''
Write-Host "  Radar Dalas rodando em $url"
Write-Host ''
Write-Host '  Para parar, feche esta janela.'
Write-Host ''
try { Start-Process "$url$Pagina" } catch {}

function Send($stream, $status, $type, [byte[]]$body, $extra, $head) {
  $len = if ($null -ne $body) { $body.Length } else { 0 }
  $hdr = "HTTP/1.1 $status`r`nContent-Type: $type`r`nContent-Length: $len`r`nCache-Control: no-cache`r`nConnection: close`r`n$extra`r`n"
  $bytes = [System.Text.Encoding]::ASCII.GetBytes($hdr)
  $stream.Write($bytes, 0, $bytes.Length)
  if ($len -gt 0 -and -not $head) { $stream.Write($body, 0, $len) }
  $stream.Flush()
}

$sep = [System.IO.Path]::DirectorySeparatorChar
$rootSep = $root.TrimEnd($sep) + $sep
while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    # conexão parada (o navegador às vezes abre uma e não usa) não trava o servidor
    $stream.ReadTimeout = 1500
    $stream.WriteTimeout = 5000
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 8192, $true)
    $line = $reader.ReadLine()
    while ($true) { $h = $reader.ReadLine(); if ($null -eq $h -or $h -eq '') { break } }
    if (-not ($line -match '^(GET|HEAD) (\S+)')) {
      Send $stream '405 Method Not Allowed' 'text/plain' ([System.Text.Encoding]::UTF8.GetBytes('405')) '' $false
      continue
    }
    $head = $Matches[1] -eq 'HEAD'
    $path = [System.Uri]::UnescapeDataString(($Matches[2] -split '\?')[0])
    $rel = $path.TrimStart('/').Replace('/', $sep)
    $file = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $rel))
    if ($file -ne $root -and -not $file.StartsWith($rootSep, [System.StringComparison]::OrdinalIgnoreCase)) {
      Send $stream '403 Forbidden' 'text/plain' ([System.Text.Encoding]::UTF8.GetBytes('403')) '' $head
      continue
    }
    if (Test-Path -LiteralPath $file -PathType Container) {
      if (-not $path.EndsWith('/')) {
        Send $stream '301 Moved Permanently' 'text/plain' $null "Location: $path/`r`n" $head
        continue
      }
      $file = [System.IO.Path]::Combine($file, 'index.html')
    }
    if (Test-Path -LiteralPath $file -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
      $type = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      Send $stream '200 OK' $type ([System.IO.File]::ReadAllBytes($file)) '' $head
    } else {
      Send $stream '404 Not Found' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Página não encontrada')) '' $head
    }
  } catch {
    # navegador fechou a conexão no meio: segue para a próxima
  } finally {
    $client.Close()
  }
}
