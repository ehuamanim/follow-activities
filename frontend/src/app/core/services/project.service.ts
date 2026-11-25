import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Project,
  ProjectMember,
  TeamReportEntry,
  ProjectActivitiesReportEntry,
  ProjectCostReportEntry
} from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getAll(includeArchived = false): Observable<Project[]> {
    let params = new HttpParams();
    if (includeArchived) {
      params = params.set('include_archived', 'true');
    }
    return this.http.get<Project[]>(`${this.apiUrl}/projects`, { params }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  create(data: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  update(id: number, data: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, data).pipe(
      catchError(err => throwError(() => err))
    );
  }

  archive(id: number): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/projects/${id}/archive`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getMembers(projectId: number): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`${this.apiUrl}/projects/${projectId}/members`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  addMember(projectId: number, userId: number): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(`${this.apiUrl}/projects/${projectId}/members`, {
      user_id: userId
    }).pipe(catchError(err => throwError(() => err)));
  }

  removeMember(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}/members/${userId}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getTeamReport(projectId: number, month: number, year: number): Observable<TeamReportEntry[]> {
    return this.http
      .get<TeamReportEntry[]>(
        `${this.apiUrl}/projects/${projectId}/team-report?month=${month}&year=${year}`
      )
      .pipe(catchError(err => throwError(() => err)));
  }

  getActivitiesReport(projectId: number, userId?: number): Observable<ProjectActivitiesReportEntry[]> {
    const params = userId ? `?user_id=${userId}` : '';
    return this.http
      .get<ProjectActivitiesReportEntry[]>(
        `${this.apiUrl}/projects/${projectId}/activities-report${params}`
      )
      .pipe(catchError(err => throwError(() => err)));
  }

  getCostReport(options?: {
    projectId?: number;
    projectIds?: number[];
    startDate?: string;
    endDate?: string;
  }): Observable<ProjectCostReportEntry[]> {
    let params = new HttpParams();
    if (options?.projectId !== undefined) params = params.set('project_id', options.projectId);
    if (options?.projectIds?.length) params = params.set('project_ids', options.projectIds.join(','));
    if (options?.startDate) params = params.set('start_date', options.startDate);
    if (options?.endDate) params = params.set('end_date', options.endDate);

    return this.http
      .get<ProjectCostReportEntry[]>(`${this.apiUrl}/projects/cost-report`, { params })
      .pipe(catchError(err => throwError(() => err)));
  }

  downloadCostExcel(options?: {
    projectIds?: number[];
    startDate?: string;
    endDate?: string;
  }): Observable<Blob> {
    let params = new HttpParams();
    if (options?.projectIds?.length) params = params.set('project_ids', options.projectIds.join(','));
    if (options?.startDate) params = params.set('start_date', options.startDate);
    if (options?.endDate) params = params.set('end_date', options.endDate);
    return this.http.get(`${this.apiUrl}/exports/costs.xlsx`, {
      params,
      responseType: 'blob'
    }).pipe(catchError(err => throwError(() => err)));
  }
}
