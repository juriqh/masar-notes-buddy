import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, MapPin, BookOpen, TrendingUp, Users, Star, Plus, Calendar, Bell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getTodayInRiyadh, formatDateForDisplay, getDayOfWeek, formatDateTimeForDisplay, formatTime } from '@/utils/datetime';
import ScheduleCard from '@/components/ScheduleCard';
import { Link } from 'react-router-dom';

interface Class {
  id: number;
  class_code: string;
  class_name: string;
  location: string;
  start_time: string;
  end_time: string;
  days_of_week: string;
}

interface NextClass extends Class {
  nextDate: Date;
  daysUntil: number;
}

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [nextClass, setNextClass] = useState<NextClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [stats, setStats] = useState({
    totalClasses: 0,
    notesUploaded: 0,
    remindersSet: 0,
    studyStreak: 0
  });
  
  const today = getTodayInRiyadh();
  const todayStr = formatDateForDisplay(today);
  const todayDayOfWeek = getDayOfWeek(today);
  
  // Hardcoded user ID for single-user MVP
  const userId = '797281cf-9397-4fca-b983-300825cde186';

  // Function to fetch statistics
  const fetchStats = async () => {
    try {
      // Fetch notes count
      const { count: notesCount } = await supabase
        .from('notes_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch reminders count
      const { count: remindersCount } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setStats(prev => ({
        ...prev,
        notesUploaded: notesCount || 0,
        remindersSet: remindersCount || 0,
        studyStreak: Math.floor(Math.random() * 7) + 1 // Mock streak for now
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Function to find the next upcoming class
  const findNextClass = (allClasses: Class[]): NextClass | null => {
    if (!allClasses || allClasses.length === 0) return null;

    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const candidates: NextClass[] = [];

    // Check next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + dayOffset);
      const dayOfWeek = dayNames[checkDate.getDay()];

      const dayClasses = allClasses.filter(cls => 
        cls.days_of_week.includes(dayOfWeek)
      );

      for (const cls of dayClasses) {
        const [hours, minutes] = cls.start_time.split(':').map(Number);
        const classTime = hours * 60 + minutes;

        // If it's today, only include classes that haven't started yet
        if (dayOffset === 0 && classTime <= currentTime) {
          continue;
        }

        const nextDate = new Date(checkDate);
        nextDate.setHours(hours, minutes, 0, 0);

        candidates.push({
          ...cls,
          nextDate,
          daysUntil: dayOffset
        });
      }
    }

    // Sort by date and time, return the earliest
    candidates.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
    return candidates[0] || null;
  };

  useEffect(() => {
    const fetchTodayClasses = async () => {
      try {
        console.log('Dashboard: Fetching classes for user:', userId);
        // First check if user has any classes at all
        const { data: allClasses, error: allClassesError } = await supabase
          .from('classes')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true);

        if (allClassesError) {
          console.error('Error fetching all classes:', allClassesError);
          setHasSchedule(false);
        } else {
          console.log('Dashboard: Found all classes:', allClasses);
          const hasAnyClasses = (allClasses && allClasses.length > 0);
          console.log('Dashboard: Has any classes:', hasAnyClasses);
          setHasSchedule(hasAnyClasses);
          
          // Update localStorage to match database state
          localStorage.setItem('schedule_uploaded', hasAnyClasses.toString());
          console.log('Dashboard: Set localStorage to:', hasAnyClasses.toString());
          
          // Find the next upcoming class
          const nextUpcomingClass = findNextClass(allClasses || []);
          setNextClass(nextUpcomingClass);
          console.log('Dashboard: Next class:', nextUpcomingClass);
          
          // Update total classes count
          setStats(prev => ({
            ...prev,
            totalClasses: allClasses?.length || 0
          }));
          
          // Fetch other stats
          fetchStats();
        }

        // Then get today's specific classes
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true)
          .like('days_of_week', `%${todayDayOfWeek}%`)
          .order('start_time');

        if (error) {
          console.error('Error fetching today\'s classes:', error);
        } else {
          console.log('Dashboard: Found today\'s classes:', data);
          setClasses(data || []);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayClasses();
  }, [userId, todayDayOfWeek]);

  // Listen for localStorage changes and refresh data
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('schedule_uploaded');
      const hasScheduleFromStorage = saved === 'true';
      setHasSchedule(hasScheduleFromStorage);
      
      // If schedule was reset, clear the classes and next class
      if (!hasScheduleFromStorage) {
        setClasses([]);
        setNextClass(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-dusty-blue">
              {t('dashboard')}
            </h1>
            <p className="text-lg text-muted-foreground">
            {formatDateTimeForDisplay(today, language)}
          </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <Star className="h-3 w-3 mr-1" />
                {stats.studyStreak} day streak
              </Badge>
              <Badge variant="outline">
                {stats.totalClasses} classes
              </Badge>
        </div>
      </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link to="/schedule-upload">
              <Button className="bg-dusty-blue hover:bg-dusty-blue/90 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Upload Schedule
              </Button>
            </Link>
            <Link to="/notes">
              <Button variant="outline" className="shadow-md border-dusty-blue text-dusty-blue hover:bg-dusty-blue hover:text-white">
                <BookOpen className="h-4 w-4 mr-2" />
                View Notes
              </Button>
            </Link>
            <Link to="/reminders">
              <Button variant="outline" className="shadow-md border-coral-pink text-coral-pink hover:bg-coral-pink hover:text-white">
                <Bell className="h-4 w-4 mr-2" />
                Reminders
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-dusty-blue border-0 shadow-lg hover-lift animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Total Classes</p>
                  <p className="text-3xl font-bold text-white">{stats.totalClasses}</p>
                </div>
                <Calendar className="h-8 w-8 text-white animate-bounce-gentle" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-coral-pink border-0 shadow-lg hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dusty-blue text-sm font-medium">Notes Uploaded</p>
                  <p className="text-3xl font-bold text-dusty-blue">{stats.notesUploaded}</p>
                </div>
                <BookOpen className="h-8 w-8 text-dusty-blue animate-bounce-gentle" style={{ animationDelay: '0.5s' }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-creamy-yellow border-0 shadow-lg hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dusty-blue text-sm font-medium">Reminders Set</p>
                  <p className="text-3xl font-bold text-dusty-blue">{stats.remindersSet}</p>
                </div>
                <Bell className="h-8 w-8 text-dusty-blue animate-bounce-gentle" style={{ animationDelay: '1s' }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-warm-cream border-0 shadow-lg hover-lift animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dusty-blue text-sm font-medium">Study Streak</p>
                  <p className="text-3xl font-bold text-dusty-blue">{stats.studyStreak}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-dusty-blue animate-bounce-gentle" style={{ animationDelay: '1.5s' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover-lift animate-slide-up">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg animate-pulse-slow">
                    <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  {t('todaysSchedule')}
          </CardTitle>
                <CardDescription className="text-base">
                  {todayStr} - {todayDayOfWeek}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : !hasSchedule ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarDays className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{t('noScheduleUploaded')}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('uploadScheduleToGetStarted')}</p>
                    <Link to="/schedule-upload">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                {t('uploadSchedule')}
                      </Button>
                    </Link>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarDays className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{t('noClassesToday')}</h3>
                    <p className="text-muted-foreground">{t('noClassesScheduledForToday')}</p>
            </div>
          ) : (
                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <ScheduleCard key={cls.id} classData={cls} />
                    ))}
                  </div>
          )}
        </CardContent>
      </Card>
    </div>

          {/* Next Class Section */}
          <div className="space-y-6">
            {hasSchedule && nextClass && (
              <Card className="shadow-xl border-0 bg-coral-pink text-white hover-lift animate-scale-in">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-white/20 rounded-lg animate-pulse-slow">
                      <Clock className="h-6 w-6" />
                    </div>
                    Next Class
                  </CardTitle>
                  <CardDescription className="text-white/90">
                    Your upcoming class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">
                          {nextClass.class_name || nextClass.class_code}
                        </h3>
                        <p className="text-purple-100 font-mono text-sm">
                          {nextClass.class_code}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-white/20 text-white border-0">
                          {nextClass.daysUntil === 0 ? 'Today' : 
                           nextClass.daysUntil === 1 ? 'Tomorrow' : 
                           `In ${nextClass.daysUntil} days`}
                        </Badge>
                        <p className="text-purple-100 text-sm mt-1">
                          {formatDateForDisplay(nextClass.nextDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-purple-100">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {formatTime(nextClass.start_time)} - {formatTime(nextClass.end_time)}
                        </span>
                      </div>
                      {nextClass.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{nextClass.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Study Progress Card */}
            <Card className="shadow-xl border-0 bg-creamy-yellow hover-lift animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-dusty-blue rounded-lg animate-pulse-slow">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Study Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Notes Uploaded</span>
                    <span className="font-medium">{stats.notesUploaded}</span>
                  </div>
                  <Progress value={Math.min((stats.notesUploaded / 10) * 100, 100)} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Study Streak</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                      {stats.studyStreak} days
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>

  );
};

export default Dashboard;