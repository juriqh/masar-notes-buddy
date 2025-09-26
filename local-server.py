#!/usr/bin/env python3
"""
Local Server for Schedule Processing
Run this to enable real OCR processing from the web interface
"""

import os
import json
import base64
import requests
from datetime import datetime, time
from typing import List, Dict, Any
from supabase import create_client, Client
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tempfile

# Load environment variables from .env file
def load_env():
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

load_env()

# Also try using python-dotenv as backup
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Loaded environment variables using python-dotenv")
except ImportError:
    print("python-dotenv not available, using manual loading")

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'your_supabase_url_here')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'your_supabase_service_role_key_here')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'your_gemini_api_key_here')
USER_ID = '797281cf-9397-4fca-b983-300825cde186'

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

class ScheduleProcessor:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    def process_image_data(self, image_data: bytes, file_name: str):
        """Process image data from frontend upload"""
        print(f"Processing image: {file_name}")
        
        # Encode image for Gemini API
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Process with Gemini Vision API
        print("Processing with Gemini Vision API...")
        schedule_data = self.process_with_gemini(base64_image)
        
        if not schedule_data:
            raise Exception("Failed to process image with Gemini")
        
        # Upload classes to database
        print("Uploading classes to database...")
        result = self.upload_classes_to_db(schedule_data)
        
        print("Processing complete!")
        
        return {
            'classesFound': len(schedule_data),
            'classesInserted': len(schedule_data) if result else 0
        }
    
    def process_with_gemini(self, base64_image: str) -> List[Dict]:
        """Process image with Gemini Vision API"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        
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
            print(f"Making request to Gemini API: {url}")
            print(f"Payload keys: {list(payload.keys())}")
            response = requests.post(url, json=payload)
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                print(f"Error response: {response.text}")
                return []
                
            response.raise_for_status()
            
            result = response.json()
            print(f"Gemini response keys: {list(result.keys())}")
            
            if 'candidates' not in result or not result['candidates']:
                print("No candidates in response")
                print(f"Full response: {result}")
                return []
                
            text = result['candidates'][0]['content']['parts'][0]['text']
            print(f"Gemini response text: {text[:200]}...")
            
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
            import traceback
            traceback.print_exc()
            return []
    
    def upload_classes_to_db(self, schedule_data: List[Dict]):
        """Upload extracted classes to Supabase database"""
        classes_to_insert = []
        
        for entry in schedule_data:
            # Convert day number to day name
            day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            day_name = day_names[entry['day_number'] - 1]
            
            # Check if class already exists
            existing = self.supabase.table('classes').select('id').eq('user_id', USER_ID).eq('class_code', entry['course_code']).eq('days_of_week', day_name).execute()
            
            if existing.data:
                print(f"Class {entry['course_code']} on {day_name} already exists, skipping...")
                continue
            
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
            result = self.supabase.table('classes').insert(classes_to_insert).execute()
            print(f"Successfully inserted {len(classes_to_insert)} classes")
            return result
        else:
            print("No new classes to insert")
            return None

# Initialize processor
processor = ScheduleProcessor()

@app.route('/api/process-schedule', methods=['POST'])
def process_schedule():
    """API endpoint for processing schedule images"""
    try:
        data = request.get_json()
        file_name = data.get('fileName')
        base64_image = data.get('base64Image')
        mime_type = data.get('mimeType', 'image/jpeg')
        
        if not file_name or not base64_image:
            return jsonify({'error': 'Missing fileName or base64Image'}), 400
        
        print(f"Processing image: {file_name}")
        
        # Convert base64 to bytes
        image_data = base64.b64decode(base64_image)
        
        # Process the image directly
        result = processor.process_image_data(image_data, file_name)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Processing error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Local server is running'})

if __name__ == '__main__':
    # Check environment variables
    print(f"SUPABASE_URL: {SUPABASE_URL[:20]}...")
    print(f"SUPABASE_KEY: {SUPABASE_KEY[:20]}...")
    print(f"GEMINI_API_KEY: {GEMINI_API_KEY[:20]}...")
    
    if SUPABASE_URL == 'your_supabase_url_here':
        print("Error: Please set SUPABASE_URL environment variable")
        exit(1)
    
    if SUPABASE_KEY == 'your_supabase_service_role_key_here':
        print("Error: Please set SUPABASE_SERVICE_ROLE_KEY environment variable")
        exit(1)
        
    if GEMINI_API_KEY == 'your_gemini_api_key_here':
        print("Error: Please set GEMINI_API_KEY environment variable")
        exit(1)
    
    print("Starting local server for schedule processing...")
    print("Server will be available at: http://localhost:5000")
    print("API endpoint: http://localhost:5000/api/process-schedule")
    app.run(host='0.0.0.0', port=5000, debug=True)
