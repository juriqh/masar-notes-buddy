import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, File, Download, Eye, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatFileSize, formatDateTimeForDisplay } from '@/utils/datetime';

interface NoteFile {
  id: number;
  file_name: string;
  size_bytes: number;
  created_at: string;
  storage_path: string;
}

interface NotesTableProps {
  files: NoteFile[];
  getFileUrl: (path: string) => string;
}

const NotesTable: React.FC<NotesTableProps> = ({ files, getFileUrl }) => {
  const { t, language } = useLanguage();

  if (files.length === 0) {
    return (
      <Card className="bg-glass border-0 shadow-2xl rounded-3xl backdrop-blur-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-float shadow-2xl">
              <File className="h-12 w-12 text-white animate-bounce-gentle" />
            </div>
            <p className="text-xl text-white/80 font-medium">{t('noFilesFound')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-glass border-0 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-white/10 to-transparent pb-6">
        <CardTitle className="flex items-center gap-4 text-white text-2xl">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl animate-glow shadow-lg">
            <File className="h-8 w-8 text-white" />
          </div>
          <div>
            <span className="font-display">{t('uploadedFiles')}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/70 text-sm">{files.length} {t('files')}</span>
              <Sparkles className="h-4 w-4 text-white/60 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="overflow-x-auto">
          <Table className="rounded-2xl overflow-hidden">
            <TableHeader>
              <TableRow className="bg-white/10 hover:bg-white/20 border-white/20">
                <TableHead className="text-white/90 font-semibold text-base">{t('fileName')}</TableHead>
                <TableHead className="text-white/90 font-semibold text-base">{t('size')}</TableHead>
                <TableHead className="text-white/90 font-semibold text-base">{t('uploadedAt')}</TableHead>
                <TableHead className="w-[120px] text-white/90 font-semibold text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id} className="border-white/10 hover:bg-white/5 transition-all duration-300">
                  <TableCell className="font-medium py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
                        <File className="h-5 w-5 text-white" />
                      </div>
                      <span className="truncate max-w-[200px] text-white font-semibold">{file.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 font-medium">
                    {formatFileSize(file.size_bytes)}
                  </TableCell>
                  <TableCell className="text-white/70 font-medium">
                    {formatDateTimeForDisplay(file.created_at, language)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      asChild
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 rounded-xl px-4 py-2"
                    >
                      <a
                        href={getFileUrl(file.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline font-semibold">{t('open')}</span>
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesTable;