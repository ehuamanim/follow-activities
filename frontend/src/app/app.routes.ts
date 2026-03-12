import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { profileGuard } from './core/guards/profile.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ActivityListComponent } from './features/activities/activity-list/activity-list.component';
import { ActivityFormComponent } from './features/activities/activity-form/activity-form.component';
import { ProjectListComponent } from './features/projects/project-list.component';
import { TeamReportComponent } from './features/projects/team-report/team-report.component';
import { ActivitiesReportComponent } from './features/reports/activities-report/activities-report.component';
import { UserAdminComponent } from './features/users/user-admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'activities', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [profileGuard],
        data: { profiles: ['Administrator'] }
      },
      { path: 'activities', component: ActivityListComponent },
      { path: 'activities/new', component: ActivityFormComponent },
      { path: 'projects', component: ProjectListComponent },
      {
        path: 'projects/:id/team-report',
        component: TeamReportComponent,
        canActivate: [profileGuard],
        data: { profiles: ['Administrator'] }
      },
      {
        path: 'reports/activities',
        component: ActivitiesReportComponent,
        canActivate: [profileGuard],
        data: { profiles: ['Administrator'] }
      },
      {
        path: 'users',
        component: UserAdminComponent,
        canActivate: [profileGuard],
        data: { profiles: ['Administrator'] }
      },
      {
        path: 'users/new',
        component: RegisterComponent,
        canActivate: [profileGuard],
        data: { profiles: ['Administrator'] }
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
