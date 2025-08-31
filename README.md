# Masar Student Assistant

A modern, production-ready frontend for managing student schedules, notes, and file uploads with Arabic/English language support.

## Features

- **Dashboard**: View today's schedule with quick access to upload notes and view existing files
- **File Upload**: Drag-and-drop interface for uploading notes and files to specific classes
- **Notes Browser**: Filter and view uploaded files by date and class
- **Reminders**: Create reminders for items to bring to class (local storage)
- **Bilingual Support**: Toggle between English and Arabic with RTL support
- **Responsive Design**: Clean, formal UI that works on all devices

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Storage)
- **Routing**: React Router v6
- **State Management**: React Context API
- **File Handling**: react-dropzone
- **UI Components**: shadcn/ui components

## Environment Setup

This project uses Supabase's native integration in Lovable. The connection is already configured and no environment variables need to be set manually.

## Database Schema

The app connects to the following Supabase tables:

### `classes`
- `id` (bigint, primary key)
- `user_id` (uuid)
- `class_code` (text)
- `class_name` (text)
- `location` (text)
- `days_of_week` (text) - e.g., "Mon,Wed,Fri"
- `start_time` (time)
- `end_time` (time)
- `remind_before_minutes` (smallint)
- `active` (boolean)

### `notes_uploads`
- `id` (bigserial, primary key)
- `user_id` (uuid)
- `class_id` (bigint, nullable)
- `class_code` (text)
- `class_name` (text)
- `class_date` (date)
- `storage_path` (text)
- `file_name` (text)
- `mime_type` (text)
- `size_bytes` (integer)
- `created_at` (timestamptz)

### Storage Bucket: `notes`
- Public bucket for storing uploaded files
- File path format: `{user_id}/{date}/{class_code}/{filename}`

## Usage Examples

### Navigation URLs

#### Upload Page
```
/upload?uid=797281cf-9397-4fca-b983-300825cde186&date=2025-09-01&code=CS101
```

#### Notes Browser
```
/notes?code=CS101&date=2025-09-01
```

### Single-User MVP Notes

This is a single-user MVP implementation with the following characteristics:

- **User ID**: Hardcoded to `797281cf-9397-4fca-b983-300825cde186`
- **Security**: Row Level Security (RLS) policies restrict access to this user ID
- **File Storage**: Public bucket with path-based access control
- **Timezone**: All dates/times use Asia/Riyadh timezone

## Development

### Local Development

1. The project is configured to work with Lovable's Supabase integration
2. All database connections and file storage are automatically configured
3. The app uses semantic design tokens from the design system

### Key Components

- **ScheduleCard**: Displays class information with action buttons
- **UploadDropzone**: Drag-and-drop file upload interface
- **NotesTable**: Table view for uploaded files with download links
- **LanguageProvider**: Manages English/Arabic language switching with RTL support

### Language Support

The app supports both English and Arabic:
- Language toggle in the header
- RTL layout for Arabic
- Translated labels and interface text
- Persistent language selection

## Deployment

The app is deployed on Lovable's platform with automatic Supabase integration. No additional configuration is required for deployment.

## Security

- Row Level Security (RLS) policies ensure data isolation
- File uploads are restricted by user ID in the storage path
- Public file access is controlled through Supabase Storage policies
- Single-user MVP design with hardcoded user authentication

## File Upload Process

1. User selects files via drag-and-drop or file picker
2. Files are uploaded to Supabase Storage bucket `notes`
3. File metadata is stored in `notes_uploads` table
4. Public URLs are generated for file access
5. Files are organized by user ID, date, and class code

## Browser Support

- Modern browsers with ES6+ support
- Mobile-responsive design
- Touch-friendly interface for tablets and phones
