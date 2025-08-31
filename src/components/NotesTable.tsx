import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, File } from 'lucide-react';
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{t('noFilesFound')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          {t('uploadedFiles')} ({files.length} {t('files')})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('fileName')}</TableHead>
                <TableHead>{t('size')}</TableHead>
                <TableHead>{t('uploadedAt')}</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{file.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFileSize(file.size_bytes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTimeForDisplay(file.created_at, language)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex items-center gap-1"
                    >
                      <a
                        href={getFileUrl(file.storage_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="hidden sm:inline">{t('open')}</span>
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