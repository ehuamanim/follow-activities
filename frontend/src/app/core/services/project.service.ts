import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, TeamReportEntry } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`).pipe(
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

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`).pipe(
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
}
