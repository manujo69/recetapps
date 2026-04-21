export interface CategoryRow {
  rowid?: number;
  id?: number | null;
  client_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  pending_sync?: number | boolean;
}
