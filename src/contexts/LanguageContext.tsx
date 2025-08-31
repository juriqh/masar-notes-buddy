import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    dashboard: 'Dashboard',
    upload: 'Upload',
    notes: 'Notes',
    reminders: 'Reminders',
    todaySchedule: 'Today\'s Schedule',
    uploadNow: 'Upload Now',
    viewNotes: 'View Notes',
    uploadNotes: 'Upload Notes',
    backToDashboard: 'Back to Dashboard',
    dragDropFiles: 'Drag and drop files here, or click to select',
    uploadedFiles: 'Uploaded Files',
    fileName: 'File Name',
    size: 'Size',
    uploadedAt: 'Uploaded At',
    open: 'Open',
    filterByDate: 'Filter by Date',
    filterByClass: 'Filter by Class',
    allClasses: 'All Classes',
    noClassesToday: 'No classes scheduled for today',
    noFilesFound: 'No files found',
    uploadSuccess: 'Files uploaded successfully',
    uploadError: 'Error uploading files',
    invalidParams: 'Invalid parameters',
    today: 'Today',
    location: 'Location',
    time: 'Time',
    class: 'Class',
    date: 'Date',
    files: 'files',
    bytes: 'bytes',
    kb: 'KB',
    mb: 'MB',
    gb: 'GB'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    upload: 'رفع الملفات',
    notes: 'الملاحظات',
    reminders: 'التذكيرات',
    todaySchedule: 'جدول اليوم',
    uploadNow: 'رفع الآن',
    viewNotes: 'عرض الملاحظات',
    uploadNotes: 'رفع الملاحظات',
    backToDashboard: 'العودة للوحة الرئيسية',
    dragDropFiles: 'اسحب وأفلت الملفات هنا، أو انقر للاختيار',
    uploadedFiles: 'الملفات المرفوعة',
    fileName: 'اسم الملف',
    size: 'الحجم',
    uploadedAt: 'تاريخ الرفع',
    open: 'فتح',
    filterByDate: 'تصفية بالتاريخ',
    filterByClass: 'تصفية بالمادة',
    allClasses: 'جميع المواد',
    noClassesToday: 'لا توجد محاضرات مجدولة لليوم',
    noFilesFound: 'لم يتم العثور على ملفات',
    uploadSuccess: 'تم رفع الملفات بنجاح',
    uploadError: 'خطأ في رفع الملفات',
    invalidParams: 'معاملات غير صحيحة',
    today: 'اليوم',
    location: 'المكان',
    time: 'الوقت',
    class: 'المادة',
    date: 'التاريخ',
    files: 'ملفات',
    bytes: 'بايت',
    kb: 'ك.ب',
    mb: 'م.ب',
    gb: 'ج.ب'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'ar')) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};