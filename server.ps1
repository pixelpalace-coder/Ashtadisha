# Ashtadisha Local Server (PowerShell)
# Serves files in the current directory on http://localhost:8000
# Essential for testing dynamic components and ES Modules locally without Node/Python

$port = 8000
$url = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Write-Host "--- Ashtadisha Development Server ---" -ForegroundColor Cyan
    Write-Host "Listening on: $url" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
    Write-Host ""

    # Open the browser automatically
    Start-Process $url

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }
        
        $filePath = Join-Path (Get-Location) $path.TrimStart('/')

        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($extension) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".json" { "application/json" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".webp" { "image/webp" }
                default { "application/octet-stream" }
            }

            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        }
        else {
            $response.StatusCode = 404
            $errorMsg = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($errorMsg, 0, $errorMsg.Length)
        }
        $response.Close()
    }
}
finally {
    $listener.Stop()
}
