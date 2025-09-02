import asyncio
import os
from datetime import datetime, timedelta, time
import pytz
from telegram import Bot
from telegram.error import TelegramError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')  # Your Telegram chat ID

# Timezone configuration (adjust for your location)
TIMEZONE = pytz.timezone('Asia/Riyadh')  # Saudi Arabia timezone

# Initialize Telegram bot
bot = Bot(token=TELEGRAM_BOT_TOKEN)

class TelegramNotifier:
    def __init__(self):
        self.chat_id = TELEGRAM_CHAT_ID
        
    async def send_message(self, message: str):
        """Send a message to Telegram"""
        try:
            await bot.send_message(chat_id=self.chat_id, text=message)
            print(f"Message sent: {message}")
        except TelegramError as e:
            print(f"Error sending message: {e}")
    
    async def send_morning_reminder(self):
        """Send morning reminder about upcoming classes"""
        # Hardcoded schedule data
        hardcoded_schedule = [
            {
                'class_code': "1203",
                'class_name': "مهارات التعلم والتفكير والبحث",
                'location': "Building 02, Floor 2, Wing A, Room 320",
                'days_of_week': "Mon",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل احمد عبدالله باصويل"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 302",
                'days_of_week': "Sun",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 415",
                'days_of_week': "Tue",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "10:00:00",
                'end_time': "10:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1202",
                'class_name': "مهارات الحاسب",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'class_code': "1202",
                'class_name': "مهارات الحاسب (عملي)",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء (تمارين)",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
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
            message = "🌅 Good Morning! 📅 No classes scheduled for today!"
            await self.send_message(message)
            return
        
        # Sort classes by start time
        today_classes.sort(key=lambda x: x['start_time'])
        
        # Combine consecutive classes with same class code
        combined_classes = []
        i = 0
        while i < len(today_classes):
            current_class = today_classes[i]
            combined_class = current_class.copy()
            
            # Check if next class is the same class code and consecutive
            while (i + 1 < len(today_classes) and 
                   today_classes[i + 1]['class_code'] == current_class['class_code'] and
                   today_classes[i + 1]['start_time'] == current_class['end_time']):
                # Combine with next class
                combined_class['end_time'] = today_classes[i + 1]['end_time']
                i += 1
            
            combined_classes.append(combined_class)
            i += 1
        
        # Create morning message
        message = "🌅 Good Morning! Here are your classes for today:\n\n"
        
        for cls in combined_classes:
            # Convert time to AM/PM format
            start_time = datetime.strptime(cls['start_time'], '%H:%M:%S').strftime('%I:%M %p')
            end_time = datetime.strptime(cls['end_time'], '%H:%M:%S').strftime('%I:%M %p')
            
            message += f"📚 **{cls['class_name']}** ({cls['class_code']})\n"
            message += f"⏰ Time: {start_time} - {end_time}\n"
            message += f"📍 Location: {cls['location']}\n\n"
        
        message += "Have a great day! 🎓\n\n"
        message += "📝 **Upload your notes:** https://YOUR-VERCEL-URL.vercel.app"
        await self.send_message(message)
    
    async def send_evening_summary(self):
        """Send evening summary"""
        tomorrow = datetime.now(TIMEZONE) + timedelta(days=1)
        tomorrow_weekday = tomorrow.strftime('%a')
        
        # Hardcoded schedule data (same as morning)
        hardcoded_schedule = [
            {
                'class_code': "1203",
                'class_name': "مهارات التعلم والتفكير والبحث",
                'location': "Building 02, Floor 2, Wing A, Room 320",
                'days_of_week': "Mon",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل احمد عبدالله باصويل"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 302",
                'days_of_week': "Sun",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 415",
                'days_of_week': "Tue",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "08:00:00",
                'end_time': "09:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 316",
                'days_of_week': "Wed",
                'start_time': "10:00:00",
                'end_time': "10:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 02, Floor 2, Wing A, Room 318",
                'days_of_week': "Thu",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1001",
                'class_name': "مهارات اللغة الإنجليزية (1)",
                'location': "Building 03, Floor 2, Wing A, Room 424",
                'days_of_week': "Mon",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "منيره نامي حمد النامي"
            },
            {
                'class_code': "1202",
                'class_name': "مهارات الحاسب",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'class_code': "1202",
                'class_name': "مهارات الحاسب (عملي)",
                'location': "Building 02, Floor 2, Wing A, Room 306",
                'days_of_week': "Tue",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "اروى عبدالله محمد المقرن"
            },
            {
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "10:00:00",
                'end_time': "11:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
                'class_code': "1103",
                'class_name': "مقدمة في الإحصاء (تمارين)",
                'location': "Building 02, Floor 2, Wing A, Room 305",
                'days_of_week': "Sun",
                'start_time': "13:00:00",
                'end_time': "14:50:00",
                'instructor_name': "امل منصور فرح العبدلي الفيفي"
            },
            {
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
        tomorrow_classes = [cls for cls in hardcoded_schedule if cls['days_of_week'] == tomorrow_weekday]
        
        message = "🌙 End of Day Summary\n\n"
        
        if tomorrow_classes:
            # Sort classes by start time
            tomorrow_classes.sort(key=lambda x: x['start_time'])
            
            # Combine consecutive classes with same class code
            combined_tomorrow_classes = []
            i = 0
            while i < len(tomorrow_classes):
                current_class = tomorrow_classes[i]
                combined_class = current_class.copy()
                
                # Check if next class is the same class code and consecutive
                while (i + 1 < len(tomorrow_classes) and 
                       tomorrow_classes[i + 1]['class_code'] == current_class['class_code'] and
                       tomorrow_classes[i + 1]['start_time'] == current_class['end_time']):
                    # Combine with next class
                    combined_class['end_time'] = tomorrow_classes[i + 1]['end_time']
                    i += 1
                
                combined_tomorrow_classes.append(combined_class)
                i += 1
            
            message += "📅 **Tomorrow's Classes:**\n"
            for cls in combined_tomorrow_classes:
                # Convert time to AM/PM format
                start_time = datetime.strptime(cls['start_time'], '%H:%M:%S').strftime('%I:%M %p')
                end_time = datetime.strptime(cls['end_time'], '%H:%M:%S').strftime('%I:%M %p')
                
                message += f"📚 **{cls['class_name']}** ({cls['class_code']})\n"
                message += f"⏰ Time: {start_time} - {end_time}\n"
                message += f"📍 Location: {cls['location']}\n\n"
        else:
            message += "📅 No classes scheduled for tomorrow!\n\n"
        
        message += "Sweet dreams! 😴\n\n"
        message += "📝 **Upload your notes:** https://YOUR-VERCEL-URL.vercel.app"
        await self.send_message(message)
    
    async def send_test_message(self):
        """Send a test message"""
        message = "🤖 Telegram bot is working! This is a test message."
        await self.send_message(message)

# Initialize the notifier
notifier = TelegramNotifier()

async def main():
    """Main function to run scheduled tasks"""
    print("Starting Telegram notification bot...")
    
    # Send a startup message
    await notifier.send_test_message()
    
    # Schedule tasks
    while True:
        now = datetime.now(TIMEZONE)
        current_time = now.time()
        
        # Morning reminder at 7:00 AM
        if current_time.hour == 7 and current_time.minute == 0:
            await notifier.send_morning_reminder()
            await asyncio.sleep(60)  # Wait 1 minute to avoid duplicate sends
        
        # Evening summary at 9:00 PM
        elif current_time.hour == 21 and current_time.minute == 0:
            await notifier.send_evening_summary()
            await asyncio.sleep(60)  # Wait 1 minute to avoid duplicate sends
        
        # Check every minute
        await asyncio.sleep(60)

if __name__ == "__main__":
    if not TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN environment variable not set!")
        exit(1)
    
    if not TELEGRAM_CHAT_ID:
        print("Error: TELEGRAM_CHAT_ID environment variable not set!")
        exit(1)
    
    print("Starting Telegram bot...")
    asyncio.run(main())
