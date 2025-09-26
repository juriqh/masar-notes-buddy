import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { getTodayInRiyadh, formatDateForDisplay } from '@/utils/datetime';
import NotesTable from '@/components/NotesTable';

interface NoteFile {
  id: number;
  file_name: string;
  size_bytes: number;
  created_at: string;
  storage_path: string;
  class_code: string;
  class_name: string;
}

interface ClassOption {
  class_code: string;
  class_name: string;
}

const Notes: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(false);
  
  const today = getTodayInRiyadh();
  const defaultDate = formatDateForDisplay(today);
  
  const [filters, setFilters] = useState({
    date: searchParams.get('date') || defaultDate,
    classCode: searchParams.get('code') || 'all'
  });

  // Hardcoded user ID for single-user MVP
  const userId = '797281cf-9397-4fca-b983-300825cde186';

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('class_code, class_name')
          .eq('user_id', userId)
          .eq('active', true)
          .order('class_code');

        if (error) {
          console.error('Error fetching classes:', error);
          setHasSchedule(false);
        } else {
          setClasses(data || []);
          setHasSchedule((data && data.length > 0) || false);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    fetchClasses();
  }, [userId]);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('notes_uploads')
          .select('*')
          .eq('user_id', userId);

        if (filters.date) {
          query = query.eq('class_date', filters.date);
        }

        if (filters.classCode && filters.classCode !== 'all') {
          query = query.eq('class_code', filters.classCode);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching files:', error);
        } else {
          setFiles(data || []);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [userId, filters]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('schedule_uploaded');
      const hasScheduleFromStorage = saved === 'true';
      setHasSchedule(hasScheduleFromStorage);
      
      // If schedule was reset, clear the classes
      if (!hasScheduleFromStorage) {
        setClasses([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newParams = new URLSearchParams();
    if (newFilters.date) newParams.set('date', newFilters.date);
    if (newFilters.classCode && newFilters.classCode !== 'all') newParams.set('code', newFilters.classCode);
    setSearchParams(newParams);
  };

  const getFileUrl = (path: string): string => {
    const { data } = supabase.storage.from('notes').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen w-full relative">
      <div className="w-full px-6 py-10 space-y-10">
        {/* Header Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 animate-float shadow-2xl">
            <FileText className="h-12 w-12 text-white animate-bounce-gentle" />
          </div>
          <h1 className="text-6xl font-display text-gradient mb-4 animate-fade-in">
            {t('notes')}
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto font-medium">
            Browse and view your uploaded notes and files
          </p>
        </div>

        <Card className="bg-glass border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl">
          <CardHeader className="bg-gradient-to-r from-white/10 to-transparent pb-6">
            <CardTitle className="flex items-center gap-4 text-white text-2xl">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-glow shadow-lg">
                <Filter className="h-8 w-8 text-white" />
              </div>
              <span className="font-display">Smart Filters</span>
          </CardTitle>
        </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-white/90 font-semibold text-base">{t('filterByDate')}</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 rounded-xl backdrop-blur-sm focus:bg-white/20 transition-all duration-300"
              />
            </div>
              <div className="space-y-3">
                <Label htmlFor="class" className="text-white/90 font-semibold text-base">{t('filterByClass')}</Label>
              <Select 
                value={filters.classCode} 
                onValueChange={(value) => handleFilterChange('classCode', value)}
              >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl backdrop-blur-sm focus:bg-white/20 transition-all duration-300">
                  <SelectValue placeholder={t('allClasses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allClasses')}</SelectItem>
                  {classes.filter(cls => cls.class_code && cls.class_code.trim() !== '').map((cls) => (
                    <SelectItem key={cls.class_code} value={cls.class_code}>
                      {cls.class_name || cls.class_code} ({cls.class_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        </Card>

      {loading ? (
        <Card className="bg-glass border-0 shadow-2xl rounded-3xl backdrop-blur-xl">
          <CardContent className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-blue-500"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-500/30"></div>
            </div>
          </CardContent>
        </Card>
      ) : !hasSchedule ? (
        <Card className="bg-glass border-0 shadow-2xl rounded-3xl backdrop-blur-xl">
          <CardContent className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-float shadow-2xl">
              <Search className="h-16 w-16 text-white animate-bounce-gentle" />
            </div>
            <h3 className="text-2xl font-display text-white mb-4">
              {t('noNotes')}
            </h3>
            <p className="text-lg text-white/70 mb-8 max-w-md mx-auto">
              {t('noNotesDescription')}
            </p>
            <Link to="/schedule-upload">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-lg">
                <Sparkles className="h-6 w-6 mr-3" />
                {t('uploadSchedule')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <NotesTable files={files} getFileUrl={getFileUrl} />
      )}
      </div>
    </div>
  );
};

export default Notes;