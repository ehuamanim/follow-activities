import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CollaborationService } from '../../../core/services/collaboration.service';
import { AppNotification, User } from '../../models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private collaborationService = inject(CollaborationService);

  notifications: AppNotification[] = [];
  showNotifications = false;

  ngOnInit(): void {
    this.refreshNotifications();
  }

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  get isAdministrator(): boolean {
    return this.authService.isAdministrator();
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read_at).length;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.refreshNotifications();
    }
  }

  refreshNotifications(): void {
    this.collaborationService.listNotifications().subscribe({
      next: (items) => { this.notifications = items; },
      error: () => { this.notifications = []; }
    });
  }

  markRead(n: AppNotification): void {
    this.collaborationService.markRead(n.id).subscribe({
      next: () => this.refreshNotifications()
    });
  }

  markAllRead(): void {
    this.collaborationService.markAllRead().subscribe({
      next: () => this.refreshNotifications()
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
