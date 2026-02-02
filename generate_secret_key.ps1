# Generate a strong Django secret key for production
# Usage: .\generate_secret_key.ps1

# Try to generate using Django
try {
    $key = python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" 2>$null
    if ($key) {
        Write-Host "Generated Django Secret Key:"
        Write-Host $key
        exit 0
    }
}
catch {
    # Continue to fallback
}

# Fallback to Python secrets module
try {
    $key = python -c "
import secrets
import string
chars = string.ascii_letters + string.digits + '!@#\$%^&*(-_=+)'
key = ''.join(secrets.choice(chars) for _ in range(50))
print(key)
" 2>$null
    
    if ($key) {
        Write-Host "Generated Secret Key (using Python secrets):"
        Write-Host $key
        exit 0
    }
}
catch {
    # Continue
}

# Fallback using .NET
try {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $key = [Convert]::ToBase64String($bytes)
    Write-Host "Generated Secret Key (using .NET):"
    Write-Host $key
    exit 0
}
catch {
    Write-Host "Error: Could not generate secret key"
    exit 1
}
