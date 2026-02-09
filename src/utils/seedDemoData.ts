import { supabase } from '@/integrations/supabase/client';

export async function seedDemoData() {
  const employeeIds: string[] = [];
  const projectIds: string[] = [];

  // Check existing employees
  const { data: existingEmployees } = await supabase.from('employees').select('id');
  if (existingEmployees && existingEmployees.length > 0) {
    employeeIds.push(...existingEmployees.map(e => e.id));
  }

  // Seed employees if less than 5
  if (employeeIds.length < 5) {
    const demoEmployees = [
      { full_name: 'דני כהן', email: 'dani.cohen@company.co.il', phone: '050-1234567', department: 'פיתוח', position: 'מפתח בכיר', is_active: true },
      { full_name: 'שרה לוי', email: 'sara.levy@company.co.il', phone: '052-9876543', department: 'שיווק', position: 'מנהלת שיווק', is_active: true },
      { full_name: 'יוסי אברהם', email: 'yosi.a@company.co.il', phone: '054-5551234', department: 'מכירות', position: 'נציג מכירות', is_active: true },
      { full_name: 'מיכל רוזנברג', email: 'michal.r@company.co.il', phone: '053-7778899', department: 'תפעול', position: 'מנהלת תפעול', is_active: true },
      { full_name: 'אלון ביטון', email: 'alon.b@company.co.il', phone: '050-3332211', department: 'פיתוח', position: 'מפתח', is_active: true },
    ];

    for (const emp of demoEmployees) {
      const { data } = await supabase.from('employees').insert(emp).select('id').single();
      if (data) employeeIds.push(data.id);
    }
  }

  // Seed projects
  const { data: existingProjects } = await supabase.from('projects').select('id');
  if (!existingProjects || existingProjects.length === 0) {
    const demoProjects = [
      { name: 'השקת אתר חדש', description: 'עיצוב ופיתוח אתר תדמית חדש לחברה', status: 'active' as const, priority: 'high' as const, progress: 65, start_date: '2025-01-01', target_date: '2025-02-28' },
      { name: 'מערכת CRM', description: 'הטמעת מערכת ניהול לקוחות חדשה', status: 'active' as const, priority: 'urgent' as const, progress: 40, start_date: '2024-12-15', target_date: '2025-03-15' },
      { name: 'אוטומציה תפעולית', description: 'שיפור תהליכי העבודה והאוטומציה', status: 'active' as const, priority: 'medium' as const, progress: 80, start_date: '2024-11-01', target_date: '2025-01-31' },
      { name: 'קמפיין שיווקי Q1', description: 'תכנון וביצוע קמפיין שיווקי לרבעון הראשון', status: 'planning' as const, priority: 'medium' as const, progress: 20, start_date: '2025-01-15', target_date: '2025-03-31' },
    ];

    for (const proj of demoProjects) {
      const { data } = await supabase.from('projects').insert(proj).select('id').single();
      if (data) projectIds.push(data.id);
    }
  } else {
    projectIds.push(...existingProjects.map(p => p.id));
  }

  // Check existing tasks
  const { data: existingTasks } = await supabase.from('tasks').select('id');
  if (!existingTasks || existingTasks.length < 5) {
    const today = new Date();
    const demoTasks = [
      { title: 'עדכון תוכן עמוד הבית', description: 'לעדכן את הטקסטים והתמונות בעמוד הראשי', priority: 'high' as const, status: 'in_progress' as const, approval_status: 'pending' as const, due_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], project_id: projectIds[0] || null },
      { title: 'הכנת מצגת למשקיעים', description: 'להכין מצגת מקצועית לפגישה עם משקיעים פוטנציאליים', priority: 'urgent' as const, status: 'new' as const, approval_status: 'pending' as const, due_date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { title: 'בדיקת חשבוניות ספקים', description: 'לבדוק ולאשר חשבוניות מספקים לחודש ינואר', priority: 'medium' as const, status: 'stuck' as const, approval_status: 'approved' as const, due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { title: 'פגישת סטטוס שבועית', description: 'לתאם ולהכין סיכום לפגישת הסטטוס השבועית', priority: 'low' as const, status: 'in_progress' as const, approval_status: 'approved' as const, due_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { title: 'הטמעת מודול דוחות', description: 'לפתח ולהטמיע מודול דוחות חדש במערכת', priority: 'high' as const, status: 'in_progress' as const, approval_status: 'pending' as const, due_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], project_id: projectIds[1] || null },
      { title: 'עדכון מסמכי נהלים', description: 'לעדכן את כל מסמכי הנהלים בהתאם לשינויים האחרונים', priority: 'medium' as const, status: 'new' as const, approval_status: 'pending' as const, due_date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { title: 'סקירת אבטחת מידע', description: 'לבצע סקירה שנתית של מערכות האבטחה', priority: 'urgent' as const, status: 'new' as const, approval_status: 'pending' as const, due_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { title: 'הדרכת עובדים חדשים', description: 'להכין ולבצע הדרכה לעובדים החדשים', priority: 'medium' as const, status: 'completed' as const, approval_status: 'approved' as const, completed_at: new Date().toISOString(), due_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    ];

    for (let i = 0; i < demoTasks.length; i++) {
      const { data: task } = await supabase.from('tasks').insert(demoTasks[i]).select('id').single();
      // Assign some employees to tasks
      if (task && employeeIds.length > 0) {
        const assigneeIndex = i % employeeIds.length;
        await supabase.from('task_assignees').insert({
          task_id: task.id,
          employee_id: employeeIds[assigneeIndex]
        });
      }
    }
  }

  // Seed audit logs for recent activity
  const { data: existingLogs } = await supabase.from('audit_logs').select('id').limit(1);
  if (!existingLogs || existingLogs.length === 0) {
    const actions = [
      { action: 'create', entity_type: 'task', details: { title: 'הכנת מצגת למשקיעים' } },
      { action: 'update', entity_type: 'task', details: { title: 'עדכון תוכן עמוד הבית', field: 'status', old_value: 'new', new_value: 'in_progress' } },
      { action: 'create', entity_type: 'project', details: { name: 'השקת אתר חדש' } },
      { action: 'approve', entity_type: 'task', details: { title: 'בדיקת חשבוניות ספקים' } },
      { action: 'create', entity_type: 'employee', details: { name: 'דני כהן' } },
      { action: 'update', entity_type: 'project', details: { name: 'אוטומציה תפעולית', field: 'progress', old_value: 70, new_value: 80 } },
      { action: 'complete', entity_type: 'task', details: { title: 'הדרכת עובדים חדשים' } },
    ];

    for (const log of actions) {
      await supabase.from('audit_logs').insert(log);
    }
  }

  console.log('Demo data seeded successfully!');
  return { employeeIds, projectIds };
}
