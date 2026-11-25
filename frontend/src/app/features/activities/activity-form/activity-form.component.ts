import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { ProjectService } from '../../../core/services/project.service';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityAttachment, ActivityComment, Project } from '../../../shared/models';
import { FechaPePipe } from '../../../shared/pipes/fecha-pe.pipe';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FechaPePipe],
  templateUrl: './activity-form.component.html'
})
export class ActivityFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly activityService = inject(ActivityService);
  private readonly projectService = inject(ProjectService);
  private readonly collaborationService = inject(CollaborationService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  form = this.fb.group({
    project_id: ['', Validators.required],
    activity_date: [new Date().toISOString().split('T')[0], Validators.required],
    hours: [null as number | null, [Validators.required, Validators.min(0.5)]],
    tasks: ['', Validators.required]
  });

  projects: Project[] = [];
  comments: ActivityComment[] = [];
  attachments: ActivityAttachment[] = [];
  newComment = '';
  loading = false;
  submitting = false;
  errorMessage = '';
  isEditMode = false;
  activityId: number | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam ? Number(idParam) : Number.NaN;
    if (!Number.isNaN(parsedId)) {
      this.isEditMode = true;
      this.activityId = parsedId;
    }

    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('hours')) this.form.patchValue({ hours: Number(qp.get('hours')) });
    if (qp.get('project_id')) this.form.patchValue({ project_id: qp.get('project_id')! });
    if (qp.get('tasks')) this.form.patchValue({ tasks: qp.get('tasks')! });

    this.loading = true;
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        if (!this.isEditMode && data.length === 1) {
          this.form.patchValue({ project_id: String(data[0].id) });
        }
        if (this.isEditMode && this.activityId !== null) {
          this.loadActivity(this.activityId);
          this.loadCollaboration(this.activityId);
          return;
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar proyectos.';
        this.loading = false;
      }
    });
  }

  copyPrevious(): void {
    this.activityService.copyPrevious().subscribe({
      next: (prev) => {
        this.form.patchValue({
          project_id: String(prev.project_id || ''),
          hours: Number(prev.hours || 0),
          tasks: prev.tasks || '',
          activity_date: new Date().toISOString().split('T')[0]
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No hay actividad previa para copiar.';
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    const { project_id, activity_date, hours, tasks } = this.form.value;
    const payload = {
      project_id: Number(project_id),
      activity_date: activity_date!,
      hours: hours!,
      tasks: tasks!
    };
    const request$ = this.isEditMode && this.activityId !== null
      ? this.activityService.update(this.activityId, payload)
      : this.activityService.create(payload);

    request$.subscribe({
      next: () => void this.router.navigate(['/activities']),
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo guardar.';
        this.submitting = false;
      }
    });
  }

  addComment(): void {
    if (!this.activityId || !this.newComment.trim()) return;
    this.collaborationService.createComment(this.activityId, this.newComment.trim()).subscribe({
      next: () => {
        this.newComment = '';
        this.loadCollaboration(this.activityId!);
      },
      error: (err) => (this.errorMessage = err?.error?.message || 'No se pudo comentar.')
    });
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.activityId) return;
    this.collaborationService.uploadAttachment(this.activityId, file).subscribe({
      next: () => this.loadCollaboration(this.activityId!),
      error: (err) => (this.errorMessage = err?.error?.message || 'No se pudo subir el archivo.')
    });
  }

  downloadAttachment(att: ActivityAttachment): void {
    if (!this.activityId) return;
    const token = this.authService.getToken();
    const url = this.collaborationService.downloadUrl(this.activityId, att.id);
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = att.original_name;
        a.click();
      })
      .catch(() => (this.errorMessage = 'No se pudo descargar el adjunto.'));
  }

  private loadActivity(id: number): void {
    this.activityService.getById(id).subscribe({
      next: (activity) => {
        this.form.patchValue({
          project_id: String(activity.project_id),
          activity_date: (activity.activity_date || '').split('T')[0],
          hours: Number(activity.hours),
          tasks: activity.tasks
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo cargar la actividad.';
        this.loading = false;
      }
    });
  }

  private loadCollaboration(id: number): void {
    this.collaborationService.listComments(id).subscribe({ next: (c) => (this.comments = c) });
    this.collaborationService.listAttachments(id).subscribe({ next: (a) => (this.attachments = a) });
  }

  cancel(): void {
    void this.router.navigate(['/activities']);
  }
}
