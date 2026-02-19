export interface User {
  id: number;
  name: string | null;
  surnames: string | null;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface UserPublic {
  id: number;
  name: string | null;
  surnames: string | null;
  email: string;
  created_at: Date;
}

export interface CreateUserDTO {
  name?: string;
  surnames?: string;
  email: string;
  password: string;
}
