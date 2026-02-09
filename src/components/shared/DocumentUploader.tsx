import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  File,
  FileImage,
  FileText,
  Trash2,
  Download,
  Loader2,
  X,
} from 'lucide-react';
import { useDocuments, useUploadDocument, useDeleteDocument, getDocumentUrl, Document } from '@/hooks/useDocuments';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface DocumentUploaderProps {
  entityType: 'task' | 'project' | 'procedure' | 'decision';
  entityId: string;
  readOnly?: boolean;
}

const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getFileIcon(fileType: string | null) {
  if (fileType?.startsWith('image/')) {
    return <FileImage className="h-8 w-8 text-blue-500" />;
  }
  if (fileType === 'application/pdf') {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({ entityType, entityId, readOnly = false }: DocumentUploaderProps) {
  const { data: documents, isLoading } = useDocuments(entityType, entityId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        setUploadingFiles((prev) => [...prev, file.name]);
        try {
          await uploadDocument.mutateAsync({
            file,
            entityType,
            entityId,
          });
        } finally {
          setUploadingFiles((prev) => prev.filter((f) => f !== file.name));
        }
      }
    },
    [entityType, entityId, uploadDocument]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    disabled: readOnly,
  });

  const handleDownload = (doc: Document) => {
    const url = getDocumentUrl(doc.file_path);
    window.open(url, '_blank');
  };

  const handleDelete = async (doc: Document) => {
    await deleteDocument.mutateAsync(doc);
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!readOnly && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          {isDragActive ? (
            <p className="text-primary">שחרר את הקבצים כאן...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                גרור קבצים לכאן או לחץ לבחירה
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, PDF, DOCX עד 10MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((fileName) => (
            <div
              key={fileName}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm flex-1 truncate">{fileName}</span>
              <span className="text-xs text-muted-foreground">מעלה...</span>
            </div>
          ))}
        </div>
      )}

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents && documents.length > 0 ? (
        <ScrollArea className="max-h-60">
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors"
              >
                {/* Preview/Icon */}
                {doc.file_type?.startsWith('image/') ? (
                  <img
                    src={getDocumentUrl(doc.file_path)}
                    alt={doc.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  getFileIcon(doc.file_type)
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)} •{' '}
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readOnly && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>למחוק את הקובץ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            פעולה זו תמחק את הקובץ לצמיתות.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(doc)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            מחק
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground">
          אין מסמכים מצורפים
        </div>
      )}
    </div>
  );
}
