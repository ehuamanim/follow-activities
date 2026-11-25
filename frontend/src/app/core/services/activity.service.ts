import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity } from '../../shared/models';

export interface ActivityFilters {
  userId?: number;
  startDate?: string;
  endDate?: string;
  projectId?: number;
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
    if (filters?.projectId !== undefined) {
      params = params.set('project_id', filters.projectId);
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

  copyPrevious(): Observable<Partial<Activity>> {
    return this.http.get<Partial<Activity>>(`${this.apiUrl}/activities/copy-previous`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  bulkCreate(items: Array<Partial<Activity>>): Observable<{ created: Activity[]; errors: Array<{ index: number; message: string }> }> {
    return this.http.post<{ created: Activity[]; errors: Array<{ index: number; message: string }> }>(
      `${this.apiUrl}/activities/bulk`,
      { items }
    ).pipe(catchError(err => throwError(() => err)));
  }

  reminderStatus(): Observable<{ enabled: boolean; missingDays: string[] }> {
    return this.http.get<{ enabled: boolean; missingDays: string[] }>(
      `${this.apiUrl}/activities/reminder-status`
    ).pipe(catchError(err => throwError(() => err)));
  }

  downloadServerExcel(filters?: ActivityFilters & { projectIds?: number[] }): Observable<Blob> {
    let params = new HttpParams();
    if (filters?.userId !== undefined) params = params.set('user_id', filters.userId);
    if (filters?.startDate) params = params.set('start_date', filters.startDate);
    if (filters?.endDate) params = params.set('end_date', filters.endDate);
    if (filters?.projectIds?.length) params = params.set('project_ids', filters.projectIds.join(','));
    return this.http.get(`${this.apiUrl}/exports/activities.xlsx`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(err => throwError(() => err)));
  }
}
