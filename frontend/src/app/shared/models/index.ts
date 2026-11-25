export type UserProfile = 'Operator' | 'Administrator';

export interface User {
  id: number;
  name: string;
  surnames: string;
  email: string;
  profile: UserProfile;
  cost_per_hour: number;
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
  budget_hours?: number;
  budget_cost?: number;
  actual_hours?: number;
  actual_cost?: number;
  created_at?: string;
}

export interface ProjectMember {
  project_id: number;
  user_id: number;
  name?: string;
  surnames?: string;
  email?: string;
}

export interface ActivityComment {
  id: number;
  activity_id: number;
  user_id: number;
  body: string;
  created_at: string;
  user_name?: string;
  user_surnames?: string;
}

export interface ActivityAttachment {
  id: number;
  activity_id: number;
  user_id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read_at?: string | null;
  created_at: string;
}

export interface Activity {
  id: number;
  user_id: number;
  project_id: number;
  hours: number;
  tasks: string;
  activity_date?: string;
  created_at?: string;
  user_name?: string;
  user_email?: string;
  user_cost_per_hour?: number;
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
  id?: number;
  key?: string;
}
