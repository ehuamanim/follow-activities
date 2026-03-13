import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectCostReportEntry } from '../../../shared/models';

@Component({
  selector: 'app-project-cost-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-cost-report.component.html'
})
export class ProjectCostReportComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);

  projects: Project[] = [];
  report: ProjectCostReportEntry[] = [];
  loading = false;
  errorMessage = '';

  readonly form = this.fb.group({
    project_id: [null as number | null],
    start_date: [''],
    end_date: ['']
  });

  ngOnInit(): void {
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load projects.';
      }
    });
  }

  loadReport(): void {
    const { project_id, start_date, end_date } = this.form.value;

    if (start_date && end_date && start_date > end_date) {
      this.errorMessage = 'Initial date must be earlier than or equal to final date.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.projectService.getCostReport(project_id ?? undefined, start_date || undefined, end_date || undefined).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load cost report.';
        this.loading = false;
      }
    });
  }

  resetFilters(): void {
    this.form.reset({ project_id: null, start_date: '', end_date: '' });
    this.report = [];
    this.errorMessage = '';
  }

  get totalHours(): number {
    return this.report.reduce((sum, entry) => sum + Number(entry.total_hours), 0);
  }

  get totalCost(): number {
    return this.report.reduce((sum, entry) => sum + Number(entry.total_cost), 0);
  }
}