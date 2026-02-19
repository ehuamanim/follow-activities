import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardData } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getHoursByTeam(period: string): Observable<DashboardData[]> {
    return this.http.get<DashboardData[]>(`${this.apiUrl}/dashboard/hours-by-team`, {
      params: { period }
    }).pipe(catchError(err => throwError(() => err)));
  }

  getHoursByProject(period: string): Observable<DashboardData[]> {
    return this.http.get<DashboardData[]>(`${this.apiUrl}/dashboard/hours-by-project`, {
      params: { period }
    }).pipe(catchError(err => throwError(() => err)));
  }

  getHoursByRole(period: string): Observable<DashboardData[]> {
    return this.http.get<DashboardData[]>(`${this.apiUrl}/dashboard/hours-by-role`, {
      params: { period }
    }).pipe(catchError(err => throwError(() => err)));
  }
}
