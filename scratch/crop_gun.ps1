Add-Type -AssemblyName System.Drawing

$filePath = "C:\Users\ragha\Documents\antigravity\mysterious-tesla\assets\gun.png"

Write-Output "Loading PNG from $filePath"
$bmp = New-Object System.Drawing.Bitmap($filePath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0
$found = $false

Write-Output "Scanning pixels to find non-transparent bounds..."

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Check if the pixel has alpha transparency (Alpha > 50)
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
Write-Output "Bounds identified: X [$minX to $maxX], Y [$minY to $maxY] (Size: ${w}x${h})"

# Create a cropped bitmap
$croppedBmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($croppedBmp)

# Draw only the cropped portion
$srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$bmp.Dispose()

# Save the cropped bitmap back to assets/gun.png
Write-Output "Saving cropped PNG to $filePath"
$croppedBmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Dispose()

Write-Output "Cropping completed successfully!"
