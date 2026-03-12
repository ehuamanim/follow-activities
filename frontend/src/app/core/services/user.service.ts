import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, User, RegisterRequest } from '../../shared/models';

export interface UpdateUserRequest {
  name?: string;
  surnames?: string;
  email?: string;
  profile?: 'Operator' | 'Administrator';
  role_ids?: number[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  create(data: RegisterRequest): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/users`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  assignRoles(userId: number, roleIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${userId}/roles`, { role_ids: roleIds }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  update(id: number, data: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  changePassword(id: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${id}/password`, { password }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
