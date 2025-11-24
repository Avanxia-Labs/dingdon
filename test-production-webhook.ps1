# Script para probar el webhook de producción
# IMPORTANTE: Reemplaza "TU-DOMINIO-PRODUCCION" con la URL real de tu app

$productionUrl = "https://dindon.onrender.com"
$workspaceId = "40dfcb7f-aa8a-4ba8-9c13-3adfa1c5b1e8"

# Simula un mensaje de Twilio
$body = "From=whatsapp%3A%2B14155238886&Body=Hola+desde+prueba"

Write-Host "🧪 Probando webhook de producción..." -ForegroundColor Yellow
Write-Host "   URL: $productionUrl/api/whatsapp/webhook?workspaceId=$workspaceId" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "$productionUrl/api/whatsapp/webhook?workspaceId=$workspaceId" `
        -Method POST `
        -Body $body `
        -ContentType "application/x-www-form-urlencoded" `
        -TimeoutSec 30

    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "   Content: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response Body: $responseBody" -ForegroundColor Red
    }
}
