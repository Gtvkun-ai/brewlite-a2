$api = "http://localhost:3001"
$pw = "E2e-Only-Password1!"
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
        Invoke-RestMethod -Method Post `
            -Uri "$api/auth/register" `
            -ContentType "application/json" `
            -Body ($body | ConvertTo-Json) | Out-Null

        "HTTP 200 | Registration succeeded"
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        "HTTP $status | $($_.ErrorDetails.Message)"
    }
}

"--- Co phone ---"
Register "phone.bug.$stamp@brewlite.test" $true

"--- Khong co phone ---"
Register "phone.ok.$stamp@brewlite.test" $false
