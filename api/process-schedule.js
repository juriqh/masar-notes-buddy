// API endpoint for processing schedule images
// This would typically be deployed as a serverless function (Vercel, Netlify, etc.)

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filePath, fileName } = req.body;

    if (!filePath || !fileName) {
      return res.status(400).json({ error: 'Missing filePath or fileName' });
    }

    // Get the image from Supabase storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('schedules')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    // Convert image to base64 for Gemini
    const arrayBuffer = await imageData.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // Use Gemini Vision to extract schedule data
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
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
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let scheduleData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scheduleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Failed to parse schedule data from AI response');
    }

    // Process and upload to Supabase
    const classesToInsert = [];
    const userId = process.env.USER_ID || '797281cf-9397-4fca-b983-300825cde186';

    for (const entry of scheduleData) {
      // Convert day number to day name
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[entry.day_number - 1];

      // Check if class already exists
      const { data: existing } = await supabase
        .from('classes')
        .select('id')
        .eq('user_id', userId)
        .eq('class_code', entry.course_code)
        .eq('days_of_week', dayName)
        .eq('start_time', entry.start_time + ':00')
        .single();

      if (existing) {
        console.log(`Class ${entry.course_code} on ${dayName} already exists, skipping...`);
        continue;
      }

      const classData = {
        user_id: userId,
        class_code: entry.course_code,
        class_name: entry.course_name_arabic,
        location: `Building ${entry.building}, Floor ${entry.floor}, Wing ${entry.wing}, Room ${entry.room}`,
        days_of_week: dayName,
        start_time: entry.start_time + ':00',
        end_time: entry.end_time + ':00',
        remind_before_minutes: 30,
        active: true
      };

      classesToInsert.push(classData);
    }

    // Insert new classes
    let insertResult = null;
    if (classesToInsert.length > 0) {
      const { data, error } = await supabase
        .from('classes')
        .insert(classesToInsert)
        .select();

      if (error) {
        throw new Error(`Failed to insert classes: ${error.message}`);
      }

      insertResult = data;
    }

    // Clean up the uploaded image (optional)
    await supabase.storage
      .from('schedules')
      .remove([filePath]);

    return res.status(200).json({
      success: true,
      classesFound: scheduleData.length,
      classesInserted: classesToInsert.length,
      classes: insertResult
    });

  } catch (error) {
    console.error('Schedule processing error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process schedule'
    });
  }
}
