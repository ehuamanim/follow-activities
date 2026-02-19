import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { Role } from '../../../shared/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  form = this.fb.group({
    name: ['', Validators.required],
    surnames: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role_ids: [[]]
  });

  roles: Role[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    // Optionally load available roles from API
  }

  onRoleChange(event: Event, roleId: number): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: number[] = (this.form.get('role_ids')?.value as number[]) || [];
    if (checked) {
      this.form.patchValue({ role_ids: [...current, roleId] });
    } else {
      this.form.patchValue({ role_ids: current.filter(id => id !== roleId) });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { name, surnames, email, password, role_ids } = this.form.value;
    this.authService.register({
      name: name!,
      surnames: surnames!,
      email: email!,
      password: password!,
      role_ids: (role_ids as number[]) || []
    }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
