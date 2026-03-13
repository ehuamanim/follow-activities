export interface Activity {
  id: number;
  user_id: number;
  project_id: number;
  hours: number;
  tasks: string;
  activity_date: string;
  created_at: Date;
  user_cost_per_hour?: number;
}

export interface CreateActivityDTO {
  user_id?: number;
  project_id: number;
  hours: number;
  tasks: string;
  activity_date?: string;
}
