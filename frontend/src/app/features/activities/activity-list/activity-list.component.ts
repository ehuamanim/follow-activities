import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActivityService } from '../../../core/services/activity.service';
import { Activity } from '../../../shared/models';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-list.component.html'
})
export class ActivityListComponent implements OnInit {
  private activityService = inject(ActivityService);
  private router = inject(Router);

  activities: Activity[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.loading = true;
    this.activityService.getAll().subscribe({
      next: (data) => {
        this.activities = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load activities.';
        this.loading = false;
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/activities/new']);
  }
}
