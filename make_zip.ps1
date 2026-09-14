$destination = "c:\Users\Pixel\Downloads\Uni-Project\techstore-final.zip"
if (Test-Path $destination) {
    Remove-Item -Force $destination
}

$items = Get-ChildItem -Path "c:\Users\Pixel\Downloads\Uni-Project" | Where-Object { 
    $_.Name -ne "node_modules" -and 
    $_.Name -ne "dist" -and 
    $_.Name -ne "techstore-final.zip" -and 
    $_.Name -ne "make_zip.ps1"
}

Compress-Archive -Path $items.FullName -DestinationPath $destination -Force
Write-Host "techstore-final.zip created successfully! File size: $((Get-Item $destination).Length) bytes"
