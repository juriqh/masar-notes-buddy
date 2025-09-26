import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, MapPin, Clock } from 'lucide-react';
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
    <Card className="transition-all duration-300 hover:shadow-lg border-0 bg-warm-cream hover-lift animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-dusty-blue">
              {classData.class_name || classData.class_code}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span className="font-mono text-sm bg-dusty-blue/20 text-dusty-blue px-2 py-1 rounded">
                {classData.class_code}
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Link to={`/upload?uid=797281cf-9397-4fca-b983-300825cde186&date=${today}&code=${classData.class_code}`}>
              <Button size="sm" className="bg-dusty-blue hover:bg-dusty-blue/90 text-white shadow-md">
                <Upload className="h-3 w-3" />
                <span className="hidden sm:inline ml-1">{t('uploadNow')}</span>
              </Button>
            </Link>
            <Link to={`/notes?code=${classData.class_code}&date=${today}`}>
              <Button variant="outline" size="sm" className="shadow-md hover:bg-dusty-blue hover:text-white border-dusty-blue text-dusty-blue">
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline ml-1">{t('viewNotes')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-dusty-blue/80">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-dusty-blue/20 rounded">
              <Clock className="h-3 w-3 text-dusty-blue" />
            </div>
            <span className="font-medium">
              {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
            </span>
          </div>
          {classData.location && (
            <div className="flex items-center gap-2">
              <div className="p-1 bg-coral-pink/20 rounded">
                <MapPin className="h-3 w-3 text-coral-pink" />
              </div>
              <span>{classData.location}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCard;