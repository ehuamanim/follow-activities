export type UserProfile = 'Operator' | 'Administrator';

export interface User {
  id: number;
  name: string | null;
  surnames: string | null;
  email: string;
  profile: UserProfile;
  cost_per_hour: number;
  status: 'A' | 'I';
  password_hash: string;
  created_at: Date;
}

export interface UserPublic {
  id: number;
  name: string | null;
  surnames: string | null;
  email: string;
  profile: UserProfile;
  cost_per_hour: number;
  status: 'A' | 'I';
  created_at: Date;
}

export interface CreateUserDTO {
  name?: string;
  surnames?: string;
  email: string;
  password: string;
  profile: UserProfile;
  cost_per_hour?: number;
  role_ids?: number[];
}
