$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$zipName = "homeandown-frontend-$timestamp.zip"

if (Test-Path $zipName) {
    Remove-Item $zipName -Force
}

Write-Host "Creating frontend deployment zip..." -ForegroundColor Green
Compress-Archive -Path "dist\*" -DestinationPath $zipName -CompressionLevel Optimal -Force

$size = [math]::Round((Get-Item $zipName).Length / 1MB, 2)
Write-Host ""
Write-Host "SUCCESS! Frontend zip created:" -ForegroundColor Green
Write-Host "  File: $zipName" -ForegroundColor White
Write-Host "  Size: $size MB" -ForegroundColor White
Write-Host ""
Write-Host "Ready for deployment! Extract contents of this zip to your web server's public directory." -ForegroundColor Cyan
