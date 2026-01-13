import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useEmailTemplates, useUpdateEmailTemplate, EmailTemplate, renderTemplate } from '@/hooks/useEmailTemplates';
import { Mail, Edit, Eye, Save, Loader2, Info } from 'lucide-react';

export function EmailTemplatesSettings() {
  const { data: templates, isLoading } = useEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditBody(template.body_template);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    await updateTemplate.mutateAsync({
      id: editingTemplate.id,
      subject: editSubject,
      body_template: editBody,
    });
    
    setEditingTemplate(null);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
  };

  // Sample data for preview
  const sampleVariables: Record<string, string> = {
    supplier_name: 'ישראל ישראלי',
    magazine_name: 'נפלאות קידס',
    issue_number: '42',
    issue_theme: 'חג הפסח',
    issue_name: 'נפלאות קידס #42 - חג הפסח',
    deadline: '15/04/2024',
    content_title: 'מדור הפתיחה',
    pages: '12-15',
    editor_name: 'שרה כהן',
    days_left: '5',
    content_list: '• מדור הפתיחה - עמודים 1-4\n• ראיון עם הרב - עמודים 8-10',
  };

  const getTemplateIcon = (key: string) => {
    switch (key) {
      case 'new_issue': return '🎉';
      case 'assignment': return '📋';
      case 'deadline_reminder': return '⏰';
      case 'content_received': return '✅';
      default: return '📧';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">טוען תבניות...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          תבניות מיילים
        </CardTitle>
        <CardDescription>
          ערוך את תוכן המיילים האוטומטיים שנשלחים מהמערכת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {templates?.map((template) => (
            <AccordionItem key={template.id} value={template.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-right">
                  <span className="text-2xl">{getTemplateIcon(template.template_key)}</span>
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">
                      {template.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Subject */}
                  <div>
                    <Label className="text-xs text-muted-foreground">נושא המייל</Label>
                    <p className="p-2 bg-muted/50 rounded text-sm mt-1" dir="ltr">
                      {template.subject}
                    </p>
                  </div>

                  {/* Body Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground">תוכן ההודעה</Label>
                    <pre className="p-3 bg-muted/50 rounded text-sm mt-1 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-auto">
                      {template.body_template}
                    </pre>
                  </div>

                  {/* Available Variables */}
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      משתנים זמינים
                    </Label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {template.available_variables?.map((variable) => (
                        <Badge key={variable} variant="secondary" className="font-mono text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      עריכה
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      תצוגה מקדימה
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {(!templates || templates.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>אין תבניות מיילים</p>
            <p className="text-sm mt-1">
              הרץ את קובץ ה-SQL ב-Supabase ליצירת תבניות ברירת מחדל
            </p>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת תבנית: {editingTemplate?.name}</DialogTitle>
            <DialogDescription>
              ערוך את נושא ותוכן המייל. השתמש במשתנים בסוגריים מסולסלים.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>נושא המייל</Label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="נושא המייל"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label>תוכן ההודעה</Label>
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="תוכן המייל"
                rows={12}
                className="font-mono text-sm"
                dir="rtl"
              />
            </div>

            {/* Available Variables */}
            <div>
              <Label className="text-xs text-muted-foreground">משתנים זמינים (לחץ להעתקה)</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {editingTemplate?.available_variables?.map((variable) => (
                  <Badge
                    key={variable}
                    variant="outline"
                    className="font-mono text-xs cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setEditBody(prev => prev + `{{${variable}}}`);
                    }}
                  >
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור
            </Button>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>תצוגה מקדימה: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              כך ייראה המייל עם נתונים לדוגמה
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4 py-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">נושא:</p>
                <p className="font-medium">
                  {renderTemplate(previewTemplate.subject, sampleVariables)}
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-white">
                <p className="text-xs text-muted-foreground mb-2">תוכן:</p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {renderTemplate(previewTemplate.body_template, sampleVariables)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
