export interface Activity {
  id: number;
  user_id: number;
  project_id: number;
  hours: number;
  tasks: string;
  created_at: Date;
}

export interface CreateActivityDTO {
  user_id?: number;
  project_id: number;
  hours: number;
  tasks: string;
}
