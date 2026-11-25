import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartEvent } from 'chart.js';
import { forkJoin } from 'rxjs';
import { CompareRow, DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  period = 'month';
  useCustomRange = false;
  startDate = '';
  endDate = '';
  loading = false;
  errorMessage = '';

  teamTotal = 0;
  projectTotal = 0;
  roleTotal = 0;
  teamRaw: DashboardData[] = [];
  projectRaw: DashboardData[] = [];
  roleRaw: DashboardData[] = [];

  aStart = '';
  aEnd = '';
  bStart = '';
  bEnd = '';
  compareRows: CompareRow[] = [];

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    onClick: (_event: ChartEvent, elements, chart) => {
      if (!elements.length) return;
      const index = elements[0].index;
      const datasetLabel = (chart.data.datasets[0] as { metaKey?: string }).metaKey;
      this.onBarClick(datasetLabel || 'project', index);
    }
  };

  teamChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], backgroundColor: '#3b82f6' }] };
  projectChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], backgroundColor: '#10b981' }] };
  roleChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], backgroundColor: '#f59e0b' }] };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    const range = this.useCustomRange && this.startDate && this.endDate
      ? { startDate: this.startDate, endDate: this.endDate }
      : { period: this.period };

    forkJoin({
      team: this.dashboardService.getHoursByTeam(range),
      project: this.dashboardService.getHoursByProject(range),
      role: this.dashboardService.getHoursByRole(range)
    }).subscribe({
      next: ({ team, project, role }) => {
        this.teamRaw = team;
        this.projectRaw = project;
        this.roleRaw = role;
        this.teamTotal = team.reduce((s, d) => s + Number(d.hours), 0);
        this.projectTotal = project.reduce((s, d) => s + Number(d.hours), 0);
        this.roleTotal = role.reduce((s, d) => s + Number(d.hours), 0);
        this.teamChartData = this.toChartData(team, '#3b82f6', 'user');
        this.projectChartData = this.toChartData(project, '#10b981', 'project');
        this.roleChartData = this.toChartData(role, '#f59e0b', 'role');
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el dashboard.';
        this.loading = false;
      }
    });
  }

  onPeriodChange(): void {
    this.useCustomRange = false;
    this.loadData();
  }

  applyCustomRange(): void {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Indica rango de fechas.';
      return;
    }
    this.useCustomRange = true;
    this.loadData();
  }

  loadCompare(): void {
    if (!this.aStart || !this.aEnd || !this.bStart || !this.bEnd) {
      this.errorMessage = 'Completa ambos periodos para comparar.';
      return;
    }
    this.dashboardService.comparePeriods(this.aStart, this.aEnd, this.bStart, this.bEnd).subscribe({
      next: (rows) => { this.compareRows = rows; },
      error: () => { this.errorMessage = 'No se pudo comparar periodos.'; }
    });
  }

  private onBarClick(kind: string, index: number): void {
    const query: Record<string, string> = {};
    if (this.useCustomRange) {
      query['start_date'] = this.startDate;
      query['end_date'] = this.endDate;
    }
    if (kind === 'user' && this.teamRaw[index]?.id) {
      query['user_id'] = String(this.teamRaw[index].id);
    }
    if (kind === 'project' && this.projectRaw[index]?.id) {
      query['project_id'] = String(this.projectRaw[index].id);
    }
    void this.router.navigate(['/activities'], { queryParams: query });
  }

  private toChartData(data: DashboardData[], backgroundColor: string, metaKey: string): ChartData<'bar'> {
    return {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.hours), backgroundColor, label: 'Hours', metaKey } as never]
    };
  }
}
