# May chu web tinh nho de chay thu website tren may (khong can cai Node/Python).
# Cach dung: bam dup file chay-thu.bat, hoac chay:  powershell -ExecutionPolicy Bypass -File tools\chay-thu.ps1
param([int]$Port = 8080, [switch]$NoBrowser)
$root = (Split-Path -Parent $PSScriptRoot).TrimEnd('\') + '\'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Website dang chay tai: http://localhost:$Port/  (dong cua so nay de dung)"
# mo trinh duyet SAU KHI may chu da san sang
if (-not $NoBrowser) { Start-Process "http://localhost:$Port/" }
$types = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8';
            '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.ico'='image/x-icon'; '.md'='text/plain; charset=utf-8' }
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($path -eq '') { $path = 'index.html' }
    # duong dan kieu /thu-vien (khong co duoi file) -> tra ve index.html giong Netlify
    if (-not [IO.Path]::HasExtension($path)) { $path = 'index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $root $path))
    $res = $ctx.Response
    if ($ctx.Request.HttpMethod -ne 'GET') {
      $res.StatusCode = 405   # form chi gui duoc khi da deploy len Netlify
    } elseif ($file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $file -PathType Leaf)) {
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $res.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-cache')   # luon lay ban moi nhat khi dang sua code
      $bytes = [IO.File]::ReadAllBytes($file)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
    }
    $res.Close()
  }
} finally { $listener.Stop() }
