export interface User {
  id: number;
  name: string;
  surnames: string;
  email: string;
  roles?: Role[];
  created_at?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at?: string;
}

export interface Activity {
  id: number;
  user_id: number;
  project_id: number;
  hours: number;
  tasks: string;
  created_at?: string;
  user?: User;
  project?: Project;
}

export interface TeamReportEntry {
  id: number;
  name: string;
  surnames: string;
  role: string;
  total_hours: number;
}

export interface ProjectActivitiesReportEntry {
  project_name: string;
  user_id: number;
  name: string;
  surnames: string;
  role: string;
  month: number;
  year: number;
  total_hours: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  surnames: string;
  email: string;
  password: string;
  role_ids?: number[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardData {
  label: string;
  hours: number;
}
