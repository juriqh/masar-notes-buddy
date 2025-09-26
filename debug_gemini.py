#!/usr/bin/env python3
import os
import base64
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'your_gemini_api_key_here')
print(f"GEMINI_API_KEY: {GEMINI_API_KEY[:20]}...")

if GEMINI_API_KEY == 'your_gemini_api_key_here':
    print("Error: GEMINI_API_KEY not found")
    exit(1)

# Test image
png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
base64_image = base64.b64encode(png_data).decode('utf-8')

url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}'

payload = {
    'contents': [{
        'parts': [
            {'text': 'What do you see in this image?'},
            {
                'inline_data': {
                    'mime_type': 'image/png',
                    'data': base64_image
                }
            }
        ]
    }]
}

print(f"Making request to: {url}")
print(f"Payload keys: {list(payload.keys())}")

try:
    response = requests.post(url, json=payload)
    print(f"Response status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Success: {result}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()
