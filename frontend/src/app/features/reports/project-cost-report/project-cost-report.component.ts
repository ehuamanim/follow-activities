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
  selectedProjectIds: number[] = [];
  report: ProjectCostReportEntry[] = [];
  loading = false;
  errorMessage = '';

  readonly form = this.fb.group({
    start_date: [''],
    end_date: ['']
  });

  ngOnInit(): void {
    this.projectService.getAll(true).subscribe({
      next: (projects) => { this.projects = projects; },
      error: (err) => { this.errorMessage = err?.error?.message || 'No se pudieron cargar proyectos.'; }
    });
  }

  toggleProject(id: number, checked: boolean): void {
    if (checked) {
      this.selectedProjectIds = [...this.selectedProjectIds, id];
    } else {
      this.selectedProjectIds = this.selectedProjectIds.filter((x) => x !== id);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedProjectIds.includes(id);
  }

  loadReport(): void {
    const { start_date, end_date } = this.form.value;
    if (start_date && end_date && start_date > end_date) {
      this.errorMessage = 'La fecha inicial debe ser menor o igual a la final.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.projectService.getCostReport({
      projectIds: this.selectedProjectIds.length ? this.selectedProjectIds : undefined,
      startDate: start_date || undefined,
      endDate: end_date || undefined
    }).subscribe({
      next: (report) => {
        this.report = report;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo cargar el reporte.';
        this.loading = false;
      }
    });
  }

  downloadExcel(): void {
    const { start_date, end_date } = this.form.value;
    this.projectService.downloadCostExcel({
      projectIds: this.selectedProjectIds.length ? this.selectedProjectIds : undefined,
      startDate: start_date || undefined,
      endDate: end_date || undefined
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'costos-proyecto.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.errorMessage = 'No se pudo descargar el Excel.'; }
    });
  }

  resetFilters(): void {
    this.form.reset({ start_date: '', end_date: '' });
    this.selectedProjectIds = [];
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
