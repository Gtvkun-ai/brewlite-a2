$api = "http://localhost:3001"
$pw = $env:B30_REGRESSION_PASSWORD
if ([string]::IsNullOrWhiteSpace($pw)) {
    throw "Set B30_REGRESSION_PASSWORD in the local process environment before running this local-only repro."
}
$stamp = Get-Date -Format yyyyMMddHHmmss

function Register($email, $withPhone) {
    $body = @{
        email = $email
        password = $pw
        fullName = "Test User"
    }

    if ($withPhone) {
        $body.phone = "0900000000"
    }

    try {
        $response = Invoke-WebRequest -Method Post `
            -Uri "$api/auth/register" `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json)

        "HTTP $([int]$response.StatusCode) | Registration succeeded"
    }
    catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "request-failed" }
        "HTTP $status | Registration rejected"
    }
}

"--- Co phone ---"
Register "phone.bug.$stamp@brewlite.test" $true

"--- Khong co phone ---"
Register "phone.ok.$stamp@brewlite.test" $false
