# Tao lai og-image.png (anh hien khi chia se link len Zalo/Facebook).
# Chay:  powershell -ExecutionPolicy Bypass -File tools\tao-anh.ps1
# (File nay luu dang UTF-8 co BOM de PowerShell doc dung tieng Viet.)
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$teal = [Drawing.Color]::FromArgb(15, 118, 110)
$ink = [Drawing.Color]::FromArgb(31, 35, 40)
$grey = [Drawing.Color]::FromArgb(90, 97, 108)
$paper = [Drawing.Color]::FromArgb(246, 245, 241)

function New-Canvas($w, $h) {
  $bmp = New-Object Drawing.Bitmap $w, $h
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
  return $bmp, $g
}

# favicon.png va apple-touch-icon.png nay la anh chup tu logo.svg (khong ve o day nua).

# --- anh Open Graph 1200 x 630 ---
$bmp, $g = New-Canvas 1200 630
$g.Clear($paper)
$g.FillRectangle((New-Object Drawing.SolidBrush $teal), 0, 0, 24, 630)
$bInk = New-Object Drawing.SolidBrush $ink; $bGrey = New-Object Drawing.SolidBrush $grey; $bTeal = New-Object Drawing.SolidBrush $teal
$f1 = New-Object Drawing.Font 'Segoe UI', 30, ([Drawing.FontStyle]::Bold)
$f2 = New-Object Drawing.Font 'Segoe UI', 54, ([Drawing.FontStyle]::Bold)
$f3 = New-Object Drawing.Font 'Segoe UI', 34
$f4 = New-Object Drawing.Font 'Segoe UI', 24
$g.DrawString('COMPLEX CHEMISTRY 12', $f1, $bTeal, 84, 70)
$g.DrawString('Học gọi tên phức chất', $f2, $bInk, 80, 150)
$g.DrawString('theo SGK Hóa học 12', $f2, $bInk, 80, 240)
$g.FillRectangle((New-Object Drawing.SolidBrush ([Drawing.Color]::White)), 84, 370, 1032, 96)
$g.DrawRectangle((New-Object Drawing.Pen ([Drawing.Color]::FromArgb(219, 217, 209)), 2), 84, 370, 1032, 96)
$g.DrawString('[Cu(NH₃)₄]SO₄  →  tetraammin đồng(II) sunfat', $f3, $bInk, 108, 388)
$g.DrawString('Gọi tên từng bước · Luyện tập · Đề kiểm tra · Thư viện phức chất', $f4, $bGrey, 84, 500)

$bmp.Save((Join-Path $root 'og-image.png'), [Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host 'Da tao og-image.png'
