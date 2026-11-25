import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Project, ProjectMember, User } from '../../shared/models';
import { FechaPePipe } from '../../shared/pipes/fecha-pe.pipe';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, FechaPePipe],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  projects: Project[] = [];
  users: User[] = [];
  members: ProjectMember[] = [];
  selectedProject: Project | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  showForm = false;
  editingId: number | null = null;
  memberUserId: number | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    status: ['active', Validators.required],
    budget_hours: [0, [Validators.min(0)]],
    budget_cost: [0, [Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadProjects();
    if (this.isAdministrator) {
      this.userService.getAll().subscribe({ next: (u) => (this.users = u) });
    }
  }

  get isAdministrator(): boolean {
    return this.authService.isAdministrator();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getAll(this.isAdministrator).subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudieron cargar proyectos.';
        this.loading = false;
      }
    });
  }

  startCreate(): void {
    this.editingId = null;
    this.showForm = true;
    this.form.reset({ status: 'active', budget_hours: 0, budget_cost: 0, name: '', description: '' });
  }

  startEdit(project: Project): void {
    this.editingId = project.id;
    this.showForm = true;
    this.form.patchValue({
      name: project.name,
      description: project.description || '',
      status: project.status,
      budget_hours: Number(project.budget_hours || 0),
      budget_cost: Number(project.budget_cost || 0)
    });
  }

  onSubmit(): void {
    if (!this.isAdministrator || this.form.invalid) return;
    this.submitting = true;
    this.errorMessage = '';
    const value = this.form.value;
    const payload = {
      name: value.name!,
      description: value.description || '',
      status: value.status!,
      budget_hours: Number(value.budget_hours || 0),
      budget_cost: Number(value.budget_cost || 0)
    };

    const req$ = this.editingId
      ? this.projectService.update(this.editingId, payload)
      : this.projectService.create(payload);

    req$.subscribe({
      next: () => {
        this.showForm = false;
        this.editingId = null;
        this.submitting = false;
        this.loadProjects();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo guardar el proyecto.';
        this.submitting = false;
      }
    });
  }

  archive(project: Project): void {
    if (!confirm(`¿Archivar proyecto "${project.name}"?`)) return;
    this.projectService.archive(project.id).subscribe({
      next: () => this.loadProjects(),
      error: (err) => (this.errorMessage = err?.error?.message || 'No se pudo archivar.')
    });
  }

  openMembers(project: Project): void {
    this.selectedProject = project;
    this.projectService.getMembers(project.id).subscribe({
      next: (members) => (this.members = members),
      error: (err) => (this.errorMessage = err?.error?.message || 'No se pudieron cargar miembros.')
    });
  }

  addMember(): void {
    if (!this.selectedProject || !this.memberUserId) return;
    this.projectService.addMember(this.selectedProject.id, this.memberUserId).subscribe({
      next: () => {
        this.memberUserId = null;
        this.openMembers(this.selectedProject!);
      },
      error: (err) => (this.errorMessage = err?.error?.message || 'No se pudo agregar miembro.')
    });
  }

  removeMember(userId: number): void {
    if (!this.selectedProject) return;
    this.projectService.removeMember(this.selectedProject.id, userId).subscribe({
      next: () => this.openMembers(this.selectedProject!),
      error: (err) => (this.errorMessage = err?.error?.message || 'No se pudo quitar miembro.')
    });
  }

  budgetPct(project: Project, kind: 'hours' | 'cost'): number {
    const budget = Number(kind === 'hours' ? project.budget_hours : project.budget_cost) || 0;
    const actual = Number(kind === 'hours' ? project.actual_hours : project.actual_cost) || 0;
    if (budget <= 0) return 0;
    return Math.min(100, Math.round((actual / budget) * 100));
  }
}
