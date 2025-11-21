$workspaceId = "40dfcb7f-aa8a-4ba8-9c13-3adfa1c5b1e8"
# URL encode completo: "whatsapp:+1234567890" -> "whatsapp%3A%2B1234567890"
# %3A = :
# %2B = +
$body = "From=whatsapp%3A%2B1234567890&Body=Hola"

Write-Host "Enviando mensaje de prueba al webhook..." -ForegroundColor Yellow

$response = Invoke-WebRequest `
    -Uri "http://localhost:3000/api/whatsapp/webhook?workspaceId=$workspaceId" `
    -Method POST `
    -Body $body `
    -ContentType "application/x-www-form-urlencoded"

Write-Host "Respuesta recibida:" -ForegroundColor Green
Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Cyan
Write-Host "Content: $($response.Content)" -ForegroundColor Cyan
