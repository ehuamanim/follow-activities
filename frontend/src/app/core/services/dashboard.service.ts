import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardData } from '../../shared/models';

export interface DashboardRange {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export interface CompareRow {
  project_id: number;
  project_name: string;
  hours_a: number;
  hours_b: number;
  delta: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private buildParams(range: DashboardRange): HttpParams {
    let params = new HttpParams();
    if (range.startDate && range.endDate) {
      params = params.set('start_date', range.startDate).set('end_date', range.endDate);
    } else if (range.period) {
      params = params.set('period', range.period);
    }
    return params;
  }

  getHoursByTeam(range: DashboardRange): Observable<DashboardData[]> {
    return this.http.get<DashboardData[]>(`${this.apiUrl}/dashboard/hours-by-team`, {
      params: this.buildParams(range)
    }).pipe(catchError(err => throwError(() => err)));
  }

  getHoursByProject(range: DashboardRange): Observable<DashboardData[]> {
    return this.http.get<DashboardData[]>(`${this.apiUrl}/dashboard/hours-by-project`, {
      params: this.buildParams(range)
    }).pipe(catchError(err => throwError(() => err)));
  }

  getHoursByRole(range: DashboardRange): Observable<DashboardData[]> {
    return this.http.get<DashboardData[]>(`${this.apiUrl}/dashboard/hours-by-role`, {
      params: this.buildParams(range)
    }).pipe(catchError(err => throwError(() => err)));
  }

  comparePeriods(aStart: string, aEnd: string, bStart: string, bEnd: string): Observable<CompareRow[]> {
    return this.http.get<CompareRow[]>(`${this.apiUrl}/dashboard/compare`, {
      params: {
        a_start: aStart,
        a_end: aEnd,
        b_start: bStart,
        b_end: bEnd
      }
    }).pipe(catchError(err => throwError(() => err)));
  }
}
