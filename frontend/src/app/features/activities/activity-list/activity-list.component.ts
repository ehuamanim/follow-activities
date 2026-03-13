import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { Activity } from '../../../shared/models';

interface ActivityEntry {
  activity: Activity;
  date: string;
}

interface MonthGroup {
  monthKey: string;        // e.g. '2026-03'
  monthLabel: string;      // e.g. 'March 2026'
  entries: ActivityEntry[];
  totalHours: number;
}

interface UserGroup {
  userName: string;
  userId: number;
  months: MonthGroup[];
  totalHours: number;
}

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-list.component.html'
})
export class ActivityListComponent implements OnInit {
  private readonly activityService = inject(ActivityService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  activities: Activity[] = [];
  groupedActivities: UserGroup[] = [];
  loading = false;
  errorMessage = '';
  isAdministrator = false;
  deletingActivityId: number | null = null;

  ngOnInit(): void {
    this.isAdministrator = this.authService.isAdministrator();
    this.loadActivities();
  }

  loadActivities(): void {
    this.loading = true;
    this.activityService.getAll().subscribe({
      next: (data) => {
        this.activities = data;
        this.groupedActivities = this.groupActivities(data);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load activities.';
        this.loading = false;
      }
    });
  }

  private groupActivities(activities: Activity[]): UserGroup[] {
    // user key -> month key -> activity[]
    const userMap = new Map<string, Map<string, Activity[]>>();
    const userIdMap = new Map<string, number>();

    for (const activity of activities) {
      const userName = activity.user_name || activity.user?.name || `User #${activity.user_id}`;
      const date = activity.activity_date || activity.created_at?.split('T')[0] || 'Unknown';
      const monthKey = date.length >= 7 ? date.substring(0, 7) : 'Unknown';

      if (!userMap.has(userName)) userMap.set(userName, new Map());
      userIdMap.set(userName, activity.user_id);
      const monthMap = userMap.get(userName)!;

      if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
      monthMap.get(monthKey)!.push(activity);
    }

    return Array.from(userMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([userName, monthMap]) => {
        const months: MonthGroup[] = Array.from(monthMap.entries())
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([monthKey, acts]) => {
            const sorted = [...acts].sort((a, b) => {
              const da = a.activity_date || a.created_at?.split('T')[0] || '';
              const db = b.activity_date || b.created_at?.split('T')[0] || '';
              return db.localeCompare(da);
            });
            const [year, month] = monthKey.split('-').map(Number);
            const monthLabel = new Date(year, month - 1, 1)
              .toLocaleString('default', { month: 'long', year: 'numeric' });
            return {
              monthKey,
              monthLabel,
              entries: sorted.map(a => ({
                activity: a,
                date: a.activity_date || a.created_at?.split('T')[0] || ''
              })),
              totalHours: sorted.reduce((sum, a) => sum + Number(a.hours), 0)
            };
          });
        return {
          userName,
          userId: userIdMap.get(userName)!,
          months,
          totalHours: months.reduce((sum, m) => sum + m.totalHours, 0)
        };
      });
  }

  navigateToCreate(): void {
    this.router.navigate(['/activities/new']);
  }

  navigateToEdit(activityId: number): void {
    this.router.navigate(['/activities', activityId, 'edit']);
  }

  deleteActivity(activityId: number): void {
    if (!this.isAdministrator || this.deletingActivityId !== null) {
      return;
    }

    const confirmed = globalThis.confirm('Are you sure you want to delete this activity?');
    if (!confirmed) {
      return;
    }

    this.deletingActivityId = activityId;
    this.errorMessage = '';

    this.activityService.delete(activityId).subscribe({
      next: () => {
        this.deletingActivityId = null;
        this.loadActivities();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete activity.';
        this.deletingActivityId = null;
      }
    });
  }
}
