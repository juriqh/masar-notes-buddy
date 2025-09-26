import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [className, setClassName] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const uid = searchParams.get('uid') || '797281cf-9397-4fca-b983-300825cde186'; // Default to single user
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // Default to today
  const code = searchParams.get('code') || 'general'; // Default class code

  useEffect(() => {
    // No need to redirect - use defaults for single-user system

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
          setClassName(code === 'general' ? 'General Notes' : code); // Fallback to class code
        } else if (data) {
          setClassName(data.class_name || (code === 'general' ? 'General Notes' : code));
        } else {
          setClassName(code === 'general' ? 'General Notes' : code); // Default fallback
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
      <div className="w-full px-4 py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Redirecting to dashboard...
              </p>
              <Link to="/">
                <Button>
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
              {t('backToDashboard')}
            </Button>
          </Link>
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-creamy-yellow rounded-full mb-4">
            <ArrowLeft className="h-8 w-8 text-dusty-blue" />
          </div>
          <h1 className="text-4xl font-bold text-dusty-blue mb-2">
            {t('uploadNotes')} — {code} — {date}
          </h1>
          {className && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{className}</p>
          )}
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
    </div>
  );
};

export default Upload;