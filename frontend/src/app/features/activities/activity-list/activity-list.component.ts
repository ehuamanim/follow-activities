import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActivityFilters, ActivityService } from '../../../core/services/activity.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { TimerService } from '../../../core/services/timer.service';
import { Activity, User } from '../../../shared/models';
import { FechaPePipe } from '../../../shared/pipes/fecha-pe.pipe';
import { formatFechaPe } from '../../../shared/utils/fecha';

interface ActivityEntry {
  activity: Activity;
  date: string;
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
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

const PAGE_SIZE = 20;

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FechaPePipe],
  templateUrl: './activity-list.component.html'
})
export class ActivityListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly activityService = inject(ActivityService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly timerService = inject(TimerService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  activities: Activity[] = [];
  groupedActivities: UserGroup[] = [];
  pagedGroups: UserGroup[] = [];
  users: User[] = [];
  loading = false;
  errorMessage = '';
  isAdministrator = false;
  deletingActivityId: number | null = null;
  page = 1;
  totalPages = 1;
  reminderDays: string[] = [];
  remindersEnabled = false;
  timerRunning = false;
  bulkMessage = '';

  indicators: ActivityIndicators = {
    totalActivities: 0,
    uniqueProjects: 0,
    totalHours: 0,
    totalCost: 0
  };

  readonly currentUser = this.authService.getCurrentUser();
  readonly pageSize = PAGE_SIZE;

  readonly filtersForm = this.fb.group({
    user_id: [null as number | null],
    start_date: [''],
    end_date: ['']
  });

  ngOnInit(): void {
    this.isAdministrator = this.authService.isAdministrator();
    this.timerRunning = this.timerService.isRunning();
    this.loadReminder();

    this.route.queryParamMap.subscribe((params) => {
      const userId = params.get('user_id');
      const start = params.get('start_date') || '';
      const end = params.get('end_date') || '';
      const page = Number(params.get('page') || '1');

      this.filtersForm.patchValue({
        user_id: userId ? Number(userId) : (this.isAdministrator ? (this.currentUser?.id ?? null) : null),
        start_date: start,
        end_date: end
      }, { emitEvent: false });

      this.page = Number.isNaN(page) || page < 1 ? 1 : page;

      if (this.isAdministrator && this.users.length === 0) {
        this.loadUsers();
        return;
      }
      this.loadActivities();
    });
  }

  loadActivities(): void {
    const startDate = this.filtersForm.value.start_date || undefined;
    const endDate = this.filtersForm.value.end_date || undefined;
    const projectIdParam = this.route.snapshot.queryParamMap.get('project_id');

    if (startDate && endDate && startDate > endDate) {
      this.errorMessage = 'La fecha inicial debe ser menor o igual a la final.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const filters: ActivityFilters = { startDate, endDate };
    if (this.isAdministrator && this.filtersForm.value.user_id !== null) {
      filters.userId = this.filtersForm.value.user_id;
    }
    if (projectIdParam) {
      filters.projectId = Number(projectIdParam);
    }

    this.activityService.getAll(filters).subscribe({
      next: (data) => {
        this.activities = data;
        this.groupedActivities = this.groupActivities(data);
        this.indicators = this.buildIndicators(data);
        this.applyPagination();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudieron cargar las actividades.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.syncQuery(1);
  }

  clearDateFilters(): void {
    this.filtersForm.patchValue({ start_date: '', end_date: '' });
    this.syncQuery(1);
  }

  resetFilters(): void {
    this.filtersForm.patchValue({
      user_id: this.isAdministrator ? (this.currentUser?.id ?? null) : null,
      start_date: '',
      end_date: ''
    });
    this.syncQuery(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.syncQuery(page);
  }

  private syncQuery(page: number): void {
    const query: Record<string, string> = { page: String(page) };
    const userId = this.filtersForm.value.user_id;
    const start = this.filtersForm.value.start_date;
    const end = this.filtersForm.value.end_date;
    if (userId !== null && userId !== undefined) query['user_id'] = String(userId);
    if (start) query['start_date'] = start;
    if (end) query['end_date'] = end;
    const projectId = this.route.snapshot.queryParamMap.get('project_id');
    if (projectId) query['project_id'] = projectId;

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: query
    });
  }

  private applyPagination(): void {
    const flat = this.flattenEntries(this.groupedActivities);
    this.totalPages = Math.max(1, Math.ceil(flat.length / PAGE_SIZE));
    if (this.page > this.totalPages) this.page = this.totalPages;
    const start = (this.page - 1) * PAGE_SIZE;
    const slice = flat.slice(start, start + PAGE_SIZE);
    this.pagedGroups = this.rebuildGroups(slice);
  }

  private flattenEntries(groups: UserGroup[]): Array<{ userName: string; userId: number; month: MonthGroup; entry: ActivityEntry }> {
    const rows: Array<{ userName: string; userId: number; month: MonthGroup; entry: ActivityEntry }> = [];
    for (const g of groups) {
      for (const m of g.months) {
        for (const e of m.entries) {
          rows.push({ userName: g.userName, userId: g.userId, month: m, entry: e });
        }
      }
    }
    return rows;
  }

  private rebuildGroups(
    rows: Array<{ userName: string; userId: number; month: MonthGroup; entry: ActivityEntry }>
  ): UserGroup[] {
    const map = new Map<string, UserGroup>();
    for (const row of rows) {
      if (!map.has(row.userName)) {
        map.set(row.userName, { userName: row.userName, userId: row.userId, months: [], totalHours: 0 });
      }
      const user = map.get(row.userName)!;
      let month = user.months.find((m) => m.monthKey === row.month.monthKey);
      if (!month) {
        month = { ...row.month, entries: [], totalHours: 0 };
        user.months.push(month);
      }
      month.entries.push(row.entry);
      month.totalHours += Number(row.entry.activity.hours);
      user.totalHours += Number(row.entry.activity.hours);
    }
    return Array.from(map.values());
  }

  downloadFilteredActivitiesExcel(): void {
    const startDate = this.filtersForm.value.start_date || undefined;
    const endDate = this.filtersForm.value.end_date || undefined;
    const filters: ActivityFilters = { startDate, endDate };
    if (this.isAdministrator && this.filtersForm.value.user_id !== null) {
      filters.userId = this.filtersForm.value.user_id ?? undefined;
    }

    this.activityService.downloadServerExcel(filters).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'actividades.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'No se pudo descargar el Excel del servidor.';
      }
    });
  }

  onBulkFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const items: Array<Partial<Activity>> = [];
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (i === 0 && /project/i.test(line)) continue;
        const [project_id, hours, activity_date, ...taskParts] = line.split(',');
        items.push({
          project_id: Number(project_id),
          hours: Number(hours),
          activity_date: activity_date || undefined,
          tasks: taskParts.join(',').replaceAll('"', '').trim()
        });
      }

      this.activityService.bulkCreate(items).subscribe({
        next: (res) => {
          this.bulkMessage = `Creadas: ${res.created.length}. Errores: ${res.errors.length}.`;
          this.loadActivities();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Error en carga masiva.';
        }
      });
    };
    reader.readAsText(file);
    input.value = '';
  }

  toggleTimer(): void {
    if (this.timerService.isRunning()) {
      const stopped = this.timerService.stop();
      this.timerRunning = false;
      if (stopped) {
        void this.router.navigate(['/activities/new'], {
          queryParams: {
            hours: stopped.hours,
            project_id: stopped.state.projectId || undefined,
            tasks: stopped.state.note || undefined
          }
        });
      }
      return;
    }
    this.timerService.start(null, '');
    this.timerRunning = true;
  }

  private loadReminder(): void {
    this.activityService.reminderStatus().subscribe({
      next: (status) => {
        this.remindersEnabled = status.enabled;
        this.reminderDays = status.missingDays.map(formatFechaPe);
      }
    });
  }

  private groupActivities(activities: Activity[]): UserGroup[] {
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
              .toLocaleString('es-PE', { month: 'long', year: 'numeric' });
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
        this.errorMessage = err?.error?.message || 'No se pudieron cargar usuarios.';
      }
    });
  }

  navigateToCreate(): void {
    void this.router.navigate(['/activities/new']);
  }

  navigateToEdit(activityId: number): void {
    void this.router.navigate(['/activities', activityId, 'edit']);
  }

  deleteActivity(activityId: number): void {
    if (!this.isAdministrator || this.deletingActivityId !== null) return;
    if (!globalThis.confirm('¿Eliminar esta actividad?')) return;

    this.deletingActivityId = activityId;
    this.activityService.delete(activityId).subscribe({
      next: () => {
        this.deletingActivityId = null;
        this.loadActivities();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo eliminar.';
        this.deletingActivityId = null;
      }
    });
  }
}
