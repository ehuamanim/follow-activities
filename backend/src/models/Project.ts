export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  budget_hours: number;
  budget_cost: number;
  created_at: Date;
  actual_hours?: number;
  actual_cost?: number;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  status?: string;
  budget_hours?: number;
  budget_cost?: number;
}

export interface ProjectMember {
  project_id: number;
  user_id: number;
  name?: string | null;
  surnames?: string | null;
  email?: string;
}
