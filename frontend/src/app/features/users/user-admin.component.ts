import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Role, User, UserProfile } from '../../shared/models';
import { UpdateUserRequest, UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-admin.component.html',
})
export class UserAdminComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  users: User[] = [];
  roles: Role[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  editingUserId: number | null = null;
  passwordUserId: number | null = null;

  readonly profiles: UserProfile[] = ['Operator', 'Administrator'];

  editForm = this.fb.group({
    name: ['', Validators.required],
    surnames: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    profile: ['Operator' as UserProfile, Validators.required],
    cost_per_hour: [0, [Validators.required, Validators.min(0)]],
    role_ids: [[] as number[]],
  });

  passwordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.userService.getAll(),
      roles: this.userService.getRoles(),
    }).subscribe({
      next: ({ users, roles }) => {
        this.users = users;
        this.roles = roles;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load users data.';
        this.loading = false;
      },
    });
  }

  startEdit(user: User): void {
    this.editingUserId = user.id;
    this.passwordUserId = null;
    this.successMessage = '';
    this.errorMessage = '';

    const selectedRoleIds = (user.roles || []).map((r) => r.id);
    this.editForm.reset({
      name: user.name || '',
      surnames: user.surnames || '',
      email: user.email,
      profile: user.profile,
      cost_per_hour: user.cost_per_hour ?? 0,
      role_ids: selectedRoleIds,
    });
  }

  cancelEdit(): void {
    this.editingUserId = null;
  }

  onEditRoleChange(event: Event, roleId: number): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = (this.editForm.get('role_ids')?.value as number[]) || [];
    if (checked) {
      this.editForm.patchValue({ role_ids: [...current, roleId] });
    } else {
      this.editForm.patchValue({ role_ids: current.filter((id) => id !== roleId) });
    }
  }

  saveEdit(): void {
    if (this.editingUserId === null || this.editForm.invalid) {
      return;
    }

    const payload = this.editForm.value as UpdateUserRequest;
    this.userService.update(this.editingUserId, {
      name: payload.name,
      surnames: payload.surnames,
      email: payload.email,
      profile: payload.profile,
      cost_per_hour: payload.cost_per_hour,
      role_ids: payload.role_ids || [],
    }).subscribe({
      next: () => {
        this.successMessage = 'User updated successfully.';
        this.editingUserId = null;
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to update user.';
      },
    });
  }

  openPasswordDialog(userId: number): void {
    this.passwordUserId = userId;
    this.editingUserId = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordForm.reset({ password: '', confirmPassword: '' });
  }

  cancelPasswordDialog(): void {
    this.passwordUserId = null;
  }

  savePassword(): void {
    if (this.passwordUserId === null || this.passwordForm.invalid) {
      return;
    }

    const { password, confirmPassword } = this.passwordForm.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.userService.changePassword(this.passwordUserId, password as string).subscribe({
      next: () => {
        this.successMessage = 'Password changed successfully.';
        this.passwordUserId = null;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to change password.';
      },
    });
  }

  deleteUser(userId: number): void {
    const confirmed = globalThis.confirm('Are you sure you want to delete this user?');
    if (!confirmed) {
      return;
    }

    this.userService.delete(userId).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully.';
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete user.';
      },
    });
  }

  hasRole(roleId: number): boolean {
    const current = (this.editForm.get('role_ids')?.value as number[]) || [];
    return current.includes(roleId);
  }
}
