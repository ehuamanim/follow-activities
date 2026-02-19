export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: Date;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  status?: string;
}
