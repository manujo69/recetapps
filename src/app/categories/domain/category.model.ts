export interface Category {
  id?: number;
  clientId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  pendingSync?: boolean;
}
