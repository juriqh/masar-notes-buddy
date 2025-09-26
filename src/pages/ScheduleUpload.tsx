import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2, Calendar, Clock, MapPin, User, Sparkles, FileText, Users, Star } from 'lucide-react';
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
  const [notesCount, setNotesCount] = useState<{ [key: string]: number }>({});

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
          fetchNotesCount();
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

      // Call local server for processing
      const response = await fetch('http://localhost:5000/api/process-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: fileName,
          base64Image: base64Image,
          mimeType: selectedFile.type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const result = await response.json();

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

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 22; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push(`${displayHour}:00 ${ampm}`);
    }
    return slots;
  };

  const formatTimeAMPM = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const isTimeInSlot = (classTime: string, timeSlot: string) => {
    const [classHour] = classTime.split(':').map(Number);
    const [slotHourStr, ampm] = timeSlot.split(' ');
    const [slotHour] = slotHourStr.split(':').map(Number);
    
    // Convert slot hour to 24-hour format for comparison
    let slotHour24 = slotHour;
    if (ampm === 'PM' && slotHour !== 12) {
      slotHour24 = slotHour + 12;
    } else if (ampm === 'AM' && slotHour === 12) {
      slotHour24 = 0;
    }
    
    return classHour === slotHour24;
  };

  const getClassColor = (classCode: string) => {
    // Generate consistent colors based on class code using our color palette
    const colors = [
      'bg-dusty-blue',
      'bg-coral-pink', 
      'bg-creamy-yellow',
      'bg-warm-cream',
      'bg-blue-400',
      'bg-green-400',
      'bg-purple-400',
      'bg-red-400',
      'bg-yellow-400',
      'bg-pink-400',
      'bg-indigo-400',
      'bg-teal-400',
      'bg-orange-400',
      'bg-cyan-400',
      'bg-emerald-400',
      'bg-violet-400'
    ];
    
    // Use class code to get consistent color
    const hash = classCode.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getClassTextColor = (classCode: string) => {
    const color = getClassColor(classCode);
    // For light colors, use dark text; for dark colors, use white text
    const lightColors = ['bg-creamy-yellow', 'bg-warm-cream', 'bg-yellow-400', 'bg-cyan-400', 'bg-emerald-400'];
    return lightColors.includes(color) ? 'text-dusty-blue' : 'text-white';
  };

  const fetchNotesCount = async () => {
    try {
      const { data: notes, error } = await supabase
        .from('notes_uploads')
        .select('class_code')
        .eq('user_id', userId);

      if (error) throw error;

      const countMap: { [key: string]: number } = {};
      notes?.forEach(note => {
        countMap[note.class_code] = (countMap[note.class_code] || 0) + 1;
      });

      setNotesCount(countMap);
    } catch (error) {
      console.error('Error fetching notes count:', error);
    }
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
      
      // Set localStorage and trigger storage event
      localStorage.setItem('schedule_uploaded', 'false');
      console.log('localStorage set to false');
      
      // Trigger storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'schedule_uploaded',
        newValue: 'false',
        oldValue: 'true'
      }));
      
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
      <div className="w-full p-6">
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
      <div className="w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-2">
              <Calendar className="h-8 w-8 text-black" />
              {t('mySchedule')}
            </h1>
            <p className="text-black mt-2">
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

        {/* Schedule Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-dusty-blue to-dusty-blue/80 text-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Total Classes</p>
                  <p className="text-2xl font-bold">{classes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-coral-pink to-coral-pink/80 text-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Total Notes</p>
                  <p className="text-2xl font-bold">
                    {Object.values(notesCount).reduce((sum, count) => sum + count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-creamy-yellow to-creamy-yellow/80 text-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Unique Classes</p>
                  <p className="text-2xl font-bold">
                    {new Set(classes.map(c => c.class_code)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-warm-cream to-warm-cream/80 text-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8" />
                <div>
                  <p className="text-sm opacity-90">Classes with Notes</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(notesCount).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Schedule Header */}
          <div className="bg-dusty-blue text-white">
            <div className="grid grid-cols-8 gap-0">
              <div className="p-4 text-center font-semibold border-r border-dusty-blue/20">
                Time
              </div>
              {dayOrder.map(day => (
                <div key={day} className="p-4 text-center font-semibold border-r border-dusty-blue/20 last:border-r-0">
                    {getDayName(day)}
                        </div>
              ))}
                        </div>
                      </div>

          {/* Schedule Body */}
          <div className="divide-y divide-gray-200">
            {generateTimeSlots().map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-8 gap-0 min-h-[60px]">
                {/* Time Column */}
                <div className="p-4 text-center font-medium text-dusty-blue bg-warm-cream border-r border-gray-200 flex items-center justify-center">
                  {timeSlot}
                </div>
                
                {/* Day Columns */}
                {dayOrder.map(day => {
                  const dayClasses = groupedClasses[day] || [];
                  const classesInTimeSlot = dayClasses.filter(cls => 
                    isTimeInSlot(cls.start_time, timeSlot)
                  );

                  return (
                    <div key={day} className="p-2 border-r border-gray-200 last:border-r-0 bg-white">
                      {classesInTimeSlot.map((cls, index) => (
                        <TooltipProvider key={cls.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`mb-1 p-2 rounded-md text-xs cursor-pointer hover:scale-105 transition-transform duration-200 ${getClassColor(cls.class_code)} ${getClassTextColor(cls.class_code)}`}
                              >
                                <div className="font-semibold truncate flex items-center justify-between">
                                  {cls.class_code}
                                  {notesCount[cls.class_code] > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                                      {notesCount[cls.class_code]}
                                    </Badge>
                                  )}
                                </div>
                                <div className="truncate opacity-90">{cls.class_name}</div>
                                <div className="text-xs opacity-75">
                                  {formatTimeAMPM(cls.start_time)} - {formatTimeAMPM(cls.end_time)}
                        </div>
                                {cls.location && (
                                  <div className="text-xs opacity-75 truncate">
                                    📍 {cls.location}
                          </div>
                        )}
                      </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm p-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded ${getClassColor(cls.class_code)}`}></div>
                                  <h3 className="font-bold text-lg">{cls.class_code}</h3>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-base mb-1">{cls.class_name}</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{formatTimeAMPM(cls.start_time)} - {formatTimeAMPM(cls.end_time)}</span>
                                    </div>
                                    
                                    {cls.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{cls.location}</span>
                                      </div>
                                    )}
                                    
                                    {cls.instructor_name && (
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{cls.instructor_name}</span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span>{notesCount[cls.class_code] || 0} notes uploaded</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 pt-2 border-t">
                                  <Link to={`/upload?uid=${userId}&date=${new Date().toISOString().split('T')[0]}&code=${cls.class_code}`}>
                                    <Button size="sm" className="text-xs">
                                      <Upload className="h-3 w-3 mr-1" />
                                      Upload Notes
                                    </Button>
                                  </Link>
                                  <Link to={`/notes?code=${cls.class_code}&date=${new Date().toISOString().split('T')[0]}`}>
                                    <Button size="sm" variant="outline" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      View Notes
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
            );
          })}
              </div>
            ))}
          </div>
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-dusty-blue rounded-full mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-dusty-blue mb-2">
            {t('uploadSchedule')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('uploadScheduleDescription')}
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover-lift animate-slide-up">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">
            {t('uploadSchedule')}
          </CardTitle>
          <CardDescription>
            {t('uploadScheduleDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-dusty-blue rounded-xl p-12 text-center hover:border-dusty-blue/80 transition-all duration-300 cursor-pointer bg-warm-cream hover-lift animate-scale-in"
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
              <div className="space-y-4">
                <div className="w-20 h-20 bg-dusty-blue rounded-full flex items-center justify-center mx-auto animate-bounce-gentle">
                  <FileImage className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-dusty-blue rounded-full flex items-center justify-center mx-auto animate-bounce-gentle">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('selectScheduleImage')}</h3>
                  <p className="text-muted-foreground">{t('dragDropOrClick')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
              className="w-full bg-dusty-blue hover:bg-dusty-blue/90 text-white shadow-lg h-12 text-lg font-semibold"
            >
              {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {uploadStatus.status === 'uploading' ? t('uploading') : t('processing')}
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  {t('processSchedule')}
                </>
              )}
            </Button>
          )}

          {/* Status Display */}
          {uploadStatus.status !== 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                {getStatusIcon()}
                <span className={`font-semibold text-lg ${getStatusColor()}`}>
                  {uploadStatus.message}
                </span>
              </div>
              
              {(uploadStatus.status === 'uploading' || uploadStatus.status === 'processing') && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progress</span>
                    <span>{uploadStatus.progress}%</span>
                  </div>
                  <Progress value={uploadStatus.progress} className="w-full h-3" />
                </div>
              )}

              {uploadStatus.status === 'success' && uploadStatus.classesFound && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                    {t('classesFound').replace('{count}', uploadStatus.classesFound?.toString() || '0')}
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus.status === 'error' && uploadStatus.error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                    {uploadStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-warm-cream p-6 rounded-xl border border-dusty-blue/20">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              {t('instructions')}
            </h3>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                {t('instruction1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                {t('instruction2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                {t('instruction3')}
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                {t('instruction4')}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Color Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Class Color Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from(new Set(classes.map(c => c.class_code))).slice(0, 12).map(classCode => (
            <div key={classCode} className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
              <div className={`w-4 h-4 rounded ${getClassColor(classCode)}`}></div>
              <span className="text-sm font-medium text-gray-700">{classCode}</span>
              {notesCount[classCode] > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {notesCount[classCode]}
                </Badge>
              )}
            </div>
          ))}
          {Array.from(new Set(classes.map(c => c.class_code))).length > 12 && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
              <div className="w-4 h-4 rounded bg-gray-400"></div>
              <span className="text-sm font-medium text-gray-500">
                +{Array.from(new Set(classes.map(c => c.class_code))).length - 12} more
              </span>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ScheduleUpload;
