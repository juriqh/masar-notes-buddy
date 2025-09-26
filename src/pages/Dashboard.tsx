import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, MapPin, BookOpen, TrendingUp, Users, Star, Plus, Calendar, Bell, Zap, Target, Award, Rocket } from 'lucide-react';
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
    <div className="min-h-screen w-full relative">
      <div className="w-full px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-display text-gradient animate-fade-in">
              {t('dashboard')}
            </h1>
            <p className="text-xl text-white/80 font-medium">
              {formatDateTimeForDisplay(today, language)}
            </p>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 px-4 py-2 shadow-lg animate-glow">
                <Star className="h-4 w-4 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
                {stats.studyStreak} day streak
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 backdrop-blur-sm">
                <Target className="h-4 w-4 mr-2" />
                {stats.totalClasses} classes
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4">
            <Link to="/schedule-upload">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 px-6 py-3 rounded-xl font-semibold">
                <Plus className="h-5 w-5 mr-2" />
                Upload Schedule
              </Button>
            </Link>
            <Link to="/notes">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 px-6 py-3 rounded-xl font-semibold backdrop-blur-sm">
                <BookOpen className="h-5 w-5 mr-2" />
                View Notes
              </Button>
            </Link>
            <Link to="/reminders">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 px-6 py-3 rounded-xl font-semibold backdrop-blur-sm">
                <Bell className="h-5 w-5 mr-2" />
                Reminders
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 border-0 shadow-2xl hover-lift animate-fade-in card-hover rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Total Classes</p>
                  <p className="text-4xl font-display text-white mt-2">{stats.totalClasses}</p>
                </div>
                <div className="relative">
                  <Calendar className="h-12 w-12 text-white animate-bounce-gentle" />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 border-0 shadow-2xl hover-lift animate-fade-in card-hover rounded-2xl" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Notes Uploaded</p>
                  <p className="text-4xl font-display text-white mt-2">{stats.notesUploaded}</p>
                </div>
                <div className="relative">
                  <BookOpen className="h-12 w-12 text-white animate-bounce-gentle" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-400 to-yellow-500 border-0 shadow-2xl hover-lift animate-fade-in card-hover rounded-2xl" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Reminders Set</p>
                  <p className="text-4xl font-display text-white mt-2">{stats.remindersSet}</p>
                </div>
                <div className="relative">
                  <Bell className="h-12 w-12 text-white animate-bounce-gentle" style={{ animationDelay: '1s' }} />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 shadow-2xl hover-lift animate-fade-in card-hover rounded-2xl" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-semibold uppercase tracking-wider">Study Streak</p>
                  <p className="text-4xl font-display text-white mt-2">{stats.studyStreak}</p>
                </div>
                <div className="relative">
                  <TrendingUp className="h-12 w-12 text-white animate-bounce-gentle" style={{ animationDelay: '1.5s' }} />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-glass backdrop-blur-xl hover-lift animate-slide-up rounded-3xl overflow-hidden">
              <CardHeader className="pb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-glow shadow-lg">
                    <CalendarDays className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <span className="text-gradient font-display">{t('todaysSchedule')}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/70 text-sm">{todayStr}</span>
                      <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                      <span className="text-white/70 text-sm">{todayDayOfWeek}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
          {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-blue-500"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-500/30"></div>
                    </div>
            </div>
          ) : !hasSchedule ? (
                  <div className="text-center py-16">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float shadow-2xl">
                      <CalendarDays className="h-16 w-16 text-white animate-bounce-gentle" />
                    </div>
                    <h3 className="text-2xl font-display text-white mb-4">{t('noScheduleUploaded')}</h3>
                    <p className="text-white/70 mb-8 max-w-md mx-auto text-lg">{t('uploadScheduleToGetStarted')}</p>
                    <Link to="/schedule-upload">
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-lg">
                        <Rocket className="h-6 w-6 mr-3" />
                        {t('uploadSchedule')}
                      </Button>
                    </Link>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float shadow-2xl">
                      <CalendarDays className="h-16 w-16 text-white animate-bounce-gentle" />
                    </div>
                    <h3 className="text-2xl font-display text-white mb-4">{t('noClassesToday')}</h3>
                    <p className="text-white/70 text-lg">{t('noClassesScheduledForToday')}</p>
            </div>
          ) : (
                  <div className="space-y-6">
                    {classes.map((cls) => (
                      <ScheduleCard key={cls.id} classData={cls} />
                    ))}
                  </div>
          )}
              </CardContent>
            </Card>
          </div>

          {/* Next Class Section */}
          <div className="space-y-8">
            {hasSchedule && nextClass && (
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-pink-500 to-rose-600 text-white hover-lift animate-scale-in rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 bg-gradient-to-r from-white/10 to-transparent">
                  <CardTitle className="flex items-center gap-4 text-2xl">
                    <div className="p-3 bg-white/20 rounded-2xl animate-glow backdrop-blur-sm">
                      <Clock className="h-8 w-8 animate-spin" style={{ animationDuration: '8s' }} />
                    </div>
                    <span className="font-display">Next Class</span>
                  </CardTitle>
                  <CardDescription className="text-white/80 text-base">
                    Your upcoming class
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-display">
                          {nextClass.class_name || nextClass.class_code}
                        </h3>
                        <p className="text-white/80 font-mono-modern text-base bg-white/20 px-3 py-1 rounded-lg inline-block">
                          {nextClass.class_code}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-white/30 text-white border-0 px-4 py-2 backdrop-blur-sm shadow-lg">
                          {nextClass.daysUntil === 0 ? 'Today' : 
                           nextClass.daysUntil === 1 ? 'Tomorrow' : 
                           `In ${nextClass.daysUntil} days`}
                        </Badge>
                        <p className="text-white/80 text-sm mt-2">
                          {formatDateForDisplay(nextClass.nextDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 text-white/90">
                      <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <Clock className="h-5 w-5" />
                        <span className="font-semibold text-lg">
                          {formatTime(nextClass.start_time)} - {formatTime(nextClass.end_time)}
                        </span>
                      </div>
                      {nextClass.location && (
                        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                          <MapPin className="h-5 w-5" />
                          <span className="font-medium">{nextClass.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Study Progress Card */}
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-indigo-500 to-purple-600 hover-lift animate-scale-in rounded-3xl overflow-hidden" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-6 bg-gradient-to-r from-white/10 to-transparent">
                <CardTitle className="flex items-center gap-4 text-white">
                  <div className="p-3 bg-white/20 rounded-2xl animate-glow backdrop-blur-sm">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-display text-xl">Study Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-white/90">
                    <span className="font-semibold">This Week</span>
                    <span className="font-display text-lg">75%</span>
                  </div>
                  <div className="relative">
                    <Progress value={75} className="h-3 bg-white/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-75 animate-shimmer"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-white/90">
                    <span className="font-semibold">Notes Uploaded</span>
                    <span className="font-display text-lg">{stats.notesUploaded}</span>
                  </div>
                  <div className="relative">
                    <Progress value={Math.min((stats.notesUploaded / 10) * 100, 100)} className="h-3 bg-white/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full opacity-75 animate-shimmer"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 font-semibold">Study Streak</span>
                    <Badge className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white border-0 px-4 py-2 shadow-lg animate-glow">
                      <Zap className="h-4 w-4 mr-2" />
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