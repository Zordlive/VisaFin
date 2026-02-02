#!/bin/bash
# Generate a strong Django secret key for production

python_code='
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
'

# Try with django first (if installed)
if command -v python &> /dev/null; then
    python -c "$python_code" 2>/dev/null && exit 0
fi

# Fallback to python3
if command -v python3 &> /dev/null; then
    python3 -c "$python_code" 2>/dev/null && exit 0
fi

# If Django not available, use python secrets
python_fallback='
import secrets
import string
chars = string.ascii_letters + string.digits + "!@#$%^&*(-_=+)"
key = "".join(secrets.choice(chars) for _ in range(50))
print(key)
'

if command -v python &> /dev/null; then
    python -c "$python_fallback"
elif command -v python3 &> /dev/null; then
    python3 -c "$python_fallback"
else
    echo "Error: Python not found. Cannot generate secret key."
    exit 1
fi
