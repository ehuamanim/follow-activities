import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { Activity } from '../../../shared/models';
import { FechaPePipe } from '../../../shared/pipes/fecha-pe.pipe';

@Component({
  selector: 'app-activity-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink, FechaPePipe],
  templateUrl: './activity-calendar.component.html'
})
export class ActivityCalendarComponent implements OnInit {
  private activityService = inject(ActivityService);

  year = new Date().getFullYear();
  month = new Date().getMonth(); // 0-based
  loading = false;
  errorMessage = '';
  byDay = new Map<string, Activity[]>();
  days: Array<{ date: string; inMonth: boolean; activities: Activity[] }> = [];

  ngOnInit(): void {
    this.load();
  }

  prev(): void {
    if (this.month === 0) {
      this.month = 11;
      this.year -= 1;
    } else {
      this.month -= 1;
    }
    this.load();
  }

  next(): void {
    if (this.month === 11) {
      this.month = 0;
      this.year += 1;
    } else {
      this.month += 1;
    }
    this.load();
  }

  get monthLabel(): string {
    return new Date(this.year, this.month, 1).toLocaleString('es-PE', { month: 'long', year: 'numeric' });
  }

  private load(): void {
    const start = `${this.year}-${String(this.month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(this.year, this.month + 1, 0);
    const end = `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    this.loading = true;
    this.activityService.getAll({ startDate: start, endDate: end }).subscribe({
      next: (activities) => {
        this.byDay.clear();
        for (const a of activities) {
          const key = (a.activity_date || '').split('T')[0];
          if (!this.byDay.has(key)) this.byDay.set(key, []);
          this.byDay.get(key)!.push(a);
        }
        this.buildGrid();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el calendario.';
        this.loading = false;
      }
    });
  }

  private buildGrid(): void {
    const first = new Date(this.year, this.month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const cells: Array<{ date: string; inMonth: boolean; activities: Activity[] }> = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ date: '', inMonth: false, activities: [] });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date, inMonth: true, activities: this.byDay.get(date) || [] });
    }
    this.days = cells;
  }
}
