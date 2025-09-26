import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, MapPin, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatTime } from '@/utils/datetime';
import { Link } from 'react-router-dom';

interface Class {
  id: number;
  class_code: string;
  class_name: string;
  location: string;
  start_time: string;
  end_time: string;
}

interface ScheduleCardProps {
  classData: Class;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ classData }) => {
  const { t } = useLanguage();
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="transition-all duration-500 hover:shadow-2xl border-0 bg-glass hover-lift animate-fade-in rounded-2xl overflow-hidden group">
      <CardHeader className="pb-4 bg-gradient-to-r from-white/10 to-transparent">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl font-display text-white group-hover:text-gradient transition-all duration-300">
              {classData.class_name || classData.class_code}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="font-mono-modern text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-lg shadow-lg">
                {classData.class_code}
              </span>
              <Sparkles className="h-4 w-4 text-white/60 animate-spin" style={{ animationDuration: '3s' }} />
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <Link to={`/upload?uid=797281cf-9397-4fca-b983-300825cde186&date=${today}&code=${classData.class_code}`}>
              <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl px-4 py-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline ml-2 font-semibold">{t('uploadNow')}</span>
              </Button>
            </Link>
            <Link to={`/notes?code=${classData.class_code}&date=${today}`}>
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl px-4 py-2 backdrop-blur-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline ml-2 font-semibold">{t('viewNotes')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-white/90">
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">
              {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
            </span>
          </div>
          {classData.location && (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg shadow-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium">{classData.location}</span>
            </div>
          )}
        </div>
        
        {/* Hover effect indicator */}
        <div className="mt-4 flex items-center gap-2 text-white/60 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="text-sm font-medium">Click to manage</span>
          <ArrowRight className="h-4 w-4 animate-bounce-gentle" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCard;