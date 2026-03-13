export interface Activity {
  id: number;
  user_id: number;
  project_id: number;
  hours: number;
  cost_per_hour: number;
  tasks: string;
  activity_date: string;
  created_at: Date;
}

export interface CreateActivityDTO {
  user_id?: number;
  project_id: number;
  hours: number;
  cost_per_hour: number;
  tasks: string;
  activity_date?: string;
}
