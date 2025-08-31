import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import UploadDropzone from '@/components/UploadDropzone';
import NotesTable from '@/components/NotesTable';

interface UploadedFile {
  id: number;
  file_name: string;
  size_bytes: number;
  created_at: string;
  storage_path: string;
}

const Upload: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [className, setClassName] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const uid = searchParams.get('uid');
  const date = searchParams.get('date');
  const code = searchParams.get('code');

  useEffect(() => {
    if (!uid || !date || !code) {
      toast({
        title: "Error",
        description: t('invalidParams'),
        variant: "destructive",
      });
      return;
    }

    const fetchClassInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('class_name')
          .eq('user_id', uid)
          .eq('class_code', code)
          .single();

        if (error) {
          console.error('Error fetching class info:', error);
        } else if (data) {
          setClassName(data.class_name || code);
        }
      } catch (error) {
        console.error('Error fetching class info:', error);
      }
    };

    const fetchUploadedFiles = async () => {
      try {
        const { data, error } = await supabase
          .from('notes_uploads')
          .select('*')
          .eq('user_id', uid)
          .eq('class_code', code)
          .eq('class_date', date)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching uploaded files:', error);
        } else {
          setUploadedFiles(data || []);
        }
      } catch (error) {
        console.error('Error fetching uploaded files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClassInfo();
    fetchUploadedFiles();
  }, [uid, date, code, t]);

  const handleUpload = async (files: File[]) => {
    if (!uid || !date || !code) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = file.name;
        const filePath = `${uid}/${date}/${code}/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('notes')
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type
          });

        if (uploadError) {
          throw uploadError;
        }

        // Insert metadata into notes_uploads table
        const { error: insertError } = await supabase
          .from('notes_uploads')
          .insert({
            user_id: uid,
            class_code: code,
            class_name: className || code,
            class_date: date,
            storage_path: filePath,
            file_name: fileName,
            mime_type: file.type,
            size_bytes: file.size
          });

        if (insertError) {
          throw insertError;
        }

        return filePath;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success",
        description: t('uploadSuccess'),
      });

      // Refresh uploaded files list
      const { data, error } = await supabase
        .from('notes_uploads')
        .select('*')
        .eq('user_id', uid)
        .eq('class_code', code)
        .eq('class_date', date)
        .order('created_at', { ascending: false });

      if (!error) {
        setUploadedFiles(data || []);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: t('uploadError'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileUrl = (path: string): string => {
    const { data } = supabase.storage.from('notes').getPublicUrl(path);
    return data.publicUrl;
  };

  if (!uid || !date || !code) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-destructive">{t('invalidParams')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('backToDashboard')}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {t('uploadNotes')} — {code} — {date}
          </h1>
          {className && (
            <p className="text-muted-foreground">{className}</p>
          )}
        </div>
      </div>

      <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <NotesTable files={uploadedFiles} getFileUrl={getFileUrl} />
      )}
    </div>
  );
};

export default Upload;