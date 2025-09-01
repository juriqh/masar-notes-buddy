import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getTodayInRiyadh, formatDateForDisplay, getDayOfWeek, formatDateTimeForDisplay } from '@/utils/datetime';
import ScheduleCard from '@/components/ScheduleCard';

interface Class {
  id: number;
  class_code: string;
  class_name: string;
  location: string;
  start_time: string;
  end_time: string;
  days_of_week: string;
}

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(() => {
    const saved = localStorage.getItem('schedule_uploaded');
    console.log('Dashboard: Initial localStorage value:', saved);
    return saved === 'true';
  });
  
  const today = getTodayInRiyadh();
  const todayStr = formatDateForDisplay(today);
  const todayDayOfWeek = getDayOfWeek(today);
  
  // Hardcoded user ID for single-user MVP
  const userId = '797281cf-9397-4fca-b983-300825cde186';

  useEffect(() => {
    const fetchTodayClasses = async () => {
      try {
        console.log('Dashboard: Fetching classes for user:', userId);
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true)
          .like('days_of_week', `%${todayDayOfWeek}%`)
          .order('start_time');

        if (error) {
          console.error('Error fetching classes:', error);
        } else {
          console.log('Dashboard: Found classes:', data);
          setClasses(data || []);
          const hasData = (data && data.length > 0);
          console.log('Dashboard: Has data:', hasData);
          setHasSchedule(hasData);
          localStorage.setItem('schedule_uploaded', hasData.toString());
          console.log('Dashboard: Set localStorage to:', hasData.toString());
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayClasses();
  }, [userId, todayDayOfWeek]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('schedule_uploaded');
      setHasSchedule(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
          <p className="text-muted-foreground">
            {formatDateTimeForDisplay(today, language)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('todaySchedule')}
          </CardTitle>
          <CardDescription>
            {t('today')} - {todayDayOfWeek}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !hasSchedule ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {t('noSchedule')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('noScheduleDescription')}
              </p>
              <a 
                href="/schedule-upload" 
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {t('uploadSchedule')}
              </a>
            </div>
          ) : (
            <ScheduleCard 
              classes={classes} 
              currentDate={todayStr} 
              userId={userId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;