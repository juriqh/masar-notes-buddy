import discord
from discord.ext import commands, tasks
import asyncio
import os
from datetime import datetime, timedelta, time
import json
from supabase import create_client, Client
import pytz
import google.generativeai as genai
import base64
import requests
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Discord Bot Configuration
DISCORD_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
DISCORD_CHANNEL_ID = int(os.getenv('DISCORD_CHANNEL_ID', '0'))  # Channel where bot sends messages
DISCORD_USER_ID = int(os.getenv('DISCORD_USER_ID', '0'))  # Fatoom's Discord user ID
USER_ID = os.getenv('USER_ID', '797281cf-9397-4fca-b983-300825cde186')  # Database user ID

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Gemini AI Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Timezone configuration (adjust for your location)
TIMEZONE = pytz.timezone('Asia/Riyadh')  # Saudi Arabia timezone

# Initialize Discord bot
intents = discord.Intents.default()
# intents.message_content = True  # Commented out to test without privileged intents
bot = commands.Bot(command_prefix='!', intents=intents)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini AI
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    ai_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    ai_model = None

class TaskTools:
    """Tools that the bot can use to perform tasks"""
    
    def __init__(self, supabase_client: Client, user_id: str):
        self.supabase = supabase_client
        self.user_id = user_id
    
    async def set_reminder(self, class_code: str, item: str) -> Dict[str, Any]:
        """Set a reminder for a specific class"""
        try:
            # Fetch the class from Supabase
            response = self.supabase.from_('classes').select('id').eq('user_id', self.user_id).eq('class_code', class_code).single().execute()
            class_data = response.data
            
            if class_data:
                class_id = class_data['id']
                # Update the bring_items field for the class
                update_response = self.supabase.from_('classes').update({'bring_items': item}).eq('id', class_id).execute()
                if update_response.data:
                    return {"success": True, "message": f"✅ Reminder set for {class_code}: '{item}'"}
                else:
                    return {"success": False, "message": f"❌ Failed to set reminder for {class_code}."}
            else:
                return {"success": False, "message": f"❌ Class {class_code} not found. Make sure the class code is correct."}
                
        except Exception as e:
            return {"success": False, "message": f"❌ Error setting reminder: {str(e)}"}
    
    async def get_schedule(self, days_ahead: int = 1) -> Dict[str, Any]:
        """Get upcoming schedule using hardcoded data"""
        try:
            # Hardcoded schedule data
            hardcoded_schedule = [
                {
                    'id': 1,
                    'class_code': "1203",
                    'class_name': "مهارات التعلم والتفكير والبحث",
                    'location': "Building 02, Floor 2, Wing A, Room 320",
                    'days_of_week': "Mon",
                    'start_time': "13:00:00",
                    'end_time': "14:50:00",
                    'instructor_name': "امل احمد عبدالله باصويل"
                },
                {
                    'id': 2,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 02, Floor 2, Wing A, Room 302",
                    'days_of_week': "Sun",
                    'start_time': "08:00:00",
                    'end_time': "09:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 3,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 02, Floor 2, Wing A, Room 316",
                    'days_of_week': "Wed",
                    'start_time': "08:00:00",
                    'end_time': "09:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 4,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 02, Floor 2, Wing A, Room 318",
                    'days_of_week': "Thu",
                    'start_time': "08:00:00",
                    'end_time': "09:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 5,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 03, Floor 2, Wing A, Room 415",
                    'days_of_week': "Tue",
                    'start_time': "08:00:00",
                    'end_time': "09:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 6,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 03, Floor 2, Wing A, Room 424",
                    'days_of_week': "Mon",
                    'start_time': "08:00:00",
                    'end_time': "09:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 7,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 02, Floor 2, Wing A, Room 316",
                    'days_of_week': "Wed",
                    'start_time': "10:00:00",
                    'end_time': "10:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 8,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 02, Floor 2, Wing A, Room 318",
                    'days_of_week': "Thu",
                    'start_time': "10:00:00",
                    'end_time': "11:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 9,
                    'class_code': "1001",
                    'class_name': "مهارات اللغة الإنجليزية (1)",
                    'location': "Building 03, Floor 2, Wing A, Room 424",
                    'days_of_week': "Mon",
                    'start_time': "10:00:00",
                    'end_time': "11:50:00",
                    'instructor_name': "منيره نامي حمد النامي"
                },
                {
                    'id': 10,
                    'class_code': "1202",
                    'class_name': "مهارات الحاسب",
                    'location': "Building 02, Floor 2, Wing A, Room 306",
                    'days_of_week': "Tue",
                    'start_time': "10:00:00",
                    'end_time': "11:50:00",
                    'instructor_name': "اروى عبدالله محمد المقرن"
                },
                {
                    'id': 11,
                    'class_code': "1202",
                    'class_name': "مهارات الحاسب (عملي)",
                    'location': "Building 02, Floor 2, Wing A, Room 306",
                    'days_of_week': "Tue",
                    'start_time': "13:00:00",
                    'end_time': "14:50:00",
                    'instructor_name': "اروى عبدالله محمد المقرن"
                },
                {
                    'id': 12,
                    'class_code': "1103",
                    'class_name': "مقدمة في الإحصاء",
                    'location': "Building 02, Floor 2, Wing A, Room 305",
                    'days_of_week': "Sun",
                    'start_time': "10:00:00",
                    'end_time': "11:50:00",
                    'instructor_name': "امل منصور فرح العبدلي الفيفي"
                },
                {
                    'id': 13,
                    'class_code': "1103",
                    'class_name': "مقدمة في الإحصاء (تمارين)",
                    'location': "Building 02, Floor 2, Wing A, Room 305",
                    'days_of_week': "Sun",
                    'start_time': "13:00:00",
                    'end_time': "14:50:00",
                    'instructor_name': "امل منصور فرح العبدلي الفيفي"
                },
                {
                    'id': 14,
                    'class_code': "—",
                    'class_name': "اللياقة والثقافة الصحية",
                    'location': "TBA",
                    'days_of_week': "Sun",
                    'start_time': "13:00:00",
                    'end_time': "14:50:00",
                    'instructor_name': "تغريد محمد عثمان"
                }
            ]
            
            # Get today's date and filter classes
            today = datetime.now(TIMEZONE)
            today_weekday = today.strftime('%a')  # Mon, Tue, Wed, etc.
            
            # Filter classes for today
            today_classes = [cls for cls in hardcoded_schedule if cls['days_of_week'] == today_weekday]
            
            if not today_classes:
                return {"success": True, "message": "📅 No classes scheduled for today!", "classes": []}
            
            # Format classes for response
            upcoming_classes = []
            for cls in today_classes:
                upcoming_classes.append({
                    'name': cls['class_name'],
                    'code': cls['class_code'],
                    'time': cls['start_time'] + ' - ' + cls['end_time'],
                    'location': cls['location'],
                    'date': today.strftime('%Y-%m-%d'),
                    'bring_items': cls.get('bring_items', ''),
                    'instructor': cls.get('instructor_name', '')
                })
            
            return {"success": True, "message": f"📅 Found {len(upcoming_classes)} classes for today", "classes": upcoming_classes}
            
        except Exception as e:
            return {"success": False, "message": f"❌ Error getting schedule: {str(e)}"}
    
    async def upload_note(self, class_code: str, note_content: str, note_type: str = "text") -> Dict[str, Any]:
        """Upload a note for a specific class"""
        try:
            # Fetch the class from Supabase
            response = self.supabase.from_('classes').select('id').eq('user_id', self.user_id).eq('class_code', class_code).single().execute()
            class_data = response.data
            
            if class_data:
                class_id = class_data['id']
                # Insert note into notes_uploads table
                note_data = {
                    'user_id': self.user_id,
                    'class_id': class_id,
                    'note_content': note_content,
                    'note_type': note_type,
                    'upload_date': datetime.now(TIMEZONE).isoformat()
                }
                
                insert_response = self.supabase.from_('notes_uploads').insert(note_data).execute()
                if insert_response.data:
                    return {"success": True, "message": f"✅ Note uploaded for {class_code}"}
                else:
                    return {"success": False, "message": f"❌ Failed to upload note for {class_code}."}
            else:
                return {"success": False, "message": f"❌ Class {class_code} not found."}
                
        except Exception as e:
            return {"success": False, "message": f"❌ Error uploading note: {str(e)}"}
    
    async def get_notes(self, class_code: str = None) -> Dict[str, Any]:
        """Get notes for a specific class or all classes"""
        try:
            query = self.supabase.from_('notes_uploads').select('*, classes(class_name, class_code)').eq('user_id', self.user_id)
            
            if class_code:
                # Get class ID first
                class_response = self.supabase.from_('classes').select('id').eq('user_id', self.user_id).eq('class_code', class_code).single().execute()
                if class_response.data:
                    class_id = class_response.data['id']
                    query = query.eq('class_id', class_id)
                else:
                    return {"success": False, "message": f"❌ Class {class_code} not found."}
            
            response = query.execute()
            notes = response.data
            
            if not notes:
                return {"success": True, "message": "📝 No notes found!", "notes": []}
            
            return {"success": True, "message": f"📝 Found {len(notes)} notes", "notes": notes}
            
        except Exception as e:
            return {"success": False, "message": f"❌ Error getting notes: {str(e)}"}
    
    async def create_reminder(self, title: str, description: str, remind_date: str, remind_time: str) -> Dict[str, Any]:
        """Create a custom reminder"""
        try:
            # Parse date and time
            remind_datetime = datetime.strptime(f"{remind_date} {remind_time}", "%Y-%m-%d %H:%M")
            remind_datetime = TIMEZONE.localize(remind_datetime)
            
            reminder_data = {
                'user_id': self.user_id,
                'title': title,
                'description': description,
                'remind_date': remind_datetime.isoformat(),
                'created_at': datetime.now(TIMEZONE).isoformat()
            }
            
            insert_response = self.supabase.from_('reminders').insert(reminder_data).execute()
            if insert_response.data:
                return {"success": True, "message": f"✅ Reminder created: '{title}' for {remind_date} at {remind_time}"}
            else:
                return {"success": False, "message": "❌ Failed to create reminder."}
                
        except Exception as e:
            return {"success": False, "message": f"❌ Error creating reminder: {str(e)}"}

class ScheduleReminderBot:
    def __init__(self):
        self.user_id = USER_ID  # Use the USER_ID from environment variables
        self.tools = TaskTools(supabase, self.user_id)
        
    async def get_upcoming_classes(self, hours_ahead=2):
        """Get classes starting within the next X hours using hardcoded data"""
        now = datetime.now(TIMEZONE)
        future_time = now + timedelta(hours=hours_ahead)
        
        # Hardcoded schedule data
        hardcoded_schedule = [
            {
                'id': 1,
                'class_code': "1203",
                'class_name': "مهارات التعلم والتفكير والبحث",
                'location': "Building 02, Floor 2, Wing A, Room 320",
                'days_of_week': "Mon",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل احمد عبدالله باصويل"
            },
            {
                'id': 2,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 302",
                'days_of_week': "Sun",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 3,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 4,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 5,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 415",
                'days_of_week': "Tue",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 6,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 7,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "10:00:00",
                'end_time': "10:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 8,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 9,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 10,
                'class_code': "1202",
                'class_name': "مهارات الحاسب",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'id': 11,
                'class_code': "1202",
                'class_name': "مهارات الحاسب (عملي)",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'id': 12,
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
                'id': 13,
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء (تمارين)",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
                'id': 14,
                'class_code': "—",
                'class_name': "اللياقة والثقافة الصحية",
                'location': "TBA",
                'days_of_week': "Sun",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "تغريد محمد عثمان"
            }
        ]
        
        # Get current day of week
        current_weekday = now.strftime('%a')  # Mon, Tue, Wed, etc.
        
        upcoming_classes = []
        for class_item in hardcoded_schedule:
            if class_item['days_of_week'] == current_weekday:
                # Parse start time
                start_time_str = class_item.get('start_time', '')
                if start_time_str:
                    try:
                        start_time = datetime.strptime(start_time_str, '%H:%M:%S').time()
                        class_datetime = datetime.combine(now.date(), start_time)
                        class_datetime = TIMEZONE.localize(class_datetime)
                        
                        # Check if class is within the specified hours
                        if now <= class_datetime <= future_time:
                            upcoming_classes.append({
                                'name': class_item.get('class_name', 'Unknown Class'),
                                'time': f"{class_item['start_time']} - {class_item['end_time']}",
                                'location': class_item.get('location', 'Unknown Location'),
                                'code': class_item.get('class_code', ''),
                                'bring_items': class_item.get('bring_items', ''),
                                'instructor': class_item.get('instructor_name', '')
                            })
                    except ValueError:
                        print(f"Error parsing time: {start_time_str}")
                        continue
                
        return upcoming_classes
    
    async def get_today_completed_classes(self):
        """Get classes that were completed today (based on uploaded notes)"""
        today = datetime.now(TIMEZONE).date()
        
        # Get notes uploaded today
        response = supabase.table('notes_uploads').select('*, classes(*)').eq('user_id', self.user_id).gte('created_at', today.isoformat()).execute()
        
        completed_classes = []
        for note in response.data:
            if note.get('classes'):
                class_info = note['classes']
                completed_classes.append({
                    'name': class_info.get('class_name', 'Unknown Class'),
                    'time': class_info.get('time', ''),
                    'notes_uploaded': True,
                    'upload_time': note.get('created_at', '')
                })
        
        return completed_classes
    
    async def get_tomorrow_classes(self):
        """Get classes scheduled for tomorrow using hardcoded data"""
        tomorrow = datetime.now(TIMEZONE) + timedelta(days=1)
        tomorrow_weekday = tomorrow.strftime('%a')  # Mon, Tue, Wed, etc.
        
        # Hardcoded schedule data (same as in get_schedule)
        hardcoded_schedule = [
            {
                'id': 1,
                'class_code': "1203",
                'class_name': "مهارات التعلم والتفكير والبحث",
                'location': "Building 02, Floor 2, Wing A, Room 320",
                'days_of_week': "Mon",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل احمد عبدالله باصويل"
            },
            {
                'id': 2,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 302",
                'days_of_week': "Sun",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 3,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 4,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 5,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 415",
                'days_of_week': "Tue",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 6,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 7,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "10:00:00",
                'end_time': "10:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 8,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 9,
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'id': 10,
                'class_code': "1202",
                'class_name': "مهارات الحاسب",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'id': 11,
                'class_code': "1202",
                'class_name': "مهارات الحاسب (عملي)",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'id': 12,
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
                'id': 13,
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء (تمارين)",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
                'id': 14,
                'class_code': "—",
                'class_name': "اللياقة والثقافة الصحية",
                'location': "TBA",
                'days_of_week': "Sun",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "تغريد محمد عثمان"
            }
        ]
        
        # Filter classes for tomorrow
        tomorrow_classes = []
        for cls in hardcoded_schedule:
            if cls['days_of_week'] == tomorrow_weekday:
                tomorrow_classes.append({
                    'name': cls['class_name'],
                    'time': f"{cls['start_time']} - {cls['end_time']}",
                    'location': cls['location'],
                    'code': cls['class_code'],
                    'bring_items': cls.get('bring_items', ''),
                    'instructor': cls.get('instructor_name', '')
                })
        
        return tomorrow_classes
    
    async def get_ai_response_with_tools(self, message: str, user_context: str = "") -> str:
        """Get AI response with tool usage capability"""
        if not ai_model:
            return "Sorry, AI features are not available. Please check the Gemini API key configuration."

        try:
            # Create context-aware prompt with available tools
            system_prompt = f"""You are Masar Assistant, Fatoom's personal AI academic companion. You can help with:

1. Academic scheduling and reminders
2. Study tips and time management
3. Course-related questions
4. General academic support
5. **PERFORMING ACTUAL TASKS** using available tools

**Available Tools:**
- set_reminder(class_code, item): Set reminder for specific class
- get_schedule(days_ahead): Get upcoming schedule
- upload_note(class_code, note_content, note_type): Upload note for class
- get_notes(class_code): Get notes for class
- create_reminder(title, description, remind_date, remind_time): Create custom reminder

**User Context:** {user_context}

**IMPORTANT:** When the user asks you to perform a task, you MUST use the appropriate tool. For example:
- "Remind me to bring my laptop for CS101" → Use set_reminder("CS101", "laptop")
- "Show me my schedule" → Use get_schedule(7)
- "Upload a note for MATH201" → Use upload_note("MATH201", "note content", "text")
- "Create a reminder for my exam" → Use create_reminder("Exam", "Study for exam", "2024-01-15", "09:00")

Be helpful, friendly, and academic-focused. When using tools, explain what you're doing and show the results.

User Message: {message}"""

            response = ai_model.generate_content(system_prompt)
            return response.text
        except Exception as e:
            print(f"AI Error: {e}")
            return "Sorry, I'm having trouble processing your request right now. Please try again later."
    
    async def process_task_request(self, message: str) -> str:
        """Process a task request and execute appropriate tools"""
        message_lower = message.lower()
        
        # Check for reminder requests
        if "remind" in message_lower and "bring" in message_lower:
            # Extract class code and item
            words = message.split()
            class_code = None
            item = None
            
            for i, word in enumerate(words):
                if word.upper() in ["CS101", "MATH201", "PHYS101", "ENG101"]:  # Add your class codes
                    class_code = word.upper()
                    # Get the item after "bring"
                    if "bring" in words[i:]:
                        bring_index = words[i:].index("bring")
                        item = " ".join(words[i + bring_index + 1:])
                        break
            
            if class_code and item:
                result = await self.tools.set_reminder(class_code, item)
                return result["message"]
        
        # Check for schedule requests
        elif "schedule" in message_lower or "classes" in message_lower:
            result = await self.tools.get_schedule(7)  # Get next 7 days
            if result["success"]:
                if result["classes"]:
                    schedule_text = "📅 **Your Schedule:**\n"
                    for class_info in result["classes"]:
                        schedule_text += f"📚 **{class_info['name']}** ({class_info['code']})\n"
                        schedule_text += f"⏰ {class_info['time']}\n"
                        schedule_text += f"📍 {class_info['location']}\n"
                        if class_info['bring_items']:
                            schedule_text += f"📝 Bring: {class_info['bring_items']}\n"
                        schedule_text += f"📅 {class_info['date']}\n\n"
                    return schedule_text
                else:
                    return result["message"]
            else:
                return result["message"]
        
        # Check for note upload requests
        elif "upload" in message_lower and "note" in message_lower:
            # Extract class code and note content
            words = message.split()
            class_code = None
            note_content = "Note uploaded via Discord"
            
            for word in words:
                if word.upper() in ["CS101", "MATH201", "PHYS101", "ENG101"]:
                    class_code = word.upper()
                    break
            
            if class_code:
                result = await self.tools.upload_note(class_code, note_content)
                return result["message"]
            else:
                return "❌ Please specify which class (e.g., 'upload note for CS101')"
        
        # Check for note retrieval requests
        elif "notes" in message_lower and ("show" in message_lower or "get" in message_lower):
            # Extract class code if specified
            words = message.split()
            class_code = None
            
            for word in words:
                if word.upper() in ["CS101", "MATH201", "PHYS101", "ENG101"]:
                    class_code = word.upper()
                    break
            
            result = await self.tools.get_notes(class_code)
            if result["success"]:
                if result["notes"]:
                    notes_text = "📝 **Your Notes:**\n"
                    for note in result["notes"]:
                        notes_text += f"📚 **{note['classes']['class_name']}** ({note['classes']['class_code']})\n"
                        notes_text += f"📝 {note['note_content']}\n"
                        notes_text += f"📅 {note['upload_date'][:10]}\n\n"
                    return notes_text
                else:
                    return result["message"]
            else:
                return result["message"]
        
        # If no specific task detected, use AI for general response
        return await self.get_ai_response_with_tools(message)
    
    async def send_morning_reminder(self):
        """Send morning reminder about upcoming classes"""
        upcoming_classes = await self.get_upcoming_classes(hours_ahead=2)
        
        if not upcoming_classes:
            return
        
        channel = bot.get_channel(DISCORD_CHANNEL_ID)
        if not channel:
            print("Discord channel not found!")
            return
        
        embed = discord.Embed(
            title="🌅 Good Morning, Fatoom!",
            description="Here are your upcoming classes:",
            color=0x3498db,
            timestamp=datetime.now(TIMEZONE)
        )
        
        for class_info in upcoming_classes:
            class_text = f"**{class_info['name']}**\n"
            class_text += f"⏰ Time: {class_info['time']}\n"
            class_text += f"📍 Location: {class_info['location']}\n"
            
            if class_info['bring_items']:
                class_text += f"📝 **Don't forget to bring:** {class_info['bring_items']}\n"
            
            embed.add_field(
                name=f"📚 {class_info['code']}",
                value=class_text,
                inline=False
            )
        
        embed.set_footer(text="Have a great day! 🎓")
        
        await channel.send(f"<@{DISCORD_USER_ID}>", embed=embed)
    
    async def send_evening_summary(self):
        """Send evening summary of the day"""
        completed_classes = await self.get_today_completed_classes()
        tomorrow_classes = await self.get_tomorrow_classes()
        
        channel = bot.get_channel(DISCORD_CHANNEL_ID)
        if not channel:
            print("Discord channel not found!")
            return
        
        embed = discord.Embed(
            title="🌙 End of Day Summary",
            description="Here's how your day went:",
            color=0x9b59b6,
            timestamp=datetime.now(TIMEZONE)
        )
        
        # Today's completed classes
        if completed_classes:
            completed_text = ""
            for class_info in completed_classes:
                completed_text += f"✅ **{class_info['name']}** ({class_info['time']})\n"
                if class_info['notes_uploaded']:
                    completed_text += f"   📝 Notes uploaded\n"
            
            embed.add_field(
                name="📚 Classes Completed Today",
                value=completed_text,
                inline=False
            )
        else:
            embed.add_field(
                name="📚 Classes Completed Today",
                value="No classes completed today",
                inline=False
            )
        
        # Tomorrow's classes
        if tomorrow_classes:
            tomorrow_text = ""
            for class_info in tomorrow_classes:
                tomorrow_text += f"📅 **{class_info['name']}** at {class_info['time']}\n"
                tomorrow_text += f"   📍 {class_info['location']}\n"
                if class_info['bring_items']:
                    tomorrow_text += f"   📝 Bring: {class_info['bring_items']}\n"
                tomorrow_text += "\n"
            
            embed.add_field(
                name="🌅 Tomorrow's Classes",
                value=tomorrow_text,
                inline=False
            )
        
        embed.add_field(
            name="💬 Reminder Setup",
            value="Reply with `!remind [class_code] [item]` to set a reminder for tomorrow's classes!",
            inline=False
        )
        
        embed.set_footer(text="Sweet dreams! 😴")
        
        await channel.send(f"<@{DISCORD_USER_ID}>", embed=embed)

# Initialize the reminder bot
reminder_bot = ScheduleReminderBot()

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')
    print(f'Bot is in {len(bot.guilds)} guilds')
    
    if DISCORD_CHANNEL_ID != 0:
        channel = bot.get_channel(DISCORD_CHANNEL_ID)
        if channel:
            await channel.send("Masar Assistant is online! 🚀\n\n**New Features:**\n• Natural language task execution\n• Automatic reminders and notes management\n• AI-powered academic assistance\n\nJust mention me or DM me to get started!")
    
    # Start the scheduled tasks
    morning_reminder.start()
    evening_summary.start()

@bot.command(name='remind')
async def set_reminder(ctx, class_code: str, *, item: str):
    """Set a reminder for a specific class"""
    if ctx.author.id != DISCORD_USER_ID:
        await ctx.send("You don't have permission to use this command.")
        return
    
    # Update the bring_items field for the class
    try:
        response = supabase.table('classes').update({
            'bring_items': item
        }).eq('user_id', reminder_bot.user_id).eq('class_code', class_code.upper()).execute()
        
        if response.data:
            await ctx.send(f"✅ Reminder set for {class_code}: Don't forget to bring **{item}**!")
        else:
            await ctx.send(f"❌ Class {class_code} not found. Make sure the class code is correct.")
            
    except Exception as e:
        await ctx.send(f"❌ Error setting reminder: {str(e)}")

@bot.command(name='schedule')
async def show_schedule(ctx):
    """Show today's schedule"""
    if ctx.author.id != DISCORD_USER_ID:
        await ctx.send("You don't have permission to use this command.")
        return
    
    upcoming_classes = await reminder_bot.get_upcoming_classes(hours_ahead=24)
    
    if not upcoming_classes:
        await ctx.send("📅 No classes scheduled for today!")
        return
    
    embed = discord.Embed(
        title="📅 Today's Schedule",
        color=0x2ecc71,
        timestamp=datetime.now(TIMEZONE)
    )
    
    for class_info in upcoming_classes:
        class_text = f"⏰ {class_info['time']}\n"
        class_text += f"📍 {class_info['location']}\n"
        if class_info['bring_items']:
            class_text += f"📝 Bring: {class_info['bring_items']}\n"
        
        embed.add_field(
            name=f"📚 {class_info['name']} ({class_info['code']})",
            value=class_text,
            inline=False
        )
    
    await ctx.send(embed=embed)

@bot.command(name='ask')
async def ask_ai(ctx, *, question: str):
    """Ask Masar Assistant anything"""
    if ctx.author.id != DISCORD_USER_ID:
        await ctx.send("You don't have permission to use this command.")
        return
    
    # Show typing indicator
    async with ctx.typing():
        # Get user context (upcoming classes, etc.)
        upcoming_classes = await reminder_bot.get_upcoming_classes(hours_ahead=24)
        context = f"Upcoming classes today: {[c['name'] for c in upcoming_classes]}"
        
        # Get AI response
        response = await reminder_bot.get_ai_response_with_tools(question, context)
        
        # Send response
        embed = discord.Embed(
            title="🤖 Masar Assistant",
            description=response,
            color=0x3498db,
            timestamp=datetime.now(TIMEZONE)
        )
        embed.set_footer(text="Powered by Gemini AI")
        
        await ctx.send(embed=embed)

@bot.event
async def on_message(message):
    """Handle direct messages and mentions"""
    # Ignore messages from the bot itself
    if message.author == bot.user:
        return
    
    # Only respond to Fatoom
    if message.author.id != DISCORD_USER_ID:
        return
    
    # Check if bot is mentioned or message is in DM
    bot_mentioned = bot.user in message.mentions
    is_dm = isinstance(message.channel, discord.DMChannel)
    
    # Process commands first
    await bot.process_commands(message)
    
    # If mentioned or DM, respond with AI and task execution
    if (bot_mentioned or is_dm) and not message.content.startswith('!'):
        # Remove mention from message
        content = message.content
        if bot_mentioned:
            content = content.replace(f'<@{bot.user.id}>', '').strip()
        
        if content:
            # Show typing indicator
            async with message.channel.typing():
                # Get user context
                upcoming_classes = await reminder_bot.get_upcoming_classes(hours_ahead=24)
                context = f"Upcoming classes today: {[c['name'] for c in upcoming_classes]}"
                
                # Process task request or get AI response
                response = await reminder_bot.process_task_request(content)
                
                # Send response
                embed = discord.Embed(
                    title="🤖 Masar Assistant",
                    description=response,
                    color=0x3498db,
                    timestamp=datetime.now(TIMEZONE)
                )
                embed.set_footer(text="Powered by Gemini AI + Task Tools")
                
                await message.channel.send(embed=embed)

@tasks.loop(time=time(7, 0, tzinfo=TIMEZONE))  # 7:00 AM
async def morning_reminder():
    """Send morning reminder at 7:00 AM"""
    await reminder_bot.send_morning_reminder()

@tasks.loop(time=time(21, 0, tzinfo=TIMEZONE))  # 9:00 PM
async def evening_summary():
    """Send evening summary at 9:00 PM"""
    await reminder_bot.send_evening_summary()

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.CommandNotFound):
        return
    print(f"Error: {error}")

if __name__ == "__main__":
    if not DISCORD_TOKEN:
        print("Error: DISCORD_BOT_TOKEN environment variable not set!")
        exit(1)
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase credentials not set!")
        exit(1)
    
    print("Starting Discord bot...")
    bot.run(DISCORD_TOKEN)
