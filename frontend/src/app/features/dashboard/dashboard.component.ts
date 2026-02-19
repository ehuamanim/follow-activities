import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  period = 'month';
  loading = false;
  errorMessage = '';

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
  } as ChartConfiguration<'bar'>['options'] & { maxHeight: number };

  teamChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], backgroundColor: '#3b82f6' }] };
  projectChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], backgroundColor: '#10b981' }] };
  roleChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], backgroundColor: '#f59e0b' }] };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      team: this.dashboardService.getHoursByTeam(this.period),
      project: this.dashboardService.getHoursByProject(this.period),
      role: this.dashboardService.getHoursByRole(this.period)
    }).subscribe({
      next: ({ team, project, role }) => {

        this.teamChartData = this.toChartData(team, '#3b82f6');
        this.projectChartData = this.toChartData(project, '#10b981');
        this.roleChartData = this.toChartData(role, '#f59e0b');
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load dashboard data.';
        this.loading = false;
      }
    });
  }

  private toChartData(data: DashboardData[], backgroundColor: string): ChartData<'bar'> {
    return {
      labels: data.map(d => d.label),
      datasets: [{ data: data.map(d => d.hours), backgroundColor, label: 'Hours' }]
    };
  }

  onPeriodChange(): void {
    this.loadData();
  }
}
