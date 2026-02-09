import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image as ImageIcon, File, FileSpreadsheet, Loader2 } from 'lucide-react';
import { getDocumentUrl } from '@/hooks/useDocuments';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string | null;
  fileName?: string;
}

const OFFICE_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];

export function DocumentPreviewModal({
  open,
  onOpenChange,
  filePath,
  fileName: propFileName,
}: DocumentPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!filePath) return null;

  const fullUrl = getDocumentUrl(filePath);
  const fileName = propFileName || filePath.split('/').pop() || 'קובץ';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';
  const isOffice = OFFICE_EXTENSIONS.includes(fileExtension);
  const isPreviewable = isImage || isPdf || isOffice;

  // Google Docs Viewer URL for Office files
  const googleViewerUrl = fullUrl 
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`
    : null;

  const handleDownload = () => {
    if (fullUrl) {
      window.open(fullUrl, '_blank');
    }
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5" />;
    if (isPdf) return <FileText className="h-5 w-5" />;
    if (['xls', 'xlsx', 'ods'].includes(fileExtension)) return <FileSpreadsheet className="h-5 w-5" />;
    if (isOffice) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            <span className="truncate">{fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          {isLoading && isPreviewable && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isImage && fullUrl && (
            <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg p-4">
              <img
                src={fullUrl}
                alt={fileName}
                className="max-w-full max-h-[60vh] object-contain rounded"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
            </div>
          )}

          {isPdf && fullUrl && (
            <iframe
              src={fullUrl}
              className="w-full h-[60vh] rounded-lg border border-border"
              title={fileName}
              onLoad={() => setIsLoading(false)}
            />
          )}

          {isOffice && googleViewerUrl && (
            <iframe
              src={googleViewerUrl}
              className="w-full h-[60vh] rounded-lg border border-border"
              title={fileName}
              onLoad={() => setIsLoading(false)}
            />
          )}

          {!isPreviewable && (
            <div className="h-[300px] flex flex-col items-center justify-center bg-muted/30 rounded-lg gap-4">
              <File className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                לא ניתן להציג תצוגה מקדימה של קובץ מסוג {fileExtension.toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                לחץ על הכפתור למטה להורדת הקובץ
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגור
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            הורד קובץ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
