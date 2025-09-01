# OCR Schedule Parser for King Saud University

This system parses student schedule images from King Saud University and uploads the data to Supabase.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Google Cloud Vision API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Vision API
4. Create a service account and download the JSON key
5. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your key file

### 3. Environment Variables
Copy `env_example.txt` to `.env` and fill in your values:

```bash
cp env_example.txt .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key (not anon key)
- `USER_ID`: The user ID for the student (default: 797281cf-9397-4fca-b983-300825cde186)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google Cloud service account key
- `IMAGE_PATH`: Path to the schedule image file

### 4. Prepare Your Schedule Image
Save your King Saud University schedule image as `schedule.png` (or update `IMAGE_PATH` in your `.env` file).

## Usage

### Run OCR Parser
```bash
python run_ocr.py
```

Or directly:
```bash
python ocr_schedule_parser.py
```

## What It Does

1. **OCR Processing**: Uses Google Cloud Vision API to extract text from the schedule image
2. **Data Parsing**: Parses Arabic text to extract:
   - Course codes and names
   - Day numbers (1=Sunday, 2=Monday, etc.)
   - Time ranges in Arabic format
   - Building, floor, wing, and room information
   - Instructor names
3. **Data Upload**: Uploads parsed schedule data to Supabase `classes` table

## Expected Schedule Format

The parser expects King Saud University schedule format with:
- Course codes (3-4 digits)
- Arabic course names
- Day numbers (1-7, where 1=Sunday)
- Arabic time format (e.g., "08:00 ص - 09:50 ص")
- Building, floor, wing, room information
- Instructor names

## Database Schema

The parser uploads to the `classes` table with this structure:
```sql
CREATE TABLE classes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    class_code TEXT,
    class_name TEXT,
    location TEXT,
    days_of_week TEXT, -- CSV format like "Mon,Wed"
    start_time TIME,
    end_time TIME,
    remind_before_minutes SMALLINT DEFAULT 30,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### Common Issues

1. **"No text found in image"**
   - Ensure the image is clear and high resolution
   - Check that the image contains readable text

2. **"Invalid time format"**
   - The parser expects Arabic time format
   - Make sure times are in format like "08:00 ص - 09:50 ص"

3. **"SUPABASE_URL and SUPABASE_KEY required"**
   - Check your `.env` file has the correct Supabase credentials
   - Use the service role key, not the anon key

4. **Google Cloud Vision API errors**
   - Verify your service account key is valid
   - Check that Vision API is enabled in your Google Cloud project
   - Ensure billing is enabled for your Google Cloud project

### Debug Mode

To see the raw OCR text output, the script will print it to console. This helps debug parsing issues.

## Example Output

```
Processing image: schedule.png
OCR Text extracted:
[Raw OCR text will be shown here]

Found 5 schedule entries:
- 1203: مهارات التعلم نهج والتفكير والبحث
  Day 2 (Mon), 13:00:00-14:50:00
  Location: Building 02, Floor 2, Wing A, Room 320
  Instructor: امل احمد عبدالله باصويل

Uploading to Supabase...
Successfully inserted 5 classes
✅ Schedule uploaded successfully!
```
