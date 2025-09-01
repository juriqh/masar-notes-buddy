import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2, Calendar, Clock, MapPin, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message: string;
  progress: number;
  classesFound?: number;
  error?: string;
}

interface Class {
  id: number;
  class_code: string;
  class_name: string;
  location: string;
  days_of_week: string;
  start_time: string;
  end_time: string;
  instructor_name?: string;
}

const ScheduleUpload: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    message: '',
    progress: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasUploaded, setHasUploaded] = useState(() => {
    const saved = localStorage.getItem('schedule_uploaded');
    return saved === 'true';
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = '797281cf-9397-4fca-b983-300825cde186'; // Dedicated user

  // Check if schedule already exists
  useEffect(() => {
    const checkExistingSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true)
          .order('days_of_week, start_time');

        if (error) {
          console.error('Error fetching classes:', error);
        } else if (data && data.length > 0) {
          setHasUploaded(true);
          setClasses(data);
          localStorage.setItem('schedule_uploaded', 'true');
        } else {
          setHasUploaded(false);
          setClasses([]);
          localStorage.setItem('schedule_uploaded', 'false');
        }
      } catch (error) {
        console.error('Error checking existing schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSchedule();
  }, [userId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('uploadError'),
          description: t('invalidFileType'),
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('uploadError'),
          description: t('fileTooLarge'),
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      setUploadStatus({
        status: 'idle',
        message: t('fileSelected'),
        progress: 0
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus({
        status: 'uploading',
        message: t('uploadingFile'),
        progress: 20
      });

      // Convert file to base64 for direct processing
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `schedule_${Date.now()}.${fileExt}`;
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data:image/...;base64, prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const base64Image = await base64Promise;

      setUploadStatus({
        status: 'processing',
        message: t('processingSchedule'),
        progress: 60
      });

      // TEMPORARY: Mock successful response for local testing
      // TODO: Replace with actual Vercel API call once environment variables are set
      const result = {
        success: true,
        classesFound: 3,
        classesInserted: 3,
        classes: [
          {
            id: '1',
            class_code: 'CS101',
            class_name: 'Introduction to Programming',
            location: 'Building 2, Floor 1, Room 101',
            days_of_week: 'Mon',
            start_time: '09:00:00',
            end_time: '10:30:00'
          },
          {
            id: '2', 
            class_code: 'MATH201',
            class_name: 'Calculus I',
            location: 'Building 3, Floor 2, Room 205',
            days_of_week: 'Wed',
            start_time: '11:00:00',
            end_time: '12:30:00'
          },
          {
            id: '3',
            class_code: 'ENG101',
            class_name: 'English Composition',
            location: 'Building 1, Floor 1, Room 150',
            days_of_week: 'Fri',
            start_time: '14:00:00',
            end_time: '15:30:00'
          }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUploadStatus({
        status: 'success',
        message: t('scheduleProcessed'),
        progress: 100,
        classesFound: result.classesFound
      });

      toast({
        title: t('uploadSuccess'),
        description: t('scheduleUploadedSuccessfully'),
      });

      // Refresh classes and mark as uploaded
      const { data: newClasses } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('days_of_week, start_time');

              setClasses(newClasses || []);
        setHasUploaded(true);
        localStorage.setItem('schedule_uploaded', 'true');

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: t('uploadFailed'),
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: t('uploadError'),
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive'
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setUploadStatus({
          status: 'idle',
          message: t('fileSelected'),
          progress: 0
        });
      }
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileImage className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus.status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove seconds
  };

  const getDayName = (dayCode: string) => {
    const { language } = useLanguage();
    
    if (language === 'ar') {
      const days: { [key: string]: string } = {
        'Sun': 'الأحد',
        'Mon': 'الاثنين', 
        'Tue': 'الثلاثاء',
        'Wed': 'الأربعاء',
        'Thu': 'الخميس',
        'Fri': 'الجمعة',
        'Sat': 'السبت'
      };
      return days[dayCode] || dayCode;
    } else {
      const days: { [key: string]: string } = {
        'Sun': 'Sunday',
        'Mon': 'Monday', 
        'Tue': 'Tuesday',
        'Wed': 'Wednesday',
        'Thu': 'Thursday',
        'Fri': 'Friday',
        'Sat': 'Saturday'
      };
      return days[dayCode] || dayCode;
    }
  };

  const groupClassesByDay = () => {
    const grouped: { [key: string]: Class[] } = {};
    classes.forEach(cls => {
      if (!grouped[cls.days_of_week]) {
        grouped[cls.days_of_week] = [];
      }
      grouped[cls.days_of_week].push(cls);
    });
    return grouped;
  };

  const getClassColor = (classCode: string) => {
    // Generate consistent colors based on class code
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-cyan-500'
    ];
    
    // Use class code to get consistent color
    const hash = classCode.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleResetSchedule = async () => {
    if (!confirm(t('confirmResetSchedule'))) return;

    try {
      console.log('Starting reset schedule...');
      
      // Delete all classes for this user
      const { error: classesError } = await supabase
        .from('classes')
        .delete()
        .eq('user_id', userId);

      if (classesError) {
        console.error('Error deleting classes:', classesError);
        throw classesError;
      }
      
      console.log('Classes deleted successfully');

      // Delete all notes for this user
      const { error: notesError } = await supabase
        .from('notes_uploads')
        .delete()
        .eq('user_id', userId);

      if (notesError) {
        console.warn('Failed to delete notes:', notesError);
      } else {
        console.log('Notes deleted successfully');
      }

      // Delete all reminders for this user
      const { error: remindersError } = await supabase
        .from('reminders')
        .delete()
        .eq('user_id', userId);

      if (remindersError) {
        console.warn('Failed to delete reminders:', remindersError);
      } else {
        console.log('Reminders deleted successfully');
      }

      // No need to delete schedule images since we're not storing them
      console.log('Skipping storage cleanup - no files stored');

      // Reset state
      console.log('Resetting UI state...');
      setHasUploaded(false);
      setClasses([]);
      setSelectedFile(null);
      setUploadStatus({
        status: 'idle',
        message: '',
        progress: 0
      });
      
      // Set localStorage BEFORE reload
      localStorage.setItem('schedule_uploaded', 'false');
      console.log('localStorage set to false');
      
      console.log('Reset completed, refreshing page...');
      // Force refresh the page to update all components
      setTimeout(() => {
        window.location.reload();
      }, 100);

      toast({
        title: t('scheduleReset'),
        description: t('scheduleResetSuccessfully'),
      });

    } catch (error) {
      console.error('Error resetting schedule:', error);
      toast({
        title: t('error'),
        description: t('failedToResetSchedule'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasUploaded) {
    const groupedClasses = groupClassesByDay();
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              {t('mySchedule')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('scheduleUploadedSuccessfully')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={handleResetSchedule}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {t('resetSchedule')}
            </Button>
            <Link to="/">
              <Button variant="outline">
                {t('backToDashboard')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dayOrder.map(day => {
            const dayClasses = groupedClasses[day];
            if (!dayClasses || dayClasses.length === 0) return null;

            return (
              <Card key={day} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-center">
                    {getDayName(day)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dayClasses.map((cls) => (
                    <div key={cls.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-6 ${getClassColor(cls.class_code)} rounded-md flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">{cls.class_code}</span>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-sm block">{cls.class_name}</span>
                          <span className="text-xs text-muted-foreground">{cls.location}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                        </div>
                        {cls.instructor_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {cls.instructor_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {Object.keys(groupedClasses).length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noClassesInSchedule')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('uploadSchedule')}
          </CardTitle>
          <CardDescription>
            {t('uploadScheduleDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FileImage className="h-12 w-12 mx-auto text-blue-500" />
                <p className="text-lg font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-lg font-medium">{t('selectScheduleImage')}</p>
                <p className="text-sm text-gray-500">{t('dragDropOrClick')}</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
              className="w-full"
            >
              {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadStatus.status === 'uploading' ? t('uploading') : t('processing')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('processSchedule')}
                </>
              )}
            </Button>
          )}

          {/* Status Display */}
          {uploadStatus.status !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className={`font-medium ${getStatusColor()}`}>
                  {uploadStatus.message}
                </span>
              </div>
              
              {(uploadStatus.status === 'uploading' || uploadStatus.status === 'processing') && (
                <Progress value={uploadStatus.progress} className="w-full" />
              )}

              {uploadStatus.status === 'success' && uploadStatus.classesFound && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('classesFound').replace('{count}', uploadStatus.classesFound?.toString() || '0')}
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus.status === 'error' && uploadStatus.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {uploadStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">{t('instructions')}</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('instruction1')}</li>
              <li>• {t('instruction2')}</li>
              <li>• {t('instruction3')}</li>
              <li>• {t('instruction4')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleUpload;
