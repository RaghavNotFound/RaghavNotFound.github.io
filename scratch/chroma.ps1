Add-Type -AssemblyName System.Drawing

$inputPath = "C:\Users\ragha\.gemini\antigravity\brain\a39854f8-01fe-4cbb-9b13-4595e223f08d\gun_chroma_1783808867393.png"
$outputPath = "C:\Users\ragha\Documents\antigravity\mysterious-tesla\assets\gun.png"

Write-Output "Loading image from $inputPath"
$img = [System.Drawing.Image]::FromFile($inputPath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)

$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0)
$g.Dispose()
$img.Dispose()

Write-Output "Image loaded successfully. Size: $($bmp.Width)x$($bmp.Height). Cleaning chroma-key..."

# Scan pixels and make magenta transparent
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Check if color is close to magenta (Chroma key)
        # Red > 140, Green < 110, Blue > 140
        if ($c.R -gt 140 -and $c.G -lt 110 -and $c.B -gt 140) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

Write-Output "Saving transparent PNG to $outputPath"
$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Completed successfully!"
