import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
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
  const [hasSchedule, setHasSchedule] = useState(() => {
    const saved = localStorage.getItem('schedule_uploaded');
    return saved === 'true';
  });
  
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
        } else {
          setClasses(data || []);
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
      setHasSchedule(saved === 'true');
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('notes')}</h1>
        <p className="text-muted-foreground">
          Browse and view your uploaded notes and files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t('filterByDate')}</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">{t('filterByClass')}</Label>
              <Select 
                value={filters.classCode} 
                onValueChange={(value) => handleFilterChange('classCode', value)}
              >
                <SelectTrigger>
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
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : !hasSchedule ? (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {t('noNotes')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('noNotesDescription')}
            </p>
            <a 
              href="/schedule-upload" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t('uploadSchedule')}
            </a>
          </CardContent>
        </Card>
      ) : (
        <NotesTable files={files} getFileUrl={getFileUrl} />
      )}
    </div>
  );
};

export default Notes;