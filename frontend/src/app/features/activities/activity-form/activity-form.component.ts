import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  private fb = inject(FormBuilder);
  private activityService = inject(ActivityService);
  private projectService = inject(ProjectService);
  private router = inject(Router);

  form = this.fb.group({
    project_id: ['', Validators.required],
    hours: [null as number | null, [Validators.required, Validators.min(0.5)]],
    tasks: ['', Validators.required]
  });

  projects: Project[] = [];
  loading = false;
  submitting = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loading = true;
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load projects.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting = true;
    this.errorMessage = '';

    const { project_id, hours, tasks } = this.form.value;
    this.activityService.create({
      project_id: Number(project_id),
      hours: hours!,
      tasks: tasks!
    }).subscribe({
      next: () => this.router.navigate(['/activities']),
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to create activity.';
        this.submitting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/activities']);
  }
}
