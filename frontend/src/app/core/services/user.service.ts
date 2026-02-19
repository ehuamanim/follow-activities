import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, RegisterRequest } from '../../shared/models';

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

  create(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  update(id: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
