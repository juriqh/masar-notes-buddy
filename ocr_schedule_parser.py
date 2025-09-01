#!/usr/bin/env python3
"""
OCR Schedule Parser for King Saud University
Parses student schedule images and uploads to Supabase
"""

import os
import re
import json
from datetime import datetime, time
from typing import List, Dict, Any, Optional
import base64
from dataclasses import dataclass

# Google Cloud Vision API
from google.cloud import vision
from google.oauth2 import service_account

# Supabase
from supabase import create_client, Client

@dataclass
class ScheduleEntry:
    course_code: str
    course_name_arabic: str
    course_name_english: str
    activity_type: str
    section: str
    hours: int
    day_number: int
    start_time: time
    end_time: time
    unit: str
    building: str
    floor: str
    wing: str
    room: str
    instructor_name: str

class ScheduleParser:
    def __init__(self, supabase_url: str, supabase_key: str, user_id: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.user_id = user_id
        
        # Initialize Google Cloud Vision
        credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if credentials_path:
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            self.vision_client = vision.ImageAnnotatorClient(credentials=credentials)
        else:
            self.vision_client = vision.ImageAnnotatorClient()
    
    def parse_arabic_time(self, time_str: str) -> tuple[time, time]:
        """Parse Arabic time format like '08:00 ص - 09:50 ص' to time objects"""
        # Remove Arabic text and clean
        time_str = re.sub(r'[صم]', '', time_str)  # Remove ص (AM) and م (PM)
        time_str = time_str.strip()
        
        # Split start and end times
        if ' - ' in time_str:
            start_str, end_str = time_str.split(' - ')
        else:
            raise ValueError(f"Invalid time format: {time_str}")
        
        # Parse times
        start_time = datetime.strptime(start_str.strip(), '%H:%M').time()
        end_time = datetime.strptime(end_str.strip(), '%H:%M').time()
        
        return start_time, end_time
    
    def day_number_to_name(self, day_num: int) -> str:
        """Convert day number to day name (Saudi week starts Sunday)"""
        days = {
            1: 'Sun',
            2: 'Mon', 
            3: 'Tue',
            4: 'Wed',
            5: 'Thu',
            6: 'Fri',
            7: 'Sat'
        }
        return days.get(day_num, 'Unknown')
    
    def extract_schedule_from_text(self, text: str) -> List[ScheduleEntry]:
        """Extract schedule entries from OCR text"""
        entries = []
        
        # Split text into lines and process
        lines = text.split('\n')
        current_course = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for course codes (3-4 digits)
            course_match = re.match(r'^(\d{3,4})\s+(.+)$', line)
            if course_match:
                current_course = {
                    'code': course_match.group(1),
                    'name': course_match.group(2).strip()
                }
                continue
            
            # Look for schedule entries with day, time, room info
            # Pattern: day_number time_arabic building floor wing room instructor
            schedule_match = re.match(
                r'(\d+)\s+([\d:صم\s\-]+)\s+(\d+)\s+(\d+)\s+([A-Z])\s+(\d+)\s+(.+)',
                line
            )
            
            if schedule_match and current_course:
                day_num = int(schedule_match.group(1))
                time_str = schedule_match.group(2)
                building = schedule_match.group(3)
                floor = schedule_match.group(4)
                wing = schedule_match.group(5)
                room = schedule_match.group(6)
                instructor = schedule_match.group(7).strip()
                
                try:
                    start_time, end_time = self.parse_arabic_time(time_str)
                    
                    entry = ScheduleEntry(
                        course_code=current_course['code'],
                        course_name_arabic=current_course['name'],
                        course_name_english='',  # Will be filled from known mappings
                        activity_type='إجبارية محاضرة',  # Default, can be enhanced
                        section='',  # Not always visible in OCR
                        hours=0,  # Can be calculated from time difference
                        day_number=day_num,
                        start_time=start_time,
                        end_time=end_time,
                        unit='1508',  # From the image
                        building=building,
                        floor=floor,
                        wing=wing,
                        room=room,
                        instructor_name=instructor
                    )
                    entries.append(entry)
                    
                except ValueError as e:
                    print(f"Error parsing time '{time_str}': {e}")
                    continue
        
        return entries
    
    def process_image(self, image_path: str) -> List[ScheduleEntry]:
        """Process schedule image and extract schedule entries"""
        with open(image_path, 'rb') as image_file:
            content = image_file.read()
        
        image = vision.Image(content=content)
        
        # Perform OCR
        response = self.vision_client.text_detection(image=image)
        texts = response.text_annotations
        
        if not texts:
            raise ValueError("No text found in image")
        
        # Get full text
        full_text = texts[0].description
        print("OCR Text extracted:")
        print(full_text)
        print("\n" + "="*50 + "\n")
        
        # Extract schedule entries
        entries = self.extract_schedule_from_text(full_text)
        return entries
    
    def upload_to_supabase(self, entries: List[ScheduleEntry]):
        """Upload schedule entries to Supabase"""
        classes_to_insert = []
        
        for entry in entries:
            # Convert to days_of_week format (CSV of day names)
            day_name = self.day_number_to_name(entry.day_number)
            
            # Check if this class already exists
            existing = self.supabase.table('classes').select('*').eq('user_id', self.user_id).eq('class_code', entry.course_code).eq('days_of_week', day_name).execute()
            
            if existing.data:
                print(f"Class {entry.course_code} on {day_name} already exists, skipping...")
                continue
            
            class_data = {
                'user_id': self.user_id,
                'class_code': entry.course_code,
                'class_name': entry.course_name_arabic,
                'location': f"Building {entry.building}, Floor {entry.floor}, Wing {entry.wing}, Room {entry.room}",
                'days_of_week': day_name,
                'start_time': entry.start_time.strftime('%H:%M:%S'),
                'end_time': entry.end_time.strftime('%H:%M:%S'),
                'remind_before_minutes': 30,  # Default 30 minutes
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
    """Main function to process schedule image"""
    # Environment variables
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')  # Service role key
    user_id = os.getenv('USER_ID', '797281cf-9397-4fca-b983-300825cde186')
    image_path = os.getenv('IMAGE_PATH', 'schedule.png')
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")
    
    # Initialize parser
    parser = ScheduleParser(supabase_url, supabase_key, user_id)
    
    # Process image
    print(f"Processing image: {image_path}")
    entries = parser.process_image(image_path)
    
    print(f"Found {len(entries)} schedule entries:")
    for entry in entries:
        print(f"- {entry.course_code}: {entry.course_name_arabic}")
        print(f"  Day {entry.day_number} ({parser.day_number_to_name(entry.day_number)}), {entry.start_time}-{entry.end_time}")
        print(f"  Location: Building {entry.building}, Floor {entry.floor}, Wing {entry.wing}, Room {entry.room}")
        print(f"  Instructor: {entry.instructor_name}")
        print()
    
    # Upload to Supabase
    print("Uploading to Supabase...")
    result = parser.upload_to_supabase(entries)
    
    if result:
        print("✅ Schedule uploaded successfully!")
    else:
        print("ℹ️ No new classes to upload")

if __name__ == "__main__":
    main()
