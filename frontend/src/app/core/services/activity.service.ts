import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity } from '../../shared/models';

export interface ActivityFilters {
  userId?: number;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAll(filters?: ActivityFilters): Observable<Activity[]> {
    let params = new HttpParams();

    if (filters?.userId !== undefined) {
      params = params.set('user_id', filters.userId);
    }
    if (filters?.startDate) {
      params = params.set('start_date', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('end_date', filters.endDate);
    }

    return this.http.get<Activity[]>(`${this.apiUrl}/activities`, { params }).pipe(
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
