export type UserProfile = 'Operator' | 'Administrator';

export interface User {
  id: number;
  name: string;
  surnames: string;
  email: string;
  profile: UserProfile;
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
  cost_per_hour: number;
  tasks: string;
  activity_date?: string;
  created_at?: string;
  user_name?: string;
  user_email?: string;
  project_name?: string;
  role_names?: string;
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

export interface ProjectCostReportEntry {
  project_id: number;
  project_name: string;
  user_id: number;
  name: string;
  surnames: string;
  role: string;
  total_hours: number;
  total_cost: number;
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
  profile: UserProfile;
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
