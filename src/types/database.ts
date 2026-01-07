// Extended types for the issues system
export interface Magazine {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  magazine_id: string;
  issue_number: number;
  template_pages: 52 | 68;
  distribution_month: string;
  theme: string;
  design_start_date: string;
  sketch_close_date: string;
  print_date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  magazine?: Magazine;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  supplier_type?: string | null;
  business_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LineupItem {
  id: string;
  issue_id: string;
  page_start: number;
  page_end: number;
  content: string;
  supplier_id?: string;
  source?: string;
  notes?: string;
  text_ready: boolean;
  files_ready: boolean;
  is_designed: boolean;
  designer_notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface Insert {
  id: string;
  issue_id: string;
  name: string;
  description?: string;
  supplier_id?: string;
  notes?: string;
  text_ready: boolean;
  files_ready: boolean;
  is_designed: boolean;
  designer_notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export type RowColor = 'yellow' | 'green' | 'white';

export function getRowColor(item: LineupItem | Insert): RowColor {
  if (item.is_designed) return 'yellow';
  if (item.text_ready || item.files_ready) return 'green';
  return 'white';
}
