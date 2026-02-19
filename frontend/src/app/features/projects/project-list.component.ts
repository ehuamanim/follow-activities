import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../shared/models';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);

  projects: Project[] = [];
  loading = false;
  submitting = false;
  errorMessage = '';
  showForm = false;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    status: ['active', Validators.required]
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load projects.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting = true;
    this.errorMessage = '';

    const { name, description, status } = this.form.value;
    this.projectService.create({ name: name!, description: description || '', status: status! }).subscribe({
      next: (project) => {
        this.projects = [...this.projects, project];
        this.form.reset({ status: 'active' });
        this.showForm = false;
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to create project.';
        this.submitting = false;
      }
    });
  }
}
