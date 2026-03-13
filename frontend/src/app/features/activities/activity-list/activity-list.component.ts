import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityFilters, ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { Activity, User } from '../../../shared/models';

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

interface ActivityIndicators {
  totalActivities: number;
  uniqueProjects: number;
  totalHours: number;
  totalCost: number;
}

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activity-list.component.html'
})
export class ActivityListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly activityService = inject(ActivityService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  activities: Activity[] = [];
  groupedActivities: UserGroup[] = [];
  users: User[] = [];
  loading = false;
  errorMessage = '';
  isAdministrator = false;
  deletingActivityId: number | null = null;
  indicators: ActivityIndicators = {
    totalActivities: 0,
    uniqueProjects: 0,
    totalHours: 0,
    totalCost: 0
  };

  readonly currentUser = this.authService.getCurrentUser();

  readonly filtersForm = this.fb.group({
    user_id: [null as number | null],
    start_date: [''],
    end_date: ['']
  });

  ngOnInit(): void {
    this.isAdministrator = this.authService.isAdministrator();

    if (this.isAdministrator && this.currentUser?.id) {
      this.filtersForm.patchValue({ user_id: this.currentUser.id });
      this.loadUsers();
      return;
    }

    this.loadActivities();
  }

  loadActivities(): void {
    const startDate = this.filtersForm.value.start_date || undefined;
    const endDate = this.filtersForm.value.end_date || undefined;

    if (startDate && endDate && startDate > endDate) {
      this.errorMessage = 'Initial date must be earlier than or equal to final date.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const filters: ActivityFilters = {
      startDate,
      endDate
    };

    if (this.isAdministrator && this.filtersForm.value.user_id !== null) {
      filters.userId = this.filtersForm.value.user_id;
    }

    this.activityService.getAll(filters).subscribe({
      next: (data) => {
        this.activities = data;
        this.groupedActivities = this.groupActivities(data);
        this.indicators = this.buildIndicators(data);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load activities.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.loadActivities();
  }

  downloadFilteredActivitiesExcel(): void {
    if (this.activities.length === 0) {
      return;
    }

    const rows = this.activities
      .map((activity) => {
        const date = activity.activity_date || activity.created_at?.split('T')[0] || '';
        const userName = activity.user_name || activity.user?.name || `User #${activity.user_id}`;
        const projectName = activity.project_name || activity.project?.name || String(activity.project_id);
        const roleNames = activity.role_names || 'No role';
        const hours = Number(activity.hours);
        const costPerHour = Number(activity.user_cost_per_hour ?? 0);
        const totalCost = hours * costPerHour;

        return `
      <Row>
        <Cell><Data ss:Type="String">${this.escapeXml(date)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(userName)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(projectName)}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(roleNames)}</Data></Cell>
        <Cell><Data ss:Type="Number">${hours}</Data></Cell>
        <Cell><Data ss:Type="Number">${costPerHour}</Data></Cell>
        <Cell><Data ss:Type="Number">${totalCost}</Data></Cell>
        <Cell><Data ss:Type="String">${this.escapeXml(activity.tasks || '')}</Data></Cell>
      </Row>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Activities">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">User</Data></Cell>
        <Cell><Data ss:Type="String">Project</Data></Cell>
        <Cell><Data ss:Type="String">Role</Data></Cell>
        <Cell><Data ss:Type="String">Hours</Data></Cell>
        <Cell><Data ss:Type="String">User Cost Per Hour</Data></Cell>
        <Cell><Data ss:Type="String">Total Cost</Data></Cell>
        <Cell><Data ss:Type="String">Tasks</Data></Cell>
      </Row>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activities-filtered-report.xls';
    a.click();
    URL.revokeObjectURL(url);
  }

  clearDateFilters(): void {
    this.filtersForm.patchValue({ start_date: '', end_date: '' });
    this.loadActivities();
  }

  resetFilters(): void {
    this.filtersForm.patchValue({
      user_id: this.isAdministrator ? (this.currentUser?.id ?? null) : null,
      start_date: '',
      end_date: ''
    });
    this.loadActivities();
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

  private buildIndicators(activities: Activity[]): ActivityIndicators {
    const projectKeys = new Set(
      activities.map(activity => activity.project_name || String(activity.project_id))
    );

    return {
      totalActivities: activities.length,
      uniqueProjects: projectKeys.size,
      totalHours: activities.reduce((sum, activity) => sum + Number(activity.hours), 0),
      totalCost: activities.reduce(
        (sum, activity) => sum + (Number(activity.hours) * Number(activity.user_cost_per_hour ?? 0)),
        0
      )
    };
  }

  private loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loadActivities();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load users.';
      }
    });
  }

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
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
