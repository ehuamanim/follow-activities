import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { Project, User, ProjectActivitiesReportEntry } from '../../../shared/models';

@Component({
  selector: 'app-activities-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activities-report.component.html'
})
export class ActivitiesReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);

  projects: Project[] = [];
  users: User[] = [];
  report: ProjectActivitiesReportEntry[] = [];
  loading = false;
  errorMessage = '';

  readonly months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  form = this.fb.group({
    project_id: [null as number | null, Validators.required],
    user_id: [null as number | null]
  });

  ngOnInit(): void {
    forkJoin({
      projects: this.projectService.getAll(),
      users: this.userService.getAll()
    }).subscribe({
      next: ({ projects, users }) => {
        this.projects = projects;
        this.users = users;
      },
      error: () => {
        this.errorMessage = 'Failed to load projects or users.';
      }
    });
  }

  loadReport(): void {
    if (this.form.invalid) return;
    const { project_id, user_id } = this.form.value;
    if (!project_id) return;

    this.loading = true;
    this.errorMessage = '';

    this.projectService.getActivitiesReport(project_id, user_id ?? undefined).subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load report.';
        this.loading = false;
      }
    });
  }

  getMonthLabel(month: number): string {
    return this.months.find(m => m.value === month)?.label ?? `Month ${month}`;
  }

  getFullName(entry: ProjectActivitiesReportEntry): string {
    return `${entry.surnames}, ${entry.name}`;
  }

  downloadExcel(): void {
    const projectName = this.projects.find(p => p.id === this.form.value.project_id)?.name ?? 'project';

    const xmlRows = this.report.map(entry => `
      <Row>
        <Cell><Data ss:Type="String">${this.escapeXml(entry.project_name)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(entry.role)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(this.getFullName(entry))}</Data></Cell>
        <Cell><Data ss:Type="Number">${entry.total_hours}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(this.getMonthLabel(entry.month))} ${entry.year}</Data></Cell>
      </Row>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Activities Report">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Project</Data></Cell>
        <Cell><Data ss:Type="String">Role</Data></Cell>
        <Cell><Data ss:Type="String">Full Name</Data></Cell>
        <Cell><Data ss:Type="String">Hours</Data></Cell>
        <Cell><Data ss:Type="String">Month</Data></Cell>
      </Row>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-report-${projectName}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
