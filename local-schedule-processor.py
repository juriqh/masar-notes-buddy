#!/usr/bin/env python3
"""
Local Schedule Processor - Process schedule images without Vercel
Run this script locally to process schedule images with Gemini Vision API
"""

import os
import json
import base64
import requests
from datetime import datetime, time
from typing import List, Dict, Any
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'your_supabase_url_here')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your_supabase_service_role_key_here')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'your_gemini_api_key_here')
USER_ID = '797281cf-9397-4fca-b983-300825cde186'

class LocalScheduleProcessor:
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
    def process_image_file(self, image_path: str):
        """Process a local image file"""
        print(f"Processing image: {image_path}")
        
        # Read and encode image
        with open(image_path, 'rb') as f:
            image_data = f.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Upload to Supabase storage
        file_name = f"schedule_{int(datetime.now().timestamp())}.jpg"
        file_path = f"schedules/{file_name}"
        
        print("Uploading to Supabase storage...")
        result = self.supabase.storage.from_('schedules').upload(
            file_path, 
            image_data, 
            file_options={"content-type": "image/jpeg"}
        )
        
        if result.get('error'):
            print(f"Upload error: {result['error']}")
            return
        
        print("Upload successful!")
        
        # Process with Gemini Vision API
        print("Processing with Gemini Vision API...")
        schedule_data = self.process_with_gemini(base64_image)
        
        if not schedule_data:
            print("Failed to process image with Gemini")
            return
        
        # Upload classes to database
        print("Uploading classes to database...")
        self.upload_classes_to_db(schedule_data)
        
        # Clean up uploaded image
        self.supabase.storage.from_('schedules').remove([file_path])
        print("Processing complete!")
    
    def process_with_gemini(self, base64_image: str) -> List[Dict]:
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

def main():
    """Main function"""
    if len(os.sys.argv) != 2:
        print("Usage: python local-schedule-processor.py <image_path>")
        print("Example: python local-schedule-processor.py schedule.jpg")
        return
    
    image_path = os.sys.argv[1]
    
    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found")
        return
    
    # Check environment variables
    if SUPABASE_URL == 'your_supabase_url_here':
        print("Error: Please set SUPABASE_URL environment variable")
        return
    
    if SUPABASE_KEY == 'your_supabase_service_role_key_here':
        print("Error: Please set SUPABASE_KEY environment variable")
        return
        
    if GEMINI_API_KEY == 'your_gemini_api_key_here':
        print("Error: Please set GEMINI_API_KEY environment variable")
        return
    
    # Process the image
    processor = LocalScheduleProcessor()
    processor.process_image_file(image_path)

if __name__ == "__main__":
    main()
