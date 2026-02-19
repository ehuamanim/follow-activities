import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ActivityListComponent } from './features/activities/activity-list/activity-list.component';
import { ActivityFormComponent } from './features/activities/activity-form/activity-form.component';
import { ProjectListComponent } from './features/projects/project-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'activities', component: ActivityListComponent },
      { path: 'activities/new', component: ActivityFormComponent },
      { path: 'projects', component: ProjectListComponent }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
