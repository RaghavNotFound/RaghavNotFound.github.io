Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\ragha\.gemini\antigravity\brain\a39854f8-01fe-4cbb-9b13-4595e223f08d\gun_texture_new_1783810261992.png"
$outputPath = "C:\Users\ragha\Documents\antigravity\mysterious-tesla\assets\gun.png"

Write-Output "Loading image from $inputPath"
$img = [System.Drawing.Image]::FromFile($inputPath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)

$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0)
$g.Dispose()
$img.Dispose()

Write-Output "Image loaded successfully. Cleaning chroma-key..."

# Scan pixels and make magenta transparent
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Check if color is close to magenta (Chroma key)
        # Red > 130, Green < 120, Blue > 130
        if ($c.R -gt 130 -and $c.G -lt 120 -and $c.B -gt 130) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

Write-Output "Finding crop bounds..."
$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0
$found = $false

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 50) {
            $found = $true
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

if (-not $found) {
    Write-Output "Error: No non-transparent pixels found in the image!"
    $bmp.Dispose()
    exit 1
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1
Write-Output "Cropping to bounds: X [$minX to $maxX], Y [$minY to $maxY] (Size: ${w}x${h})"

$croppedBmp = New-Object System.Drawing.Bitmap($w, $h)
$cg = [System.Drawing.Graphics]::FromImage($croppedBmp)
$srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$cg.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$cg.Dispose()
$bmp.Dispose()

Write-Output "Saving cropped transparent PNG to $outputPath"
$croppedBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Dispose()

Write-Output "New texture processed successfully!"
