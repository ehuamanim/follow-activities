import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { Project, TeamReportEntry } from '../../../shared/models';

@Component({
  selector: 'app-team-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './team-report.component.html'
})
export class TeamReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);

  project: Project | null = null;
  report: TeamReportEntry[] = [];
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

  readonly years: number[] = (() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - i);
  })();

  form = this.fb.group({
    month: [new Date().getMonth() + 1, Validators.required],
    year: [new Date().getFullYear(), Validators.required]
  });

  get projectId(): number {
    return parseInt(this.route.snapshot.paramMap.get('id') ?? '0', 10);
  }

  ngOnInit(): void {
    this.projectService.getById(this.projectId).subscribe({
      next: (p) => (this.project = p),
      error: () => (this.errorMessage = 'Failed to load project.')
    });
    this.loadReport();
  }

  loadReport(): void {
    const { month, year } = this.form.value;
    if (!month || !year) return;
    this.loading = true;
    this.errorMessage = '';
    this.projectService.getTeamReport(this.projectId, month, year).subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load team report.';
        this.loading = false;
      }
    });
  }

  downloadExcel(): void {
    const { month, year } = this.form.value;
    const monthLabel = this.months.find(m => m.value === month)?.label ?? `Month ${month}`;
    const projectName = this.project?.name ?? 'Project';

    const xmlRows = this.report.map(entry => `
      <Row>
        <Cell><Data ss:Type="String">${this.escapeXml(entry.name + ' ' + entry.surnames)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(entry.role)}</Data></Cell>
        <Cell><Data ss:Type="Number">${entry.total_hours}</Data></Cell>
      </Row>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Team Report">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Name</Data></Cell>
        <Cell><Data ss:Type="String">Role</Data></Cell>
        <Cell><Data ss:Type="String">Hours (${this.escapeXml(String(monthLabel))} ${year})</Data></Cell>
      </Row>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-report-${projectName}-${monthLabel}-${year}.xls`;
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
