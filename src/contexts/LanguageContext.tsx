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
    scheduleUpload: 'Schedule',
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
    gb: 'GB',
    uploadSchedule: 'Upload Schedule',
    uploadScheduleDescription: 'Upload your King Saud University schedule image to automatically extract and add your classes',
    selectScheduleImage: 'Select Schedule Image',
    dragDropOrClick: 'Drag and drop your schedule image here, or click to select',
    processSchedule: 'Process Schedule',
    uploading: 'Uploading...',
    processing: 'Processing...',
    scheduleProcessed: 'Schedule processed successfully!',
    scheduleUploadedSuccessfully: 'Your schedule has been uploaded and processed successfully',
    classesFound: 'Found {count} classes in your schedule',
    uploadFailed: 'Upload failed',
    fileSelected: 'File selected',
    uploadingFile: 'Uploading file...',
    processingSchedule: 'Processing schedule with AI...',
    invalidFileType: 'Please select an image file',
    fileTooLarge: 'File size must be less than 10MB',
    instructions: 'Instructions',
    instruction1: 'Upload a clear image of your King Saud University schedule',
    instruction2: 'Make sure the text is readable and not blurry',
    instruction3: 'The system will automatically extract your classes and times',
    instruction4: 'Your schedule will be added to your dashboard',
    mySchedule: 'My Schedule',
    noClassesInSchedule: 'No classes in your schedule',
    resetSchedule: 'Reset Schedule',
    confirmResetSchedule: 'Are you sure you want to reset your schedule? This will delete all your classes.',
    scheduleReset: 'Schedule Reset',
    scheduleResetSuccessfully: 'Your schedule has been reset successfully',
    error: 'Error',
    failedToResetSchedule: 'Failed to reset schedule',
    noSchedule: 'No Schedule',
    noScheduleDescription: 'You haven\'t uploaded your schedule yet. Upload it to see your classes and manage your academic life.',
    noNotes: 'No Notes',
    noNotesDescription: 'You haven\'t uploaded any notes yet. Upload your schedule first to start managing your notes.',
    noReminders: 'No Reminders',
    noRemindersDescription: 'You haven\'t created any reminders yet. Upload your schedule first to start managing your reminders.'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    upload: 'رفع الملفات',
    scheduleUpload: 'الجدول',
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
    gb: 'ج.ب',
    uploadSchedule: 'رفع الجدول',
    uploadScheduleDescription: 'ارفع صورة جدولك من جامعة الملك سعود لاستخراج وإضافة محاضراتك تلقائياً',
    selectScheduleImage: 'اختر صورة الجدول',
    dragDropOrClick: 'اسحب وأفلت صورة الجدول هنا، أو انقر للاختيار',
    processSchedule: 'معالجة الجدول',
    uploading: 'جاري الرفع...',
    processing: 'جاري المعالجة...',
    scheduleProcessed: 'تم معالجة الجدول بنجاح!',
    scheduleUploadedSuccessfully: 'تم رفع ومعالجة جدولك بنجاح',
    classesFound: 'تم العثور على {count} محاضرة في جدولك',
    uploadFailed: 'فشل الرفع',
    fileSelected: 'تم اختيار الملف',
    uploadingFile: 'جاري رفع الملف...',
    processingSchedule: 'جاري معالجة الجدول بالذكاء الاصطناعي...',
    invalidFileType: 'يرجى اختيار ملف صورة',
    fileTooLarge: 'يجب أن يكون حجم الملف أقل من 10 ميجابايت',
    instructions: 'التعليمات',
    instruction1: 'ارفع صورة واضحة لجدولك من جامعة الملك سعود',
    instruction2: 'تأكد من أن النص مقروء وغير ضبابي',
    instruction3: 'سيقوم النظام باستخراج محاضراتك وأوقاتها تلقائياً',
    instruction4: 'سيتم إضافة جدولك إلى لوحة التحكم',
    mySchedule: 'جدولي الدراسي',
    noClassesInSchedule: 'لا توجد محاضرات في جدولك',
    resetSchedule: 'إعادة تعيين الجدول',
    confirmResetSchedule: 'هل أنت متأكد من إعادة تعيين جدولك؟ سيتم حذف جميع محاضراتك.',
    scheduleReset: 'تم إعادة تعيين الجدول',
    scheduleResetSuccessfully: 'تم إعادة تعيين جدولك بنجاح',
    error: 'خطأ',
    failedToResetSchedule: 'فشل في إعادة تعيين الجدول',
    noSchedule: 'لا يوجد جدول',
    noScheduleDescription: 'لم تقم برفع جدولك بعد. ارفعه لرؤية محاضراتك وإدارة حياتك الأكاديمية.',
    noNotes: 'لا توجد ملاحظات',
    noNotesDescription: 'لم تقم برفع أي ملاحظات بعد. ارفع جدولك أولاً لبدء إدارة ملاحظاتك.',
    noReminders: 'لا توجد تذكيرات',
    noRemindersDescription: 'لم تقم بإنشاء أي تذكيرات بعد. ارفع جدولك أولاً لبدء إدارة تذكيراتك.'
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