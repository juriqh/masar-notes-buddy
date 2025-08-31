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
  classes: Class[];
  currentDate: string;
  userId: string;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ classes, currentDate, userId }) => {
  const { t } = useLanguage();

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('noClassesToday')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((cls) => (
        <Card key={cls.id} className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  {cls.class_name || cls.class_code}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <span className="font-mono text-sm">{cls.class_code}</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Link to={`/upload?uid=${userId}&date=${currentDate}&code=${cls.class_code}`}>
                  <Button size="sm" className="flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('uploadNow')}</span>
                  </Button>
                </Link>
                <Link to={`/notes?code=${cls.class_code}&date=${currentDate}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span className="hidden sm:inline">{t('viewNotes')}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                </span>
              </div>
              {cls.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{cls.location}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ScheduleCard;