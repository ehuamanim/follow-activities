import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserProfile } from '../../shared/models';

export const profileGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const allowedProfiles = (route.data?.['profiles'] as UserProfile[] | undefined) ?? [];
  if (allowedProfiles.length === 0) {
    return true;
  }

  if (authService.hasProfile(...allowedProfiles)) {
    return true;
  }

  return router.createUrlTree(['/activities']);
};
