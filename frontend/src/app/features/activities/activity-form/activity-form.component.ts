import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../shared/models';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activity-form.component.html'
})
export class ActivityFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly activityService = inject(ActivityService);
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  form = this.fb.group({
    project_id: ['', Validators.required],
    activity_date: [new Date().toISOString().split('T')[0], Validators.required],
    hours: [null as number | null, [Validators.required, Validators.min(0.5)]],
    cost_per_hour: [null as number | null, [Validators.required, Validators.min(0)]],
    tasks: ['', Validators.required]
  });

  projects: Project[] = [];
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

    this.loading = true;
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        if (!this.isEditMode && data.length === 1) {
          this.form.patchValue({ project_id: String(data[0].id) });
        }

        if (this.isEditMode && this.activityId !== null) {
          this.loadActivity(this.activityId);
          return;
        }

        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load projects.';
        this.loading = false;
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

    const { project_id, activity_date, hours, cost_per_hour, tasks } = this.form.value;
    const payload = {
      project_id: Number(project_id),
      activity_date: activity_date!,
      hours: hours!,
      cost_per_hour: cost_per_hour!,
      tasks: tasks!
    };

    const request$ = this.isEditMode && this.activityId !== null
      ? this.activityService.update(this.activityId, payload)
      : this.activityService.create(payload);

    request$.subscribe({
      next: () => {
        void this.router.navigate(['/activities']);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || (this.isEditMode
          ? 'Failed to update activity.'
          : 'Failed to create activity.');
        this.submitting = false;
      }
    });
  }

  private loadActivity(id: number): void {
    this.activityService.getById(id).subscribe({
      next: (activity) => {
        this.form.patchValue({
          project_id: String(activity.project_id),
          activity_date: (activity.activity_date || '').split('T')[0],
          hours: Number(activity.hours),
          cost_per_hour: Number(activity.cost_per_hour),
          tasks: activity.tasks
        });
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load activity.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/activities']);
  }
}
