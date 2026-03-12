import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { UserProfile, Role } from '../../../shared/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);

  form = this.fb.group({
    profile: ['Operator' as UserProfile, Validators.required],
    role_ids: [[] as number[]],
    name: ['', Validators.required],
    surnames: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly profiles: UserProfile[] = ['Operator', 'Administrator'];
  roles: Role[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => { this.roles = roles; },
      error: () => { /* roles remain empty, optional */ }
    });
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
    this.successMessage = '';

    const { name, surnames, email, password, profile, role_ids } = this.form.value;
    this.userService.create({
      name: name!,
      surnames: surnames!,
      email: email!,
      password: password!,
      profile: profile as UserProfile,
      role_ids: (role_ids as number[]) || []
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = 'User created successfully. Redirecting...';

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1200);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'User creation failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
