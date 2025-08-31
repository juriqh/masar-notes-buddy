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
  
  const today = getTodayInRiyadh();
  const todayStr = formatDateForDisplay(today);
  const todayDayOfWeek = getDayOfWeek(today);
  
  // Hardcoded user ID for single-user MVP
  const userId = '797281cf-9397-4fca-b983-300825cde186';

  useEffect(() => {
    const fetchTodayClasses = async () => {
      try {
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