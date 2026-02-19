import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activities`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getById(id: number): Observable<Activity> {
    return this.http.get<Activity>(`${this.apiUrl}/activities/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  create(data: Partial<Activity>): Observable<Activity> {
    return this.http.post<Activity>(`${this.apiUrl}/activities`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  update(id: number, data: Partial<Activity>): Observable<Activity> {
    return this.http.put<Activity>(`${this.apiUrl}/activities/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/activities/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
