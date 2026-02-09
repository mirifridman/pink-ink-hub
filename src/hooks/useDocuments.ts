import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  entity_type: string;
  entity_id: string;
  uploaded_by: string | null;
  created_at: string;
}

export function useDocuments(entityType: string, entityId: string | null) {
  return useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!entityId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File;
      entityType: string;
      entityId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityType}/${entityId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          entity_type: entityType,
          entity_id: entityId,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      toast({ title: 'הקובץ הועלה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה בהעלאת קובץ', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Document) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'הקובץ נמחק בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה במחיקת קובץ', description: error.message, variant: 'destructive' });
    },
  });
}

export function getDocumentUrl(filePath: string): string {
  // Determine the correct bucket based on the file path prefix
  let bucket = 'documents';
  let adjustedPath = filePath;
  
  // Check if the path indicates it's from email-attachments bucket
  if (filePath.startsWith('email-attachments/')) {
    bucket = 'email-attachments';
    // Remove the bucket prefix from the path since getPublicUrl expects just the file path
    adjustedPath = filePath.replace('email-attachments/', '');
  } else if (filePath.startsWith('AAMkADE') || filePath.includes('/1769')) {
    // Heuristic: paths starting with AAMk or containing /1769 timestamps are from email-attachments
    bucket = 'email-attachments';
    adjustedPath = filePath;
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(adjustedPath);
  return data.publicUrl;
}
