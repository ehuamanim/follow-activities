import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityAttachment, ActivityComment, AppNotification } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listComments(activityId: number): Observable<ActivityComment[]> {
    return this.http.get<ActivityComment[]>(`${this.apiUrl}/activities/${activityId}/comments`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  createComment(activityId: number, body: string): Observable<ActivityComment> {
    return this.http.post<ActivityComment>(`${this.apiUrl}/activities/${activityId}/comments`, { body }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  listAttachments(activityId: number): Observable<ActivityAttachment[]> {
    return this.http.get<ActivityAttachment[]>(`${this.apiUrl}/activities/${activityId}/attachments`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  uploadAttachment(activityId: number, file: File): Observable<ActivityAttachment> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ActivityAttachment>(
      `${this.apiUrl}/activities/${activityId}/attachments`,
      form
    ).pipe(catchError(err => throwError(() => err)));
  }

  downloadUrl(activityId: number, attachmentId: number): string {
    return `${this.apiUrl}/activities/${activityId}/attachments/${attachmentId}/download`;
  }

  listNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${this.apiUrl}/notifications`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  markRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/${id}/read`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/notifications/read-all`, {}).pipe(
      catchError(err => throwError(() => err))
    );
  }
}
