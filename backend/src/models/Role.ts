export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface UserRole {
  user_id: number;
  role_id: number;
}
