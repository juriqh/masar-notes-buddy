import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  message: string;
  progress: number;
  classesFound?: number;
  error?: string;
}

const ScheduleUpload: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    message: '',
    progress: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('uploadError'),
          description: t('invalidFileType'),
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('uploadError'),
          description: t('fileTooLarge'),
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      setUploadStatus({
        status: 'idle',
        message: t('fileSelected'),
        progress: 0
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus({
        status: 'uploading',
        message: t('uploadingFile'),
        progress: 20
      });

      // Upload file to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `schedule_${Date.now()}.${fileExt}`;
      const filePath = `schedules/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('schedules')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setUploadStatus({
        status: 'processing',
        message: t('processingSchedule'),
        progress: 60
      });

      // Call OCR processing API
      const response = await fetch('/api/process-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: filePath,
          fileName: fileName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const result = await response.json();

      setUploadStatus({
        status: 'success',
        message: t('scheduleProcessed'),
        progress: 100,
        classesFound: result.classesFound
      });

      toast({
        title: t('uploadSuccess'),
        description: t('scheduleUploadedSuccessfully'),
      });

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: t('uploadFailed'),
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: t('uploadError'),
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive'
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setUploadStatus({
          status: 'idle',
          message: t('fileSelected'),
          progress: 0
        });
      }
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileImage className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus.status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('uploadSchedule')}
          </CardTitle>
          <CardDescription>
            {t('uploadScheduleDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FileImage className="h-12 w-12 mx-auto text-blue-500" />
                <p className="text-lg font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-lg font-medium">{t('selectScheduleImage')}</p>
                <p className="text-sm text-gray-500">{t('dragDropOrClick')}</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <Button
              onClick={handleUpload}
              disabled={uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
              className="w-full"
            >
              {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadStatus.status === 'uploading' ? t('uploading') : t('processing')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('processSchedule')}
                </>
              )}
            </Button>
          )}

          {/* Status Display */}
          {uploadStatus.status !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className={`font-medium ${getStatusColor()}`}>
                  {uploadStatus.message}
                </span>
              </div>
              
              {(uploadStatus.status === 'uploading' || uploadStatus.status === 'processing') && (
                <Progress value={uploadStatus.progress} className="w-full" />
              )}

              {uploadStatus.status === 'success' && uploadStatus.classesFound && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('classesFound', { count: uploadStatus.classesFound })}
                  </AlertDescription>
                </Alert>
              )}

              {uploadStatus.status === 'error' && uploadStatus.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {uploadStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">{t('instructions')}</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('instruction1')}</li>
              <li>• {t('instruction2')}</li>
              <li>• {t('instruction3')}</li>
              <li>• {t('instruction4')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleUpload;
