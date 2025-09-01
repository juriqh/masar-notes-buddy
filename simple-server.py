#!/usr/bin/env python3
"""
Simple Local Server for Schedule Processing
"""

import os
import json
import base64
import requests
from datetime import datetime, time
from typing import List, Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables from .env file
def load_env():
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

load_env()

app = Flask(__name__)
CORS(app)

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'your_supabase_url_here')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'your_supabase_service_role_key_here')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'your_gemini_api_key_here')
USER_ID = '797281cf-9397-4fca-b983-300825cde186'

def process_with_gemini(base64_image: str) -> List[Dict]:
    """Process image with Gemini Vision API"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = """
    Analyze this King Saud University student schedule image and extract all class information.
    
    Return a JSON array with this structure for each class:
    [
      {
        "course_code": "1203",
        "course_name_arabic": "مهارات التعلم نهج والتفكير والبحث",
        "course_name_english": "Learning Skills, Approach, Thinking, and Research",
        "day_number": 2,
        "start_time": "13:00",
        "end_time": "14:50",
        "building": "02",
        "floor": "2",
        "wing": "A",
        "room": "320",
        "instructor_name": "امل احمد عبدالله باصويل"
      }
    ]
    
    Important notes:
    - Day numbers: 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday
    - Time format: "HH:MM" in 24-hour format
    - Extract all classes from the schedule
    - If you see multiple entries for the same course on different days, create separate entries
    - Be precise with Arabic text extraction
    - Only return valid JSON, no other text
    """
    
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": base64_image
                    }
                }
            ]
        }]
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        text = result['candidates'][0]['content']['parts'][0]['text']
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\[[\s\S]*\]', text)
        if json_match:
            schedule_data = json.loads(json_match.group())
            print(f"Extracted {len(schedule_data)} classes")
            return schedule_data
        else:
            print("No JSON found in Gemini response")
            print("Response:", text)
            return []
            
    except Exception as e:
        print(f"Gemini API error: {e}")
        return []

def upload_to_supabase(schedule_data: List[Dict]):
    """Upload classes to Supabase using direct HTTP requests"""
    classes_to_insert = []
    
    for entry in schedule_data:
        # Convert day number to day name
        day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        day_name = day_names[entry['day_number'] - 1]
        
        class_data = {
            'user_id': USER_ID,
            'class_code': entry['course_code'],
            'class_name': entry['course_name_arabic'],
            'location': f"Building {entry['building']}, Floor {entry['floor']}, Wing {entry['wing']}, Room {entry['room']}",
            'days_of_week': day_name,
            'start_time': entry['start_time'] + ':00',
            'end_time': entry['end_time'] + ':00',
            'remind_before_minutes': 30,
            'active': True
        }
        
        classes_to_insert.append(class_data)
    
    if classes_to_insert:
        # Use Supabase REST API directly
        url = f"{SUPABASE_URL}/rest/v1/classes"
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        }
        
        response = requests.post(url, json=classes_to_insert, headers=headers)
        if response.status_code in [200, 201]:
            print(f"Successfully inserted {len(classes_to_insert)} classes")
            return True
        else:
            print(f"Failed to insert classes: {response.status_code} - {response.text}")
            return False
    else:
        print("No classes to insert")
        return False

@app.route('/api/process-schedule', methods=['POST'])
def process_schedule():
    """API endpoint for processing schedule images"""
    try:
        data = request.get_json()
        file_path = data.get('filePath')
        file_name = data.get('fileName')
        
        if not file_path or not file_name:
            return jsonify({'error': 'Missing filePath or fileName'}), 400
        
        # Download image from Supabase storage using REST API
        print(f"Downloading image: {file_path}")
        url = f"{SUPABASE_URL}/storage/v1/object/notes/{file_path}"
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}'
        }
        
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return jsonify({'error': f'Failed to download image: {response.status_code}'}), 400
        
        image_data = response.content
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Process with Gemini Vision API
        print("Processing with Gemini Vision API...")
        schedule_data = process_with_gemini(base64_image)
        
        if not schedule_data:
            return jsonify({'error': 'Failed to process image with Gemini'}), 500
        
        # Upload classes to database
        print("Uploading classes to database...")
        success = upload_to_supabase(schedule_data)
        
        if success:
            return jsonify({
                'classesFound': len(schedule_data),
                'classesInserted': len(schedule_data)
            })
        else:
            return jsonify({'error': 'Failed to upload classes to database'}), 500
        
    except Exception as e:
        print(f"Processing error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Simple server is running'})

if __name__ == '__main__':
    # Check environment variables
    if SUPABASE_URL == 'your_supabase_url_here':
        print("Error: Please set SUPABASE_URL environment variable")
        exit(1)
    
    if SUPABASE_KEY == 'your_supabase_service_role_key_here':
        print("Error: Please set SUPABASE_SERVICE_ROLE_KEY environment variable")
        exit(1)
        
    if GEMINI_API_KEY == 'your_gemini_api_key_here':
        print("Error: Please set GEMINI_API_KEY environment variable")
        exit(1)
    
    print("Starting simple server for schedule processing...")
    print("Server will be available at: http://localhost:5000")
    print("API endpoint: http://localhost:5000/api/process-schedule")
    app.run(host='0.0.0.0', port=5000, debug=True)
