import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  private authService = inject(AuthService);

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  logout(): void {
    this.authService.logout();
  }
}
