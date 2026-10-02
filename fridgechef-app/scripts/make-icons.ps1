# Renders the app icon, splash, favicon and Android adaptive layers from the AppLogo geometry
# (src/components/AppLogo.tsx: a 48-unit viewBox). Windows PowerShell 5.1 + GDI+, no packages.
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/make-icons.ps1
# Re-run after changing the logo; the PNGs in assets/images are the output.
Add-Type -AssemblyName System.Drawing

$out = Join-Path $PSScriptRoot '..\assets\images'
$lime = [System.Drawing.ColorTranslator]::FromHtml('#C6F432')
$ink = [System.Drawing.ColorTranslator]::FromHtml('#0A0A0A')
$white = [System.Drawing.Color]::White

function New-RoundRect([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = 2 * $r
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

# Draws the logo with its 48-unit box at (ox, oy), `scale` px per unit.
# mono: the hat silhouette only, in `hat` colour (Android monochrome layer).
function Draw-Logo($g, [single]$ox, [single]$oy, [single]$scale, [bool]$mono = $false, $hat = $ink) {
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $s = $scale
  if (-not $mono) {
    $disc = New-Object System.Drawing.SolidBrush $lime
    $g.FillEllipse($disc, $ox, $oy, 48 * $s, 48 * $s)
  }
  $b = New-Object System.Drawing.SolidBrush $hat
  foreach ($c in @(@(16.5, 20.5, 6), @(24, 16.5, 7.5), @(31.5, 20.5, 6))) {
    $g.FillEllipse($b, $ox + ($c[0] - $c[2]) * $s, $oy + ($c[1] - $c[2]) * $s, 2 * $c[2] * $s, 2 * $c[2] * $s)
  }
  $g.FillRectangle($b, $ox + 14.5 * $s, $oy + 20 * $s, 19 * $s, 10 * $s)
  $g.FillPath($b, (New-RoundRect ($ox + 15 * $s) ($oy + 31.5 * $s) (18 * $s) (5 * $s) (1.8 * $s)))
  # The check swoosh: lime on the ink hat (cut out of the silhouette in mono).
  $penColor = if ($mono) { [System.Drawing.Color]::Transparent } else { $lime }
  $pen = New-Object System.Drawing.Pen $penColor, (3 * $s)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $pts = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF ($ox + 18.8 * $s), ($oy + 23.8 * $s)),
    (New-Object System.Drawing.PointF ($ox + 22.6 * $s), ($oy + 27.6 * $s)),
    (New-Object System.Drawing.PointF ($ox + 29.8 * $s), ($oy + 20.2 * $s))
  )
  if ($mono) { $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy }
  $g.DrawLines($pen, $pts)
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
}

function Save-Png([int]$size, [string]$name, $background, [single]$logoFraction, [bool]$mono = $false, $hat = $ink) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  if ($null -ne $background) { $g.Clear($background) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  $logo = $size * $logoFraction
  $scale = $logo / 48
  $o = ($size - $logo) / 2
  Draw-Logo $g $o $o $scale $mono $hat
  $path = Join-Path $out $name
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "wrote $name ($size x $size)"
}

# iOS / store icon: opaque, the disc on #0A0A0A (iOS rounds the corners itself).
Save-Png 1024 'icon.png' $ink 0.72
# Splash: the disc alone, transparent (expo-splash-screen paints #0A0A0A behind it).
Save-Png 512 'splash-icon.png' $null 1.0
# Web favicon.
Save-Png 48 'favicon.png' $null 1.0
# Android adaptive icon: background layer, foreground inside the 66% safe zone, monochrome.
$bg = New-Object System.Drawing.Bitmap 512, 512
$gb = [System.Drawing.Graphics]::FromImage($bg); $gb.Clear($ink); $gb.Dispose()
$bg.Save((Join-Path $out 'android-icon-background.png'), [System.Drawing.Imaging.ImageFormat]::Png); $bg.Dispose()
Write-Output 'wrote android-icon-background.png (512 x 512)'
Save-Png 512 'android-icon-foreground.png' $null 0.6
Save-Png 432 'android-icon-monochrome.png' $null 0.6 $true $white
