export const formatTime = (time: string): string => {
  if (!time) return '';
  
  try {
    // Handle time format from database (HH:mm:ss or HH:mm)
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  } catch {
    return time;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 bytes';
  
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getTodayInRiyadh = (): Date => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
};

export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

export const formatDateTimeForDisplay = (date: string | Date, language: 'en' | 'ar' = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'ar') {
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Riyadh'
    });
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Riyadh'
  });
};

export const getDayOfWeek = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};